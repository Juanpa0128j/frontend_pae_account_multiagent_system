'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import {
    uploadFile,
    processAccounting,
    getProcessStatus,
    getIngestDetail,
    getStatements,
} from '@/lib/api';
import type { FileUploadState, FinancialStatementType } from '@/types';
import type { FinancialStatementResponse } from '@/lib/api';
import { useCompany } from '@/context/CompanyContext';

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
    const { activeNit } = useCompany();
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
                const uploaded = await uploadFile(
                    fileState.file,
                    (evt: { loaded: number; total?: number }) => {
                        const progress = evt.total
                            ? Math.round((evt.loaded / evt.total) * 50)
                            : 25;
                        setFiles((prev) =>
                            prev.map((f) =>
                                f.id === fileState.id ? { ...f, progress } : f
                            )
                        );
                    },
                    activeNit ?? undefined
                );

                // Ingest/OCR step
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileState.id
                            ? { ...f, status: 'extracting', progress: 60, ingest_id: uploaded.ingest_id }
                            : f
                    )
                );

                // Wait until ingest has actually staged transactions in DB.
                await waitForIngestCompletion(uploaded.ingest_id);

                // Accounting pipeline step
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileState.id
                            ? { ...f, status: 'processing', progress: 75 }
                            : f
                    )
                );

                // Trigger accounting pipeline
                const process = await processAccounting(uploaded.ingest_id);
                const finalProcess = await waitForProcessCompletion(process.process_id);
                const normalizedProcessStatus = String(finalProcess.status).toLowerCase();
                const processMeta = {
                    process_id: process.process_id,
                    error_category: finalProcess.error_category,
                    error_code: finalProcess.error_code,
                    remediation: finalProcess.remediation,
                    has_warnings: Boolean(finalProcess.has_warnings),
                    trace_url: finalProcess.trace_url ?? null,
                };

                if (normalizedProcessStatus !== 'completed') {
                    const failureMessage =
                        finalProcess.remediation ||
                        finalProcess.error_message ||
                        'El proceso finalizó con error.';
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.id === fileState.id
                                ? {
                                      ...f,
                                      ...processMeta,
                                      status: 'error',
                                      error: failureMessage,
                                      progress: 100,
                                  }
                                : f
                        )
                    );
                    continue;
                }

                // Done
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileState.id
                            ? {
                                  ...f,
                                  ...processMeta,
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
    }, [files, queryClient, activeNit]);

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
// useViaBUpload — Via B pipeline: 3 first-level PDFs → auto-derived statements
// ---------------------------------------------------------------------------

export type ViaBDocType = 'balance_general' | 'estado_resultados' | 'libro_auxiliar';

export interface ViaBSlot {
    docType: ViaBDocType;
    label: string;
    file: File | null;
    status: 'idle' | 'uploading' | 'extracting' | 'done' | 'error';
    progress: number;
    ingest_id?: string;
    error?: string;
    error_category?: string;
    error_code?: string;
    remediation?: string;
    has_warnings?: boolean;
    trace_url?: string | null;
}

const VIA_B_SLOTS: Pick<ViaBSlot, 'docType' | 'label'>[] = [
    { docType: 'balance_general', label: 'Balance General' },
    { docType: 'estado_resultados', label: 'Estado de Resultados' },
    { docType: 'libro_auxiliar', label: 'Libro Auxiliar' },
];

const SECOND_LEVEL_TYPES = new Set<string>([
    'flujo_de_caja',
    'cambios_patrimonio',
    'notas_estados_financieros',
]);

async function waitForDerivedStatements(
    companyNit: string,
    timeoutMs = 120_000
): Promise<FinancialStatementResponse[]> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const stmts = await getStatements({ company_nit: companyNit });
        const found = stmts.filter((s) => SECOND_LEVEL_TYPES.has(s.statement_type));
        if (found.length >= 3) return stmts;
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error('Timeout esperando documentos derivados (flujo_de_caja, cambios_patrimonio, notas).');
}

