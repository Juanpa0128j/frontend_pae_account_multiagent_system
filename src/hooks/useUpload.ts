'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useUploadSession } from '@/context/UploadSessionContext';
import { ingestApiClient, processApiClient, reportApiClient } from '@/lib/api/clients';
import type {
    BundleJobState,
    FileUploadState,
    FinancialStatementType,
    IngestClassificationReview,
    FinancialStatementResponse,
} from '@/types';
import { useCompany } from '@/context/CompanyContext';
import { useGlobalError } from '@/context/GlobalErrorContext';
import { updateSlot, updateWhere } from '@/hooks/useFileSlotState';

const TERMINAL_PROCESS_STATUS = new Set([
    'completed',
    'failed',
    'cancelled',
    'pending_audit_review',
    'error',
]);
const TERMINAL_INGEST_STATUS = new Set(['completed', 'failed']);

const countDocuments = (fileState: FileUploadState) =>
    fileState.files ? fileState.files.length : 1;

const displayFileName = (fileState: FileUploadState) => {
    const files = fileState.files ?? [fileState.file];
    if (files.length <= 1) return fileState.file.name;
    return `${files[0].name} +${files.length - 1}`;
};

async function waitForIngestCompletion(
    ingestId: string,
    onProgress?: (index: number | null) => void
) {
    const maxAttempts = 300; // ~10 minutes at 2s interval
    const pollIntervalMs = 2000;
    let lastKnownStatus = 'unknown';

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const ingest = await ingestApiClient.getIngestDetail(ingestId);
        onProgress?.(ingest.current_file_index ?? null);
        const normalizedStatus = String(ingest.status || '').toLowerCase();
        lastKnownStatus = normalizedStatus || lastKnownStatus;

        if (normalizedStatus === 'pending_review') {
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

    throw new Error(`La ingesta tardo demasiado en responder (estado actual: ${lastKnownStatus}).`);
}

// Backend MAX_PROCESS_SECONDS = 300s + 60s outer buffer (jobs.py). Allow extra
// margin for HTTP round-trip jitter so the UI never declares "tardó demasiado"
// while the backend is still actively working.
const PROCESS_POLL_INTERVAL_MS = 2000;
const PROCESS_POLL_MAX_MS = 10 * 60 * 1000; // 10 min
const PROCESS_QUEUED_MAX_MS = 90 * 1000; // 90s — max time to stay in 'queued' state

async function waitForProcessCompletion(processId: string) {
    const maxAttempts = Math.floor(PROCESS_POLL_MAX_MS / PROCESS_POLL_INTERVAL_MS);
    const firstPollTime = Date.now();
    let everStarted = false;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const status = await processApiClient.getProcessStatus(processId);
        const normalizedStatus = String(status.status || '').toLowerCase();

        if (TERMINAL_PROCESS_STATUS.has(normalizedStatus)) {
            return status;
        }

        // Track if job has ever left the queued state
        if (normalizedStatus !== 'queued') {
            everStarted = true;
        }

        // Early detection: job is still queued after timeout and has never started
        if (
            !everStarted &&
            normalizedStatus === 'queued' &&
            Date.now() - firstPollTime > PROCESS_QUEUED_MAX_MS
        ) {
            throw new Error(
                'El motor de procesamiento no respondió (el trabajo quedó en cola). ' +
                    'Verifica que el worker de Inngest esté activo o usa WORKFLOW_ENGINE=inline.'
            );
        }

        await new Promise((resolve) => setTimeout(resolve, PROCESS_POLL_INTERVAL_MS));
    }

    throw new Error('El proceso tardó demasiado en responder.');
}

function buildBundleJobs(uploadFiles: File[], ingestIds: string[]): BundleJobState[] {
    return ingestIds.map((ingestId, index) => ({
        ingest_id: ingestId,
        file_name: uploadFiles[index]?.name ?? `Documento ${index + 1}`,
        status: 'extracting',
        progress: 60,
    }));
}

