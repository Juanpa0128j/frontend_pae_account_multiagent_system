'use client';

import { useState } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    LinearProgress,
    Chip,
    Button,
    Alert,
    Divider,
} from '@mui/material';
import {
    CheckCircle as OkIcon,
    Error as ErrIcon,
    Warning as WarnIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/layout/PageHeader';
import AgentTimeline from '@/components/agent/AgentTimeline';
import { AgentStep } from '@/types';

interface MetricBarProps {
    label: string;
    value: number;
    color: string;
}

function MetricBar({ label, value, color }: MetricBarProps) {
    return (
        <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="caption" fontWeight={700} sx={{ color, fontFamily: 'monospace' }}>
                    {value.toFixed(1)}%
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={value}
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

const MOCK_AGENT_TRACE: AgentStep[] = [
    { agente: 'Supervisor', accion: 'Coordinación general del pipeline de evaluación', resultado: 'success', duracion_ms: 98, detalle: 'Iniciando evaluación del sistema con 50 transacciones de prueba.' },
    { agente: 'Contador', accion: 'Validación de cuentas PUC asignadas', resultado: 'success', duracion_ms: 1840, detalle: '48/50 clasificaciones correctas (96%). 2 errores: transacciones 1037 y 1041 clasificadas erróneamente.' },
    { agente: 'Tributario', accion: 'Verificación de cálculos tributarios', resultado: 'success', duracion_ms: 2100, detalle: 'Todos los cálculos de Retefuente e IVA son correctos. Error < $1 en todas las transacciones por redondeo.' },
    { agente: 'Auditor', accion: 'Verificación masiva de partida doble', resultado: 'success', duracion_ms: 890, detalle: '50/50 asientos contables con partida doble correcta. 100% de compliance.' },
];

export default function EvaluationPage() {
    const [ran, setRan] = useState(false);

    const metrics = [
        { label: 'Precisión clasificación PUC', value: 96.0, color: '#6366F1' },
        { label: 'Exactitud cálculos tributarios', value: 99.2, color: '#10B981' },
        { label: 'Partida doble correcta', value: 100.0, color: '#10B981' },
        { label: 'Documentos procesados sin error', value: 94.0, color: '#F59E0B' },
    ];

    const issues = [
        { id: '1037', descr: 'Clasificación incorrecta: 5195 → debería ser 5130', sev: 'media' },
        { id: '1041', descr: 'Clasificación incorrecta: 5195 → debería ser 1430', sev: 'baja' },
    ];

    const SEV_COLOR = { alta: '#EF4444', media: '#F59E0B', baja: '#6B7280' };
    const SEV_ICON = { alta: <ErrIcon sx={{ fontSize: 14, mr: 0.5 }} />, media: <WarnIcon sx={{ fontSize: 14, mr: 0.5 }} />, baja: <WarnIcon sx={{ fontSize: 14, mr: 0.5 }} /> };

    return (
        <Box>
            <PageHeader
                title="Evaluación del Sistema"
                subtitle="Métricas de precision y recall del pipeline de IA. Ejecuta pruebas de regresión contra el dataset de referencia."
                breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Evaluación' }]}
                action={
                    <Button
                        variant="contained"
                        startIcon={<RefreshIcon />}
                        onClick={() => setRan(true)}
                        id="btn-run-evaluation"
                        size="small"
                    >
                        Ejecutar evaluación
                    </Button>
                }
            />

            {!ran && (
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    Pulsa &ldquo;Ejecutar evaluación&rdquo; para correr el dataset de referencia contra el pipeline de agentes.
                </Alert>
            )}

            {(ran) && (
                <Grid container spacing={2.5}>
                    {/* Metrics */}
                    <Grid item xs={12} md={5}>
                        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <OkIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                <Typography variant="subtitle1" fontWeight={700}>Métricas de calidad</Typography>
                                <Chip size="small" label="50 muestras" sx={{ height: 18, fontSize: '0.65rem', ml: 'auto', bgcolor: 'rgba(255,255,255,0.05)' }} />
                            </Box>

                            {metrics.map((m) => (
                                <MetricBar key={m.label} {...m} />
                            ))}

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Errores detectados</Typography>
                            {issues.map((issue) => (
                                <Box
                                    key={issue.id}
                                    sx={{
                                        py: 0.75,
                                        px: 1,
                                        borderRadius: 1.5,
                                        border: `1px solid ${SEV_COLOR[issue.sev as keyof typeof SEV_COLOR]}25`,
                                        bgcolor: `${SEV_COLOR[issue.sev as keyof typeof SEV_COLOR]}06`,
                                        mb: 0.75,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                    }}
                                >
                                    <Box sx={{ color: SEV_COLOR[issue.sev as keyof typeof SEV_COLOR] }}>
                                        {SEV_ICON[issue.sev as keyof typeof SEV_ICON]}
                                    </Box>
                                    <Box>
                                        <Chip size="small" label={`Tx #${issue.id}`} sx={{ height: 16, fontSize: '0.6rem', fontFamily: 'monospace', mr: 0.75, bgcolor: 'rgba(255,255,255,0.05)' }} />
                                        <Typography variant="caption" color="text.secondary">{issue.descr}</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Paper>
                    </Grid>

                    {/* Agent trace */}
                    <Grid item xs={12} md={7}>
                        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3 }}>
                            <AgentTimeline steps={MOCK_AGENT_TRACE} totalDurationMs={4928} />
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}
