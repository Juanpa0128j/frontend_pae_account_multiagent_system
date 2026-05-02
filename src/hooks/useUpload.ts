'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useUploadSession } from '@/context/UploadSessionContext';
import {
    uploadFile,
    processAccounting,
    getProcessStatus,
    getIngestDetail,
    updateIngestClassification,
    getStatements,
} from '@/lib/api';
import type {
    FileUploadState,
    FinancialStatementType,
    IngestClassificationReview,
} from '@/types';
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
    const { viaAFiles: files, setViaAFiles: setFiles } = useUploadSession();

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

    const runAccountingPipeline = useCallback(
        async (fileState: FileUploadState, ingestId: string) => {
            // Accounting pipeline step
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === fileState.id
                        ? { ...f, status: 'processing', progress: 75 }
                        : f
                )
            );

            const process = await processAccounting(ingestId);
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
                                  concepto: fileState.file.name,
                              },
                          }
                        : f
                )
            );

            await queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        [queryClient]
    );

    const handleIngestStage = useCallback(
        async (fileState: FileUploadState, ingestId: string) => {
            const ingest = await waitForIngestCompletion(ingestId);
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
                              }
                            : f
                    )
                );
                return false;
            }

            await runAccountingPipeline(fileState, ingestId);
            return true;
        },
        [runAccountingPipeline]
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
                    activeNit
                );

                // Ingest/OCR step
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileState.id
                            ? { ...f, status: 'extracting', progress: 60, ingest_id: uploaded.ingest_id }
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
                        f.id === fileState.id
                            ? { ...f, status: 'error', error: message }
                            : f
                    )
                );
            }
        }
    }, [files, activeNit, handleIngestStage]);

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
                const updated = await updateIngestClassification(fileState.ingest_id, {
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
                                      classification_review:
                                          updated.classification_review ?? null,
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
                        f.id === fileId
                            ? { ...f, status: 'error', error: message }
                            : f
                    )
                );
            }
        },
        [files, handleIngestStage]
    );

    return {
        files,
        addFiles,
        removeFile,
        clearAll,
        uploadAll,
        resumeIngest,
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
    status: 'idle' | 'uploading' | 'extracting' | 'review' | 'done' | 'error';
    progress: number;
    ingest_id?: string;
    error?: string;
    error_category?: string;
    error_code?: string;
    remediation?: string;
    has_warnings?: boolean;
    trace_url?: string | null;
    classification_review?: IngestClassificationReview | null;
}

const VIA_B_SLOTS: Pick<ViaBSlot, 'docType' | 'label'>[] = [
    { docType: 'balance_general', label: 'Balance General' },
    { docType: 'estado_resultados', label: 'Estado de Resultados' },
    { docType: 'libro_auxiliar', label: 'Libro Auxiliar' },
];

const VIA_B_DOC_TYPE_SET = new Set<string>([
    'balance_general',
    'estado_resultados',
    'libro_auxiliar',
]);

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
                    status: s.status === 'error' ? 'error' : 'done',
                    progress: 100,
                    error: s.status === 'error' ? s.error : undefined,
                    error_category: s.status === 'error' ? s.error_category : undefined,
                    remediation: s.status === 'error' ? s.remediation : undefined,
                }))
            );
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
                              remediation:
                                  'Los estados financieros derivados tardaron demasiado. Vuelve a intentarlo.',
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
    }, [companyNit, queryClient]);

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
                const normalizedStatus = String(ingest.status || '').toLowerCase();

                if (normalizedStatus === 'pending_review') {
                    const predictedType = ingest.classification_review?.predicted_type ?? '';
                    const isViaADoc = predictedType && !VIA_B_DOC_TYPE_SET.has(predictedType);

                    if (isViaADoc) {
                        // Classifier identified a Via A document in a Via B slot — block immediately.
                        const predictedLabel =
                            ingest.classification_review?.predicted_label ?? predictedType;
                        setSlots((prev) =>
                            prev.map((s) =>
                                s.docType === slot.docType
                                    ? {
                                          ...s,
                                          status: 'error',
                                          progress: 0,
                                          error: `Este archivo parece ser un documento de Vía A (${predictedLabel}). Los documentos de Vía A (facturas, extractos, etc.) deben subirse en la sección Vía A. Elimina este archivo y cárgalo en la sección correcta.`,
                                          error_category: 'wrong_upload_area',
                                      }
                                    : s
                            )
                        );
                        return;
                    }

                    // Via B type predicted — auto-confirm with the slot's expected doc_type
                    // so the pipeline continues without user interruption.
                    try {
                        await updateIngestClassification(uploaded.ingest_id, {
                            doc_type: slot.docType,
                            confirmed: true,
                        });
                    } catch {
                        // If auto-confirm fails, fall through to the normal ingest poll below.
                    }
                }

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

                if (normalizedStatus === 'failed') {
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
        await pollDerivedStatements();
    }, [slots, pollDerivedStatements, companyNit]);

    const resumeSlot = useCallback(
        async (slotType: ViaBDocType, docType: string) => {
            const targetSlot = slots.find((s) => s.docType === slotType);
            if (!targetSlot?.ingest_id) return;

            setSlots((prev) =>
                prev.map((s) =>
                    s.docType === slotType
                        ? {
                              ...s,
                              status: 'extracting',
                              progress: 60,
                              classification_review: null,
                          }
                        : s
                )
            );

            try {
                const updated = await updateIngestClassification(targetSlot.ingest_id, {
                    doc_type: docType,
                    confirmed: true,
                });
                const normalizedStatus = String(updated.status || '').toLowerCase();

                if (normalizedStatus === 'pending_review') {
                    setSlots((prev) =>
                        prev.map((s) =>
                            s.docType === slotType
                                ? {
                                      ...s,
                                      status: 'review',
                                      progress: 60,
                                      classification_review:
                                          updated.classification_review ?? null,
                                  }
                                : s
                        )
                    );
                    return;
                }

                const ingest = await waitForIngestCompletion(targetSlot.ingest_id);
                setSlots((prev) =>
                    prev.map((s) =>
                        s.docType === slotType
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

                const remaining = slots.filter((s) => s.docType !== slotType);
                const allDone = remaining.every((s) => s.status === 'done');
                if (allDone && !isPollingDerived) {
                    await pollDerivedStatements();
                }
            } catch (err: unknown) {
                const message = extractErrorMessage(err);
                setSlots((prev) =>
                    prev.map((s) =>
                        s.docType === slotType
                            ? { ...s, status: 'error', error: message }
                            : s
                    )
                );
            }
        },
        [isPollingDerived, pollDerivedStatements, slots]
    );

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
        slots.some((s) => s.status === 'uploading' || s.status === 'extracting' || s.status === 'review') ||
        isPollingDerived;

    return {
        slots,
        setSlotFile,
        allFilesSelected,
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
        mutationFn: (ingestId: string) => processAccounting(ingestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
    });
}