function deriveBundleAggregate(jobs: BundleJobState[]): {
    status: FileUploadState['status'];
    progress: number;
    hasWarnings: boolean;
} {
    if (jobs.length === 0) {
        return { status: 'idle', progress: 0, hasWarnings: false };
    }

    const doneCount = jobs.filter((job) => job.status === 'done' || job.status === 'error').length;
    const anyError = jobs.some((job) => job.status === 'error');
    const anyReview = jobs.some((job) => job.status === 'review');
    const anyProcessing = jobs.some((job) => job.status === 'processing');
    const anyExtracting = jobs.some((job) => job.status === 'extracting');
    const hasWarnings = jobs.some((job) => Boolean(job.has_warnings));

    let status: FileUploadState['status'] = 'idle';
    if (doneCount === jobs.length) {
        status = anyError ? 'error' : 'done';
    } else if (anyReview) {
        status = 'review';
    } else if (anyProcessing) {
        status = 'processing';
    } else if (anyExtracting) {
        status = 'extracting';
    }

    const progress = Math.round((doneCount / jobs.length) * 100);

    return { status, progress, hasWarnings };
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
    const { viaAFiles: files, setViaAFiles: setFiles } = useUploadSession();
    const { showError } = useGlobalError();
    const addFiles = useCallback(
        (newFiles: File[]) => {
            if (newFiles.length === 0) return;
            if (newFiles.length === 1) {
                const state: FileUploadState = {
                    file: newFiles[0],
                    id: crypto.randomUUID(),
                    status: 'idle',
                    progress: 0,
                    parser_mode: 'fast',
                };
                setFiles((prev) => [...prev, state]);
                return;
            }
            const state: FileUploadState = {
                file: newFiles[0],
                files: newFiles,
                id: crypto.randomUUID(),
                status: 'idle',
                progress: 0,
                parser_mode: 'fast',
                multi_file_mode: 'documents',
            };
            setFiles((prev) => [...prev, state]);
        },
        [setFiles]
    );

    const removeFile = useCallback(
        (id: string) => {
            setFiles((prev) => prev.filter((f) => f.id !== id));
        },
        [setFiles]
    );

    const cancelUpload = useCallback(
        async (id: string) => {
            const fileState = files.find((f) => f.id === id);
            if (fileState?.ingest_id) {
                try {
                    await ingestApiClient.cancelIngest(fileState.ingest_id);
                } catch (err: unknown) {
                    console.warn('Failed to cancel ingest:', err);
                }
            }
            setFiles((prev) => prev.filter((f) => f.id !== id));
        },
        [files, setFiles]
    );

    const clearAll = useCallback(() => {
        setFiles([]);
    }, [setFiles]);

    const updateBundleJobs = useCallback(
        (fileId: string, updater: (jobs: BundleJobState[]) => BundleJobState[]) => {
            setFiles((prev) =>
                prev.map((f) => {
                    if (f.id !== fileId) return f;
                    const nextJobs = updater(f.bundle_jobs ?? []);
                    const aggregate = deriveBundleAggregate(nextJobs);
                    return {
                        ...f,
                        bundle_jobs: nextJobs,
                        status: aggregate.status,
                        progress: aggregate.progress,
                        has_warnings: aggregate.hasWarnings,
                    };
                })
            );
        },
        [setFiles]
    );

    const updateBundleJob = useCallback(
        (fileId: string, ingestId: string, updates: Partial<BundleJobState>) => {
            updateBundleJobs(fileId, (jobs) =>
                jobs.map((job) => (job.ingest_id === ingestId ? { ...job, ...updates } : job))
            );
        },
        [updateBundleJobs]
    );

    const runAccountingPipeline = useCallback(
        async (fileState: FileUploadState, ingestId: string) => {
            // Accounting pipeline step
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === fileState.id ? { ...f, status: 'processing', progress: 75 } : f
                )
            );

            const process = await processApiClient.processAccounting(ingestId);
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

            if (normalizedProcessStatus === 'pending_audit_review') {
                // HITL: pipeline paused awaiting user confirmation — show audit panel
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileState.id
                            ? {
                                  ...f,
                                  ...processMeta,
                                  status: 'done',
                                  has_warnings: true,
                                  progress: 100,
                              }
                            : f
                    )
                );
                return;
            }

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
                showError(failureMessage, 'error');
                return;
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
                              extracted: {
                                  fecha: new Date().toISOString().split('T')[0],
                                  nit: undefined,
                                  total: undefined,
                                  concepto: displayFileName(fileState),
                              },
                          }
                        : f
                )
            );

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['transactions'] }),
                queryClient.invalidateQueries({ queryKey: ['companies'] }),
                queryClient.invalidateQueries({ queryKey: ['ingest-jobs'] }),
            ]);
        },
        [queryClient, setFiles, showError]
    );

    const runAccountingPipelineForJob = useCallback(
        async (fileId: string, ingestId: string) => {
            updateBundleJob(fileId, ingestId, { status: 'processing', progress: 75 });

            const process = await processApiClient.processAccounting(ingestId);
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

            if (normalizedProcessStatus === 'pending_audit_review') {
                updateBundleJob(fileId, ingestId, {
                    ...processMeta,
                    status: 'done',
                    has_warnings: true,
                    progress: 100,
                });
                return;
            }

            if (normalizedProcessStatus !== 'completed') {
                const failureMessage =
                    finalProcess.remediation ||
                    finalProcess.error_message ||
                    'El proceso finalizó con error.';
                updateBundleJob(fileId, ingestId, {
                    ...processMeta,
                    status: 'error',
                    error: failureMessage,
                    progress: 100,
                });
                showError(failureMessage, 'error');
                return;
            }

            updateBundleJob(fileId, ingestId, {
                ...processMeta,
                status: 'done',
                progress: 100,
            });

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['transactions'] }),
                queryClient.invalidateQueries({ queryKey: ['companies'] }),
                queryClient.invalidateQueries({ queryKey: ['ingest-jobs'] }),
            ]);
        },
        [queryClient, showError, updateBundleJob]
    );

    const handleIngestStage = useCallback(
        async (fileState: FileUploadState, ingestId: string) => {
            const ingest = await waitForIngestCompletion(ingestId, (index) => {
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileState.id ? { ...f, current_file_index: index } : f
                    )
                );
            });
            const normalizedStatus = String(ingest.status || '').toLowerCase();

            if (normalizedStatus === 'pending_review') {
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileState.id
                            ? {
                                  ...f,
                                  status: 'review',
                                  progress: 60,
                                  ingest_id: ingestId,
                                  classification_review: ingest.classification_review ?? null,
                                  file_names: ingest.file_names ?? [],
                              }
                            : f
                    )
                );
                return false;
            }

            // Persist file_names from ingest before entering the accounting pipeline
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === fileState.id ? { ...f, file_names: ingest.file_names ?? [] } : f
                )
            );

            await runAccountingPipeline(fileState, ingestId);
            return true;
        },
        [runAccountingPipeline, setFiles]
    );

    const handleBundleIngestStage = useCallback(
        async (fileId: string, ingestId: string) => {
            const ingest = await waitForIngestCompletion(ingestId);
            const normalizedStatus = String(ingest.status || '').toLowerCase();

            if (normalizedStatus === 'pending_review') {
                updateBundleJob(fileId, ingestId, {
                    status: 'review',
                    progress: 60,
                    classification_review: ingest.classification_review ?? null,
                    file_names: ingest.file_names ?? [],
                });
                return false;
            }

            updateBundleJob(fileId, ingestId, {
                file_names: ingest.file_names ?? [],
            });

            await runAccountingPipelineForJob(fileId, ingestId);
            return true;
        },
        [runAccountingPipelineForJob, updateBundleJob]
    );

    const setFileParserMode = useCallback(
        (fileId: string, mode: string) => {
            setFiles((prev) =>
                prev.map((f) => (f.id === fileId ? { ...f, parser_mode: mode } : f))
            );
        },
        [setFiles]
    );

    const setFileMode = useCallback(
        (fileId: string, mode: 'pages' | 'documents') => {
            setFiles((prev) =>
                prev.map((f) => (f.id === fileId ? { ...f, multi_file_mode: mode } : f))
            );
        },
        [setFiles]
    );

    const reorderBundleFiles = useCallback(
        (id: string, newFiles: File[]) => {
            setFiles((prev) =>
                prev.map((f) => (f.id === id ? { ...f, files: newFiles, file: newFiles[0] } : f))
            );
        },
        [setFiles]
    );

    const reorderQueue = useCallback(
        (newOrder: FileUploadState[]) => {
            setFiles(newOrder);
        },
        [setFiles]
    );

    const pendingDocumentsCount = useMemo(
        () =>
            files.filter((f) => f.status === 'idle').reduce((sum, f) => sum + countDocuments(f), 0),
        [files]
    );

    const totalDocumentsCount = useMemo(
        () => files.reduce((sum, f) => sum + countDocuments(f), 0),
        [files]
    );

    const uploadAll = useCallback(async () => {
        // Validate company is selected
        if (!activeNit) {
            throw new Error('Seleccione una empresa antes de subir documentos');
        }

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
                const uploadFiles = fileState.files ?? [fileState.file];
                const uploaded = await ingestApiClient.uploadFile(
                    uploadFiles,
                    (evt: { loaded: number; total?: number }) => {
                        const progress = evt.total ? Math.round((evt.loaded / evt.total) * 50) : 25;
                        setFiles((prev) =>
                            prev.map((f) => (f.id === fileState.id ? { ...f, progress } : f))
                        );
                    },
                    activeNit,
                    undefined,
                    fileState.parser_mode || 'fast',
                    fileState.multi_file_mode ?? 'pages'
                );

                const ingestIds = uploaded.ingest_ids ?? [];
                const isFanout = ingestIds.length > 1;

                if (isFanout) {
                    const bundleJobs = buildBundleJobs(uploadFiles, ingestIds);
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.id === fileState.id
                                ? {
                                      ...f,
                                      status: 'extracting',
                                      progress: 60,
                                      ingest_id: uploaded.ingest_id,
                                      ingest_ids: ingestIds,
                                      bundle_jobs: bundleJobs,
                                  }
                                : f
                        )
                    );

                    await Promise.all(
                        ingestIds.map((ingestId) => handleBundleIngestStage(fileState.id, ingestId))
                    );
                    continue;
                }

                // Ingest/OCR step
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileState.id
                            ? {
                                  ...f,
                                  status: 'extracting',
                                  progress: 60,
                                  ingest_id: uploaded.ingest_id,
                                  ingest_ids: ingestIds.length > 0 ? ingestIds : undefined,
                              }
                            : f
                    )
                );

                const continued = await handleIngestStage(fileState, uploaded.ingest_id);
                if (!continued) {
                    continue;
                }
            } catch (err: unknown) {
                const message = extractErrorMessage(err);
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileState.id ? { ...f, status: 'error', error: message } : f
                    )
                );
                showError(message, 'error');
            }
        }
    }, [files, activeNit, handleBundleIngestStage, handleIngestStage, setFiles, showError]);

    const resumeIngest = useCallback(
        async (fileId: string, docType: string) => {
            const fileState = files.find((f) => f.id === fileId);
            if (!fileState || !fileState.ingest_id) return;

            setFiles((prev) =>
                prev.map((f) =>
                    f.id === fileId
                        ? {
                              ...f,
                              status: 'extracting',
                              progress: 60,
                              classification_review: null,
                          }
                        : f
                )
            );

            try {
                const updated = await ingestApiClient.updateIngestClassification(fileState.ingest_id, {
                    doc_type: docType,
                    confirmed: true,
                });

                const normalizedStatus = String(updated.status || '').toLowerCase();
                if (normalizedStatus === 'pending_review') {
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.id === fileId
                                ? {
                                      ...f,
                                      status: 'review',
                                      progress: 60,
                                      classification_review: updated.classification_review ?? null,
                                  }
                                : f
                        )
                    );
                    return;
                }

                await handleIngestStage(fileState, fileState.ingest_id);
            } catch (err: unknown) {
                const message = extractErrorMessage(err);
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileId ? { ...f, status: 'error', error: message } : f
                    )
                );
                showError(message, 'error');
            }
        },
        [files, handleIngestStage, setFiles, showError]
    );

    const resumeBundleIngest = useCallback(
        async (fileId: string, ingestId: string, docType: string) => {
            updateBundleJob(fileId, ingestId, {
                status: 'extracting',
                progress: 60,
                classification_review: null,
            });

            try {
                const updated = await ingestApiClient.updateIngestClassification(ingestId, {
                    doc_type: docType,
                    confirmed: true,
                });

                const normalizedStatus = String(updated.status || '').toLowerCase();
                if (normalizedStatus === 'pending_review') {
                    updateBundleJob(fileId, ingestId, {
                        status: 'review',
                        progress: 60,
                        classification_review: updated.classification_review ?? null,
                    });
                    return;
                }

                await handleBundleIngestStage(fileId, ingestId);
            } catch (err: unknown) {
                const message = extractErrorMessage(err);
                updateBundleJob(fileId, ingestId, {
                    status: 'error',
                    error: message,
                    progress: 100,
                });
                showError(message, 'error');
            }
        },
        [handleBundleIngestStage, showError, updateBundleJob]
    );

    const resumeAfterConfirm = useCallback(
        async (fileId: string, processId: string) => {
            const fileState = files.find((f) => f.id === fileId);
            if (!fileState) return;

            setFiles((prev) =>
                prev.map((f) =>
                    f.id === fileId ? { ...f, status: 'processing', progress: 80 } : f
                )
            );

            try {
                const finalProcess = await waitForProcessCompletion(processId);
                const normalizedProcessStatus = String(finalProcess.status).toLowerCase();
                const processMeta = {
                    process_id: processId,
                    error_category: finalProcess.error_category,
                    error_code: finalProcess.error_code,
                    remediation: finalProcess.remediation,
                    has_warnings: Boolean(finalProcess.has_warnings),
                    trace_url: finalProcess.trace_url ?? null,
                };

                if (normalizedProcessStatus === 'pending_audit_review') {
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.id === fileId
                                ? {
                                      ...f,
                                      ...processMeta,
                                      status: 'done',
                                      has_warnings: true,
                                      progress: 100,
                                  }
                                : f
                        )
                    );
                    return;
                }

                if (normalizedProcessStatus !== 'completed') {
                    const failureMessage =
                        finalProcess.remediation ||
                        finalProcess.error_message ||
                        'El proceso finalizó con error.';
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.id === fileId
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
                    showError(failureMessage, 'error');
                    return;
                }

                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileId
                            ? {
                                  ...f,
                                  ...processMeta,
                                  status: 'done',
                                  has_warnings: false,
                                  progress: 100,
                                  extracted: {
                                      fecha: new Date().toISOString().split('T')[0],
                                      nit: undefined,
                                      total: undefined,
                                      concepto: fileState.file.name,
                                  },
                              }
                            : f
                    )
                );
                await queryClient.invalidateQueries({ queryKey: ['transactions'] });
            } catch (err: unknown) {
                const message = extractErrorMessage(err);
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileId
                            ? { ...f, status: 'error', error: message, progress: 100 }
                            : f
                    )
                );
                showError(message, 'error');
            }
        },
        [files, queryClient, setFiles, showError]
    );

    const resumeBundleAfterConfirm = useCallback(
        async (fileId: string, ingestId: string, processId: string) => {
            updateBundleJob(fileId, ingestId, { status: 'processing', progress: 80 });

            try {
                const finalProcess = await waitForProcessCompletion(processId);
                const normalizedProcessStatus = String(finalProcess.status).toLowerCase();
                const processMeta = {
                    process_id: processId,
                    error_category: finalProcess.error_category,
                    error_code: finalProcess.error_code,
                    remediation: finalProcess.remediation,
                    has_warnings: Boolean(finalProcess.has_warnings),
                    trace_url: finalProcess.trace_url ?? null,
                };

                if (normalizedProcessStatus === 'pending_audit_review') {
                    updateBundleJob(fileId, ingestId, {
                        ...processMeta,
                        status: 'done',
                        has_warnings: true,
                        progress: 100,
                    });
                    return;
                }

                if (normalizedProcessStatus !== 'completed') {
                    const failureMessage =
                        finalProcess.remediation ||
                        finalProcess.error_message ||
                        'El proceso finalizó con error.';
                    updateBundleJob(fileId, ingestId, {
                        ...processMeta,
                        status: 'error',
                        error: failureMessage,
                        progress: 100,
                    });
                    showError(failureMessage, 'error');
                    return;
                }

                updateBundleJob(fileId, ingestId, {
                    ...processMeta,
                    status: 'done',
                    has_warnings: false,
                    progress: 100,
                });
                await queryClient.invalidateQueries({ queryKey: ['transactions'] });
            } catch (err: unknown) {
                const message = extractErrorMessage(err);
                updateBundleJob(fileId, ingestId, {
                    status: 'error',
                    error: message,
                    progress: 100,
                });
                showError(message, 'error');
            }
        },
        [queryClient, showError, updateBundleJob]
    );

    return {
        files,
        addFiles,
        removeFile,
        cancelUpload,
        clearAll,
        uploadAll,
        resumeIngest,
        resumeBundleIngest,
        resumeAfterConfirm,
        resumeBundleAfterConfirm,
        hasFiles: files.length > 0,
        pendingDocumentsCount,
        totalDocumentsCount,
        isUploading: files.some(
            (f) =>
                f.status === 'uploading' || f.status === 'extracting' || f.status === 'processing'
        ),
        allDone:
            files.length > 0 && files.every((f) => f.status === 'done' || f.status === 'error'),
        setFileParserMode,
        setFileMode,
        reorderBundleFiles,
        reorderQueue,
    };
}

