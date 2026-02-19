'use client';

import DataTable, { Column } from '@/components/common/DataTable';
import MoneyDisplay from '@/components/common/MoneyDisplay';
import { BookEntry } from '@/types';
import { formatDate } from '@/lib/formatters';
import { Box, Typography, Chip } from '@mui/material';

interface BookTableProps {
    rows: BookEntry[];
    loading?: boolean;
    error?: string | null;
}

export default function BookTable({ rows, loading, error }: BookTableProps) {
    const columns: Column<BookEntry>[] = [
        {
            key: 'fecha',
            label: 'Fecha',
            sortable: true,
            width: 100,
            render: (val) => formatDate(String(val)),
        },
        {
            key: 'documento',
            label: 'Documento',
            width: 100,
            render: (val) => (
                <Chip
                    size="small"
                    label={String(val)}
                    sx={{
                        height: 20,
                        fontSize: '0.68rem',
                        fontFamily: 'monospace',
                        bgcolor: 'rgba(99,102,241,0.1)',
                        color: 'primary.light',
                    }}
                />
            ),
        },
        { key: 'concepto', label: 'Concepto' },
        {
            key: 'cuenta_puc',
            label: 'Cuenta PUC',
            width: 160,
            render: (val, row) => (
                <Box>
                    <Typography variant="caption" fontWeight={700} fontFamily="monospace" display="block">
                        {String(val)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                        {row.nombre_cuenta}
                    </Typography>
                </Box>
            ),
        },
        {
            key: 'debito',
            label: 'Débito',
            align: 'right',
            sortable: true,
            width: 120,
            render: (val) => (Number(val) > 0 ? <MoneyDisplay value={Number(val)} variant="caption" /> : <Typography variant="caption" color="text.disabled">—</Typography>),
        },
        {
            key: 'credito',
            label: 'Crédito',
            align: 'right',
            sortable: true,
            width: 120,
            render: (val) => (Number(val) > 0 ? <MoneyDisplay value={Number(val)} variant="caption" /> : <Typography variant="caption" color="text.disabled">—</Typography>),
        },
        {
            key: 'saldo',
            label: 'Saldo',
            align: 'right',
            sortable: true,
            width: 130,
            render: (val) => <MoneyDisplay value={Number(val)} showSign variant="caption" />,
        },
    ];

    return (
        <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            error={error}
            emptyMessage="No hay registros en este libro"
            rowKey={(_, idx) => idx!}
            stickyHeader
            maxHeight={600}
        />
    );
}
