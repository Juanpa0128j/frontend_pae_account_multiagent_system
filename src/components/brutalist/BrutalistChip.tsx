'use client';

import { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { palette, fonts, sxLabel, hexAlpha } from '@/styles/brutalist';

interface BrutalistChipProps {
    label: string;
    /** Color theme — defaults to accent indigo */
    color?: string;
    /** Variant: outlined (default), filled, ghost */
    variant?: 'outlined' | 'filled' | 'ghost';
    /** Show the // prefix (default: true) */
    monoPrefix?: boolean;
    /** Optional leading icon */
    icon?: ReactNode;
    /** Size: sm | md */
    size?: 'sm' | 'md';
}

export default function BrutalistChip({
    label,
    color = palette.accent,
    variant = 'outlined',
    monoPrefix = true,
    icon,
    size = 'md',
}: BrutalistChipProps) {
    const styles = {
        outlined: {
            border: `1px solid ${hexAlpha(color, 0.4)}`,
            bgcolor: 'transparent',
            color,
        },
        filled: {
            border: 'none',
            bgcolor: color,
            color: palette.ink,
        },
        ghost: {
            border: 'none',
            bgcolor: hexAlpha(color, 0.1),
            color,
        },
    }[variant];

    const dims =
        size === 'sm'
            ? { py: 0.25, px: 0.75, fontSize: '0.62rem' }
            : { py: 0.5, px: 1, fontSize: '0.7rem' };

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                borderRadius: 0.75,
                ...styles,
                ...dims,
                lineHeight: 1,
                fontFamily: fonts.mono,
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
            }}
        >
            {icon && <Box sx={{ display: 'flex', alignItems: 'center' }}>{icon}</Box>}
            <Typography
                component="span"
                sx={{
                    ...sxLabel,
                    fontSize: 'inherit',
                    letterSpacing: '0.15em',
                    color: 'inherit',
                    fontWeight: 600,
                }}
            >
                {monoPrefix && '// '}
                {label}
            </Typography>
        </Box>
    );
}
