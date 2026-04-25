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

// IVA Card Component
function IVACard() {
    const { data, isLoading } = useIVA();

    if (isLoading || !data) {
        return (
            <BrutalistCardShell eyebrow="// TRIBUTARIO" title="IVA del Período">
                <Skeleton variant="rectangular" height={120} sx={{ bgcolor: hexAlpha(palette.paper, 0.05) }} />
            </BrutalistCardShell>
        );
    }

    const saldo = data.iva_a_pagar;

    return (
        <BrutalistCardShell eyebrow="// TRIBUTARIO" title="IVA del Período">
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Typography sx={{ ...sxLabelSmall, color: palette.success }}>Generado</Typography>
                    <MoneyDisplay value={data.iva_generado} variant="body1" />
                </Grid>
                <Grid item xs={6}>
                    <Typography sx={{ ...sxLabelSmall, color: palette.error }}>Descontable</Typography>
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
                        <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted }}>
                            Saldo a pagar
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MoneyDisplay
                                value={saldo}
                                variant="h5"
                                showSign={true}
                                sx={{ fontWeight: 700, color: saldo >= 0 ? palette.error : palette.success }}
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
function WithholdingsCard() {
    const { data, isLoading } = useWithholdings();

    if (isLoading || !data) {
        return (
            <BrutalistCardShell eyebrow="// TRIBUTARIO" title="Retenciones">
                <Skeleton variant="rectangular" height={80} sx={{ bgcolor: hexAlpha(palette.paper, 0.05) }} />
            </BrutalistCardShell>
        );
    }

    return (
        <BrutalistCardShell eyebrow="// TRIBUTARIO" title="Retenciones">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                    <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted }}>Retefuente (Cuenta 2365)</Typography>
                    <MoneyDisplay value={data.retencion_en_la_fuente} variant="body1" />
                </Box>
                <Box>
                    <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted }}>ReteICA (Cuenta 2368)</Typography>
                    <MoneyDisplay value={data.retencion_ica} variant="body1" />
                </Box>
                <Box
                    sx={{
                        pt: 1.5,
                        mt: 0.5,
                        borderTop: `1px solid ${palette.line}`,
                    }}
                >
                    <Typography sx={{ ...sxLabelSmall, color: palette.accent }}>Total Retenciones</Typography>
                    <MoneyDisplay value={data.total_retenciones} variant="h6" sx={{ fontWeight: 700 }} />
                </Box>
            </Box>
        </BrutalistCardShell>
    );
}

// ICA Card Component
function ICACard({ companyNit }: { companyNit: string }) {
    const { data, isLoading } = useICA(companyNit);

    if (isLoading || !data) {
        return (
            <BrutalistCardShell eyebrow="// MUNICIPAL" title="ICA" accent={palette.chartreuse}>
                <Skeleton variant="rectangular" height={100} sx={{ bgcolor: hexAlpha(palette.paper, 0.05) }} />
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
                <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted }}>Ingresos Brutos</Typography>
                <MoneyDisplay value={data.ingresos_brutos} variant="body1" />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted }}>Tasa ICA</Typography>
                    <Typography sx={{ fontFamily: fonts.mono, color: palette.paper }}>
                        {(data.tasa_ica * 100).toFixed(2)}%
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ ...sxLabelSmall, color: palette.chartreuse }}>A pagar</Typography>
                    <MoneyDisplay value={data.ica_a_pagar} variant="h6" sx={{ fontWeight: 700, color: palette.chartreuse }} />
                </Box>
            </Box>

            <Typography sx={{ mt: 2, fontSize: '0.75rem', color: hexAlpha(palette.paperMuted, 0.7), fontFamily: fonts.mono }}>
                Cuenta gasto: {data.cuenta_gasto_puc} | Pasivo: {data.cuenta_pasivo_puc}
            </Typography>
        </BrutalistCardShell>
    );
}

// Renta Card Component
function RentaCard({ companyNit }: { companyNit: string }) {
    const { data, isLoading } = useRentaProvision(companyNit);

    if (isLoading || !data) {
        return (
            <BrutalistCardShell eyebrow="// ANUAL" title="Provisión Renta" accent={palette.pink}>
                <Skeleton variant="rectangular" height={100} sx={{ bgcolor: hexAlpha(palette.paper, 0.05) }} />
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
                <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted }}>Utilidad antes de Impuestos</Typography>
                <MoneyDisplay value={data.utilidad_antes_impuestos} variant="body1" />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted }}>Tasa</Typography>
                    <Typography sx={{ fontFamily: fonts.mono, color: palette.paper }}>
                        {(data.tasa_renta * 100).toFixed(0)}%
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ ...sxLabelSmall, color: palette.pink }}>Provisión</Typography>
                    <MoneyDisplay value={data.provision_renta} variant="h6" sx={{ fontWeight: 700, color: palette.pink }} />
                </Box>
            </Box>

            <Typography sx={{ mt: 2, fontSize: '0.75rem', color: hexAlpha(palette.paperMuted, 0.7), fontFamily: fonts.mono }}>
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
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        periodType: 'month',
    });

    return (
        <Box>
            {/* Period selector */}
            <Box sx={{ mb: 4 }}>
                <Typography sx={{ ...sxLabelSmall, mb: 2, color: palette.paperMuted }}>
                    {'// Período de análisis'}
                </Typography>
                <PeriodSelector
                    value={period}
                    onChange={setPeriod}
                    showBimestre={true}
                />
            </Box>

            {/* Cards grid */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <IVACard />
                </Grid>
                <Grid item xs={12} md={6}>
                    <WithholdingsCard />
                </Grid>
                <Grid item xs={12} md={6}>
                    <ICACard companyNit={companyNit} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <RentaCard companyNit={companyNit} />
                </Grid>
            </Grid>
        </Box>
    );
}
