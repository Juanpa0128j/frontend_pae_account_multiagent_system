'use client';

import { useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Collapse,
    Stack,
    Typography,
} from '@mui/material';
import {
    AutoFixHigh as AuditIcon,
    ExpandLess as CollapseIcon,
    ExpandMore as ExpandIcon,
    WarningAmber as WarningIcon,
} from '@mui/icons-material';
import StatusBadge from '@/components/common/StatusBadge';
import { BrutalistCard, BrutalistChip, BrutalistEmptyState } from '@/components/brutalist';
import AgentTimeline from '@/components/agent/AgentTimeline';
import { useProcessTrace } from '@/hooks';
import type { AgentName, AgentResult, FileUploadState } from '@/types';
import { formatDateLong, formatDuration } from '@/lib/formatters';
import { fonts, hexAlpha, moduleAccents, palette, sxLabelSmall } from '@/styles/brutalist';

interface ProcessAuditPanelProps {
    file: FileUploadState;
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
    if (status === 'retried') return 'retry';
    return 'success';
}

function AuditFindingList({
    title,
    findings,
    accent,
}: {
    title: string;
    findings: Array<{
        rule_id: string;
        user_message_es: string;
        suggested_action_es?: string | null;
    }>;
    accent: string;
}) {
    if (findings.length === 0) return null;

    return (
        <Box sx={{ mt: 2 }}>
            <Typography sx={{ ...sxLabelSmall, color: accent, mb: 1 }}>
                {title}
            </Typography>
            <Stack spacing={1}>
                {findings.map((finding, idx) => (
                    <BrutalistCard
                        key={`${finding.rule_id}-${idx}`}
                        accent={accent}
                        active
                        sx={{ p: 1.5 }}
                    >
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.68rem',
                                letterSpacing: '0.12em',
                                color: accent,
                                mb: 0.5,
                            }}
                        >
                            {finding.rule_id}
                        </Typography>
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

export default function ProcessAuditPanel({ file }: ProcessAuditPanelProps) {
    const [expanded, setExpanded] = useState(false);
    const shouldLoadTrace = expanded || file.status === 'error' || Boolean(file.has_warnings);
    const { data: trace, isLoading, isError } = useProcessTrace(
        file.process_id,
        shouldLoadTrace && Boolean(file.process_id)
    );

    const overallLabel = useMemo(() => {
        if (file.status === 'error') return 'REJECTED';
        if (file.has_warnings) return 'PENDING';
        return 'POSTED';
    }, [file.has_warnings, file.status]);

    const summaryAccent = file.status === 'error' ? palette.error : palette.amber;
    const blockers = trace?.blockers ?? [];
    const retrySteps =
        trace?.steps.filter((step) => step.status === 'retried' || step.status === 'failed') ?? [];
    const timelineSteps = (trace?.steps ?? []).map((step) => ({
        agente: mapTraceAgentToTimelineAgent(step.agent),
        accion: step.summary_es,
        resultado: mapTraceStatusToTimelineResult(step.status),
        duracion_ms: step.duration_ms ?? 0,
        detalle: step.details_es.join(' '),
    }));

    return (
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
                            {'// AUDITORÍA DEL PROCESO'}
                        </Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                        <StatusBadge status={overallLabel} />
                        {file.error_code && (
                            <BrutalistChip
                                label={file.error_code}
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
                            'El proceso terminó, pero conviene revisar la traza del auditor.'}
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
                            {(file.error_category || trace?.overall_status || '').toUpperCase()}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: palette.paperMuted }}>
                            <CircularProgress size={16} sx={{ color: summaryAccent }} />
                            <Typography sx={{ fontFamily: fonts.body, fontSize: '0.9rem' }}>
                                Cargando trace del proceso...
                            </Typography>
                        </Box>
                    )}

                    {!isLoading && isError && (
                        <Alert severity="warning" sx={{ borderRadius: 1 }}>
                            No se pudo cargar la traza del proceso. El backend terminó el flujo, pero el detalle no está disponible.
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

                            {trace.steps.some((step) => step.started_at || step.completed_at) && (
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
                                            {step.started_at ? formatDateLong(step.started_at) : '—'}
                                            {' · '}
                                            {step.completed_at ? formatDateLong(step.completed_at) : 'en curso'}
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
                                findings={retrySteps.flatMap((step) => step.findings)}
                                accent={palette.amber}
                            />

                            {trace.give_up && (
                                <Alert
                                    severity="warning"
                                    icon={<WarningIcon />}
                                    sx={{ mt: 2, borderRadius: 1 }}
                                >
                                    {trace.give_up.explanation_es}
                                </Alert>
                            )}
                        </Box>
                    )}
                </Box>
            </Collapse>
        </BrutalistCard>
    );
}
