'use client';

import { useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Collapse,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import {
    AutoFixHigh as AuditIcon,
    ExpandLess as CollapseIcon,
    ExpandMore as ExpandIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import StatusBadge from '@/components/common/StatusBadge';
import {
    BrutalistButton,
    BrutalistCard,
    BrutalistChip,
    BrutalistEmptyState,
} from '@/components/brutalist';
import AgentTimeline from '@/components/agent/AgentTimeline';
import PeriodReviewCard from '@/components/upload/PeriodReviewCard';
import {
    useConfirmAuditReview,
    useIngestDetail,
    useIngestTrace,
    useProcessStatus,
    useProcessTrace,
} from '@/hooks';
import { setTransactionFecha, updateIngestPeriod } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import type { AgentName, AgentResult } from '@/types';
import { formatDateLong, formatDuration } from '@/lib/formatters';
import { fonts, hexAlpha, moduleAccents, palette, sxLabelSmall } from '@/styles/brutalist';

type AuditTraceKind = 'process' | 'ingest';

export interface AuditPanelState {
    status: 'done' | 'error';
    error?: string;
    error_category?: string;
    error_code?: string;
    remediation?: string;
    has_warnings?: boolean;
    process_id?: string;
    ingest_id?: string;
    trace_kind?: AuditTraceKind;
    label?: string;
    file_names?: string[];
}

interface ProcessAuditPanelProps {
    file: AuditPanelState;
    onConfirmSuccess?: (processId: string) => void;
}

function mapTraceAgentToTimelineAgent(agent: string): AgentName {
    switch (agent) {
        case 'ingesta':
            return 'Ingesta';
        case 'contador':
            return 'Contador';
        case 'tributario':
            return 'Tributario';
        case 'auditor':
        case 'db_persist':
            return 'Auditor';
        default:
            return 'Supervisor';
    }
}

function mapTraceStatusToTimelineResult(status: string): AgentResult {
    if (status === 'failed') return 'error';
    if (status === 'retried' || status === 'warning') return 'retry';
    return 'success';
}

const ERROR_CODE_ES: Record<string, string> = {
    PROCESS_EXECUTION_ERROR: 'ERROR_EJECUCIÓN',
    PUC_CODES_NOT_FOUND: 'CÓDIGOS_PUC_INVÁLIDOS',
    AUDIT_BLOCKER: 'BLOQUEO_AUDITORÍA',
    MISSING_COMPANY_SETTINGS: 'CONFIGURACIÓN_EMPRESA_FALTANTE',
    NO_STAGED_TRANSACTIONS: 'SIN_TRANSACCIONES',
    MISSING_NIT_RECEPTOR: 'NIT_RECEPTOR_FALTANTE',
    INGEST_ERROR: 'ERROR_INGESTA',
    NO_CONTADOR_ASIENTOS: 'SIN_ASIENTOS_CONTABLES',
    SCHEMA_VALIDATION_EXHAUSTED: 'VALIDACIÓN_ESQUEMA_AGOTADA',
};

const ERROR_CATEGORY_ES: Record<string, string> = {
    system_error: 'ERROR_SISTEMA',
    validation_error: 'ERROR_VALIDACIÓN',
    audit_blocker: 'BLOQUEO_AUDITORÍA',
    business_precondition: 'PRECONDICIÓN_NEGOCIO',
    extraction_error: 'ERROR_EXTRACCIÓN',
    completed_with_warnings: 'COMPLETADO_CON_ALERTAS',
    failed: 'FALLIDO',
    completed: 'COMPLETADO',
};

function localizeErrorCode(code: string | undefined): string | undefined {
    if (!code) return undefined;
    return ERROR_CODE_ES[code] ?? code;
}

function localizeErrorCategory(category: string | undefined): string | undefined {
    if (!category) return undefined;
    return ERROR_CATEGORY_ES[category] ?? category.toUpperCase();
}

export function AuditFindingList({
    title,
    findings,
    accent,
}: {
    title: string;
    findings: Array<{
        rule_id: string;
        fixable?: boolean;
        user_message_es: string;
        suggested_action_es?: string | null;
    }>;
    accent: string;
}) {
    if (findings.length === 0) return null;

    return (
        <Box sx={{ mt: 2 }}>
            <Typography sx={{ ...sxLabelSmall, color: accent, mb: 1 }}>{title}</Typography>
            <Stack spacing={1}>
                {findings.map((finding, idx) => (
                    <BrutalistCard
                        key={`${finding.rule_id}-${idx}`}
                        accent={accent}
                        active
                        sx={{ p: 1.5 }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 0.5,
                                flexWrap: 'wrap',
                            }}
                        >
                            <Typography
                                sx={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.68rem',
                                    letterSpacing: '0.12em',
                                    color: accent,
                                }}
                            >
                                {localizeErrorCode(finding.rule_id) ?? finding.rule_id}
                            </Typography>
                            {finding.fixable && (
                                <BrutalistChip
                                    label="ACCIÓN REQUERIDA"
                                    color={palette.amber}
                                    size="sm"
                                />
                            )}
                        </Box>
                        <Typography
                            sx={{
                                fontFamily: fonts.body,
                                fontSize: '0.9rem',
                                color: palette.paper,
                            }}
                        >
                            {finding.user_message_es}
                        </Typography>
                        {finding.suggested_action_es && (
                            <Typography
                                sx={{
                                    fontFamily: fonts.body,
                                    fontSize: '0.82rem',
                                    color: palette.paperMuted,
                                    mt: 0.75,
                                }}
                            >
                                {finding.suggested_action_es}
                            </Typography>
                        )}
                    </BrutalistCard>
                ))}
            </Stack>
        </Box>
    );
}

