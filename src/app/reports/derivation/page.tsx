'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Alert,
    Stack,
    CircularProgress,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
} from '@mui/material';
import {
    Calculate as DerivationIcon,
    Refresh as RefreshIcon,
    PlayArrow as RunIcon,
    CheckCircle as CheckIcon,
    Cancel as MissingIcon,
    OpenInNew as LinkIcon,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    BrutalistPageHero,
    BrutalistButton,
    BrutalistCard,
    BrutalistEmptyState,
} from '@/components/brutalist';
import { palette, fonts, moduleAccents, sxLabel, sxLabelSmall, hexAlpha } from '@/styles/brutalist';
import { useCompany } from '@/context/CompanyContext';
import { getDerivationStatus, runDerivation, type DerivationStatusResponse } from '@/lib/api';
import ViaADerivationTab from './_components/ViaADerivationTab';

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

// ── Period Matrix ─────────────────────────────────────────────────────────────

function PeriodMatrix({ status }: { status: DerivationStatusResponse }) {
    // Annual period_ends are the only candidates for derivation; monthly rows
    // are listed at the bottom of the matrix as informational greyed-out rows
    // so the user understands they exist but aren't actionable.
    const annualPeriodEnds = useMemo(() => {
        const all = new Set<string>();
        for (const t of REQUIRED_TYPES) {
            for (const item of status.sources[t] ?? []) {
                if (item.period_end && item.frequency === 'annual') all.add(item.period_end);
            }
        }
        return Array.from(all).sort().reverse();
    }, [status.sources]);

    const monthlyPeriodEnds = useMemo(() => {
        const all = new Set<string>();
        for (const t of REQUIRED_TYPES) {
            for (const item of status.sources[t] ?? []) {
                if (item.period_end && item.frequency === 'monthly') all.add(item.period_end);
            }
        }
        return Array.from(all).sort().reverse();
    }, [status.sources]);

    if (annualPeriodEnds.length === 0 && monthlyPeriodEnds.length === 0) return null;

    const renderRow = (pe: string, kind: 'annual' | 'monthly') => {
        const bg = status.sources['balance_general']?.some((i) => i.period_end === pe);
        const er = status.sources['estado_resultados']?.some((i) => i.period_end === pe);
        const la = status.sources['libro_auxiliar']?.some((i) => i.period_end === pe);
        // Either of the two normative paths satisfies the row. Mirrors the
        // backend rule in /api/v1/reports/derivation/status.
        const meetsAnyPath = kind === 'annual' && ((bg && er) || la);
        return (
            <Box
                key={`${kind}-${pe}`}
                sx={{
                    display: 'grid',
                    gridTemplateColumns: '160px repeat(3, 1fr) 120px',
                    gap: 0,
                    py: 0.75,
                    borderBottom: `1px solid ${hexAlpha(palette.paper, 0.06)}`,
                    opacity: kind === 'monthly' ? 0.5 : 1,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.7rem',
                            color: palette.paperMuted,
                        }}
                    >
                        {pe.slice(0, 10)}
                    </Typography>
                    {kind === 'monthly' && (
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.55rem',
                                letterSpacing: '0.15em',
                                color: palette.paperFaint,
                                textTransform: 'uppercase',
                            }}
                        >
                            {'// M'}
                        </Typography>
                    )}
                </Box>
                {REQUIRED_TYPES.map((t) => {
                    const present = status.sources[t]?.some((i) => i.period_end === pe);
                    return (
                        <Box
                            key={t}
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Box
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: present
                                        ? palette.chartreuse
                                        : hexAlpha(palette.amber, 0.5),
                                    boxShadow: present
                                        ? `0 0 6px ${palette.chartreuse}`
                                        : undefined,
                                }}
                            />
                        </Box>
                    );
                })}
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {kind === 'annual' ? (
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.6rem',
                                letterSpacing: '0.12em',
                                color: meetsAnyPath ? palette.chartreuse : palette.paperFaint,
                            }}
                        >
                            {meetsAnyPath ? '// DERIVABLE' : '// FALTA'}
                        </Typography>
                    ) : (
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.55rem',
                                letterSpacing: '0.12em',
                                color: palette.paperFaint,
                            }}
                        >
                            {'// NO ANUAL'}
                        </Typography>
                    )}
                </Box>
            </Box>
        );
    };

    return (
        <Box sx={{ mb: 4, overflowX: 'auto' }}>
            {/* Tooltip with normative citations */}
            <Tooltip
                title={
                    <Box sx={{ p: 0.5, maxWidth: 380 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: palette.paper, mb: 0.5 }}>
                            <strong>Mínimo para derivación (NIC 7 § 18):</strong>
                        </Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: palette.paperDim, mb: 0.5 }}>
                            • Balance General + Estado de Resultados (método indirecto), o
                        </Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: palette.paperDim, mb: 0.5 }}>
                            • Libro Auxiliar anual que cubra clases 1-7 del PUC (Decreto 2650/1993)
                        </Typography>
                        <Typography
                            sx={{ fontSize: '0.65rem', color: palette.paperFaint, mt: 0.75 }}
                        >
                            Solo cierres anuales se aceptan — la NIC 7 método indirecto requiere
                            comparar dos años fiscales.
                        </Typography>
                    </Box>
                }
                arrow
                placement="top-start"
            >
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.62rem',
                        letterSpacing: '0.18em',
                        color: palette.paperFaint,
                        textTransform: 'uppercase',
                        mb: 1,
                        display: 'inline-block',
                        textDecoration: 'underline dotted',
                        cursor: 'help',
                    }}
                >
                    {'// PERÍODOS DISPONIBLES — qué requiere la derivación?'}
                </Typography>
            </Tooltip>

            {/* Header */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: '160px repeat(3, 1fr) 120px',
                    gap: 0,
                    borderBottom: `1px solid ${hexAlpha(palette.paper, 0.15)}`,
                    mb: 0.5,
                }}
            >
                <Box />
                {REQUIRED_TYPES.map((t) => (
                    <Typography
                        key={t}
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.65rem',
                            letterSpacing: '0.08em',
                            color: palette.paperMuted,
                            textAlign: 'center',
                            pb: 0.75,
                        }}
                    >
                        {TYPE_LABEL[t].toUpperCase()}
                    </Typography>
                ))}
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.65rem',
                        letterSpacing: '0.08em',
                        color: palette.paperMuted,
                        textAlign: 'center',
                        pb: 0.75,
                    }}
                >
                    ESTADO
                </Typography>
            </Box>

            {/* Annual rows (derivation candidates) */}
            {annualPeriodEnds.map((pe) => renderRow(pe, 'annual'))}

            {/* Monthly rows (informational) */}
            {monthlyPeriodEnds.length > 0 && (
                <>
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.6rem',
                            letterSpacing: '0.18em',
                            color: palette.paperFaint,
                            textTransform: 'uppercase',
                            mt: 1.5,
                            mb: 0.5,
                        }}
                    >
                        {'// MENSUALES — solo informativos'}
                    </Typography>
                    {monthlyPeriodEnds.map((pe) => renderRow(pe, 'monthly'))}
                </>
            )}
        </Box>
    );
}

