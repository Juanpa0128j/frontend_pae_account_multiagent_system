'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { uploadFile, processAccounting } from '@/lib/api';
import type { FileUploadState } from '@/types';

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

                // Trigger accounting pipeline
                await processAccounting(uploaded.ingest_id);

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
                                      concepto: uploaded.filename ?? fileState.file.name,
                                  },
                              }
                            : f
                    )
                );

                // Invalidate transactions so the list refreshes
                await queryClient.invalidateQueries({ queryKey: ['transactions'] });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Error al procesar el archivo';
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
