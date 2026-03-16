'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { uploadFile, processAccounting, getProcessStatus, getIngestDetail } from '@/lib/api';
import type { FileUploadState } from '@/types';

const TERMINAL_PROCESS_STATUS = new Set(['completed', 'failed', 'cancelled']);
const TERMINAL_INGEST_STATUS = new Set(['completed', 'failed']);

async function waitForIngestCompletion(ingestId: string) {
    const maxAttempts = 300; // ~10 minutes at 2s interval
    const pollIntervalMs = 2000;
    let lastKnownStatus = 'unknown';

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const ingest = await getIngestDetail(ingestId);
        const normalizedStatus = String(ingest.status || '').toLowerCase();
        lastKnownStatus = normalizedStatus || lastKnownStatus;

        const stagedTransactions = Array.isArray(ingest.raw_transactions)
            ? ingest.raw_transactions.length
            : 0;

        // If ingest already staged transactions, accounting can start.
        if (stagedTransactions > 0) {
            return ingest;
        }

        if (TERMINAL_INGEST_STATUS.has(normalizedStatus)) {
            if (normalizedStatus !== 'completed') {
                const ingestError = ingest.extraction_errors?.[0];
                throw new Error(ingestError || 'La ingesta finalizo con error.');
            }
            return ingest;
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(
        `La ingesta tardo demasiado en responder (estado actual: ${lastKnownStatus}).`
    );
}

async function waitForProcessCompletion(processId: string) {
    const maxAttempts = 90; // ~3 minutes at 2s interval
    const pollIntervalMs = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const status = await getProcessStatus(processId);
        const normalizedStatus = String(status.status || '').toLowerCase();

        if (TERMINAL_PROCESS_STATUS.has(normalizedStatus)) {
            return status;
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('El proceso tardó demasiado en responder.');
}

function extractErrorMessage(err: unknown): string {
    if (err instanceof Error && err.message) {
        return err.message;
    }

    if (typeof err === 'object' && err !== null) {
        const maybeError = err as { message?: unknown; detail?: unknown };
        if (typeof maybeError.detail === 'string' && maybeError.detail.trim().length > 0) {
            return maybeError.detail;
        }
        if (typeof maybeError.message === 'string' && maybeError.message.trim().length > 0) {
            return maybeError.message;
        }
    }

    return 'Error al procesar el archivo';
}

// ---------------------------------------------------------------------------
// useUpload — Manages file upload + processing pipeline
// ---------------------------------------------------------------------------

export function useUpload() {
    const queryClient = useQueryClient();
    const [files, setFiles] = useState<FileUploadState[]>([]);

    const addFiles = useCallback((newFiles: File[]) => {
        const states: FileUploadState[] = newFiles.map((f) => ({
            file: f,
            id: crypto.randomUUID(),
            status: 'idle',
            progress: 0,
        }));
        setFiles((prev) => [...prev, ...states]);
    }, []);

    const removeFile = useCallback((id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setFiles([]);
    }, []);

    const uploadAll = useCallback(async () => {
        for (const fileState of files) {
            if (fileState.status !== 'idle') continue;

            // Set to uploading
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === fileState.id ? { ...f, status: 'uploading', progress: 0 } : f
                )
            );

            try {
                // Upload step
                const uploaded = await uploadFile(fileState.file, (evt: { loaded: number; total?: number }) => {
                    const progress = evt.total
                        ? Math.round((evt.loaded / evt.total) * 50)
                        : 25;
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.id === fileState.id ? { ...f, progress } : f
                        )
                    );
                });

                // Processing step
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileState.id
                            ? { ...f, status: 'processing', progress: 60, ingest_id: uploaded.ingest_id }
                            : f
                    )
                );

                // Wait until ingest has actually staged transactions in DB.
                await waitForIngestCompletion(uploaded.ingest_id);

                // Trigger accounting pipeline
                const process = await processAccounting(uploaded.ingest_id);
                const finalProcess = await waitForProcessCompletion(process.process_id);

                if (String(finalProcess.status).toLowerCase() !== 'completed') {
                    throw new Error(finalProcess.error_message || 'El proceso finalizó con error.');
                }

                // Done
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileState.id
                            ? {
                                  ...f,
                                  status: 'done',
                                  progress: 100,
                                  // Populate extracted preview from whatever the API returns
                                  extracted: {
                                      fecha: new Date().toISOString().split('T')[0],
                                      nit: undefined,
                                      total: undefined,
                                      concepto: uploaded.file_name ?? fileState.file.name,
                                  },
                              }
                            : f
                    )
                );

                // Invalidate transactions so the list refreshes
                await queryClient.invalidateQueries({ queryKey: ['transactions'] });
            } catch (err: unknown) {
                const message = extractErrorMessage(err);
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileState.id
                            ? { ...f, status: 'error', error: message }
                            : f
                    )
                );
            }
        }
    }, [files, queryClient]);

    return {
        files,
        addFiles,
        removeFile,
        clearAll,
        uploadAll,
        hasFiles: files.length > 0,
        isUploading: files.some((f) => f.status === 'uploading' || f.status === 'processing'),
        allDone: files.length > 0 && files.every((f) => f.status === 'done' || f.status === 'error'),
    };
}

// ---------------------------------------------------------------------------
// useProcessTransaction — Trigger accounting pipeline for a single transaction
// ---------------------------------------------------------------------------

export function useProcessTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ingestId: string) => processAccounting(ingestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
    });
}
