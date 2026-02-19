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
    Paper,
    Typography,
    Skeleton,
    Alert,
} from '@mui/material';
import { TableChart as EmptyIcon } from '@mui/icons-material';

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
            <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 2,
            }}
        >
            <TableContainer sx={{ maxHeight: maxHeight }}>
                <Table stickyHeader={stickyHeader} size="small">
                    <TableHead>
                        <TableRow>
                            {columns.map((col) => (
                                <TableCell
                                    key={String(col.key)}
                                    align={col.align || 'left'}
                                    style={{ width: col.width }}
                                >
                                    {col.sortable ? (
                                        <TableSortLabel
                                            active={orderBy === String(col.key)}
                                            direction={orderBy === String(col.key) ? order : 'asc'}
                                            onClick={() => handleSort(String(col.key))}
                                            sx={{ color: 'inherit !important', '& .MuiSvgIcon-root': { fontSize: 14 } }}
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
                        {loading
                            ? Array.from({ length: defaultRowsPerPage }).map((_, i) => (
                                <TableRow key={i}>
                                    {columns.map((col) => (
                                        <TableCell key={String(col.key)}>
                                            <Skeleton variant="text" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                            : paginatedRows.length === 0
                                ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length}>
                                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                                <EmptyIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {emptyMessage}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )
                                : paginatedRows.map((row, idx) => (
                                    <TableRow
                                        key={rowKey ? rowKey(row, idx) : idx}
                                        onClick={() => onRowClick?.(row)}
                                        sx={{
                                            cursor: onRowClick ? 'pointer' : 'default',
                                        }}
                                    >
                                        {columns.map((col) => {
                                            const val = getValue(row, String(col.key));
                                            return (
                                                <TableCell key={String(col.key)} align={col.align || 'left'}>
                                                    {col.render ? col.render(val, row) : String(val ?? '—')}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
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
                    labelRowsPerPage="Filas:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                    sx={{
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                            fontSize: '0.8rem',
                            color: 'text.secondary',
                        },
                    }}
                />
            )}
        </Paper>
    );
}
