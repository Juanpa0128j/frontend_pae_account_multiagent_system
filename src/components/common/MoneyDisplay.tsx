'use client';

import { Typography, TypographyProps, Box } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { formatCOP } from '@/lib/formatters';

interface MoneyDisplayProps {
    value: number;
    showSign?: boolean;
    showTrend?: boolean;
    compact?: boolean;
    variant?: TypographyProps['variant'];
    sx?: TypographyProps['sx'];
}

export default function MoneyDisplay({
    value,
    showSign = false,
    showTrend = false,
    compact = false,
    variant = 'body2',
    sx,
}: MoneyDisplayProps) {
    const formatted = formatCOP(value, { showSign, compact });
    const isPositive = value >= 0;
    const isNegative = value < 0;

    const color = showSign
        ? isPositive
            ? 'success.main'
            : 'error.main'
        : 'text.primary';

    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            {showTrend && (
                <>
                    {isPositive ? (
                        <TrendingUp sx={{ fontSize: 14, color: 'success.main' }} />
                    ) : (
                        <TrendingDown sx={{ fontSize: 14, color: 'error.main' }} />
                    )}
                </>
            )}
            <Typography
                variant={variant}
                sx={{
                    fontFamily: '"SF Mono", "Roboto Mono", monospace',
                    fontWeight: 600,
                    color: showSign ? color : isNegative ? 'error.main' : 'text.primary',
                    letterSpacing: '-0.01em',
                    ...sx,
                }}
            >
                {formatted}
            </Typography>
        </Box>
    );
}
