'use client';

import { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Alert,
    Stack,
    Button,
    Chip,
    CircularProgress,
    Paper,
    Divider,
} from '@mui/material';
import { useCompany } from '@/context/CompanyContext';
import { getDerivationStatus, runDerivation, type DerivationStatusResponse } from '@/lib/api';

const REQUIRED_TYPES: Array<'balance_general' | 'estado_resultados' | 'libro_auxiliar'> = [
    'balance_general',
    'estado_resultados',
    'libro_auxiliar',
];

const TYPE_LABEL: Record<string, string> = {
    balance_general: 'Balance General',
    estado_resultados: 'Estado de Resultados',
    libro_auxiliar: 'Libro Auxiliar',
};

export default function DerivationPage() {
    const { activeCompany } = useCompany();
    const [status, setStatus] = useState<DerivationStatusResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const loadStatus = async () => {
        if (!activeCompany?.nit) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getDerivationStatus(activeCompany.nit);
            setStatus(res);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al cargar estado');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCompany?.nit]);

    const handleRun = async (start: string, end: string) => {
        if (!activeCompany?.nit) return;
        setRunning(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await runDerivation(
                activeCompany.nit,
                start.slice(0, 10),
                end.slice(0, 10)
            );
            setSuccess(`Derivación ejecutada: ${res.status}`);
            await loadStatus();
        } catch (e) {
            // apiClient's interceptor normalizes errors to an Error with
            // { message, detail }. `message` already holds the FastAPI detail
            // (e.g. the 409 BusinessRuleError message); `detail` carries the
            // remediation when present.
            const err = e as Error & { detail?: string };
            const msg = err?.message || err?.detail || 'Error al ejecutar derivación';
            setError(msg);
        } finally {
            setRunning(false);
        }
    };

    if (!activeCompany) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="info">Selecciona una empresa para gestionar la derivación.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, maxWidth: 960 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Derivación de estados financieros (Vía B)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Una vez cargados Balance General, Estado de Resultados y Libro Auxiliar para un
                mismo período, puedes ejecutar la derivación de flujo de caja, cambios en patrimonio
                y notas a los estados financieros.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 2 }}
                >
                    <Typography variant="h6">Documentos fuente cargados</Typography>
                    <Button onClick={loadStatus} disabled={loading} size="small">
                        {loading ? <CircularProgress size={18} /> : 'Refrescar'}
                    </Button>
                </Stack>

                <Stack spacing={1.5}>
                    {REQUIRED_TYPES.map((t) => {
                        const items = status?.sources[t] ?? [];
                        return (
                            <Stack key={t} direction="row" alignItems="center" spacing={2}>
                                <Box sx={{ minWidth: 200, fontWeight: 600 }}>{TYPE_LABEL[t]}</Box>
                                {items.length === 0 ? (
                                    <Chip label="No cargado" color="warning" size="small" />
                                ) : (
                                    <Chip
                                        label={`${items.length} cargado(s)`}
                                        color="success"
                                        size="small"
                                    />
                                )}
                                <Box sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                                    {items
                                        .map(
                                            (i) =>
                                                `${i.period_start?.slice(0, 10) ?? '?'} → ${i.period_end?.slice(0, 10) ?? '?'}`
                                        )
                                        .join(', ')}
                                </Box>
                            </Stack>
                        );
                    })}
                </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Períodos listos para derivar
                </Typography>
                {!status || status.ready_periods.length === 0 ? (
                    <Alert severity="info">
                        No hay períodos con los 3 documentos fuente cargados. Carga los faltantes y
                        refresca.
                    </Alert>
                ) : (
                    <Stack spacing={2}>
                        {status.ready_periods.map((p) => (
                            <Box
                                key={`${p.period_start}-${p.period_end}`}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    border: 1,
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    p: 2,
                                }}
                            >
                                <Box>
                                    <Typography sx={{ fontWeight: 600 }}>
                                        {p.period_start.slice(0, 10)} → {p.period_end.slice(0, 10)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Los 3 documentos están presentes para este período.
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    disabled={running}
                                    onClick={() => handleRun(p.period_start, p.period_end)}
                                >
                                    {running ? 'Derivando...' : 'Ejecutar derivación'}
                                </Button>
                            </Box>
                        ))}
                    </Stack>
                )}
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                    La derivación genera estados financieros derivados (flujo de caja, cambios en
                    patrimonio, notas) a partir de los documentos fuente.
                </Typography>
            </Paper>
        </Box>
    );
}
