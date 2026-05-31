'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Alert, Stack, CircularProgress, Tooltip } from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Refresh as RefreshIcon,
    PlayArrow as RunIcon,
    Article as DocIcon,
    WarningAmber as WarnIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { BrutalistButton, BrutalistCard, BrutalistEmptyState } from '@/components/brutalist';
import { palette, fonts, moduleAccents, sxLabel, sxLabelSmall, hexAlpha } from '@/styles/brutalist';
import { useCompany } from '@/context/CompanyContext';
import { reportApiClient } from '@/lib/api/clients';
import type { AxiosError } from 'axios';

const ACCENT = moduleAccents.reports;
const SUCCESS_DISMISS_MS = 4_000;

const FIRST_LEVEL_LABELS: Record<string, string> = {
    balance_general: 'BG',
    estado_resultados: 'ER',
    libro_auxiliar: 'LA',
    libro_diario: 'LD',
};

const DERIVED_LABELS: Record<string, string> = {
    flujo_de_caja: 'Flujo de Caja',
    cambios_patrimonio: 'Cambios Patrimonio',
    notas_estados_financieros: 'Notas EEFF',
};

function formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return iso.slice(0, 10);
}

function extractAxiosError(e: unknown): string {
    const ax = e as AxiosError<{ detail?: string; message?: string }>;
    return (
        ax?.response?.data?.detail ||
        ax?.response?.data?.message ||
        (e as Error)?.message ||
        'Error al derivar'
    );
}

