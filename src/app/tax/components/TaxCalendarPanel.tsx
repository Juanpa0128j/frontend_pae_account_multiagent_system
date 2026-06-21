'use client';

import { useState, useMemo } from 'react';
import { Box, Typography, Chip, Skeleton, Alert } from '@mui/material';
import { CalendarMonth, Warning, Error as ErrorIcon, CheckCircle } from '@mui/icons-material';
import { useTaxCalendar } from '@/hooks/useTax';
import { useCompany } from '@/context/CompanyContext';
import { palette, fonts, motion, sxLabelSmall, hexAlpha } from '@/styles/brutalist';
import PeriodSelector from '@/components/common/PeriodSelector';
import type { PeriodType } from '@/components/common/PeriodSelector';
import { parseLocalYMD } from '@/lib/formatters';

type UrgencyLevel = 'overdue' | 'critical' | 'warning' | 'future';

function getUrgencyLevel(daysUntil: number): UrgencyLevel {
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 7) return 'critical';
    if (daysUntil <= 30) return 'warning';
    return 'future';
}

function getUrgencyConfig(level: UrgencyLevel) {
    switch (level) {
        case 'overdue':
            return {
                color: palette.error,
                bgColor: hexAlpha(palette.error, 0.1),
                icon: <ErrorIcon sx={{ fontSize: 16 }} />,
                label: 'VENCIDO',
            };
        case 'critical':
            return {
                color: palette.error,
                bgColor: hexAlpha(palette.error, 0.08),
                icon: <Warning sx={{ fontSize: 16 }} />,
                label: 'CRÍTICO',
            };
        case 'warning':
            return {
                color: palette.amber,
                bgColor: hexAlpha(palette.amber, 0.08),
                icon: <Warning sx={{ fontSize: 16 }} />,
                label: 'PRÓXIMO',
            };
        case 'future':
            return {
                color: palette.success,
                bgColor: hexAlpha(palette.success, 0.08),
                icon: <CheckCircle sx={{ fontSize: 16 }} />,
                label: 'A TIEMPO',
            };
    }
}

function formatFormType(formType: string): string {
    const mapping: Record<string, string> = {
        retefuente: 'Retención en la Fuente',
        iva_bimestral: 'IVA Bimestral',
        iva_cuatrimestral: 'IVA Cuatrimestral',
        renta_pj: 'Renta Personas Jurídicas',
        renta_pn: 'Renta Personas Naturales',
        ica: 'ICA Municipal',
        ica_anual: 'ICA Anual (estimado)',
        ica_bimestral: 'ICA Bimestral (estimado)',
        reteica: 'ReteICA',
    };
    return mapping[formType] || formType;
}

type IcaPeriodicidad = 'none' | 'anual' | 'bimestral';

const ICA_OPTIONS: { value: IcaPeriodicidad; label: string }[] = [
    { value: 'none', label: 'Sin ICA' },
    { value: 'anual', label: 'ICA anual' },
    { value: 'bimestral', label: 'ICA bimestral' },
];

function formatDeadline(dateStr: string): string {
    const date = parseLocalYMD(dateStr);
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    };
    return date.toLocaleDateString('es-CO', options);
}

