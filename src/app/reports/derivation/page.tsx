'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Alert, Stack, CircularProgress } from '@mui/material';
import {
    Calculate as DerivationIcon,
    Refresh as RefreshIcon,
    PlayArrow as RunIcon,
    CheckCircle as CheckIcon,
    Cancel as MissingIcon,
} from '@mui/icons-material';
import {
    BrutalistPageHero,
    BrutalistButton,
    BrutalistCard,
    BrutalistEmptyState,
} from '@/components/brutalist';
import { palette, fonts, moduleAccents, sxLabel, sxLabelSmall, hexAlpha } from '@/styles/brutalist';
import { useCompany } from '@/context/CompanyContext';
import { getDerivationStatus, runDerivation, type DerivationStatusResponse } from '@/lib/api';

const ACCENT = moduleAccents.reports;

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

const TYPE_NUMBER: Record<string, string> = {
    balance_general: '01',
    estado_resultados: '02',
    libro_auxiliar: '03',
};

function formatPeriod(iso: string | null | undefined): string {
    if (!iso) return '—';
    return iso.slice(0, 10);
}

export default function DerivationPage() {
    const { activeCompany } = useCompany();
    const [status, setStatus] = useState<DerivationStatusResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [runningKey, setRunningKey] = useState<string | null>(null);
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
        const key = `${start}-${end}`;
        setRunningKey(key);
        setError(null);
        setSuccess(null);
        try {
            const res = await runDerivation(
                activeCompany.nit,
                start.slice(0, 10),
                end.slice(0, 10)
            );
            setSuccess(`Derivación ejecutada (${res.status}) para ${end.slice(0, 10)}`);
            await loadStatus();
        } catch (e) {
            const err = e as Error & { detail?: string };
            const msg = err?.message || err?.detail || 'Error al ejecutar derivación';
            setError(msg);
        } finally {
            setRunningKey(null);
        }
    };

    if (!activeCompany) {
        return (
            <Box>
                <BrutalistPageHero
                    eyebrow="// MÓDULO_5B // DERIVACIÓN"
                    title={
                        <>
                            Estados
                            <br />
                            derivados.
                        </>
                    }
                    subtitle="vía b · derivación manual"
                    lede="Selecciona una empresa para gestionar la derivación de estados financieros derivados a partir de Balance General, Estado de Resultados y Libro Auxiliar."
                    accent={ACCENT}
                    ghostNumber="5b"
                />
                <BrutalistEmptyState
                    label="// SIN EMPRESA"
                    title="Selecciona una empresa"
                    description="La derivación opera por empresa. Elige una del selector arriba para continuar."
                    accent={ACCENT}
                />
            </Box>
        );
    }

    const sources = status?.sources;
    const totalLoaded = sources
        ? REQUIRED_TYPES.reduce((acc, t) => acc + (sources[t]?.length ?? 0), 0)
        : 0;
    const typesPresent = sources
        ? REQUIRED_TYPES.filter((t) => (sources[t]?.length ?? 0) > 0).length
        : 0;
    const readyCount = status?.ready_periods.length ?? 0;

    return (
        <Box>
            <BrutalistPageHero
                eyebrow="// MÓDULO_5B // DERIVACIÓN"
                title={
                    <>
                        Estados
                        <br />
                        derivados.
                    </>
                }
                subtitle={activeCompany.nombre ?? activeCompany.nit}
                lede="Cuando Balance, Estado de Resultados y Libro Auxiliar comparten período de cierre, se puede derivar flujo de caja, cambios en patrimonio y notas a los estados financieros."
                accent={ACCENT}
                ghostNumber="5b"
                kpis={[
                    { value: `${typesPresent}/3`, label: 'TIPOS CARGADOS' },
                    { value: String(totalLoaded), label: 'EEFF FUENTE' },
                    { value: String(readyCount), label: 'PERÍODOS LISTOS' },
                ]}
                action={
                    <BrutalistButton
                        variant="outline"
                        size="md"
                        accent={ACCENT}
                        icon={
                            loading ? (
                                <CircularProgress size={14} sx={{ color: 'inherit' }} />
                            ) : (
                                <RefreshIcon sx={{ fontSize: 16 }} />
                            )
                        }
                        onClick={loadStatus}
                        disabled={loading}
                    >
                        Refrescar
                    </BrutalistButton>
                }
            />

            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 2,
                        bgcolor: hexAlpha(palette.error, 0.08),
                        border: `1px solid ${hexAlpha(palette.error, 0.4)}`,
                        borderRadius: 0,
                        fontFamily: fonts.body,
                    }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}
            {success && (
                <Alert
                    severity="success"
                    sx={{
                        mb: 2,
                        bgcolor: hexAlpha(palette.chartreuse, 0.08),
                        border: `1px solid ${hexAlpha(palette.chartreuse, 0.4)}`,
                        color: palette.chartreuse,
                        borderRadius: 0,
                        fontFamily: fonts.body,
                    }}
                    onClose={() => setSuccess(null)}
                >
                    {success}
                </Alert>
            )}

            {/* ── Documentos fuente ─────────────────────────────────────── */}
            <Box sx={{ mb: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                        sx={{
                            width: 30,
                            height: 2,
                            bgcolor: ACCENT,
                            boxShadow: `0 0 8px ${ACCENT}`,
                        }}
                    />
                    <Typography sx={{ ...sxLabelSmall, color: ACCENT }}>
                        {'// DOCUMENTOS FUENTE'}
                    </Typography>
                </Box>
                <Typography
                    sx={{
                        fontFamily: fonts.display,
                        fontSize: { xs: '1.4rem', md: '1.8rem' },
                        fontWeight: 700,
                        color: palette.paper,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.1,
                        mb: 3,
                    }}
                >
                    Insumos cargados por empresa.
                </Typography>

                <Stack spacing={1.5}>
                    {REQUIRED_TYPES.map((t) => {
                        const items = sources?.[t] ?? [];
                        const hasAny = items.length > 0;
                        return (
                            <BrutalistCard
                                key={t}
                                sx={{
                                    p: 2.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2.5,
                                    borderLeft: `3px solid ${hasAny ? palette.chartreuse : palette.amber}`,
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontFamily: fonts.mono,
                                        fontSize: '0.8rem',
                                        color: palette.paperMuted,
                                        minWidth: 28,
                                    }}
                                >
                                    {TYPE_NUMBER[t]}
                                </Typography>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.display,
                                            fontSize: '1.05rem',
                                            fontWeight: 700,
                                            color: palette.paper,
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        {TYPE_LABEL[t]}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.72rem',
                                            color: palette.paperMuted,
                                            mt: 0.3,
                                        }}
                                    >
                                        {hasAny
                                            ? items
                                                  .map(
                                                      (i) =>
                                                          `${formatPeriod(i.period_start)} → ${formatPeriod(i.period_end)}`
                                                  )
                                                  .join('   ·   ')
                                            : 'sin cargar'}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.75,
                                        color: hasAny ? palette.chartreuse : palette.amber,
                                    }}
                                >
                                    {hasAny ? (
                                        <CheckIcon sx={{ fontSize: 18 }} />
                                    ) : (
                                        <MissingIcon sx={{ fontSize: 18 }} />
                                    )}
                                    <Typography
                                        sx={{
                                            ...sxLabel,
                                            fontSize: '0.65rem',
                                            color: 'inherit',
                                        }}
                                    >
                                        {hasAny ? `${items.length} cargado(s)` : 'pendiente'}
                                    </Typography>
                                </Box>
                            </BrutalistCard>
                        );
                    })}
                </Stack>
            </Box>

            {/* ── Períodos listos ───────────────────────────────────────── */}
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                        sx={{
                            width: 30,
                            height: 2,
                            bgcolor: ACCENT,
                            boxShadow: `0 0 8px ${ACCENT}`,
                        }}
                    />
                    <Typography sx={{ ...sxLabelSmall, color: ACCENT }}>
                        {'// PERÍODOS LISTOS'}
                    </Typography>
                </Box>
                <Typography
                    sx={{
                        fontFamily: fonts.display,
                        fontSize: { xs: '1.4rem', md: '1.8rem' },
                        fontWeight: 700,
                        color: palette.paper,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.1,
                        mb: 1,
                    }}
                >
                    Ejecutar derivación.
                </Typography>
                <Typography
                    sx={{
                        fontFamily: fonts.body,
                        fontSize: '0.9rem',
                        color: palette.paperMuted,
                        mb: 3,
                        maxWidth: 720,
                    }}
                >
                    Cada período tiene los 3 documentos fuente con la misma fecha de cierre. Al
                    derivar se generan{' '}
                    <Box component="span" sx={{ color: palette.paper }}>
                        flujo de caja
                    </Box>
                    ,{' '}
                    <Box component="span" sx={{ color: palette.paper }}>
                        cambios en patrimonio
                    </Box>{' '}
                    y{' '}
                    <Box component="span" sx={{ color: palette.paper }}>
                        notas a los estados financieros
                    </Box>{' '}
                    para esa empresa y período.
                </Typography>

                {!status || status.ready_periods.length === 0 ? (
                    <BrutalistEmptyState
                        label="// SIN PERÍODOS"
                        title="No hay períodos derivables aún"
                        description="Carga Balance General, Estado de Resultados y Libro Auxiliar con la misma fecha de cierre (period_end). Cuando los 3 coincidan, aparecerán aquí."
                        accent={ACCENT}
                    />
                ) : (
                    <Stack spacing={1.5}>
                        {status.ready_periods.map((p) => {
                            const key = `${p.period_start}-${p.period_end}`;
                            const isRunning = runningKey === key;
                            return (
                                <BrutalistCard
                                    key={key}
                                    sx={{
                                        p: 2.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2.5,
                                        borderLeft: `3px solid ${ACCENT}`,
                                    }}
                                >
                                    <DerivationIcon sx={{ color: ACCENT, fontSize: 22 }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.display,
                                                fontSize: '1.05rem',
                                                fontWeight: 700,
                                                color: palette.paper,
                                                letterSpacing: '-0.01em',
                                            }}
                                        >
                                            {formatPeriod(p.period_start)} →{' '}
                                            {formatPeriod(p.period_end)}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.7rem',
                                                color: palette.paperMuted,
                                                mt: 0.3,
                                            }}
                                        >
                                            los 3 documentos fuente coinciden
                                        </Typography>
                                    </Box>
                                    <BrutalistButton
                                        variant="primary"
                                        size="md"
                                        accent={ACCENT}
                                        icon={
                                            isRunning ? (
                                                <CircularProgress
                                                    size={14}
                                                    sx={{ color: 'inherit' }}
                                                />
                                            ) : (
                                                <RunIcon sx={{ fontSize: 16 }} />
                                            )
                                        }
                                        onClick={() => handleRun(p.period_start, p.period_end)}
                                        disabled={isRunning || runningKey !== null}
                                    >
                                        {isRunning ? 'Derivando...' : 'Derivar'}
                                    </BrutalistButton>
                                </BrutalistCard>
                            );
                        })}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}