// ---------------------------------------------------------------------------
// useViaBUpload — Via B pipeline: 3 first-level PDFs → auto-derived statements
// ---------------------------------------------------------------------------

export type ViaBDocType =
    | 'balance_general'
    | 'estado_resultados'
    | 'libro_auxiliar'
    | 'balance_general_anterior';

export interface ViaBSlot {
    docType: ViaBDocType;
    label: string;
    file: File | null;
    status: 'idle' | 'uploading' | 'extracting' | 'review' | 'done' | 'error';
    progress: number;
    parser_mode: string;
    ingest_id?: string;
    error?: string;
    error_category?: string;
    error_code?: string;
    remediation?: string;
    has_warnings?: boolean;
    trace_url?: string | null;
    classification_review?: IngestClassificationReview | null;
    file_names?: string[];
}

const VIA_B_SLOTS: Pick<ViaBSlot, 'docType' | 'label'>[] = [
    { docType: 'balance_general', label: 'Balance General' },
    { docType: 'estado_resultados', label: 'Estado de Resultados' },
    { docType: 'libro_auxiliar', label: 'Libro Auxiliar' },
    { docType: 'balance_general_anterior', label: 'Balance General anterior' },
];

const VIA_B_DOC_TYPE_SET = new Set<string>([
    'balance_general',
    'estado_resultados',
    'libro_auxiliar',
    'balance_general_anterior',
]);

