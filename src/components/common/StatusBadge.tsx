'use client';

import { Chip, ChipProps } from '@mui/material';
import {
    HourglassEmpty as PendingIcon,
    Sync as ProcessingIcon,
    CheckCircle as PostedIcon,
    Cancel as RejectedIcon,
} from '@mui/icons-material';
import { TransactionStatus } from '@/types';

const STATUS_CONFIG: Record<
    TransactionStatus,
    { label: string; color: ChipProps['color']; icon: React.ReactElement; bgColor: string; borderColor: string }
> = {
    PENDING: {
        label: 'Pendiente',
        color: 'warning',
        icon: <PendingIcon sx={{ fontSize: '14px !important' }} />,
        bgColor: 'rgba(245,158,11,0.12)',
        borderColor: 'rgba(245,158,11,0.3)',
    },
    PROCESSING: {
        label: 'Procesando',
        color: 'info',
        icon: <ProcessingIcon sx={{ fontSize: '14px !important', animation: 'spin 1.5s linear infinite' }} />,
        bgColor: 'rgba(59,130,246,0.12)',
        borderColor: 'rgba(59,130,246,0.3)',
    },
    POSTED: {
        label: 'Contabilizada',
        color: 'success',
        icon: <PostedIcon sx={{ fontSize: '14px !important' }} />,
        bgColor: 'rgba(16,185,129,0.12)',
        borderColor: 'rgba(16,185,129,0.3)',
    },
    REJECTED: {
        label: 'Rechazada',
        color: 'error',
        icon: <RejectedIcon sx={{ fontSize: '14px !important' }} />,
        bgColor: 'rgba(239,68,68,0.12)',
        borderColor: 'rgba(239,68,68,0.3)',
    },
};

interface StatusBadgeProps {
    status: TransactionStatus | string;
    size?: 'small' | 'medium';
}

export default function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
    const normalizedStatus = String(status || '').toUpperCase() as TransactionStatus;
    const config = STATUS_CONFIG[normalizedStatus] || {
        label: normalizedStatus || 'Desconocido',
        color: 'default' as ChipProps['color'],
        icon: <PendingIcon sx={{ fontSize: '14px !important' }} />,
        bgColor: 'rgba(148,163,184,0.12)',
        borderColor: 'rgba(148,163,184,0.3)',
    };

    return (
        <>
            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
            <Chip
                size={size}
                label={config.label}
                icon={config.icon}
                sx={{
                    bgcolor: config.bgColor,
                    border: `1px solid ${config.borderColor}`,
                    color: `${config.color}.main`,
                    fontWeight: 600,
                    fontSize: size === 'small' ? '0.72rem' : '0.8rem',
                    height: size === 'small' ? 24 : 28,
                    '& .MuiChip-icon': { ml: 0.5, color: 'inherit' },
                }}
            />
        </>
    );
}
