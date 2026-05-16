'use client';

import { Box, Typography, Chip, Paper, Collapse, IconButton } from '@mui/material';
import {
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Replay as RetryIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import React, { useMemo, useState } from 'react';
import { AgentStep } from '@/types';
import { formatCOP, formatDuration } from '@/lib/formatters';
import { fonts, palette, sxLabelSmall } from '@/styles/brutalist';

const AGENT_COLORS: Record<string, string> = {
    Supervisor: '#6366F1',
    Ingesta: '#3B82F6',
    Contador: '#10B981',
    Tributario: '#F59E0B',
    Auditor: '#8B5CF6',
};

const RESULT_ICON: Record<string, React.ReactNode> = {
    success: <SuccessIcon sx={{ fontSize: 16, color: '#10B981' }} />,
    error: <ErrorIcon sx={{ fontSize: 16, color: '#EF4444' }} />,
    retry: <RetryIcon sx={{ fontSize: 16, color: '#F59E0B' }} />,
};

interface AgentStepCardProps {
    step: AgentStep;
    isLast?: boolean;
}

export function AgentStepCard({ step, isLast = false }: AgentStepCardProps) {
    const [expanded, setExpanded] = useState(false);
    const color = AGENT_COLORS[step.agente] || '#6366F1';
    const detailPayload = useMemo(() => {
        const raw = step.detalle?.trim();
        if (!raw) return null;
        if (
            (raw.startsWith('{') && raw.endsWith('}')) ||
            (raw.startsWith('[') && raw.endsWith(']'))
        ) {
            try {
                return JSON.parse(raw) as Record<string, unknown>;
            } catch {
                return null;
            }
        }
        return null;
    }, [step.detalle]);

    const detailSummary =
        (detailPayload?.descripcion_general as string | undefined) ??
        (detailPayload?.resumen as string | undefined) ??
        (detailPayload?.descripcion as string | undefined) ??
        '';

    const asientos = Array.isArray(detailPayload?.asientos)
        ? (detailPayload?.asientos as Array<Record<string, unknown>>)
        : null;

    const totals = [
        { label: 'Total débitos', value: detailPayload?.total_debitos },
        { label: 'Total créditos', value: detailPayload?.total_creditos },
    ]
        .map((item) => ({
            label: item.label,
            value:
                typeof item.value === 'string' || typeof item.value === 'number'
                    ? Number(item.value)
                    : null,
        }))
        .filter((item) => item.value !== null);

    const hasDetail = Boolean(detailSummary || step.detalle?.trim() || asientos?.length);

    return (
        <Box sx={{ display: 'flex', gap: 1.5, position: 'relative' }}>
            {/* Timeline line */}
            {!isLast && (
                <Box
                    sx={{
                        position: 'absolute',
                        left: 15,
                        top: 32,
                        bottom: -8,
                        width: 2,
                        bgcolor: 'rgba(255,255,255,0.06)',
                    }}
                />
            )}

            {/* Dot */}
            <Box
                sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: `${color}20`,
                    border: `2px solid ${color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mt: 0.5,
                    boxShadow: `0 0 12px ${color}40`,
                }}
            >
                {RESULT_ICON[step.resultado]}
            </Box>

            {/* Card */}
            <Paper
                elevation={0}
                sx={{
                    flex: 1,
                    mb: isLast ? 0 : 1.5,
                    p: 1.5,
                    border: `1px solid ${color}25`,
                    bgcolor: `${color}08`,
                    borderRadius: 2,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 0.5,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color }}>
                            {step.agente}
                        </Typography>
                        <Chip
                            size="small"
                            label={formatDuration(step.duracion_ms)}
                            sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor: 'rgba(255,255,255,0.06)',
                                color: 'text.secondary',
                                fontFamily: 'monospace',
                            }}
                        />
                    </Box>
                    {hasDetail && (
                        <IconButton
                            size="small"
                            onClick={() => setExpanded((e) => !e)}
                            sx={{ p: 1, color: 'text.disabled' }}
                        >
                            {expanded ? (
                                <CollapseIcon fontSize="small" />
                            ) : (
                                <ExpandIcon fontSize="small" />
                            )}
                        </IconButton>
                    )}
                </Box>

                <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', display: 'block' }}
                >
                    {step.accion}
                </Typography>

                {hasDetail && (
                    <Collapse in={expanded}>
                        <Box
                            sx={{
                                mt: 1,
                                p: 1.25,
                                borderRadius: 1.5,
                                bgcolor: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
                            {detailSummary && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'text.secondary',
                                        fontStyle: 'italic',
                                        lineHeight: 1.6,
                                        display: 'block',
                                    }}
                                >
                                    &ldquo;{detailSummary}&rdquo;
                                </Typography>
                            )}

                            {asientos && asientos.length > 0 && (
                                <Box sx={{ mt: detailSummary ? 1 : 0 }}>
                                    <Typography
                                        sx={{
                                            ...sxLabelSmall,
                                            color: palette.paperFaint,
                                            mb: 0.75,
                                        }}
                                    >
                                        {'// Asientos'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                        {asientos.map((entry, idx) => {
                                            const cuenta = String(entry.cuenta_puc ?? entry.cuenta ?? '');
                                            const nombre = String(
                                                entry.nombre_cuenta ?? entry.descripcion ?? ''
                                            );
                                            const tipo = String(entry.tipo_movimiento ?? '').toLowerCase();
                                            const valorRaw = entry.valor ?? entry.monto ?? entry.valor_cop ?? 0;
                                            const valorNum =
                                                typeof valorRaw === 'string' || typeof valorRaw === 'number'
                                                    ? Number(valorRaw)
                                                    : 0;
                                            const isDebito = tipo.includes('debito');
                                            const label = isDebito ? 'Débito' : 'Crédito';
                                            return (
                                                <Box
                                                    key={`${cuenta}-${idx}`}
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography
                                                            sx={{
                                                                fontFamily: fonts.mono,
                                                                fontSize: '0.72rem',
                                                                color: palette.paper,
                                                            }}
                                                        >
                                                            {cuenta || '—'}
                                                        </Typography>
                                                        <Typography
                                                            sx={{
                                                                fontSize: '0.72rem',
                                                                color: palette.paperFaint,
                                                            }}
                                                        >
                                                            {nombre || '—'}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'right' }}>
                                                        <Typography
                                                            sx={{
                                                                ...sxLabelSmall,
                                                                color: palette.paperFaint,
                                                            }}
                                                        >
                                                            {label}
                                                        </Typography>
                                                        <Typography
                                                            sx={{
                                                                fontFamily: fonts.mono,
                                                                fontSize: '0.78rem',
                                                                color: isDebito
                                                                    ? palette.success
                                                                    : palette.amber,
                                                            }}
                                                        >
                                                            {formatCOP(valorNum)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            )}

                            {totals.length > 0 && (
                                <Box
                                    sx={{
                                        mt: 1,
                                        pt: 1,
                                        borderTop: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        gap: 2,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    {totals.map((total) => (
                                        <Box key={total.label}>
                                            <Typography
                                                sx={{
                                                    ...sxLabelSmall,
                                                    color: palette.paperFaint,
                                                }}
                                            >
                                                {total.label}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.78rem',
                                                    color: palette.paper,
                                                }}
                                            >
                                                {formatCOP(total.value ?? 0)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            {!detailSummary && !asientos?.length && step.detalle && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'text.secondary',
                                        fontStyle: 'italic',
                                        lineHeight: 1.6,
                                    }}
                                >
                                    &ldquo;{step.detalle}&rdquo;
                                </Typography>
                            )}
                        </Box>
                    </Collapse>
                )}
            </Paper>
        </Box>
    );
}