export default function TaxCalendarPanel() {
    // Initialize to full current year so users see obligations immediately
    const currentYear = new Date().getFullYear();
    const [period, setPeriod] = useState<{
        startDate: string;
        endDate: string;
        periodType: PeriodType;
    }>({
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
        periodType: 'year',
    });
    const [icaPeriodicidad, setIcaPeriodicidad] = useState<IcaPeriodicidad>('none');

    const { data, isLoading, error } = useTaxCalendar(
        currentYear,
        'bimestral',
        icaPeriodicidad === 'none' ? undefined : icaPeriodicidad
    );

    const filteredObligations = useMemo(() => {
        if (!data?.obligations) return [];

        const periodStart = parseLocalYMD(period.startDate);
        const periodEnd = parseLocalYMD(period.endDate);

        return data.obligations
            .filter((obl) => {
                const deadline = parseLocalYMD(obl.deadline);
                return deadline >= periodStart && deadline <= periodEnd;
            })
            .sort(
                (a, b) => parseLocalYMD(a.deadline).getTime() - parseLocalYMD(b.deadline).getTime()
            );
    }, [data, period]);

    const { activeNit } = useCompany();

    // Don't render if no company selected
    if (!activeNit) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography sx={{ color: palette.paperMuted }}>
                    Seleccione una empresa para ver el calendario tributario
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert
                severity="error"
                sx={{
                    bgcolor: hexAlpha(palette.error, 0.1),
                    color: palette.error,
                    border: `1px solid ${palette.error}`,
                }}
            >
                Error cargando calendario tributario
            </Alert>
        );
    }

    return (
        <Box>
            {/* Header with period selector */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', md: 'center' },
                    gap: 2,
                    mb: 3,
                }}
            >
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.75rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: palette.paperMuted,
                    }}
                >
                    {'// Calendario DIAN 2026'}
                </Typography>

                <PeriodSelector value={period} onChange={setPeriod} showBimestre={true} />
            </Box>

            {/* ICA municipal toggle — fechas estimadas (el municipio fija las exactas) */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1,
                    mb: 3,
                }}
            >
                <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted, mr: 0.5 }}>
                    {'// ICA MUNICIPAL'}
                </Typography>
                {ICA_OPTIONS.map((opt) => {
                    const active = icaPeriodicidad === opt.value;
                    return (
                        <Chip
                            key={opt.value}
                            label={opt.label}
                            size="small"
                            onClick={() => setIcaPeriodicidad(opt.value)}
                            sx={{
                                cursor: 'pointer',
                                fontFamily: fonts.mono,
                                fontSize: '0.65rem',
                                letterSpacing: '0.08em',
                                borderRadius: 0.5,
                                bgcolor: active ? hexAlpha(palette.accent, 0.18) : 'transparent',
                                color: active ? palette.accent : palette.paperMuted,
                                border: `1px solid ${active ? palette.accent : palette.line}`,
                                transition: `all ${motion.duration.md} ${motion.snap}`,
                                '&:hover': { borderColor: palette.accent },
                            }}
                        />
                    );
                })}
                {icaPeriodicidad !== 'none' && (
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.62rem',
                            color: palette.paperMuted,
                            letterSpacing: '0.05em',
                        }}
                    >
                        {'// fechas estimadas — confirme el calendario del municipio'}
                    </Typography>
                )}
            </Box>

            {/* Stats summary */}
            {!isLoading && data && (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: 2,
                        mb: 4,
                        p: 2,
                        border: `1px solid ${palette.line}`,
                        borderRadius: 1,
                    }}
                >
                    <Box>
                        <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted }}>
                            {'// TOTAL'}
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: fonts.display,
                                fontSize: '2rem',
                                fontWeight: 700,
                                color: palette.paper,
                            }}
                        >
                            {data.obligations.length}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted }}>
                            {'// ALERTAS'}
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: fonts.display,
                                fontSize: '2rem',
                                fontWeight: 700,
                                color: palette.error,
                            }}
                        >
                            {data.obligations.filter((o) => o.alert).length}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted }}>
                            {'// VENCIDOS'}
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: fonts.display,
                                fontSize: '2rem',
                                fontWeight: 700,
                                color: palette.paperMuted,
                            }}
                        >
                            {data.obligations.filter((o) => o.days_until < 0).length}
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Obligations list */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isLoading ? (
                    // Loading skeletons
                    Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            variant="rectangular"
                            height={80}
                            sx={{ bgcolor: hexAlpha(palette.paper, 0.05) }}
                        />
                    ))
                ) : filteredObligations.length === 0 ? (
                    <Box
                        sx={{
                            textAlign: 'center',
                            py: 6,
                            border: `1px dashed ${palette.line}`,
                            borderRadius: 1,
                        }}
                    >
                        <CalendarMonth sx={{ fontSize: 48, color: palette.paperMuted, mb: 2 }} />
                        <Typography sx={{ color: palette.paperMuted }}>
                            No hay obligaciones en el período seleccionado
                        </Typography>
                    </Box>
                ) : (
                    filteredObligations.map((obligation) => {
                        const urgency = getUrgencyLevel(obligation.days_until);
                        const config = getUrgencyConfig(urgency);

                        return (
                            <Box
                                key={`${obligation.form_type}-${obligation.period}`}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    p: 2.5,
                                    border: `1px solid ${palette.line}`,
                                    borderRadius: 1,
                                    bgcolor: config.bgColor,
                                    transition: `all ${motion.duration.md} ${motion.snap}`,
                                    '&:hover': {
                                        borderColor: config.color,
                                        transform: 'translateX(4px)',
                                    },
                                }}
                            >
                                {/* Urgency indicator */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        bgcolor: hexAlpha(config.color, 0.15),
                                        color: config.color,
                                        flexShrink: 0,
                                    }}
                                >
                                    {config.icon}
                                </Box>

                                {/* Content */}
                                <Box sx={{ flex: 1 }}>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.display,
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            color: palette.paper,
                                            mb: 0.5,
                                        }}
                                    >
                                        {formatFormType(obligation.form_type)}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.75rem',
                                            color: palette.paperMuted,
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        {obligation.period_label}
                                    </Typography>
                                </Box>

                                {/* Deadline */}
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            color: config.color,
                                        }}
                                    >
                                        {formatDeadline(obligation.deadline)}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.7rem',
                                            color: palette.paperMuted,
                                        }}
                                    >
                                        {obligation.days_until < 0
                                            ? `Venció hace ${Math.abs(obligation.days_until)} días`
                                            : obligation.days_until === 0
                                              ? 'Vence hoy'
                                              : `Faltan ${obligation.days_until} días`}
                                    </Typography>
                                </Box>

                                {/* Status chip */}
                                <Chip
                                    label={config.label}
                                    size="small"
                                    sx={{
                                        bgcolor: hexAlpha(config.color, 0.15),
                                        color: config.color,
                                        fontFamily: fonts.mono,
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.1em',
                                        border: `1px solid ${config.color}`,
                                        display: { xs: 'none', sm: 'flex' },
                                    }}
                                />
                            </Box>
                        );
                    })
                )}
            </Box>
        </Box>
    );
}
