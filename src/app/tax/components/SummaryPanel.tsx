'use client';

import { Box, Typography, Skeleton, Grid } from '@mui/material';
import {
    AccountBalance as ICAIcon,
    Receipt as RentaIcon,
    TrendingUp,
    TrendingDown,
} from '@mui/icons-material';
import { palette, fonts, motion, sxLabelSmall, hexAlpha } from '@/styles/brutalist';
import { useIVA, useWithholdings, useICA, useRentaProvision } from '@/hooks/useTax';
import MoneyDisplay from '@/components/common/MoneyDisplay';
import { toLocalYMD } from '@/lib/formatters';
import PeriodSelector from '@/components/common/PeriodSelector';
import type { PeriodType } from '@/components/common/PeriodSelector';
import { useState } from 'react';

const ACCENT = palette.accent;

interface SummaryPanelProps {
    companyNit: string;
}

// Card shell component
function BrutalistCardShell({
    eyebrow,
    title,
    children,
    accent = ACCENT,
}: {
    eyebrow: string;
    title: string;
    children: React.ReactNode;
    accent?: string;
}) {
    return (
        <Box
            sx={{
                position: 'relative',
                p: { xs: 2.5, md: 3 },
                border: `1px solid ${palette.line}`,
                borderRadius: 1,
                bgcolor: 'transparent',
                height: '100%',
                overflow: 'hidden',
                transition: `border-color ${motion.duration.md} ${motion.snap}`,
                '&:hover': { borderColor: hexAlpha(accent, 0.4) },
            }}
        >
            {/* Top accent stripe */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: 2,
                    width: 32,
                    bgcolor: accent,
                    boxShadow: `0 0 8px ${accent}`,
                }}
            />

            {/* Eyebrow */}
            <Typography
                sx={{
                    ...sxLabelSmall,
                    color: hexAlpha(palette.paper, 0.5),
                    mb: 0.5,
                }}
            >
                {eyebrow}
            </Typography>

            {/* Title */}
            <Typography
                variant="h6"
                sx={{
                    fontFamily: fonts.display,
                    fontWeight: 700,
                    fontSize: { xs: '1.15rem', md: '1.35rem' },
                    color: palette.paper,
                    letterSpacing: '-0.02em',
                    mb: 2,
                }}
            >
                {title}
            </Typography>

            {/* Content */}
            {children}
        </Box>
    );
}

interface PeriodProps {
    periodStart: string;
    periodEnd: string;
}

// IVA Card Component
function IVACard({ periodStart, periodEnd }: PeriodProps) {
    const { data, isLoading } = useIVA({ periodStart, periodEnd });

    if (isLoading || !data) {
        return (
            <BrutalistCardShell eyebrow="// TRIBUTARIO" title="IVA del Período">
                <Skeleton
                    variant="rectangular"
                    height={120}
                    sx={{ bgcolor: hexAlpha(palette.paper, 0.05) }}
                />
            </BrutalistCardShell>
        );
    }

    const saldo = data.iva_a_pagar;
    const derivedStatus = saldo > 0 ? 'saldo_a_pagar' : saldo < 0 ? 'saldo_a_favor' : 'saldo_cero';
    const normalizedStatus = data.iva_status ?? derivedStatus;
    const statusLabel =
        normalizedStatus === 'saldo_a_pagar'
            ? 'Saldo a Pagar'
            : normalizedStatus === 'saldo_a_favor'
              ? 'Saldo a Favor'
              : 'Saldo Cero';
    const statusColor =
        normalizedStatus === 'saldo_a_pagar'
            ? palette.error
            : normalizedStatus === 'saldo_a_favor'
              ? palette.success
              : palette.paperMuted;

    return (
        <BrutalistCardShell eyebrow="// TRIBUTARIO" title="IVA del Período">
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Typography sx={{ ...sxLabelSmall, color: palette.success }}>
                        Generado
                    </Typography>
                    <MoneyDisplay value={data.iva_generado} variant="body1" />
                </Grid>
                <Grid item xs={6}>
                    <Typography sx={{ ...sxLabelSmall, color: palette.error }}>
                        Descontable
                    </Typography>
                    <MoneyDisplay value={data.iva_descontable} variant="body1" />
                </Grid>
                <Grid item xs={12}>
                    <Box
                        sx={{
                            pt: 1.5,
                            mt: 1,
                            borderTop: `1px solid ${palette.line}`,
                        }}
                    >
                        <Typography sx={{ ...sxLabelSmall, color: statusColor }}>
                            {statusLabel}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MoneyDisplay
                                value={saldo}
                                variant="h5"
                                showSign={true}
                                sx={{
                                    fontWeight: 700,
                                    color: saldo >= 0 ? palette.error : palette.success,
                                }}
                            />
                            {saldo >= 0 ? (
                                <TrendingUp sx={{ color: palette.error }} />
                            ) : (
                                <TrendingDown sx={{ color: palette.success }} />
                            )}
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </BrutalistCardShell>
    );
}

