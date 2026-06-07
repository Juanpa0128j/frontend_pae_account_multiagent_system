'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, Alert, Stack, CircularProgress, Tooltip } from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Refresh as RefreshIcon,
    PlayArrow as RunIcon,
    AddCircleOutline as BuildIcon,
    Article as DocIcon,
    WarningAmber as WarnIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import { BrutalistButton, BrutalistCard, BrutalistEmptyState } from '@/components/brutalist';
import ViaAPeriodPicker, {
    annualPeriod,
    type ViaAPeriodValue,
} from '@/app/reports/derivation/_components/ViaAPeriodPicker';
import { palette, fonts, moduleAccents, sxLabelSmall, hexAlpha } from '@/styles/brutalist';
import { useCompany } from '@/context/CompanyContext';
import { useDerivationStatusViaA, useBuildFirstLevelViaA, useDeriveSecondaryViaA } from '@/hooks';
import type { ViaADerivationStatus, ViaAFirstLevelPeriod } from '@/types';
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

const NIC7_TOOLTIP =
    'Solo los cierres anuales pueden derivar flujo de caja, cambios de patrimonio y ' +
    'notas. La NIC 7 (método indirecto) compara dos años fiscales; los períodos ' +
    'mensuales sirven para reportes individuales pero no anclan la derivación NIIF.';

/**
 * Split the first-level periods into the annual group (eligible to anchor NIC 7
 * secondary derivation) and the monthly/informational group. Exported for tests.
 */
export function splitFirstLevelPeriods(status?: ViaADerivationStatus | null): {
    annual: ViaAFirstLevelPeriod[];
    monthly: ViaAFirstLevelPeriod[];
} {
    const periods = status?.first_level_periods ?? [];
    const annual = periods.filter((p) => p.frequency === 'annual');
    const monthly = periods.filter((p) => p.frequency !== 'annual');
    return { annual, monthly };
}

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

function SectionHeader({ label, title }: { label: string; title: string }) {
    return (
        <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box
                    sx={{ width: 30, height: 2, bgcolor: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }}
                />
                <Typography sx={{ ...sxLabelSmall, color: ACCENT }}>{label}</Typography>
            </Box>
            <Typography
                sx={{
                    fontFamily: fonts.display,
                    fontSize: { xs: '1.4rem', md: '1.8rem' },
                    fontWeight: 700,
                    color: palette.paper,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                }}
            >
                {title}
            </Typography>
        </Box>
    );
}

function TypeChips({ types, accent }: { types: string[]; accent: string }) {
    return (
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
            {types.map((t) => (
                <Typography
                    key={t}
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.65rem',
                        color: accent === ACCENT ? palette.paperMuted : accent,
                        border: `1px solid ${hexAlpha(accent === ACCENT ? palette.paper : accent, accent === ACCENT ? 0.2 : 0.4)}`,
                        px: 0.75,
                        py: 0.15,
                    }}
                >
                    {FIRST_LEVEL_LABELS[t] ?? DERIVED_LABELS[t] ?? t}
                </Typography>
            ))}
        </Box>
    );
}