const SECOND_LEVEL_TYPES = new Set<string>([
    'flujo_de_caja',
    'cambios_patrimonio',
    'notas_estados_financieros',
]);

const FIRST_LEVEL_TYPES = new Set(['balance_general', 'estado_resultados', 'libro_auxiliar']);

async function waitForDerivedStatements(
    companyNit: string,
    timeoutMs = 120_000
): Promise<FinancialStatementResponse[]> {
    const deadline = Date.now() + timeoutMs;
    let lastFirstLevelCount = 0;
    let lastSecondLevelCount = 0;

    while (Date.now() < deadline) {
        const stmts = await reportApiClient.getStatements({ company_nit: companyNit });
        const firstLevel = stmts.filter((s) => FIRST_LEVEL_TYPES.has(s.statement_type));
        const secondLevel = stmts.filter((s) => SECOND_LEVEL_TYPES.has(s.statement_type));
        lastFirstLevelCount = firstLevel.length;
        lastSecondLevelCount = secondLevel.length;

        if (secondLevel.length >= 3) return stmts;
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Differentiate between "ingest never ran" and "derivation step failed":
    // if first-level exist but second-level don't, the persist node ran but
    // derivation crashed without surfacing the error. Tell the user that.
    if (lastFirstLevelCount > 0 && lastSecondLevelCount < 3) {
        throw new Error(
            `Los documentos cargados se registraron, pero la derivación de los estados ` +
                `complementarios (flujo de caja, cambios en patrimonio, notas) falló o no terminó a tiempo. ` +
                `Revise la traza del último ingest o vuelva a intentarlo en unos minutos.`
        );
    }
    throw new Error(
        'Tiempo de espera agotado esperando los documentos derivados. ' +
            'Verifique que los 3 documentos base hayan sido procesados correctamente.'
    );
}

export function guessDocType(filename: string): ViaBDocType | null {
    const n = filename.toLowerCase();
    if (n.includes('anterior') || n.includes('previo') || n.includes('prev'))
        return 'balance_general_anterior';
    if (n.includes('balance') || n.includes('activo')) return 'balance_general';
    if (n.includes('resultado') || n.includes('pnl') || n.includes('pyg'))
        return 'estado_resultados';
    if (n.includes('auxiliar') || n.includes('libro')) return 'libro_auxiliar';
    return null;
}

export function useViaBUpload(companyNitOverride?: string) {
    const { activeNit } = useCompany();
    const companyNit = companyNitOverride ?? activeNit ?? '';
    const queryClient = useQueryClient();
    const { showError } = useGlobalError();

    const {
        viaBSlots: slots,
        setViaBSlots: setSlots,
        isPollingDerived,
        setIsPollingDerived,
        derivedStatements,
        setDerivedStatements,
        derivedError,
        setDerivedError,
    } = useUploadSession();

    const pollDerivedStatements = useCallback(async () => {
        setIsPollingDerived(true);
        try {
            const allStatements = await waitForDerivedStatements(companyNit);
            setDerivedStatements(allStatements);
            setSlots((prev) =>
                prev.map((s) => ({
                    ...s,
                    status: s.status === 'error' ? 'error' : ('done' as const),
                    progress: 100,
                    error: s.status === 'error' ? s.error : undefined,
                    error_category: s.status === 'error' ? s.error_category : undefined,
                    remediation: s.status === 'error' ? s.remediation : undefined,
                }))
            );
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['statements'] }),
                queryClient.invalidateQueries({ queryKey: ['reports'] }),
                queryClient.invalidateQueries({ queryKey: ['transactions'] }),
            ]);
        } catch (err: unknown) {
            const message = extractErrorMessage(err);
            setDerivedError(message);
            setSlots((prev) =>
                prev.map((s) => ({
                    ...s,
                    status: 'error' as const,
                    error: message,
                    error_category:
                        s.status === 'extracting' || s.status === 'uploading'
                            ? 'timeout'
                            : (s.error_category ?? 'timeout'),
                    remediation:
                        s.status === 'extracting' || s.status === 'uploading'
                            ? 'Los estados financieros derivados tardaron demasiado. Vuelve a intentarlo.'
                            : (s.remediation ??
                              'Los estados financieros derivados tardaron demasiado. Vuelve a intentarlo.'),
                }))
            );
        } finally {
            setIsPollingDerived(false);
        }
    }, [
        companyNit,
        queryClient,
        setDerivedError,
        setDerivedStatements,
        setIsPollingDerived,
        setSlots,
    ]);

    const assignFilesToSlots = useCallback(
        (assignments: { file: File; docType: ViaBDocType }[]) => {
            for (const { file, docType } of assignments) {
                setSlots((prev) =>
                    updateSlot(prev, docType, {
                        file,
                        status: 'idle',
                        progress: 0,
                        error: undefined,
                        parser_mode: 'fast',
                    })
                );
            }
        },
        [setSlots]
    );

    const setSlotFile = useCallback(
        (docType: ViaBDocType, file: File | null) => {
            setSlots((prev) =>
                updateSlot(prev, docType, {
                    file,
                    status: 'idle',
                    progress: 0,
                    error: undefined,
                    parser_mode: 'fast',
                })
            );
        },
        [setSlots]
    );

    const setSlotParserMode = useCallback(
        (docType: ViaBDocType, mode: string) => {
            setSlots((prev) => updateSlot(prev, docType, { parser_mode: mode }));
        },
        [setSlots]
    );

    // Allow partial uploads: at least one slot with a file is enough to start.
    // Derivation is now manual (see /reports/derivation), so users may upload
    // documents one at a time and trigger derivation when all 3 are present.
    const hasAnyFileSelected = slots.some((s) => s.file !== null);

    const startUpload = useCallback(async () => {
        setDerivedError(null);
        setDerivedStatements([]);

        const slotsToUpload = slots.filter((s) => s.file !== null);
        const uploadedDocTypes = new Set(slotsToUpload.map((s) => s.docType));

        // Mark all as uploading up-front so the user sees the parallel run.
        setSlots((prev) =>
            updateWhere(prev, (s) => uploadedDocTypes.has(s.docType), {
                status: 'uploading',
                progress: 0,
                error: undefined,
            })
        );

        const cancelOtherSlots = (failedDocType: string, reason: string) => {
            // Reset other in-flight slots back to idle so the user can retry
            // without an inconsistent screen of frozen extracting cards.
            setSlots((prev) =>
                updateWhere(
                    prev,
                    (s) =>
                        uploadedDocTypes.has(s.docType) &&
                        s.docType !== failedDocType &&
                        (s.status === 'uploading' || s.status === 'extracting'),
                    {
                        status: 'idle',
                        progress: 0,
                        error: undefined,
                        error_category: undefined,
                        ingest_id: undefined,
                    }
                )
            );
            return reason;
        };

        const uploadSlot = async (slot: ViaBSlot) => {
            if (!slot.file) return null;
            try {
                const uploaded = await ingestApiClient.uploadFile(
                    slot.file,
                    (evt: { loaded: number; total?: number }) => {
                        const progress = evt.total ? Math.round((evt.loaded / evt.total) * 50) : 25;
                        setSlots((prev) => updateSlot(prev, slot.docType, { progress }));
                    },
                    companyNit || undefined,
                    slot.docType,
                    slot.parser_mode || 'fast'
                );

                setSlots((prev) =>
                    updateSlot(prev, slot.docType, {
                        status: 'extracting',
                        progress: 60,
                        ingest_id: uploaded.ingest_id,
                    })
                );

                const ingest = await waitForIngestCompletion(uploaded.ingest_id);
                const normalizedStatus = String(ingest.status || '').toLowerCase();

                if (normalizedStatus === 'pending_review') {
                    const predictedType = ingest.classification_review?.predicted_type ?? '';
                    const isViaADoc = predictedType && !VIA_B_DOC_TYPE_SET.has(predictedType);

                    if (isViaADoc) {
                        const predictedLabel =
                            ingest.classification_review?.predicted_label ?? predictedType;
                        const wrongAreaMessage = `Este archivo parece ser un documento de Vía A (${predictedLabel}). Los documentos de Vía A (facturas, extractos, etc.) deben subirse en la sección Vía A. Elimina este archivo y cárgalo en la sección correcta.`;
                        setSlots((prev) =>
                            updateSlot(prev, slot.docType, {
                                status: 'error',
                                progress: 0,
                                error: wrongAreaMessage,
                                error_category: 'wrong_upload_area',
                            })
                        );
                        showError(wrongAreaMessage, 'error');
                        cancelOtherSlots(slot.docType, 'wrong_upload_area');
                        return { docType: slot.docType, ok: false } as const;
                    }

                    // Via B predicted — auto-confirm with the slot's expected type.
                    try {
                        await ingestApiClient.updateIngestClassification(uploaded.ingest_id, {
                            doc_type: slot.docType,
                            confirmed: true,
                        });
                    } catch (autoConfirmErr) {
                        console.warn(
                            `[Via B] auto-confirm failed for ${slot.docType}, continuing with original status:`,
                            autoConfirmErr
                        );
                    }
                }

                if (ingest.status === 'failed') {
                    const failureMessage =
                        ingest.remediation ||
                        ingest.error_message ||
                        'La ingesta finalizó con error. Revise el documento e intente nuevamente.';
                    showError(failureMessage, 'error');
                }

                setSlots((prev) =>
                    updateSlot(prev, slot.docType, {
                        status: ingest.status === 'failed' ? 'error' : 'done',
                        progress: 100,
                        error: ingest.error_message,
                        error_category: ingest.error_category,
                        error_code: ingest.error_code,
                        remediation: ingest.remediation,
                        has_warnings: Boolean(ingest.has_warnings),
                        trace_url: ingest.trace_url ?? null,
                        file_names: ingest.file_names ?? [],
                    })
                );

                return {
                    docType: slot.docType,
                    ok: normalizedStatus !== 'failed',
                } as const;
            } catch (err: unknown) {
                const message = extractErrorMessage(err);
                setSlots((prev) =>
                    updateSlot(prev, slot.docType, { status: 'error', error: message })
                );
                showError(message, 'error');
                return { docType: slot.docType, ok: false } as const;
            }
        };

        // Run all slot ingests in parallel (LlamaParse rate limits per-key,
        // not per-account, but separate calls already overlap server-side).
        await Promise.all(slotsToUpload.map(uploadSlot));

        // Derivation is now manual via /reports/derivation. Don't poll.
        // Refresh dependent data so the UI reflects the new state — most
        // importantly the company's locked_pathway, which the server sets on
        // first upload.
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['companies'] }),
            queryClient.invalidateQueries({ queryKey: ['statements'] }),
            queryClient.invalidateQueries({ queryKey: ['reports'] }),
            queryClient.invalidateQueries({ queryKey: ['ingest-jobs'] }),
        ]);
    }, [
        slots,
        companyNit,
        setDerivedError,
        setDerivedStatements,
        setSlots,
        queryClient,
        showError,
    ]);

    const resumeSlot = useCallback(
        async (slotType: ViaBDocType, docType: string) => {
            const targetSlot = slots.find((s) => s.docType === slotType);
            if (!targetSlot?.ingest_id) return;

            setSlots((prev) =>
                updateSlot(prev, slotType, {
                    status: 'extracting',
                    progress: 60,
                    classification_review: null,
                })
            );

            try {
                const updated = await ingestApiClient.updateIngestClassification(targetSlot.ingest_id, {
                    doc_type: docType,
                    confirmed: true,
                });
                const normalizedStatus = String(updated.status || '').toLowerCase();

                if (normalizedStatus === 'pending_review') {
                    setSlots((prev) =>
                        updateSlot(prev, slotType, {
                            status: 'review',
                            progress: 60,
                            classification_review: updated.classification_review ?? null,
                        })
                    );
                    return;
                }

                const ingest = await waitForIngestCompletion(targetSlot.ingest_id);

                if (ingest.status === 'failed') {
                    const failureMessage =
                        ingest.remediation ||
                        ingest.error_message ||
                        'La ingesta finalizó con error. Revise el documento e intente nuevamente.';
                    showError(failureMessage, 'error');
                }

                setSlots((prev) =>
                    updateSlot(prev, slotType, {
                        status: ingest.status === 'failed' ? 'error' : 'done',
                        progress: 100,
                        error: ingest.error_message,
                        error_category: ingest.error_category,
                        error_code: ingest.error_code,
                        remediation: ingest.remediation,
                        has_warnings: Boolean(ingest.has_warnings),
                        trace_url: ingest.trace_url ?? null,
                        file_names: ingest.file_names ?? [],
                    })
                );

                // Derivation is now manual via /reports/derivation — no post-upload
                // bookkeeping needed here. The slot itself was just marked 'done'.
            } catch (err: unknown) {
                const message = extractErrorMessage(err);
                setSlots((prev) => updateSlot(prev, slotType, { status: 'error', error: message }));
                showError(message, 'error');
            }
        },
        [slots, setSlots, showError]
    );

    const resetSlots = useCallback(() => {
        setSlots(
            VIA_B_SLOTS.map((s) => ({
                ...s,
                file: null,
                status: 'idle',
                progress: 0,
                parser_mode: 'fast',
            }))
        );
        setDerivedStatements([]);
        setDerivedError(null);
        setIsPollingDerived(false);
    }, [setSlots, setDerivedStatements, setDerivedError, setIsPollingDerived]);

    // "All done" now means: every slot that had a file has finished uploading.
    // Slots without a file (partial upload) don't block completion.
    const allDone =
        slots.every((s) => s.file === null || s.status === 'done') &&
        slots.some((s) => s.status === 'done');

    const isUploading =
        slots.some(
            (s) => s.status === 'uploading' || s.status === 'extracting' || s.status === 'review'
        ) || isPollingDerived;

    return {
        slots,
        setSlotFile,
        assignFilesToSlots,
        setSlotParserMode,
        hasAnyFileSelected,
        startUpload,
        resumeSlot,
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
        mutationFn: (ingestId: string) => processApiClient.processAccounting(ingestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
    });
}