// Withholdings Card Component
function WithholdingsCard({ periodStart, periodEnd }: PeriodProps) {
    const { data, isLoading } = useWithholdings({ periodStart, periodEnd });

    if (isLoading || !data) {
        return (
            <BrutalistCardShell eyebrow="// TRIBUTARIO" title="Retenciones">
                <Skeleton
                    variant="rectangular"
                    height={80}
                    sx={{ bgcolor: hexAlpha(palette.paper, 0.05) }}
                />
            </BrutalistCardShell>
        );
    }

    const retefuenteDerived =
        data.retencion_en_la_fuente > 0
            ? 'saldo_a_pagar'
            : data.retencion_en_la_fuente < 0
              ? 'saldo_a_favor'
              : 'saldo_cero';
    const reteiCaDerived =
        data.retencion_ica > 0
            ? 'saldo_a_pagar'
            : data.retencion_ica < 0
              ? 'saldo_a_favor'
              : 'saldo_cero';
    const totalRetencionesDerived =
        data.total_retenciones > 0
            ? 'saldo_a_pagar'
            : data.total_retenciones < 0
              ? 'saldo_a_favor'
              : 'saldo_cero';

    const retefuenteStatus = data.retencion_en_la_fuente_status ?? retefuenteDerived;
    const reteicaStatus = data.retencion_ica_status ?? reteiCaDerived;
    const totalRetencioneStatus = data.total_retenciones_status ?? totalRetencionesDerived;

    const retefuenteStatusLabel =
        retefuenteStatus === 'saldo_a_pagar'
            ? 'A Pagar'
            : retefuenteStatus === 'saldo_a_favor'
              ? 'A Favor'
              : 'Cero';
    const reteicaStatusLabel =
        reteicaStatus === 'saldo_a_pagar'
            ? 'A Pagar'
            : reteicaStatus === 'saldo_a_favor'
              ? 'A Favor'
              : 'Cero';
    const totalStatusLabel =
        totalRetencioneStatus === 'saldo_a_pagar'
            ? 'Total A Pagar'
            : totalRetencioneStatus === 'saldo_a_favor'
              ? 'Total A Favor'
              : 'Total Cero';

    const retefuenteStatusColor =
        retefuenteStatus === 'saldo_a_pagar'
            ? palette.error
            : retefuenteStatus === 'saldo_a_favor'
              ? palette.success
              : palette.paperMuted;
    const reteicaStatusColor =
        reteicaStatus === 'saldo_a_pagar'
            ? palette.error
            : reteicaStatus === 'saldo_a_favor'
              ? palette.success
              : palette.paperMuted;

    return (
        <BrutalistCardShell eyebrow="// TRIBUTARIO" title="Retenciones">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                    <Typography sx={{ ...sxLabelSmall, color: retefuenteStatusColor }}>
                        Retefuente ({retefuenteStatusLabel})
                    </Typography>
                    <MoneyDisplay value={data.retencion_en_la_fuente} variant="body1" />
                </Box>
                <Box>
                    <Typography sx={{ ...sxLabelSmall, color: reteicaStatusColor }}>
                        ReteICA ({reteicaStatusLabel})
                    </Typography>
                    <MoneyDisplay value={data.retencion_ica} variant="body1" />
                </Box>
                <Box
                    sx={{
                        pt: 1.5,
                        mt: 0.5,
                        borderTop: `1px solid ${palette.line}`,
                    }}
                >
                    <Typography
                        sx={{
                            ...sxLabelSmall,
                            color:
                                totalRetencioneStatus === 'saldo_a_pagar'
                                    ? palette.error
                                    : totalRetencioneStatus === 'saldo_a_favor'
                                      ? palette.success
                                      : palette.accent,
                        }}
                    >
                        {totalStatusLabel}
                    </Typography>
                    <MoneyDisplay
                        value={data.total_retenciones}
                        variant="h6"
                        sx={{ fontWeight: 700 }}
                    />
                </Box>
            </Box>
        </BrutalistCardShell>
    );
}