export default function ViaADerivationTab() {
    const { activeCompany } = useCompany();
    const nit = activeCompany?.nit ?? null;

    const { data: status, isLoading, refetch } = useDerivationStatusViaA(nit);
    const buildMutation = useBuildFirstLevelViaA();
    const deriveMutation = useDeriveSecondaryViaA();

    const [period, setPeriod] = useState<ViaAPeriodValue>(() =>
        annualPeriod(new Date().getFullYear())
    );
    const [runningKey, setRunningKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const journalRange = status?.journal_date_range;
    const hasJournalData = Boolean(journalRange?.earliest || journalRange?.latest);

    const { annual, monthly } = useMemo(() => splitFirstLevelPeriods(status), [status]);

    const handleGenerar = async () => {
        if (!nit) return;
        setError(null);
        setSuccess(null);
        try {
            await buildMutation.mutateAsync({
                company_nit: nit,
                period_start: period.period_start,
                period_end: period.period_end,
                period_type: period.period_type,
            });
            showSuccess(
                `Estados de primer nivel generados para ${period.period_start} → ${period.period_end}`
            );
        } catch (e) {
            setError(extractAxiosError(e));
        }
    };

    const handleDerivar = async (period_start: string, period_end: string) => {
        if (!nit) return;
        const key = `${period_start}-${period_end}`;
        setRunningKey(key);
        setError(null);
        setSuccess(null);
        try {
            await deriveMutation.mutateAsync({
                company_nit: nit,
                period_start: period_start.slice(0, 10),
                period_end: period_end.slice(0, 10),
            });
            showSuccess(`Derivación NIC 7 completada para ${period_end.slice(0, 10)}`);
        } catch (e) {
            setError(extractAxiosError(e));
        } finally {
            setRunningKey(null);
        }
    };

    const derivedComplete = status?.derived_periods.filter((d) => d.complete).length ?? 0;

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
                    <Typography
                        sx={{ ...sxLabelSmall, fontSize: '0.6rem', color: ACCENT, mt: 0.25 }}
                    >
                        PERÍODOS DE PRIMER NIVEL
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
                        {derivedComplete || '—'}
                    </Typography>
                    <Typography
                        sx={{ ...sxLabelSmall, fontSize: '0.6rem', color: ACCENT, mt: 0.25 }}
                    >
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

            {/* ── PASO 1 — Generar estados de primer nivel ──────────────── */}
            <SectionHeader label="// 01 — PRIMER NIVEL" title="Generar desde los asientos." />

            <BrutalistCard sx={{ p: { xs: 2.5, md: 3 }, mb: 4 }}>
                <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted, mb: 0.5 }}>
                    {'// ASIENTOS CONTABLES DISPONIBLES'}
                </Typography>
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.82rem',
                        color: palette.paper,
                        mb: 2,
                    }}
                >
                    {hasJournalData
                        ? `${formatDate(journalRange?.earliest)} → ${formatDate(journalRange?.latest)}`
                        : 'Sin asientos contables — procesa transacciones (Vía A) primero.'}
                </Typography>

                <Typography
                    sx={{
                        fontFamily: fonts.body,
                        fontSize: '0.9rem',
                        color: palette.paperMuted,
                        mb: 2,
                    }}
                >
                    Elige el período y genera Balance General, Estado de Resultados, Libro Auxiliar
                    y Libro Diario. La derivación NIC 7 (paso 2) solo aplica a cierres anuales.
                </Typography>

                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2,
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                    }}
                >
                    <ViaAPeriodPicker
                        value={period}
                        onChange={setPeriod}
                        journalRange={journalRange}
                    />
                    <BrutalistButton
                        variant="primary"
                        size="md"
                        accent={ACCENT}
                        icon={
                            buildMutation.isPending ? (
                                <CircularProgress size={14} sx={{ color: 'inherit' }} />
                            ) : (
                                <BuildIcon sx={{ fontSize: 16 }} />
                            )
                        }
                        onClick={handleGenerar}
                        disabled={
                            !nit ||
                            !hasJournalData ||
                            buildMutation.isPending ||
                            !period.period_start ||
                            !period.period_end ||
                            period.period_end < period.period_start
                        }
                    >
                        {buildMutation.isPending ? 'Generando...' : 'Generar'}
                    </BrutalistButton>
                </Box>
            </BrutalistCard>

            {/* Generated first-level periods — annual / monthly split. */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={28} sx={{ color: ACCENT }} />
                </Box>
            ) : !status?.first_level_periods.length ? (
                <BrutalistEmptyState
                    label="// SIN PERÍODOS"
                    title="Aún no generas estados de primer nivel"
                    description="Elige un período arriba y pulsa Generar para construir Balance, ER y Libro Auxiliar desde los asientos contables de esta empresa."
                    accent={ACCENT}
                />
            ) : (
                <Stack spacing={3}>
                    {annual.length > 0 && (
                        <Box>
                            <Typography sx={{ ...sxLabelSmall, color: ACCENT, mb: 1.5 }}>
                                {`// CIERRES ANUALES (${annual.length})`}
                            </Typography>
                            <Stack spacing={1.5}>
                                {annual.map((p) => (
                                    <FirstLevelCard
                                        key={`${p.period_start}-${p.period_end}`}
                                        period={p}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    )}
                    {monthly.length > 0 && (
                        <Box>
                            <Typography
                                sx={{ ...sxLabelSmall, color: palette.paperMuted, mb: 1.5 }}
                            >
                                {`// PERÍODOS MENSUALES (${monthly.length}) — solo informativos`}
                            </Typography>
                            <Stack spacing={1.5}>
                                {monthly.map((p) => (
                                    <FirstLevelCard
                                        key={`${p.period_start}-${p.period_end}`}
                                        period={p}
                                        muted
                                    />
                                ))}
                            </Stack>
                        </Box>
                    )}
                </Stack>
            )}

            {/* ── PASO 2 — Derivar estados secundarios (NIC 7) ──────────── */}
            <Box sx={{ mt: 5 }}>
                <SectionHeader label="// 02 — NIC 7" title="Derivar estados secundarios." />

                {annual.length === 0 ? (
                    <BrutalistEmptyState
                        label="// SIN CIERRES ANUALES"
                        title="Genera un cierre anual primero"
                        description="El flujo de caja, los cambios de patrimonio y las notas solo se derivan de cierres anuales (NIC 7). Genera un período anual en el paso 1 para habilitar la derivación."
                        accent={ACCENT}
                    />
                ) : (
                    <Stack spacing={1.5}>
                        {annual.map((p) => {
                            const pe = p.period_end?.slice(0, 10) ?? '';
                            const ps = p.period_start?.slice(0, 10) ?? '';
                            const key = `${p.period_start}-${p.period_end}`;
                            const isRunning = runningKey === key;
                            const derivedEntry = status?.derived_periods.find(
                                (d) => d.period_end?.slice(0, 10) === pe
                            );
                            const isDerived = derivedEntry?.complete === true;
                            const eligible = p.eligible_for_secondary !== false;
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
                                        <CheckIcon
                                            sx={{ color: palette.chartreuse, fontSize: 22 }}
                                        />
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
                                            {hasPriorGap && (
                                                <Tooltip
                                                    title="Hay períodos anteriores sin derivar. El flujo de caja usará saldo inicial $0 y los deltas de capital de trabajo serán incorrectos."
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
                                        {isDerived && derivedEntry ? (
                                            <TypeChips
                                                types={derivedEntry.statements}
                                                accent={palette.chartreuse}
                                            />
                                        ) : (
                                            <Typography
                                                sx={{
                                                    fontFamily: fonts.body,
                                                    fontSize: '0.8rem',
                                                    color: palette.paperMuted,
                                                    mt: 0.5,
                                                }}
                                            >
                                                Flujo de caja · Cambios de patrimonio · Notas
                                            </Typography>
                                        )}
                                    </Box>
                                    <BrutalistButton
                                        variant={isDerived ? 'outline' : 'primary'}
                                        size="md"
                                        accent={isDerived ? palette.chartreuse : ACCENT}
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
                                        onClick={() => ps && handleDerivar(ps, pe)}
                                        disabled={
                                            isRunning || runningKey !== null || !eligible || !ps
                                        }
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

                        {monthly.length > 0 && (
                            <Tooltip title={NIC7_TOOLTIP} placement="top" arrow>
                                <Box
                                    tabIndex={0}
                                    role="note"
                                    aria-label={NIC7_TOOLTIP}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        p: 2,
                                        border: `1px dashed ${hexAlpha(palette.paper, 0.15)}`,
                                        opacity: 0.55,
                                        cursor: 'help',
                                    }}
                                >
                                    <LockIcon sx={{ fontSize: 18, color: palette.paperMuted }} />
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.72rem',
                                            color: palette.paperMuted,
                                        }}
                                    >
                                        {`// ${monthly.length} PERÍODO(S) MENSUAL(ES) — NO ANUAL, NO DERIVABLE (NIC 7)`}
                                    </Typography>
                                </Box>
                            </Tooltip>
                        )}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}

function FirstLevelCard({
    period,
    muted = false,
}: {
    period: ViaAFirstLevelPeriod;
    muted?: boolean;
}) {
    const accent = muted ? palette.paperMuted : ACCENT;
    return (
        <BrutalistCard
            sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderLeft: `3px solid ${muted ? hexAlpha(palette.paper, 0.2) : ACCENT}`,
                opacity: muted ? 0.75 : 1,
            }}
        >
            <DocIcon sx={{ color: accent, fontSize: 20 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    sx={{
                        fontFamily: fonts.display,
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: palette.paper,
                        letterSpacing: '-0.01em',
                    }}
                >
                    {formatDate(period.period_start)} → {formatDate(period.period_end)}
                </Typography>
                <TypeChips types={period.types} accent={ACCENT} />
            </Box>
        </BrutalistCard>
    );
}
