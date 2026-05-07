'use client';

import DataTable, { Column } from '@/components/common/DataTable';
import MoneyDisplay from '@/components/common/MoneyDisplay';
import { BookEntry } from '@/types';
import { formatDate } from '@/lib/formatters';
import { Box, Typography } from '@mui/material';
import { palette, fonts, hexAlpha, moduleAccents } from '@/styles/brutalist';

interface BookTableProps {
    rows: BookEntry[];
    loading?: boolean;
    error?: string | null;
}

export default function BookTable({ rows, loading, error }: BookTableProps) {
    const ACCENT = moduleAccents.books;

    const columns: Column<BookEntry>[] = [
        {
            key: 'fecha',
            label: 'Fecha',
            sortable: true,
            width: 110,
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
            key: 'documento',
            label: 'Documento',
            width: 110,
            render: (val) => {
                const text = String(val ?? '').trim();
                if (!text)
                    return (
                        <Typography component="span" sx={{ color: palette.paperGhost }}>
                            —
                        </Typography>
                    );
                return (
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
                        {text}
                    </Box>
                );
            },
        },
        {
            key: 'concepto',
            label: 'Concepto',
            render: (val) => (
                <Typography
                    component="span"
                    sx={{
                        fontFamily: fonts.body,
                        fontSize: '0.85rem',
                        color: palette.paper,
                    }}
                >
                    {String(val) || '—'}
                </Typography>
            ),
        },
        {
            key: 'cuenta_puc',
            label: 'Cuenta PUC',
            width: 180,
            render: (val, row) => (
                <Box>
                    <Typography
                        component="span"
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: palette.paper,
                            letterSpacing: '0.05em',
                        }}
                    >
                        {String(val)}
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: fonts.body,
                            fontSize: '0.72rem',
                            color: palette.paperFaint,
                            display: 'block',
                            mt: 0.25,
                        }}
                    >
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
            width: 130,
            render: (val) =>
                Number(val) > 0 ? (
                    <Typography
                        component="span"
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: palette.success,
                        }}
                    >
                        <MoneyDisplay value={Number(val)} variant="caption" />
                    </Typography>
                ) : (
                    <Typography
                        component="span"
                        sx={{ color: palette.paperGhost, fontFamily: fonts.mono }}
                    >
                        —
                    </Typography>
                ),
        },
        {
            key: 'credito',
            label: 'Crédito',
            align: 'right',
            sortable: true,
            width: 130,
            render: (val) =>
                Number(val) > 0 ? (
                    <Typography
                        component="span"
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: palette.error,
                        }}
                    >
                        <MoneyDisplay value={Number(val)} variant="caption" />
                    </Typography>
                ) : (
                    <Typography
                        component="span"
                        sx={{ color: palette.paperGhost, fontFamily: fonts.mono }}
                    >
                        —
                    </Typography>
                ),
        },
        {
            key: 'saldo',
            label: 'Saldo',
            align: 'right',
            sortable: true,
            width: 140,
            render: (val) => (
                <Box
                    component="span"
                    sx={{
                        fontFamily: fonts.mono,
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: Number(val) >= 0 ? palette.success : palette.error,
                    }}
                >
                    <MoneyDisplay value={Number(val)} showSign variant="caption" />
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
            emptyMessage="No hay registros en este libro"
            rowKey={(_, idx) => idx!}
            stickyHeader
            maxHeight={600}
            accent={ACCENT}
        />
    );
}