export default function ViaADerivationTab() {
    const { activeCompany } = useCompany();
    const [runningKey, setRunningKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
        data: status,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['derivationStatusViaA', activeCompany?.nit],
        queryFn: () => reportApiClient.getDerivationStatusViaA(activeCompany!.nit),
        enabled: !!activeCompany?.nit,
        staleTime: 0,
    });

    useEffect(() => {
        return () => {
            if (successTimer.current) clearTimeout(successTimer.current);
        };
    }, []);

    const showSuccess = (msg: string) => {
        if (successTimer.current) clearTimeout(successTimer.current);
        setSuccess(msg);
        successTimer.current = setTimeout(() => setSuccess(null), SUCCESS_DISMISS_MS);
    };

    const handleActualizar = async (period_start: string | null, period_end: string) => {
        if (!activeCompany?.nit || !period_start) return;
        const key = `${period_start}-${period_end}`;
        setRunningKey(key);
        setError(null);
        setSuccess(null);
        try {
            const result = await reportApiClient.runDerivationViaA(
                activeCompany.nit,
                period_start.slice(0, 10),
                period_end.slice(0, 10)
            );
            await refetch();
            if (result?.prior_period_warning) {
                setError(result.prior_period_warning);
            } else {
                showSuccess(`Derivación completada para ${period_end.slice(0, 10)}`);
            }
        } catch (e) {
            setError(extractAxiosError(e));
        } finally {
            setRunningKey(null);
        }
    };

    const journalRange = status?.journal_date_range;
    const hasJournalData = journalRange?.earliest || journalRange?.latest;

    return (
        <Box>
            {/* KPIs */}
            <Stack direction="row" spacing={3} sx={{ mb: 4 }} alignItems="center">
                <Box>
                    <Typography
                        sx={{
                            fontFamily: fonts.display,
                            fontSize: '1.6rem',
                            fontWeight: 700,
                            color: palette.paper,
                            letterSpacing: '-0.04em',
                            lineHeight: 1,
                        }}
                    >
                        {status?.first_level_periods.length ?? '—'}
                    </Typography>
                    <Typography sx={{ ...sxLabel, fontSize: '0.6rem', color: ACCENT, mt: 0.25 }}>
                        PERÍODOS DERIVADOS
                    </Typography>
                </Box>
                <Box>
                    <Typography
                        sx={{
                            fontFamily: fonts.display,
                            fontSize: '1.6rem',
                            fontWeight: 700,
                            color: palette.paper,
                            letterSpacing: '-0.04em',
                            lineHeight: 1,
                        }}
                    >
                        {status?.derived_periods.filter((d) => d.complete).length ?? '—'}
                    </Typography>
                    <Typography sx={{ ...sxLabel, fontSize: '0.6rem', color: ACCENT, mt: 0.25 }}>
                        EEFF SECUNDARIOS
                    </Typography>
                </Box>
                <Box sx={{ flex: 1 }} />
                <BrutalistButton
                    variant="outline"
                    size="md"
                    accent={ACCENT}
                    icon={
                        isLoading ? (
                            <CircularProgress size={14} sx={{ color: 'inherit' }} />
                        ) : (
                            <RefreshIcon sx={{ fontSize: 16 }} />
                        )
                    }
                    onClick={() => refetch()}
                    disabled={isLoading}
                >
                    Refrescar
                </BrutalistButton>
            </Stack>

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

            {/* ── Rango de asientos ──────────────────────────────────── */}
            {hasJournalData && (
                <BrutalistCard sx={{ p: 2.5, mb: 4, borderLeft: `3px solid ${palette.accent}` }}>
                    <Typography sx={{ ...sxLabelSmall, color: palette.accent, mb: 0.5 }}>
                        {'// ASIENTOS CONTABLES'}
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.82rem',
                            color: palette.paper,
                        }}
                    >
                        {formatDate(journalRange?.earliest)} → {formatDate(journalRange?.latest)}
                    </Typography>
                </BrutalistCard>
            )}

            {/* ── Períodos derivados ──────────────────────────────────── */}
            <Box sx={{ mb: 2 }}>
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
                        {'// ESTADOS DERIVADOS'}
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
                    Actualizar desde asientos.
                </Typography>
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={28} sx={{ color: ACCENT }} />
                </Box>
            ) : !status?.first_level_periods.length ? (
                <BrutalistEmptyState
                    label="// SIN PERÍODOS"
                    title="Sin datos derivados"
                    description="Esta empresa aún no tiene estados financieros generados desde asientos contables. Procesa transacciones primero para que el sistema construya Balance, ER y Libro Auxiliar automáticamente."
                    accent={ACCENT}
                />
            ) : (
                <Stack spacing={1.5}>
                    {status.first_level_periods.map((p) => {
                        const key = `${p.period_start}-${p.period_end}`;
                        const isRunning = runningKey === key;
                        const pe = p.period_end?.slice(0, 10) ?? '';
                        const ps = p.period_start?.slice(0, 10) ?? null;
                        const derivedEntry = status.derived_periods.find((d) => {
                            const dEnd = d.period_end?.slice(0, 10) === pe;
                            return ps ? dEnd : dEnd;
                        });
                        const isDerived = derivedEntry?.complete === true;
                        const missingStart = !p.period_start;
                        const hasPriorGap = p.prior_period_gap === true;

                        return (
                            <BrutalistCard
                                key={key}
                                sx={{
                                    p: 2.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2.5,
                                    borderLeft: `3px solid ${isDerived ? palette.chartreuse : ACCENT}`,
                                }}
                            >
                                {isDerived ? (
                                    <CheckIcon sx={{ color: palette.chartreuse, fontSize: 22 }} />
                                ) : (
                                    <DocIcon sx={{ color: ACCENT, fontSize: 22 }} />
                                )}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.display,
                                                fontSize: '1.05rem',
                                                fontWeight: 700,
                                                color: palette.paper,
                                                letterSpacing: '-0.01em',
                                            }}
                                        >
                                            {formatDate(p.period_start)} →{' '}
                                            {formatDate(p.period_end)}
                                        </Typography>
                                        {missingStart && (
                                            <Tooltip
                                                title="Este período no tiene fecha de inicio registrada en el libro de asientos. No se puede derivar hasta que el backend la exponga."
                                                placement="top"
                                                arrow
                                            >
                                                <WarnIcon
                                                    titleAccess="Falta fecha de inicio del período"
                                                    tabIndex={0}
                                                    sx={{
                                                        fontSize: 15,
                                                        color: palette.amber,
                                                        cursor: 'help',
                                                    }}
                                                />
                                            </Tooltip>
                                        )}
                                        {hasPriorGap && (
                                            <Tooltip
                                                title="Hay períodos anteriores sin derivar. El flujo de caja usará saldo inicial $0 y los deltas de capital de trabajo serán incorrectos. Deriva los períodos anteriores primero."
                                                placement="top"
                                                arrow
                                            >
                                                <WarnIcon
                                                    titleAccess="Períodos anteriores sin derivar"
                                                    tabIndex={0}
                                                    sx={{
                                                        fontSize: 15,
                                                        color: palette.amber,
                                                        cursor: 'help',
                                                    }}
                                                />
                                            </Tooltip>
                                        )}
                                    </Box>
                                    <Box
                                        sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}
                                    >
                                        {p.types.map((t) => (
                                            <Typography
                                                key={t}
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.65rem',
                                                    color: palette.paperMuted,
                                                    border: `1px solid ${hexAlpha(palette.paper, 0.2)}`,
                                                    px: 0.75,
                                                    py: 0.15,
                                                }}
                                            >
                                                {FIRST_LEVEL_LABELS[t] ?? t}
                                            </Typography>
                                        ))}
                                        {isDerived &&
                                            derivedEntry?.statements.map((s) => (
                                                <Typography
                                                    key={s}
                                                    sx={{
                                                        fontFamily: fonts.mono,
                                                        fontSize: '0.65rem',
                                                        color: palette.chartreuse,
                                                        border: `1px solid ${hexAlpha(palette.chartreuse, 0.4)}`,
                                                        px: 0.75,
                                                        py: 0.15,
                                                    }}
                                                >
                                                    {DERIVED_LABELS[s] ?? s}
                                                </Typography>
                                            ))}
                                    </Box>
                                </Box>
                                <BrutalistButton
                                    variant={isDerived ? 'outline' : 'primary'}
                                    size="md"
                                    accent={isDerived ? palette.chartreuse : ACCENT}
                                    icon={
                                        isRunning ? (
                                            <CircularProgress size={14} sx={{ color: 'inherit' }} />
                                        ) : (
                                            <RunIcon sx={{ fontSize: 16 }} />
                                        )
                                    }
                                    onClick={() => handleActualizar(p.period_start, p.period_end)}
                                    disabled={isRunning || runningKey !== null || missingStart}
                                >
                                    {isRunning
                                        ? 'Derivando...'
                                        : isDerived
                                          ? 'Re-derivar'
                                          : 'Derivar'}
                                </BrutalistButton>
                            </BrutalistCard>
                        );
                    })}
                </Stack>
            )}
        </Box>
    );
}