export function useViaBUpload(companyNitOverride?: string) {
    const { activeNit } = useCompany();
    const companyNit = companyNitOverride ?? activeNit ?? '';
    const queryClient = useQueryClient();
    const [slots, setSlots] = useState<ViaBSlot[]>(
        VIA_B_SLOTS.map((s) => ({ ...s, file: null, status: 'idle', progress: 0 }))
    );
    const [isPollingDerived, setIsPollingDerived] = useState(false);
    const [derivedStatements, setDerivedStatements] = useState<FinancialStatementResponse[]>([]);
    const [derivedError, setDerivedError] = useState<string | null>(null);

    const setSlotFile = useCallback((docType: ViaBDocType, file: File | null) => {
        setSlots((prev) =>
            prev.map((s) =>
                s.docType === docType
                    ? { ...s, file, status: 'idle', progress: 0, error: undefined }
                    : s
            )
        );
    }, []);

    const allFilesSelected = slots.every((s) => s.file !== null);

    const startUpload = useCallback(async () => {
        setDerivedError(null);
        setDerivedStatements([]);

        // Upload each slot sequentially (same pattern as useUpload)
        for (const slot of slots) {
            if (!slot.file) continue;

            setSlots((prev) =>
                prev.map((s) =>
                    s.docType === slot.docType
                        ? { ...s, status: 'uploading', progress: 0, error: undefined }
                        : s
                )
            );

            try {
                const uploaded = await uploadFile(
                    slot.file,
                    (evt: { loaded: number; total?: number }) => {
                        const progress = evt.total
                            ? Math.round((evt.loaded / evt.total) * 50)
                            : 25;
                        setSlots((prev) =>
                            prev.map((s) => (s.docType === slot.docType ? { ...s, progress } : s))
                        );
                    },
                    companyNit || undefined
                );

                setSlots((prev) =>
                    prev.map((s) =>
                        s.docType === slot.docType
                            ? { ...s, status: 'extracting', progress: 60, ingest_id: uploaded.ingest_id }
                            : s
                    )
                );

                // Via B: only wait for ingest (no processAccounting call)
                const ingest = await waitForIngestCompletion(uploaded.ingest_id);

                setSlots((prev) =>
                    prev.map((s) =>
                        s.docType === slot.docType
                            ? {
                                  ...s,
                                  status: ingest.status === 'failed' ? 'error' : 'done',
                                  progress: 100,
                                  error: ingest.error_message,
                                  error_category: ingest.error_category,
                                  error_code: ingest.error_code,
                                  remediation: ingest.remediation,
                                  has_warnings: Boolean(ingest.has_warnings),
                                  trace_url: ingest.trace_url ?? null,
                              }
                            : s
                    )
                );

                if (String(ingest.status).toLowerCase() === 'failed') {
                    return;
                }
            } catch (err: unknown) {
                const message = extractErrorMessage(err);
                setSlots((prev) =>
                    prev.map((s) =>
                        s.docType === slot.docType ? { ...s, status: 'error', error: message } : s
                    )
                );
                return; // Stop on first error
            }
        }

        // All 3 uploaded — now poll for derived statements
        setIsPollingDerived(true);
        try {
            const allStatements = await waitForDerivedStatements(companyNit);
            setDerivedStatements(allStatements);
            setSlots((prev) =>
                prev.map((s) => ({
                    ...s,
                    status: s.status === 'error' ? 'error' : 'done',
                    progress: 100,
                    error: s.status === 'error' ? s.error : undefined,
                    error_category: s.status === 'error' ? s.error_category : undefined,
                    remediation: s.status === 'error' ? s.remediation : undefined,
                }))
            );
            // Invalidate the shared statements cache so the reports page refreshes
            await queryClient.invalidateQueries({ queryKey: ['statements'] });
        } catch (err: unknown) {
            const message = extractErrorMessage(err);
            setDerivedError(message);
            setSlots((prev) =>
                prev.map((s) =>
                    s.status === 'extracting' || s.status === 'uploading'
                        ? {
                              ...s,
                              status: 'error',
                              error: message,
                              error_category: 'timeout',
                              remediation: 'Los estados financieros derivados tardaron demasiado. Vuelve a intentarlo.',
                          }
                        : {
                              ...s,
                              status: 'error',
                              error: message,
                              error_category: s.error_category ?? 'timeout',
                              remediation:
                                  s.remediation ??
                                  'Los estados financieros derivados tardaron demasiado. Vuelve a intentarlo.',
                          }
                )
            );
        } finally {
            setIsPollingDerived(false);
        }
    }, [slots, companyNit, queryClient]);

    const resetSlots = useCallback(() => {
        setSlots(VIA_B_SLOTS.map((s) => ({ ...s, file: null, status: 'idle', progress: 0 })));
        setDerivedStatements([]);
        setDerivedError(null);
        setIsPollingDerived(false);
    }, []);

    const allDone =
        slots.every((s) => s.status === 'done') &&
        !isPollingDerived &&
        derivedStatements.length > 0;

    const isUploading =
        slots.some((s) => s.status === 'uploading' || s.status === 'extracting') ||
        isPollingDerived;

    return {
        slots,
        setSlotFile,
        allFilesSelected,
        startUpload,
        resetSlots,
        isUploading,
        isPollingDerived,
        derivedStatements,
        derivedError,
        allDone,
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
