'use client';

import { useState, useCallback } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight, CalendarToday } from '@mui/icons-material';
import { fonts, palette, motion, sxLabelSmall } from '@/styles/brutalist';
import { toLocalYMD, parseLocalYMD } from '@/lib/formatters';

export type PeriodType = 'month' | 'bimestre' | 'year' | 'custom';

interface PeriodSelectorProps {
    value: {
        startDate: string;
        endDate: string;
        periodType: PeriodType;
    };
    onChange: (value: { startDate: string; endDate: string; periodType: PeriodType }) => void;
    showBimestre?: boolean;
}

const PERIOD_OPTIONS: { label: string; value: PeriodType }[] = [
    { label: 'Este mes', value: 'month' },
    { label: 'Este bimestre', value: 'bimestre' },
    { label: 'Este año', value: 'year' },
];

function getPeriodLabel(periodType: PeriodType, startDate: string, endDate: string): string {
    const start = parseLocalYMD(startDate);
    const end = parseLocalYMD(endDate);
    const monthNames = [
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

    switch (periodType) {
        case 'month':
            return `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
        case 'bimestre': {
            const bimestreNum = Math.floor(start.getMonth() / 2) + 1;
            return `Bimestre ${bimestreNum} ${start.getFullYear()}`;
        }
        case 'year':
            return `${start.getFullYear()}`;
        case 'custom':
            return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
        default:
            return '';
    }
}

function calculatePeriod(
    periodType: PeriodType,
    direction: 'current' | 'prev' | 'next' = 'current'
): { startDate: string; endDate: string } {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (direction === 'prev') {
        now.setMonth(now.getMonth() - 1);
    } else if (direction === 'next') {
        now.setMonth(now.getMonth() + 1);
    }

    switch (periodType) {
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'bimestre': {
            const bimestreStart = Math.floor(now.getMonth() / 2) * 2;
            start = new Date(now.getFullYear(), bimestreStart, 1);
            end = new Date(now.getFullYear(), bimestreStart + 2, 0);
            break;
        }
        case 'year':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
            break;
        default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return {
        startDate: toLocalYMD(start),
        endDate: toLocalYMD(end),
    };
}

export default function PeriodSelector({
    value,
    onChange,
    showBimestre = true,
}: PeriodSelectorProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handlePeriodChange = useCallback(
        (periodType: PeriodType) => {
            const dates = calculatePeriod(periodType, 'current');
            onChange({
                ...dates,
                periodType,
            });
            setAnchorEl(null);
        },
        [onChange]
    );

    const handleNavigate = useCallback(
        (direction: 'prev' | 'next') => {
            const sign = direction === 'prev' ? -1 : 1;
            // Parse as LOCAL so the day/month don't shift in UTC-5, then rebuild
            // both ends from day 1 / day 0 so we never trip day-of-month overflow
            // (e.g. setMonth on Jan 31 → Mar 3). This kept the period drifting.
            const start = parseLocalYMD(value.startDate);
            const year = start.getFullYear();
            const month = start.getMonth();

            let newStart: Date;
            let newEnd: Date;

            if (value.periodType === 'year') {
                newStart = new Date(year + sign, 0, 1);
                newEnd = new Date(year + sign, 11, 31);
            } else {
                const span = value.periodType === 'bimestre' ? 2 : 1;
                newStart = new Date(year, month + sign * span, 1);
                newEnd = new Date(year, month + sign * span + span, 0);
            }

            onChange({
                startDate: toLocalYMD(newStart),
                endDate: toLocalYMD(newEnd),
                periodType: value.periodType,
            });
        },
        [value, onChange]
    );

    const periodLabel = getPeriodLabel(value.periodType, value.startDate, value.endDate);
    const options = showBimestre
        ? PERIOD_OPTIONS
        : PERIOD_OPTIONS.filter((o) => o.value !== 'bimestre');

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                border: `1px solid ${palette.line}`,
                borderRadius: 1,
                bgcolor: 'transparent',
            }}
        >
            {/* Navigation arrows */}
            <IconButton
                size="small"
                onClick={() => handleNavigate('prev')}
                sx={{
                    color: palette.paper,
                    '&:hover': { color: palette.accent },
                    transition: `color ${motion.duration.md} ${motion.snap}`,
                }}
            >
                <ChevronLeft />
            </IconButton>

            {/* Period display with menu */}
            <Button
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                    minWidth: 160,
                    color: palette.paper,
                    fontFamily: fonts.mono,
                    fontSize: '0.85rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.05)',
                    },
                }}
                startIcon={<CalendarToday sx={{ fontSize: 16 }} />}
            >
                {periodLabel}
            </Button>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                    sx: {
                        bgcolor: palette.ink,
                        border: `1px solid ${palette.line}`,
                        '& .MuiMenuItem-root': {
                            fontFamily: fonts.mono,
                            fontSize: '0.8rem',
                            letterSpacing: '0.05em',
                            color: palette.paper,
                            '&:hover': {
                                bgcolor: 'rgba(99, 102, 241, 0.1)',
                            },
                        },
                    },
                }}
            >
                {options.map((option) => (
                    <MenuItem
                        key={option.value}
                        onClick={() => handlePeriodChange(option.value)}
                        selected={value.periodType === option.value}
                    >
                        {option.label}
                    </MenuItem>
                ))}
            </Menu>

            {/* Next arrow */}
            <IconButton
                size="small"
                onClick={() => handleNavigate('next')}
                sx={{
                    color: palette.paper,
                    '&:hover': { color: palette.accent },
                    transition: `color ${motion.duration.md} ${motion.snap}`,
                }}
            >
                <ChevronRight />
            </IconButton>

            {/* Date range label */}
            <Typography
                sx={{
                    ...sxLabelSmall,
                    ml: 2,
                    color: palette.paperMuted,
                    display: { xs: 'none', sm: 'block' },
                }}
            >
                {value.startDate} → {value.endDate}
            </Typography>
        </Box>
    );
}