export default function ProcessAuditPanel({ file, onConfirmSuccess }: ProcessAuditPanelProps) {
    const [expanded, setExpanded] = useState(false);
    const processId = file.process_id ?? null;

    const { data: processStatus } = useProcessStatus(processId, Boolean(processId));
    const confirmMutation = useConfirmAuditReview();

    const [fechaInput, setFechaInput] = useState<string>('');
    const [fechaSaving, setFechaSaving] = useState(false);
    const [fechaError, setFechaError] = useState<string | null>(null);

    const isPendingAuditReview =
        processStatus?.status === 'pending_audit_review' ||
        (file as { status?: string }).status === 'pending_audit_review';

    const auditReview = processStatus?.audit_review ?? null;

    // Detect the "missing fecha" HITL case — when present, surface a date
    // picker instead of (or in addition to) the generic "continuar de todas
    // formas" button.
    const fechaFinding = useMemo(() => {
        const findings = (auditReview?.last_findings ?? []) as Array<{
            rule_id?: string;
            evidence?: { transaction_id?: string };
        }>;
        return findings.find((f) => f.rule_id === 'ING-FECHA-MISSING') ?? null;
    }, [auditReview]);
    const missingFechaTxId = fechaFinding?.evidence?.transaction_id ?? null;

    const shouldLoadTrace = expanded || file.status === 'error' || Boolean(file.has_warnings);
    const traceKind = file.trace_kind ?? (file.process_id ? 'process' : 'ingest');

    // Pull the ingest detail so we can render the PeriodReviewCard when the
    // backend flags the LLM-extracted period for human verification. Only
    // Vía B uploads carry a ``period_review`` block — Vía A ingests come
    // back with ``null`` and the card stays hidden.
    const queryClient = useQueryClient();
    const { data: ingestDetail } = useIngestDetail(file.ingest_id ?? null, Boolean(file.ingest_id));
    const periodReview = ingestDetail?.period_review ?? null;
    const {
        data: processTrace,
        isLoading: isProcessLoading,
        isError: isProcessError,
    } = useProcessTrace(
        file.process_id,
        traceKind === 'process' && shouldLoadTrace && Boolean(file.process_id)
    );
    const {
        data: ingestTrace,
        isLoading: isIngestLoading,
        isError: isIngestError,
    } = useIngestTrace(
        file.ingest_id,
        traceKind === 'ingest' && shouldLoadTrace && Boolean(file.ingest_id)
    );
    const trace = traceKind === 'ingest' ? ingestTrace : processTrace;
    const isLoading = traceKind === 'ingest' ? isIngestLoading : isProcessLoading;
    const isError = traceKind === 'ingest' ? isIngestError : isProcessError;

    const overallLabel = useMemo(() => {
        if (file.status === 'error') return 'REJECTED';
        if (file.has_warnings) return 'PENDING';
        return 'POSTED';
    }, [file.has_warnings, file.status]);

    const summaryAccent = file.status === 'error' ? palette.error : palette.amber;
    const blockers = trace?.blockers ?? [];
    const retrySteps =
        trace?.steps.filter(
            (step) =>
                step.status === 'retried' || step.status === 'failed' || step.status === 'warning'
        ) ?? [];
    const timelineSteps = (trace?.steps ?? []).map((step) => ({
        agente: mapTraceAgentToTimelineAgent(step.agent),
        accion: step.summary_es,
        resultado: mapTraceStatusToTimelineResult(step.status),
        duracion_ms: step.duration_ms ?? 0,
        detalle: step.details_es.join(' '),
    }));

    return (
        <>
            {confirmMutation.isSuccess &&
                !isPendingAuditReview &&
                !['completed', 'failed', 'cancelled'].includes(
                    String(processStatus?.status || '').toLowerCase()
                ) && (
                    <BrutalistCard
                        accent={palette.chartreuse}
                        active
                        sx={{
                            mt: 2,
                            p: 0,
                            overflow: 'hidden',
                            border: `1px solid ${hexAlpha(palette.chartreuse, 0.3)}`,
                        }}
                    >
                        <Box
                            sx={{
                                p: { xs: 2.5, md: 3.5 },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <CircularProgress
                                size={20}
                                sx={{ color: palette.chartreuse, flexShrink: 0 }}
                            />
                            <Box>
                                <Typography
                                    sx={{ ...sxLabelSmall, color: palette.chartreuse, mb: 0.5 }}
                                >
                                    {'// PROCESANDO'}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: fonts.body,
                                        fontSize: '0.95rem',
                                        color: palette.paper,
                                    }}
                                >
                                    El pipeline contable continúa con persistencia forzada.
                                    {file.label && (
                                        <Box
                                            component="span"
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.8rem',
                                                color: hexAlpha(palette.paper, 0.6),
                                                display: 'block',
                                                mt: 0.5,
                                            }}
                                        >
                                            {file.label}
                                        </Box>
                                    )}
                                </Typography>
                            </Box>
                        </Box>
                    </BrutalistCard>
                )}

            {isPendingAuditReview && !confirmMutation.isSuccess && (
                <BrutalistCard
                    accent={palette.amber}
                    active
                    sx={{
                        mt: 2,
                        p: 0,
                        overflow: 'hidden',
                        border: `1px solid ${hexAlpha(palette.amber, 0.3)}`,
                    }}
                >
                    <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
                        <Typography
                            sx={{
                                ...sxLabelSmall,
                                color: palette.amber,
                                mb: 1.5,
                            }}
                        >
                            {'// REVISIÓN_REQUERIDA'}
                        </Typography>

                        {file.label && (
                            <Typography
                                sx={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.75rem',
                                    color: hexAlpha(palette.amber, 0.7),
                                    letterSpacing: '0.1em',
                                    mb: 1.5,
                                }}
                            >
                                {file.label}
                            </Typography>
                        )}

                        <Typography
                            sx={{
                                fontFamily: fonts.display,
                                fontSize: { xs: '1.4rem', md: '1.8rem' },
                                fontWeight: 700,
                                letterSpacing: '-0.04em',
                                color: palette.paper,
                                mb: 2,
                            }}
                        >
                            Confirmación requerida.
                        </Typography>

                        {Boolean(auditReview?.explanation_es) && (
                            <Typography
                                sx={{
                                    fontFamily: fonts.body,
                                    fontSize: '0.95rem',
                                    color: palette.paper,
                                    mb: 1.5,
                                }}
                            >
                                {String(auditReview!.explanation_es)}
                            </Typography>
                        )}

                        {!auditReview?.explanation_es && trace?.give_up?.explanation_es && (
                            <Typography
                                sx={{
                                    fontFamily: fonts.body,
                                    fontSize: '0.95rem',
                                    color: palette.paper,
                                    mb: 1.5,
                                }}
                            >
                                {trace.give_up.explanation_es}
                            </Typography>
                        )}

                        {Boolean(auditReview?.rejection_reason) && (
                            <Typography
                                sx={{
                                    fontFamily: fonts.body,
                                    fontSize: '0.88rem',
                                    color: palette.paperMuted,
                                    mb: 1.5,
                                    pl: 1.5,
                                    borderLeft: `2px solid ${hexAlpha(palette.amber, 0.5)}`,
                                }}
                            >
                                {String(auditReview!.rejection_reason)}
                            </Typography>
                        )}

                        {typeof auditReview?.attempts === 'number' && (
                            <Typography
                                sx={{
                                    ...sxLabelSmall,
                                    color: palette.amber,
                                    mb: 2,
                                }}
                            >
                                {'// '}
                                {String(auditReview.attempts)}
                                {' INTENTOS_AUTOMÁTICOS'}
                            </Typography>
                        )}

                        {Array.isArray(auditReview?.last_findings) &&
                            (auditReview.last_findings as unknown[]).length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography
                                        sx={{ ...sxLabelSmall, color: palette.amber, mb: 1 }}
                                    >
                                        {'// ÚLTIMOS_HALLAZGOS'}
                                    </Typography>
                                    <Stack spacing={1}>
                                        {(
                                            auditReview.last_findings as Array<{
                                                rule_id?: string;
                                                user_message_es?: string;
                                            }>
                                        ).map((f, idx) => (
                                            <Box
                                                key={`finding-${idx}`}
                                                sx={{
                                                    p: 1.25,
                                                    border: `1px solid ${hexAlpha(palette.amber, 0.18)}`,
                                                    borderRadius: 1,
                                                }}
                                            >
                                                {f.rule_id && (
                                                    <Typography
                                                        sx={{
                                                            fontFamily: fonts.mono,
                                                            fontSize: '0.68rem',
                                                            letterSpacing: '0.12em',
                                                            color: palette.amber,
                                                            mb: 0.5,
                                                        }}
                                                    >
                                                        {localizeErrorCode(f.rule_id) ?? f.rule_id}
                                                    </Typography>
                                                )}
                                                {f.user_message_es && (
                                                    <Typography
                                                        sx={{
                                                            fontFamily: fonts.body,
                                                            fontSize: '0.88rem',
                                                            color: palette.paper,
                                                        }}
                                                    >
                                                        {f.user_message_es}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                        {missingFechaTxId && (
                            <Box
                                sx={{
                                    mb: 2.5,
                                    p: 2,
                                    border: `1px solid ${hexAlpha(palette.amber, 0.35)}`,
                                    bgcolor: hexAlpha(palette.amber, 0.05),
                                }}
                            >
                                <Typography
                                    sx={{
                                        ...sxLabelSmall,
                                        color: palette.amber,
                                        mb: 1,
                                    }}
                                >
                                    {'// INGRESAR_FECHA_DEL_DOCUMENTO'}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: fonts.body,
                                        fontSize: '0.85rem',
                                        color: palette.paper,
                                        mb: 1.5,
                                    }}
                                >
                                    El sistema no pudo determinar la fecha del documento. Ingrésela
                                    manualmente (la usaremos como fecha contable del asiento y para
                                    derivar el periodo).
                                </Typography>
                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                    <TextField
                                        type="date"
                                        size="small"
                                        value={fechaInput}
                                        onChange={(e) => {
                                            setFechaInput(e.target.value);
                                            setFechaError(null);
                                        }}
                                        sx={{
                                            flex: 1,
                                            '& input': {
                                                fontFamily: fonts.mono,
                                                fontSize: '0.85rem',
                                                color: palette.paper,
                                                colorScheme: 'dark',
                                            },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: hexAlpha(palette.amber, 0.4),
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: palette.amber,
                                            },
                                        }}
                                        label="Fecha del documento"
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{
                                            'aria-label': 'Fecha del documento',
                                        }}
                                    />
                                    <BrutalistButton
                                        accent={palette.amber}
                                        variant="primary"
                                        loading={fechaSaving}
                                        disabled={
                                            !fechaInput ||
                                            fechaSaving ||
                                            !processId ||
                                            !missingFechaTxId
                                        }
                                        onClick={async () => {
                                            if (!missingFechaTxId || !processId) return;
                                            setFechaSaving(true);
                                            setFechaError(null);
                                            try {
                                                await setTransactionFecha(
                                                    missingFechaTxId,
                                                    fechaInput
                                                );
                                                await confirmMutation.mutateAsync(processId);
                                                onConfirmSuccess?.(processId);
                                            } catch (err) {
                                                setFechaError(
                                                    err instanceof Error
                                                        ? err.message
                                                        : 'Error al guardar la fecha'
                                                );
                                            } finally {
                                                setFechaSaving(false);
                                            }
                                        }}
                                    >
                                        Guardar y reintentar
                                    </BrutalistButton>
                                </Stack>
                                {fechaError && (
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.body,
                                            fontSize: '0.8rem',
                                            color: palette.error,
                                            mt: 1.5,
                                        }}
                                    >
                                        {fechaError}
                                    </Typography>
                                )}
                            </Box>
                        )}

                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.68rem',
                                letterSpacing: '0.12em',
                                color: hexAlpha(palette.amber, 0.65),
                                mb: 2.5,
                            }}
                        >
                            {
                                '// ADVERTENCIA: Los asientos contables se persistirán sin aprobación del auditor.'
                            }
                        </Typography>

                        <BrutalistButton
                            accent={palette.amber}
                            variant="outline"
                            onClick={() => {
                                if (processId) {
                                    confirmMutation.mutate(processId, {
                                        onSuccess: () => onConfirmSuccess?.(processId),
                                    });
                                }
                            }}
                            loading={confirmMutation.isPending}
                            disabled={!processId || confirmMutation.isPending}
                        >
                            Continuar de todas formas
                        </BrutalistButton>

                        {confirmMutation.isError && (
                            <Typography
                                sx={{
                                    fontFamily: fonts.body,
                                    fontSize: '0.85rem',
                                    color: palette.error,
                                    mt: 1.5,
                                }}
                            >
                                Error al confirmar. Intente de nuevo.
                            </Typography>
                        )}
                    </Box>
                </BrutalistCard>
            )}

            {/* HITL — period review for Vía B uploads with an ambiguous extraction. */}
            {file.ingest_id && periodReview && periodReview.requires_review && (
                <PeriodReviewCard
                    fileName={file.label ?? file.ingest_id}
                    review={periodReview}
                    onConfirm={async (payload) => {
                        await updateIngestPeriod(file.ingest_id!, payload);
                        queryClient.invalidateQueries({
                            queryKey: ['ingest', file.ingest_id],
                        });
                    }}
                />
            )}

            <BrutalistCard
                accent={summaryAccent}
                active
                sx={{
                    mt: 2,
                    p: 0,
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        justifyContent: 'space-between',
                        gap: 2,
                        flexDirection: { xs: 'column', md: 'row' },
                    }}
                >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AuditIcon sx={{ color: summaryAccent, fontSize: 18 }} />
                            <Typography sx={{ ...sxLabelSmall, color: summaryAccent }}>
                                {traceKind === 'ingest'
                                    ? '// AUDITORÍA DE INGESTA'
                                    : '// AUDITORÍA DEL PROCESO'}
                            </Typography>
                        </Box>
                        {file.label && (
                            <Typography
                                sx={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.7rem',
                                    color: hexAlpha(summaryAccent, 0.7),
                                    letterSpacing: '0.1em',
                                    mb: file.file_names && file.file_names.length > 1 ? 0.5 : 1,
                                    mt: -0.5,
                                }}
                            >
                                {file.label}
                            </Typography>
                        )}
                        {file.file_names && file.file_names.length > 1 && (
                            <Box
                                component="ul"
                                sx={{
                                    listStyle: 'none',
                                    m: 0,
                                    p: 0,
                                    mb: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.25,
                                }}
                            >
                                {file.file_names.map((name, i) => (
                                    <Box
                                        key={i}
                                        component="li"
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.65rem',
                                            color: hexAlpha(summaryAccent, 0.55),
                                            letterSpacing: '0.08em',
                                        }}
                                    >
                                        {name}
                                    </Box>
                                ))}
                            </Box>
                        )}
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1}
                            alignItems={{ sm: 'center' }}
                        >
                            <StatusBadge status={overallLabel} />
                            {file.error_code && (
                                <BrutalistChip
                                    label={localizeErrorCode(file.error_code) ?? file.error_code}
                                    color={summaryAccent}
                                    size="sm"
                                />
                            )}
                        </Stack>
                        <Typography
                            sx={{
                                mt: 1.25,
                                fontFamily: fonts.body,
                                fontSize: '0.95rem',
                                color: palette.paper,
                            }}
                        >
                            {file.remediation ||
                                file.error ||
                                (traceKind === 'ingest'
                                    ? 'La ingesta terminó, pero conviene revisar la traza del auditor.'
                                    : 'El proceso terminó, pero conviene revisar la traza del auditor.')}
                        </Typography>
                        {(file.error_category || trace?.overall_status) && (
                            <Typography
                                sx={{
                                    mt: 0.75,
                                    fontFamily: fonts.mono,
                                    fontSize: '0.68rem',
                                    color: palette.paperFaint,
                                    letterSpacing: '0.08em',
                                }}
                            >
                                {localizeErrorCategory(file.error_category) ??
                                    localizeErrorCategory(trace?.overall_status) ??
                                    (trace?.overall_status || '').toUpperCase()}
                            </Typography>
                        )}
                    </Box>

                    <Button
                        variant="outlined"
                        onClick={() => setExpanded((current) => !current)}
                        startIcon={expanded ? <CollapseIcon /> : <ExpandIcon />}
                        sx={{
                            alignSelf: { xs: 'stretch', md: 'center' },
                            borderColor: hexAlpha(summaryAccent, 0.35),
                            color: summaryAccent,
                            '&:hover': {
                                borderColor: summaryAccent,
                                bgcolor: hexAlpha(summaryAccent, 0.08),
                            },
                        }}
                    >
                        {expanded ? 'Ocultar trace' : 'Ver trace'}
                    </Button>
                </Box>

                <Collapse in={expanded}>
                    <Box
                        sx={{
                            borderTop: `1px solid ${palette.line}`,
                            px: 2,
                            py: 2,
                            bgcolor: hexAlpha(moduleAccents.upload, 0.02),
                        }}
                    >
                        {isLoading && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    color: palette.paperMuted,
                                }}
                            >
                                <CircularProgress size={16} sx={{ color: summaryAccent }} />
                                <Typography sx={{ fontFamily: fonts.body, fontSize: '0.9rem' }}>
                                    {traceKind === 'ingest'
                                        ? 'Cargando trace de la ingesta...'
                                        : 'Cargando trace del proceso...'}
                                </Typography>
                            </Box>
                        )}

                        {!isLoading && isError && (
                            <Alert severity="warning" sx={{ borderRadius: 1 }}>
                                {traceKind === 'ingest'
                                    ? 'No se pudo cargar la traza de la ingesta. El backend terminó el flujo, pero el detalle no está disponible.'
                                    : 'No se pudo cargar la traza del proceso. El backend terminó el flujo, pero el detalle no está disponible.'}
                            </Alert>
                        )}

                        {!isLoading && !isError && trace && (
                            <Box>
                                {timelineSteps.length > 0 ? (
                                    <AgentTimeline
                                        steps={timelineSteps}
                                        totalDurationMs={trace.steps.reduce(
                                            (sum, step) => sum + (step.duration_ms ?? 0),
                                            0
                                        )}
                                    />
                                ) : (
                                    <BrutalistEmptyState
                                        label="// TRACE VACÍO"
                                        title="Sin pasos registrados"
                                        description="El backend terminó el proceso, pero no adjuntó una secuencia útil de pasos para esta corrida."
                                    />
                                )}

                                {trace.steps.some(
                                    (step) => step.started_at || step.completed_at
                                ) && (
                                    <Stack spacing={0.75} sx={{ mt: 2 }}>
                                        {trace.steps.map((step, idx) => (
                                            <Typography
                                                key={`${step.agent}-ts-${idx}`}
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.62rem',
                                                    letterSpacing: '0.08em',
                                                    color: palette.paperGhost,
                                                }}
                                            >
                                                {step.agent.toUpperCase()}
                                                {' · '}
                                                {step.started_at
                                                    ? formatDateLong(step.started_at)
                                                    : '—'}
                                                {' · '}
                                                {step.completed_at
                                                    ? formatDateLong(step.completed_at)
                                                    : 'en curso'}
                                                {typeof step.duration_ms === 'number'
                                                    ? ` · ${formatDuration(step.duration_ms)}`
                                                    : ''}
                                            </Typography>
                                        ))}
                                    </Stack>
                                )}

                                <AuditFindingList
                                    title="// BLOCKERS"
                                    findings={blockers}
                                    accent={palette.error}
                                />

                                <AuditFindingList
                                    title="// REINTENTOS / OBSERVACIONES"
                                    findings={retrySteps.flatMap((step) => step.findings ?? [])}
                                    accent={palette.amber}
                                />

                                {trace.give_up && (
                                    <Alert
                                        severity="warning"
                                        icon={<WarningIcon />}
                                        sx={{ mt: 2, borderRadius: 1 }}
                                    >
                                        <Typography
                                            sx={{ fontFamily: fonts.body, fontSize: '0.9rem' }}
                                        >
                                            {trace.give_up.explanation_es}
                                        </Typography>
                                        {trace.give_up.rejection_reason && (
                                            <Typography
                                                sx={{
                                                    fontFamily: fonts.body,
                                                    fontSize: '0.82rem',
                                                    mt: 0.75,
                                                    opacity: 0.8,
                                                }}
                                            >
                                                {trace.give_up.rejection_reason}
                                            </Typography>
                                        )}
                                    </Alert>
                                )}
                            </Box>
                        )}
                    </Box>
                </Collapse>
            </BrutalistCard>
        </>
    );
}
