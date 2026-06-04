'use client';

import { useEffect } from 'react';
import { Box, IconButton, TextField, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { palette, fonts, motion, sxLabelSmall, hexAlpha } from '@/styles/brutalist';
import type { ViaAPeriodType } from '@/types';

const ACCENT = palette.chartreuse;

const MONTHS = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

const MODES: { value: ViaAPeriodType; label: string }[] = [
    { value: 'annual', label: 'Anual' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'custom', label: 'Personalizado' },
];

export interface ViaAPeriodValue {
    period_type: ViaAPeriodType;
    period_start: string; // YYYY-MM-DD
    period_end: string; // YYYY-MM-DD
}

interface ViaAPeriodPickerProps {
    value: ViaAPeriodValue;
    onChange: (v: ViaAPeriodValue) => void;
    /** Journal coverage so the default period lands on the real data. */
    journalRange?: { earliest: string | null; latest: string | null } | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function annualPeriod(year: number): ViaAPeriodValue {
    return {
        period_type: 'annual',
        period_start: `${year}-01-01`,
        period_end: `${year}-12-31`,
    };
}

export function monthlyPeriod(year: number, month1to12: number): ViaAPeriodValue {
    const lastDay = new Date(year, month1to12, 0).getDate();
    return {
        period_type: 'monthly',
        period_start: `${year}-${pad(month1to12)}-01`,
        period_end: `${year}-${pad(month1to12)}-${pad(lastDay)}`,
    };
}

/** Step a month by ±delta, rolling across years. */
function shiftMonth(year: number, month1to12: number, delta: number): ViaAPeriodValue {
    const zeroBased = month1to12 - 1 + delta;
    const newYear = year + Math.floor(zeroBased / 12);
    const newMonth = ((zeroBased % 12) + 12) % 12;
    return monthlyPeriod(newYear, newMonth + 1);
}

function yearOf(iso: string | null | undefined, fallback: number): number {
    if (!iso) return fallback;
    const y = Number(iso.slice(0, 4));
    return Number.isFinite(y) ? y : fallback;
}

/**
 * Explicit period control for the Vía A first-level generator. Mirrors the
 * familiar prev/next navigation of the tax PeriodSelector but lets the
 * accountant pick a concrete fiscal year / month / range — seeded from the
 * company's journal coverage so it defaults to the data on file (not the
 * wall-clock year). Annual steps ±1 year; monthly steps ±1 month (rolling
 * across years); custom exposes two date inputs.
 */
export default function ViaAPeriodPicker({ value, onChange, journalRange }: ViaAPeriodPickerProps) {
    const currentYear = new Date().getFullYear();
    const latestYear = yearOf(journalRange?.latest, currentYear);

    // Seed the default period to the latest journal year (annual) once, when the
    // journal range becomes known and the user hasn't picked a year in it yet.
    useEffect(() => {
        if (!journalRange?.latest) return;
        const selectedYear = yearOf(value.period_start, latestYear);
        if (selectedYear !== latestYear && value.period_type === 'annual') {
            onChange(annualPeriod(latestYear));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [journalRange?.latest]);

    const selectedYear = yearOf(value.period_start, latestYear);
    const selectedMonth = Number(value.period_start?.slice(5, 7)) || 1;

    const setMode = (mode: ViaAPeriodType) => {
        if (mode === 'annual') onChange(annualPeriod(selectedYear));
        else if (mode === 'monthly') onChange(monthlyPeriod(selectedYear, selectedMonth));
        else onChange({ ...value, period_type: 'custom' });
    };

    const navigate = (dir: -1 | 1) => {
        if (value.period_type === 'annual') onChange(annualPeriod(selectedYear + dir));
        else if (value.period_type === 'monthly')
            onChange(shiftMonth(selectedYear, selectedMonth, dir));
    };

    const navLabel =
        value.period_type === 'annual'
            ? String(selectedYear)
            : `${MONTHS[selectedMonth - 1]} ${selectedYear}`;

    const arrowSx = {
        color: palette.paper,
        '&:hover': { color: ACCENT },
        transition: `color ${motion.duration.md} ${motion.snap}`,
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Mode toggle */}
            <Box sx={{ display: 'flex', gap: 1 }}>
                {MODES.map((m) => {
                    const active = value.period_type === m.value;
                    return (
                        <Box
                            key={m.value}
                            component="button"
                            type="button"
                            onClick={() => setMode(m.value)}
                            aria-pressed={active}
                            sx={{
                                cursor: 'pointer',
                                fontFamily: fonts.mono,
                                fontSize: '0.72rem',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                px: 1.5,
                                py: 0.75,
                                bgcolor: active ? ACCENT : 'transparent',
                                color: active ? palette.ink : palette.paperMuted,
                                border: `1px solid ${active ? ACCENT : hexAlpha(palette.paper, 0.2)}`,
                                transition: 'all 0.2s cubic-bezier(0.2,0.9,0.3,1)',
                                '&:hover': {
                                    borderColor: ACCENT,
                                    color: active ? palette.ink : palette.paper,
                                },
                            }}
                        >
                            {m.label}
                        </Box>
                    );
                })}
            </Box>

            {/* Annual / monthly → prev/next navigator. Custom → date inputs. */}
            {value.period_type !== 'custom' ? (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        border: `1px solid ${palette.line}`,
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                        width: 'fit-content',
                    }}
                >
                    <IconButton
                        size="small"
                        onClick={() => navigate(-1)}
                        aria-label={
                            value.period_type === 'annual' ? 'Año anterior' : 'Mes anterior'
                        }
                        sx={arrowSx}
                    >
                        <ChevronLeft />
                    </IconButton>
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.9rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: palette.paper,
                            minWidth: 140,
                            textAlign: 'center',
                        }}
                    >
                        {navLabel}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={() => navigate(1)}
                        aria-label={
                            value.period_type === 'annual' ? 'Año siguiente' : 'Mes siguiente'
                        }
                        sx={arrowSx}
                    >
                        <ChevronRight />
                    </IconButton>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <TextField
                        type="date"
                        size="small"
                        label="Inicio"
                        InputLabelProps={{ shrink: true }}
                        value={value.period_start}
                        onChange={(e) =>
                            onChange({
                                ...value,
                                period_type: 'custom',
                                period_start: e.target.value,
                            })
                        }
                        inputProps={{ 'aria-label': 'Inicio del rango' }}
                        sx={{
                            '& input': {
                                fontFamily: fonts.mono,
                                fontSize: '0.8rem',
                                color: palette.paper,
                                colorScheme: 'dark',
                            },
                        }}
                    />
                    <Typography sx={{ color: palette.paperMuted }}>→</Typography>
                    <TextField
                        type="date"
                        size="small"
                        label="Fin"
                        InputLabelProps={{ shrink: true }}
                        value={value.period_end}
                        onChange={(e) =>
                            onChange({
                                ...value,
                                period_type: 'custom',
                                period_end: e.target.value,
                            })
                        }
                        inputProps={{ 'aria-label': 'Fin del rango' }}
                        sx={{
                            '& input': {
                                fontFamily: fonts.mono,
                                fontSize: '0.8rem',
                                color: palette.paper,
                                colorScheme: 'dark',
                            },
                        }}
                    />
                </Box>
            )}

            <Typography
                sx={{ fontFamily: fonts.mono, fontSize: '0.7rem', color: palette.paperFaint }}
            >
                {`// PERÍODO: ${value.period_start} → ${value.period_end}`}
            </Typography>
        </Box>
    );
}
