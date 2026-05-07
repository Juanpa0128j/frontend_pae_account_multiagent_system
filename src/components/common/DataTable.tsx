'use client';

import React from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TableSortLabel,
    Typography,
    Skeleton,
    Alert,
} from '@mui/material';
import { palette, fonts, motion, sxLabel, sxLabelSmall, hexAlpha } from '@/styles/brutalist';

export interface Column<T> {
    key: keyof T | string;
    label: string;
    align?: 'left' | 'right' | 'center';
    width?: number | string;
    sortable?: boolean;
    render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T extends object> {
    columns: Column<T>[];
    rows: T[];
    loading?: boolean;
    error?: string | null;
    emptyMessage?: string;
    rowKey?: (row: T, index: number) => string | number;
    onRowClick?: (row: T) => void;
    pagination?: boolean;
    rowsPerPageOptions?: number[];
    defaultRowsPerPage?: number;
    stickyHeader?: boolean;
    maxHeight?: number | string;
    /** Accent color for hover/sort indicators */
    accent?: string;
}

type Order = 'asc' | 'desc';

function getValue<T>(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
}

export default function DataTable<T extends object>({
    columns,
    rows,
    loading = false,
    error = null,
    emptyMessage = 'Sin datos disponibles',
    rowKey,
    onRowClick,
    pagination = true,
    rowsPerPageOptions = [10, 25, 50],
    defaultRowsPerPage = 10,
    stickyHeader = false,
    maxHeight,
    accent = palette.accent,
}: DataTableProps<T>) {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(defaultRowsPerPage);
    const [orderBy, setOrderBy] = React.useState<string>('');
    const [order, setOrder] = React.useState<Order>('asc');

    const handleSort = (key: string) => {
        const isAsc = orderBy === key && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(key);
    };

    const sortedRows = React.useMemo(() => {
        if (!orderBy) return rows;
        return [...rows].sort((a, b) => {
            const aVal = getValue(a, orderBy);
            const bVal = getValue(b, orderBy);
            if (aVal === bVal) return 0;
            const cmp = aVal! < bVal! ? -1 : 1;
            return order === 'asc' ? cmp : -cmp;
        });
    }, [rows, orderBy, order]);

    const paginatedRows = pagination
        ? sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        : sortedRows;

    if (error) {
        return (
            <Alert
                severity="error"
                sx={{
                    bgcolor: hexAlpha(palette.error, 0.08),
                    border: `1px solid ${hexAlpha(palette.error, 0.3)}`,
                    color: palette.paper,
                    borderRadius: 2,
                    fontFamily: fonts.body,
                    '& .MuiAlert-icon': { color: palette.error },
                }}
            >
                {error}
            </Alert>
        );
    }

    return (
        <Box
            sx={{
                overflow: 'hidden',
                border: `1px solid ${palette.line}`,
                borderRadius: 2,
                bgcolor: 'transparent',
            }}
        >
            <TableContainer sx={{ maxHeight }}>
                <Table stickyHeader={stickyHeader} size="small">
                    <TableHead>
                        <TableRow
                            sx={{
                                '& th': {
                                    bgcolor: hexAlpha(palette.ink, 0.6),
                                    borderBottom: `1px solid ${palette.line}`,
                                    backdropFilter: stickyHeader ? 'blur(8px)' : undefined,
                                },
                            }}
                        >
                            {columns.map((col) => (
                                <TableCell
                                    key={String(col.key)}
                                    align={col.align || 'left'}
                                    style={{ width: col.width }}
                                    sx={{
                                        ...sxLabelSmall,
                                        color: palette.paperFaint,
                                        py: 1.5,
                                        fontWeight: 700,
                                    }}
                                >
                                    {col.sortable ? (
                                        <TableSortLabel
                                            active={orderBy === String(col.key)}
                                            direction={orderBy === String(col.key) ? order : 'asc'}
                                            onClick={() => handleSort(String(col.key))}
                                            sx={{
                                                color: 'inherit !important',
                                                fontFamily: fonts.mono,
                                                letterSpacing: '0.2em',
                                                '& .MuiSvgIcon-root': {
                                                    fontSize: 14,
                                                    color:
                                                        orderBy === String(col.key)
                                                            ? `${accent} !important`
                                                            : 'inherit',
                                                },
                                                '&:hover': { color: `${accent} !important` },
                                                '&.Mui-active': { color: `${accent} !important` },
                                            }}
                                        >
                                            {col.label}
                                        </TableSortLabel>
                                    ) : (
                                        col.label
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: defaultRowsPerPage }).map((_, i) => (
                                <TableRow key={i}>
                                    {columns.map((col) => (
                                        <TableCell
                                            key={String(col.key)}
                                            sx={{ borderBottom: `1px solid ${palette.lineFaint}` }}
                                        >
                                            <Skeleton
                                                variant="text"
                                                height={20}
                                                sx={{ bgcolor: 'rgba(255,255,255,0.04)' }}
                                            />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : paginatedRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} sx={{ borderBottom: 'none' }}>
                                    <Box sx={{ py: 6, textAlign: 'left', px: 2 }}>
                                        <Typography
                                            sx={{ ...sxLabel, color: palette.paperGhost, mb: 1 }}
                                        >
                                            {'// SIN REGISTROS'}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.display,
                                                fontSize: '1.4rem',
                                                fontWeight: 700,
                                                color: palette.paperFaint,
                                                letterSpacing: '-0.02em',
                                            }}
                                        >
                                            {emptyMessage}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedRows.map((row, idx) => (
                                <TableRow
                                    key={rowKey ? rowKey(row, idx) : idx}
                                    onClick={() => onRowClick?.(row)}
                                    sx={{
                                        cursor: onRowClick ? 'pointer' : 'default',
                                        position: 'relative',
                                        transition: `all ${motion.duration.sm} ${motion.snap}`,
                                        '& td': {
                                            borderBottom: `1px solid ${palette.lineFaint}`,
                                            fontFamily: fonts.body,
                                            fontSize: '0.85rem',
                                            color: palette.paperDim,
                                            py: 1.25,
                                            transition: `all ${motion.duration.sm} ${motion.snap}`,
                                        },
                                        '&:hover td': onRowClick
                                            ? {
                                                  bgcolor: hexAlpha(accent, 0.04),
                                                  color: palette.paper,
                                              }
                                            : {},
                                        '&:hover td:first-of-type': onRowClick
                                            ? {
                                                  borderLeft: `2px solid ${accent}`,
                                                  pl: 1.5,
                                              }
                                            : {},
                                        '& td:first-of-type': {
                                            borderLeft: '2px solid transparent',
                                            transition: `border-color ${motion.duration.sm} ${motion.snap}`,
                                        },
                                    }}
                                >
                                    {columns.map((col) => {
                                        const val = getValue(row, String(col.key));
                                        return (
                                            <TableCell
                                                key={String(col.key)}
                                                align={col.align || 'left'}
                                            >
                                                {col.render
                                                    ? col.render(val, row)
                                                    : String(val ?? '—')}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {pagination && rows.length > 0 && (
                <TablePagination
                    rowsPerPageOptions={rowsPerPageOptions}
                    component="div"
                    count={rows.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    labelRowsPerPage="Filas /"
                    labelDisplayedRows={({ from, to, count }) =>
                        `${String(from).padStart(2, '0')} → ${String(to).padStart(2, '0')} / ${String(count).padStart(2, '0')}`
                    }
                    sx={{
                        borderTop: `1px solid ${palette.line}`,
                        bgcolor: hexAlpha(palette.ink, 0.4),
                        '& .MuiTablePagination-toolbar': { minHeight: 44 },
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                            fontFamily: fonts.mono,
                            fontSize: '0.7rem',
                            color: palette.paperFaint,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                        },
                        '& .MuiSelect-select': {
                            fontFamily: fonts.mono,
                            fontSize: '0.75rem',
                            color: palette.paper,
                            letterSpacing: '0.1em',
                        },
                        '& .MuiIconButton-root': {
                            color: palette.paperFaint,
                            '&:hover': { color: accent, bgcolor: hexAlpha(accent, 0.08) },
                            '&.Mui-disabled': { color: palette.paperGhost },
                        },
                    }}
                />
            )}
        </Box>
    );
}
