'use client';

import { useRouter } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import DataTable, { Column } from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import MoneyDisplay from '@/components/common/MoneyDisplay';
import { formatDate, formatNIT } from '@/lib/formatters';
import { TransactionSummary } from '@/hooks/useTransactions';
import { TransactionStatus } from '@/types';
import { palette, fonts, hexAlpha, moduleAccents } from '@/styles/brutalist';

interface TransactionTableProps {
    rows: TransactionSummary[];
    loading?: boolean;
    error?: string | null;
}

export default function TransactionTable({ rows, loading, error }: TransactionTableProps) {
    const router = useRouter();
    const ACCENT = moduleAccents.transactions;

    const columns: Column<TransactionSummary>[] = [
        {
            key: 'id',
            label: '# Tx',
            width: 110,
            render: (val) => (
                <Box
                    component="span"
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: ACCENT,
                        bgcolor: hexAlpha(ACCENT, 0.1),
                        border: `1px solid ${hexAlpha(ACCENT, 0.25)}`,
                        px: 0.75,
                        py: 0.3,
                        borderRadius: 0.5,
                        letterSpacing: '0.05em',
                    }}
                >
                    {String(val).slice(0, 10)}…
                </Box>
            ),
        },
        {
            key: 'fecha',
            label: 'Fecha',
            sortable: true,
            width: 110,
            hideOnMobile: true,
            render: (val) => (
                <Typography
                    component="span"
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.78rem',
                        color: palette.paperDim,
                        letterSpacing: '0.02em',
                    }}
                >
                    {formatDate(String(val))}
                </Typography>
            ),
        },
        {
            key: 'concepto',
            label: 'Concepto',
            render: (val) => (
                <Typography
                    component="span"
                    sx={{
                        fontFamily: fonts.body,
                        fontSize: '0.88rem',
                        fontWeight: 500,
                        color: palette.paper,
                        maxWidth: 280,
                        display: 'inline-block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'middle',
                    }}
                >
                    {String(val) || '—'}
                </Typography>
            ),
        },
        {
            key: 'nit_emisor',
            label: 'NIT Emisor',
            width: 150,
            hideOnMobile: true,
            render: (val) => (
                <Typography
                    component="span"
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.75rem',
                        color: palette.paperFaint,
                        letterSpacing: '0.05em',
                    }}
                >
                    {formatNIT(String(val))}
                </Typography>
            ),
        },
        {
            key: 'total',
            label: 'Total',
            align: 'right',
            sortable: true,
            width: 140,
            render: (val) => <MoneyDisplay value={Number(val)} variant="caption" />,
        },
        {
            key: 'status',
            label: 'Estado',
            width: 150,
            render: (val) => <StatusBadge status={val as TransactionStatus} />,
        },
        {
            key: 'id',
            label: '',
            width: 36,
            align: 'right',
            render: (_val, row) => (
                <Box
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/transactions/${row.id}`);
                    }}
                    sx={{
                        color: palette.paperGhost,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 26,
                        height: 26,
                        '&:hover': { color: ACCENT, bgcolor: hexAlpha(ACCENT, 0.08) },
                    }}
                >
                    <ViewIcon fontSize="small" />
                </Box>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            error={error}
            emptyMessage="No hay transacciones en este estado"
            rowKey={(row) => row.id}
            onRowClick={(row) => router.push(`/transactions/${row.id}`)}
            rowsPerPageOptions={[10, 25, 50]}
            defaultRowsPerPage={10}
            accent={ACCENT}
        />
    );
}
