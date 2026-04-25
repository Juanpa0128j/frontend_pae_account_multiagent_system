'use client';

import { Box, Typography, keyframes } from '@mui/material';
import { TransactionStatus } from '@/types';
import { palette, fonts, hexAlpha } from '@/styles/brutalist';

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
`;

const STATUS_CONFIG: Record<
    TransactionStatus,
    { label: string; color: string; pulsing?: boolean }
> = {
    PENDING: { label: 'PENDIENTE', color: palette.amber },
    PROCESSING: { label: 'PROCESANDO', color: palette.accent, pulsing: true },
    POSTED: { label: 'CONTABILIZADA', color: palette.success },
    REJECTED: { label: 'RECHAZADA', color: palette.error },
};

interface StatusBadgeProps {
    status: TransactionStatus | string;
    size?: 'small' | 'medium';
}

export default function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
    const normalizedStatus = String(status || '').toUpperCase() as TransactionStatus;
    const config = STATUS_CONFIG[normalizedStatus] ?? {
        label: normalizedStatus || 'DESCONOCIDO',
        color: palette.paperFaint,
    };

    const dims = size === 'small'
        ? { px: 0.75, py: 0.3, fontSize: '0.6rem', dot: 5 }
        : { px: 1, py: 0.5, fontSize: '0.7rem', dot: 6 };

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                px: dims.px,
                py: dims.py,
                bgcolor: hexAlpha(config.color, 0.1),
                border: `1px solid ${hexAlpha(config.color, 0.35)}`,
                borderRadius: 0.5,
                whiteSpace: 'nowrap',
            }}
        >
            <Box
                sx={{
                    width: dims.dot,
                    height: dims.dot,
                    bgcolor: config.color,
                    borderRadius: '50%',
                    boxShadow: `0 0 6px ${config.color}`,
                    animation: config.pulsing ? `${pulse} 1.5s infinite` : 'none',
                    flexShrink: 0,
                }}
            />
            <Typography
                component="span"
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: dims.fontSize,
                    fontWeight: 700,
                    color: config.color,
                    letterSpacing: '0.15em',
                    lineHeight: 1,
                }}
            >
                {config.label}
            </Typography>
        </Box>
    );
}
