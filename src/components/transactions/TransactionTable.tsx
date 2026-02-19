'use client';

import { useRouter } from 'next/navigation';
import { Box, Chip } from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import DataTable, { Column } from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import MoneyDisplay from '@/components/common/MoneyDisplay';
import { formatDate, formatNIT } from '@/lib/formatters';
import { TransactionSummary } from '@/hooks/useTransactions';
import { TransactionStatus } from '@/types';

interface TransactionTableProps {
    rows: TransactionSummary[];
    loading?: boolean;
    error?: string | null;
}

export default function TransactionTable({ rows, loading, error }: TransactionTableProps) {
    const router = useRouter();

    const columns: Column<TransactionSummary>[] = [
        {
            key: 'id',
            label: '# Tx',
            width: 80,
            render: (val) => (
                <Chip
                    size="small"
                    label={`#${val}`}
                    sx={{
                        height: 20,
                        fontSize: '0.68rem',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        bgcolor: 'rgba(99,102,241,0.12)',
                        color: 'primary.light',
                    }}
                />
            ),
        },
        {
            key: 'fecha',
            label: 'Fecha',
            sortable: true,
            width: 110,
            render: (val) => formatDate(String(val)),
        },
        {
            key: 'concepto',
            label: 'Concepto',
            render: (val) => (
                <Box
                    sx={{
                        maxWidth: 260,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.85rem',
                        color: 'text.primary',
                        fontWeight: 500,
                    }}
                >
                    {String(val)}
                </Box>
            ),
        },
        {
            key: 'nit_emisor',
            label: 'NIT Emisor',
            width: 140,
            render: (val) => (
                <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'text.secondary' }}>
                    {formatNIT(String(val))}
                </Box>
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
            width: 130,
            render: (val) => <StatusBadge status={val as TransactionStatus} />,
        },
        {
            key: 'id',
            label: '',
            width: 36,
            render: (_val, row) => (
                <Box
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/transactions/${row.id}`);
                    }}
                    sx={{
                        color: 'text.disabled',
                        cursor: 'pointer',
                        display: 'flex',
                        '&:hover': { color: 'primary.main' },
                        transition: 'color 0.15s',
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
        />
    );
}