// ICA Card Component
function ICACard({ companyNit, periodStart, periodEnd }: { companyNit: string } & PeriodProps) {
    const { data, isLoading } = useICA({ companyNitFallback: companyNit, periodStart, periodEnd });

    if (isLoading || !data) {
        return (
            <BrutalistCardShell eyebrow="// MUNICIPAL" title="ICA" accent={palette.chartreuse}>
                <Skeleton
                    variant="rectangular"
                    height={100}
                    sx={{ bgcolor: hexAlpha(palette.paper, 0.05) }}
                />
            </BrutalistCardShell>
        );
    }

    return (
        <BrutalistCardShell eyebrow="// MUNICIPAL" title="ICA" accent={palette.chartreuse}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ICAIcon sx={{ color: palette.chartreuse }} />
                <Typography sx={{ color: palette.paperMuted, fontSize: '0.85rem' }}>
                    Impuesto de Industria y Comercio
                </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
                <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted }}>
                    Ingresos Brutos
                </Typography>
                <MoneyDisplay value={data.ingresos_brutos} variant="body1" />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted }}>
                        Tasa ICA
                    </Typography>
                    <Typography sx={{ fontFamily: fonts.mono, color: palette.paper }}>
                        {(data.tasa_ica * 100).toFixed(2)}%
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ ...sxLabelSmall, color: palette.chartreuse }}>
                        A pagar
                    </Typography>
                    <MoneyDisplay
                        value={data.ica_a_pagar}
                        variant="h6"
                        sx={{ fontWeight: 700, color: palette.chartreuse }}
                    />
                </Box>
            </Box>

            <Typography
                sx={{
                    mt: 2,
                    fontSize: '0.75rem',
                    color: hexAlpha(palette.paperMuted, 0.7),
                    fontFamily: fonts.mono,
                }}
            >
                Cuenta gasto: {data.cuenta_gasto_puc} | Pasivo: {data.cuenta_pasivo_puc}
            </Typography>
        </BrutalistCardShell>
    );
}

// Renta Card Component
function RentaCard({ companyNit, periodStart, periodEnd }: { companyNit: string } & PeriodProps) {
    const { data, isLoading } = useRentaProvision({
        companyNitFallback: companyNit,
        periodStart,
        periodEnd,
    });

    if (isLoading || !data) {
        return (
            <BrutalistCardShell eyebrow="// ANUAL" title="Provisión Renta" accent={palette.pink}>
                <Skeleton
                    variant="rectangular"
                    height={100}
                    sx={{ bgcolor: hexAlpha(palette.paper, 0.05) }}
                />
            </BrutalistCardShell>
        );
    }

    return (
        <BrutalistCardShell eyebrow="// ANUAL" title="Provisión Renta" accent={palette.pink}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <RentaIcon sx={{ color: palette.pink }} />
                <Typography sx={{ color: palette.paperMuted, fontSize: '0.85rem' }}>
                    Impuesto a la Renta 35%
                </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
                <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted }}>
                    Utilidad antes de Impuestos
                </Typography>
                <MoneyDisplay value={data.utilidad_antes_impuestos} variant="body1" />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted }}>
                        Tasa
                    </Typography>
                    <Typography sx={{ fontFamily: fonts.mono, color: palette.paper }}>
                        {(data.tasa_renta * 100).toFixed(0)}%
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ ...sxLabelSmall, color: palette.pink }}>Provisión</Typography>
                    <MoneyDisplay
                        value={data.provision_renta}
                        variant="h6"
                        sx={{ fontWeight: 700, color: palette.pink }}
                    />
                </Box>
            </Box>

            <Typography
                sx={{
                    mt: 2,
                    fontSize: '0.75rem',
                    color: hexAlpha(palette.paperMuted, 0.7),
                    fontFamily: fonts.mono,
                }}
            >
                Cuenta gasto: {data.cuenta_gasto_puc} | Pasivo: {data.cuenta_pasivo_puc}
            </Typography>
        </BrutalistCardShell>
    );
}

// Main Summary Panel
export default function SummaryPanel({ companyNit }: SummaryPanelProps) {
    const [period, setPeriod] = useState<{
        startDate: string;
        endDate: string;
        periodType: PeriodType;
    }>({
        startDate: toLocalYMD(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
        endDate: toLocalYMD(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)),
        periodType: 'month',
    });

    // Don't render if no company selected
    if (!companyNit) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography sx={{ color: palette.paperMuted }}>
                    Seleccione una empresa para ver el resumen tributario
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Period selector */}
            <Box sx={{ mb: 4 }}>
                <Typography sx={{ ...sxLabelSmall, mb: 2, color: palette.paperMuted }}>
                    {'// Período de análisis'}
                </Typography>
                <PeriodSelector value={period} onChange={setPeriod} showBimestre={true} />
            </Box>

            {/* Cards grid */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <IVACard periodStart={period.startDate} periodEnd={period.endDate} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <WithholdingsCard periodStart={period.startDate} periodEnd={period.endDate} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <ICACard
                        companyNit={companyNit}
                        periodStart={period.startDate}
                        periodEnd={period.endDate}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <RentaCard
                        companyNit={companyNit}
                        periodStart={period.startDate}
                        periodEnd={period.endDate}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
