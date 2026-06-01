'use client';

import { useEffect, useState, useRef } from 'react';
import {
    Box,
    Grid,
    Typography,
    LinearProgress,
    Chip,
    Alert,
    Divider,
    CircularProgress,
} from '@mui/material';
import { CheckCircle as OkIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { BrutalistPageHero, BrutalistButton } from '@/components/brutalist';
import { moduleAccents, palette } from '@/styles/brutalist';
import { evaluationApiClient } from '@/lib/api/clients';
import type { SchemaComplianceMetrics, EvaluationAgentDetail } from '@/types';

interface MetricBarProps {
    label: string;
    value: number;
    color: string;
}

function MetricBar({ label, value, color }: MetricBarProps) {
    return (
        <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: palette.paperMuted }}>
                    {label}
                </Typography>
                <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color, fontFamily: 'monospace' }}
                >
                    {(value * 100).toFixed(1)}%
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={value * 100}
                sx={{
                    borderRadius: 1,
                    height: 6,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 1 },
                }}
            />
        </Box>
    );
}

function colorForRate(rate: number): string {
    if (rate >= 0.95) return palette.success;
    if (rate >= 0.8) return palette.amber;
    return palette.error;
}

export default function EvaluationPage() {
    const [metrics, setMetrics] = useState<SchemaComplianceMetrics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const controllerRef = useRef<AbortController | null>(null);

    const load = async () => {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        setLoading(true);
        setError(null);
        try {
            const data = await evaluationApiClient.getEvaluationMetrics({
                signal: controller.signal,
            });
            if (!controller.signal.aborted) setMetrics(data);
        } catch (e) {
            if (controller.signal.aborted) return;
            setError(e instanceof Error ? e.message : 'Error desconocido');
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    };

    useEffect(() => {
        return () => controllerRef.current?.abort();
    }, []);

    return (
        <Box>
            <BrutalistPageHero
                eyebrow="// MÓDULO_8 // EVALUACIÓN"
                title={
                    <>
                        Calidad
                        <br />
                        del pipeline.
                    </>
                }
                subtitle="schema compliance · validator metrics"
                lede="Métricas reales del OutputValidator: tasas de cumplimiento de esquema por agente, calculadas desde las validaciones ejecutadas en producción."
                accent={moduleAccents.evaluation}
                ghostNumber="8"
                action={
                    <BrutalistButton
                        accent={palette.amber}
                        icon={<RefreshIcon sx={{ fontSize: 18 }} />}
                        size="md"
                        onClick={load}
                    >
                        Ejecutar
                    </BrutalistButton>
                }
            />

            {!metrics && !loading && !error && (
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    Pulsa &ldquo;Ejecutar&rdquo; para consultar las métricas actuales del validador.
                </Alert>
            )}

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    No se pudieron obtener las métricas: {error}
                </Alert>
            )}

            {metrics && !loading && (
                <Grid container spacing={2.5}>
                    <Grid item xs={12} md={6}>
                        <Box
                            sx={{
                                p: 2.5,
                                border: `1px solid ${palette.line}`,
                                borderRadius: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <OkIcon sx={{ fontSize: 18, color: palette.success }} />
                                <Typography variant="subtitle1" fontWeight={700}>
                                    Cumplimiento global de esquema
                                </Typography>
                                <Chip
                                    size="small"
                                    label={`${metrics.total_validations} validaciones`}
                                    sx={{
                                        height: 18,
                                        fontSize: '0.65rem',
                                        ml: 'auto',
                                        bgcolor: 'rgba(255,255,255,0.05)',
                                    }}
                                />
                            </Box>

                            <MetricBar
                                label="Tasa global"
                                value={metrics.overall_compliance_rate}
                                color={colorForRate(metrics.overall_compliance_rate)}
                            />

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                Por agente
                            </Typography>

                            {Object.keys(metrics.per_agent_compliance_rate).length === 0 ? (
                                <Typography variant="body2" sx={{ color: palette.paperMuted }}>
                                    No hay validaciones registradas todavía.
                                </Typography>
                            ) : (
                                Object.entries(metrics.per_agent_compliance_rate).map(
                                    ([agent, rate]) => (
                                        <MetricBar
                                            key={agent}
                                            label={agent}
                                            value={rate}
                                            color={colorForRate(rate)}
                                        />
                                    )
                                )
                            )}
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Box
                            sx={{
                                p: 2.5,
                                border: `1px solid ${palette.line}`,
                                borderRadius: 2,
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                Detalle por agente
                            </Typography>
                            {Object.entries(metrics.per_agent_detail).map(
                                ([agent, detail]: [string, EvaluationAgentDetail]) => (
                                    <Box
                                        key={agent}
                                        sx={{
                                            mb: 1.5,
                                            py: 0.75,
                                            px: 1,
                                            borderRadius: 1.5,
                                            border: `1px solid ${palette.line}`,
                                        }}
                                    >
                                        <Typography variant="caption" fontWeight={700}>
                                            {agent}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{ display: 'block', color: palette.paperMuted }}
                                        >
                                            Pasaron: {detail.passed} / Fallaron: {detail.failed} /
                                            Total: {detail.total}
                                        </Typography>
                                    </Box>
                                )
                            )}
                            {Object.keys(metrics.per_agent_detail).length === 0 && (
                                <Typography variant="body2" sx={{ color: palette.paperMuted }}>
                                    Sin detalle disponible.
                                </Typography>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}
