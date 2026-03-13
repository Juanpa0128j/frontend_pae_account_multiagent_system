'use client';

import { useQuery } from '@tanstack/react-query';
import { getRun, getTransactions, searchTransactions, getTransactionDetail } from '@/lib/api';
import type { TransactionSummary } from '@/types';
import type { TransactionSearchParams } from '@/lib/api';

// Re-export for convenience
export type { TransactionSummary };

// ---------------------------------------------------------------------------
// useEvaluationRun — Trigger the evaluation pipeline
// ---------------------------------------------------------------------------
export function useEvaluationRun(enabled = false) {
    return useQuery({
        queryKey: ['evaluation', 'run'],
        queryFn: getRun,
        enabled,
        staleTime: 0,
    });
}

// ---------------------------------------------------------------------------
// Fallback mock data shown when the backend is unreachable
// ---------------------------------------------------------------------------
const MOCK_TRANSACTIONS: TransactionSummary[] = [
    { id: '1042', fecha: '2026-02-15', concepto: 'Factura Proveedor XYZ', total: 1500000, status: 'POSTED', nit_emisor: '900.123.456-1' },
    { id: '1041', fecha: '2026-02-14', concepto: 'Servicio de consultoría', total: 3200000, status: 'POSTED', nit_emisor: '800.234.567-2' },
    { id: '1040', fecha: '2026-02-13', concepto: 'Compra insumos', total: 750000, status: 'PENDING', nit_emisor: '700.345.678-3' },
    { id: '1039', fecha: '2026-02-12', concepto: 'Factura de arriendo', total: 2100000, status: 'REJECTED', nit_emisor: '600.456.789-4' },
    { id: '1038', fecha: '2026-02-11', concepto: 'Servicios públicos', total: 180000, status: 'PROCESSING', nit_emisor: '500.567.890-5' },
];

// Track whether the backend actually has the /api/v1/transactions endpoint.
// When it returns 404 we flip this to false so the polling loop stops.
let transactionsEndpointAvailable = true;

// ---------------------------------------------------------------------------
// useTransactions — Fetches transaction list with optional status filter
// Falls back to mock data gracefully when the backend is unavailable
// ---------------------------------------------------------------------------
export function useTransactions(status?: TransactionSummary['status']) {
    return useQuery<TransactionSummary[]>({
        queryKey: ['transactions', status],
        queryFn: async () => {
            try {
                const data = await getTransactions(status);
                transactionsEndpointAvailable = true;
                // Map backend shape to our TransactionSummary type
                return data.map((t) => ({
                    id: t.id,
                    fecha: t.fecha,
                    concepto: t.concepto,
                    total: t.total,
                    status: String(t.status || '').toUpperCase() as TransactionSummary['status'],
                    nit_emisor: t.nit_emisor,
                }));
            } catch {
                // Backend unavailable or endpoint not yet implemented → use mock data.
                // Also disable polling so we don't spam the server with 404s.
                transactionsEndpointAvailable = false;
                const filtered = status ? MOCK_TRANSACTIONS.filter((t) => t.status === status) : MOCK_TRANSACTIONS;
                return filtered;
            }
        },
        staleTime: 3 * 1000,
        refetchInterval: (query) => {
            // Only poll if the endpoint exists AND there are rows still processing
            if (!transactionsEndpointAvailable) return false;
            const data = query.state.data as TransactionSummary[] | undefined;
            if (data?.some((t) => t.status === 'PROCESSING')) return 3000;
            return false;
        },
    });
}

// ---------------------------------------------------------------------------
// useSearchTransactions — Search transactions with multiple filters
// ---------------------------------------------------------------------------
export function useSearchTransactions(
    params: TransactionSearchParams,
    enabled = true
) {
    return useQuery<TransactionSummary[]>({
        queryKey: ['transactions', 'search', params],
        queryFn: async () => {
            try {
                const data = await searchTransactions(params);
                // Map backend shape to our TransactionSummary type
                return data.map((t) => ({
                    id: t.id,
                    fecha: t.fecha,
                    concepto: t.concepto,
                    total: t.total,
                    status: String(t.status || '').toUpperCase() as TransactionSummary['status'],
                    nit_emisor: t.nit_emisor,
                }));
            } catch {
                // Return empty array if search fails
                return [];
            }
        },
        enabled,
        staleTime: 5 * 1000,
    });
}

// ---------------------------------------------------------------------------
// useTransactionDetail — Fetch single transaction detail by ID
// ---------------------------------------------------------------------------
export function useTransactionDetail(id: string | null | undefined, enabled = true) {
    return useQuery({
        queryKey: ['transactions', 'detail', id],
        queryFn: () => getTransactionDetail(id!),
        enabled: enabled && !!id,
        staleTime: 5 * 1000,
        retry: false,
    });
}