// ── Vía B tab ─────────────────────────────────────────────────────────────────

function ViaBDerivationTab({
    status,
    isLoading,
    refetch,
}: {
    status: DerivationStatusResponse | undefined;
    isLoading: boolean;
    refetch: () => void;
}) {
    const queryClient = useQueryClient();
    const { activeCompany } = useCompany();
    const [runningKey, setRunningKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const sources = status?.sources;
    const totalLoaded = sources
        ? REQUIRED_TYPES.reduce((acc, t) => acc + (sources[t]?.length ?? 0), 0)
        : 0;
    const typesPresent = sources
        ? REQUIRED_TYPES.filter((t) => (sources[t]?.length ?? 0) > 0).length
        : 0;
    const readyCount = status?.ready_periods.length ?? 0;
    const derivedCount = status?.derived_periods?.filter((d) => d.complete).length ?? 0;

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
            queryClient.invalidateQueries({ queryKey: ['derivationStatus', activeCompany.nit] });
        } catch (e) {
            const err = e as Error & { detail?: string };
            setError(err?.message || err?.detail || 'Error al ejecutar derivación');
        } finally {
            setRunningKey(null);
        }
    };

    return (
        <Box>
            {/* KPIs */}
            <Stack direction="row" spacing={3} sx={{ mb: 4 }}>
                {[
                    { value: `${typesPresent}/3`, label: 'TIPOS CARGADOS' },
                    { value: String(totalLoaded), label: 'EEFF FUENTE' },
                    { value: String(readyCount), label: 'PERÍODOS LISTOS' },
                    { value: String(derivedCount), label: 'DERIVADOS' },
                ].map((kpi) => (
                    <Box key={kpi.label}>
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
                            {kpi.value}
                        </Typography>
                        <Typography
                            sx={{ ...sxLabel, fontSize: '0.6rem', color: ACCENT, mt: 0.25 }}
                        >
                            {kpi.label}
                        </Typography>
                    </Box>
                ))}
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
                    onClick={refetch}
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

            {/* ── Documentos fuente ─────────────────────────────────────── */}
            <Box sx={{ mb: 5 }}>
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

                {/* Period matrix */}
                {status && <PeriodMatrix status={status} />}

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
                                        sx={{ ...sxLabel, fontSize: '0.65rem', color: 'inherit' }}
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
                    </Box>
                    .
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
                            const pe = p.period_end?.slice(0, 10) ?? '';
                            const derivedEntry = status.derived_periods?.find(
                                (d) => d.period_end?.slice(0, 10) === pe
                            );
                            const isDerived = derivedEntry?.complete === true;
                            const isPartial = derivedEntry && !derivedEntry.complete;

                            return (
                                <BrutalistCard
                                    key={key}
                                    sx={{
                                        p: 2.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2.5,
                                        borderLeft: `3px solid ${
                                            isDerived
                                                ? palette.chartreuse
                                                : isPartial
                                                  ? palette.amber
                                                  : ACCENT
                                        }`,
                                    }}
                                >
                                    {isDerived ? (
                                        <CheckIcon
                                            sx={{ color: palette.chartreuse, fontSize: 22 }}
                                        />
                                    ) : (
                                        <DerivationIcon sx={{ color: ACCENT, fontSize: 22 }} />
                                    )}
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
                                                color: isDerived
                                                    ? palette.chartreuse
                                                    : palette.paperMuted,
                                                mt: 0.3,
                                            }}
                                        >
                                            {isDerived
                                                ? '✓ flujo de caja · cambios patrimonio · notas'
                                                : isPartial
                                                  ? `incompleto — ${derivedEntry?.statements?.join(', ')}`
                                                  : 'los 3 documentos fuente coinciden'}
                                        </Typography>
                                    </Box>

                                    {isDerived ? (
                                        <BrutalistButton
                                            variant="outline"
                                            size="md"
                                            accent={palette.chartreuse}
                                            icon={<LinkIcon sx={{ fontSize: 14 }} />}
                                            onClick={() => window.open('/reports', '_blank')}
                                        >
                                            Ver reportes
                                        </BrutalistButton>
                                    ) : (
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
                                            {isRunning
                                                ? 'Derivando...'
                                                : isPartial
                                                  ? 'Re-derivar'
                                                  : 'Derivar'}
                                        </BrutalistButton>
                                    )}
                                </BrutalistCard>
                            );
                        })}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DerivationPage() {
    const { activeCompany } = useCompany();
    const searchParams = useSearchParams();
    const router = useRouter();

    const activeTab = useMemo<'via-a' | 'via-b'>(() => {
        const fromUrl = searchParams.get('tab');
        if (fromUrl === 'via-a' || fromUrl === 'via-b') return fromUrl;
        if (activeCompany?.locked_pathway === 'build_from_scratch') return 'via-a';
        return 'via-b';
    }, [searchParams, activeCompany?.locked_pathway]);

    const handleTabChange = (_: React.SyntheticEvent, val: 'via-a' | 'via-b' | null) => {
        if (!val) return;
        router.push(`/reports/derivation?tab=${val}`);
    };

    const {
        data: statusViaB,
        isLoading: loadingViaB,
        refetch: refetchViaB,
    } = useQuery({
        queryKey: ['derivationStatus', activeCompany?.nit],
        queryFn: () => getDerivationStatus(activeCompany!.nit),
        enabled: !!activeCompany?.nit && activeTab === 'via-b',
        staleTime: 30_000,
    });

    if (!activeCompany) {
        return (
            <Box>
                <BrutalistPageHero
                    eyebrow="// MÓDULO_6 // DERIVACIÓN"
                    title={
                        <>
                            Estados
                            <br />
                            derivados.
                        </>
                    }
                    subtitle="vía a · vía b · derivación"
                    lede="Selecciona una empresa para gestionar la derivación de estados financieros."
                    accent={ACCENT}
                    ghostNumber="6"
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

    return (
        <Box>
            <BrutalistPageHero
                eyebrow="// MÓDULO_6 // DERIVACIÓN"
                title={
                    <>
                        Estados
                        <br />
                        derivados.
                    </>
                }
                subtitle={activeCompany.nombre ?? activeCompany.nit}
                lede="Genera flujo de caja, cambios en patrimonio y notas a partir de los estados fuente, ya sea desde Vía A (asientos contables) o Vía B (documentos cargados)."
                accent={ACCENT}
                ghostNumber="6"
            />

            {/* ── Tab selector ──────────────────────────────────────────── */}
            <Box sx={{ mb: 4 }}>
                <ToggleButtonGroup
                    value={activeTab}
                    exclusive
                    onChange={handleTabChange}
                    size="small"
                    sx={{
                        border: `1px solid ${hexAlpha(palette.paper, 0.2)}`,
                        borderRadius: 0,
                        '& .MuiToggleButton-root': {
                            fontFamily: fonts.mono,
                            fontSize: '0.7rem',
                            letterSpacing: '0.08em',
                            color: palette.paperMuted,
                            border: 'none',
                            borderRadius: 0,
                            px: 2.5,
                            py: 1,
                            textTransform: 'none',
                            '&.Mui-selected': {
                                color: ACCENT,
                                bgcolor: hexAlpha(ACCENT, 0.08),
                                boxShadow: `inset 0 -2px 0 ${ACCENT}`,
                            },
                            '&:hover': {
                                bgcolor: hexAlpha(palette.paper, 0.05),
                            },
                        },
                    }}
                >
                    <ToggleButton
                        value="via-b"
                        disabled={activeCompany.locked_pathway === 'build_from_scratch'}
                    >
                        VÍA B — DESDE ESTADOS
                    </ToggleButton>
                    <ToggleButton
                        value="via-a"
                        disabled={activeCompany.locked_pathway === 'work_with_existing'}
                    >
                        VÍA A — DESDE ASIENTOS
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* ── Tab content ───────────────────────────────────────────── */}
            {activeTab === 'via-b' ? (
                <ViaBDerivationTab
                    status={statusViaB}
                    isLoading={loadingViaB}
                    refetch={refetchViaB}
                />
            ) : (
                <ViaADerivationTab />
            )}
        </Box>
    );
}
