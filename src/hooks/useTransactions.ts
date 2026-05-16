'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getRun,
    getTransactions,
    searchTransactions,
    getTransactionDetail,
    deleteTransaction,
    deleteTransactionsByIngest,
} from '@/lib/api';
import type { TransactionSummary } from '@/types';
import type { TransactionSearchParams } from '@/lib/api';
import { useCompany } from '@/context/CompanyContext';

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

// Track whether the backend actually has the /api/v1/transactions endpoint.
// When it returns 404 we flip this to false so the polling loop stops.
let transactionsEndpointAvailable = true;

// ---------------------------------------------------------------------------
// useTransactions — Fetches transaction list with optional status filter
// Only enabled when a company is selected
// ---------------------------------------------------------------------------
export function useTransactions(status?: TransactionSummary['status']) {
    const { activeNit } = useCompany();
    return useQuery<TransactionSummary[]>({
        queryKey: ['transactions', status, activeNit],
        queryFn: async ({ signal }) => {
            try {
                const data = await getTransactions(status, activeNit!, { signal });
                transactionsEndpointAvailable = true;
                // Map backend shape to TransactionSummary type
                return data.map((t) => ({
                    id: t.id,
                    fecha: t.fecha,
                    concepto: t.concepto,
                    total: t.total,
                    status: String(t.status || '').toUpperCase() as TransactionSummary['status'],
                    nit_emisor: t.nit_emisor,
                    ingest_id: t.ingest_id,
                }));
            } catch {
                // Backend unavailable or endpoint not yet implemented → return empty array
                transactionsEndpointAvailable = false;
                return [];
            }
        },
        staleTime: 5 * 1000,
        enabled: !!activeNit,
        refetchInterval: (query) => {
            if (!transactionsEndpointAvailable) return false;
            const data = query.state.data as TransactionSummary[] | undefined;
            // Fast poll while any transaction is processing, slow poll otherwise
            // so new transactions from other sessions appear without a reload
            if (data?.some((t) => t.status === 'PROCESSING')) return 3000;
            return 8000;
        },
    });
}

// ---------------------------------------------------------------------------
// useSearchTransactions — Search transactions with multiple filters
// ---------------------------------------------------------------------------
export function useSearchTransactions(params: TransactionSearchParams, enabled = true) {
    return useQuery<TransactionSummary[]>({
        queryKey: ['transactions', 'search', params],
        queryFn: async ({ signal }) => {
            try {
                const data = await searchTransactions(params, { signal });
                // Map backend shape to our TransactionSummary type
                return data.map((t) => ({
                    id: t.id,
                    fecha: t.fecha,
                    concepto: t.concepto,
                    total: t.total,
                    status: String(t.status || '').toUpperCase() as TransactionSummary['status'],
                    nit_emisor: t.nit_emisor,
                    ingest_id: t.ingest_id,
                }));
            } catch {
                // Return empty array if search fails
                return [];
            }
        },
        enabled,
        staleTime: 15 * 1000,
    });
}

// ---------------------------------------------------------------------------
// useTransactionDetail — Fetch single transaction detail by ID
// ---------------------------------------------------------------------------
export function useTransactionDetail(id: string | null | undefined, enabled = true) {
    return useQuery({
        queryKey: ['transactions', 'detail', id],
        queryFn: ({ signal }) => getTransactionDetail(id!, { signal }),
        enabled: enabled && !!id,
        staleTime: 15 * 1000,
        retry: false,
    });
}

// ---------------------------------------------------------------------------
// useDeleteTransaction — Delete a single transaction by ID
// ---------------------------------------------------------------------------
export function useDeleteTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
    });
}

// ---------------------------------------------------------------------------
// useDeleteTransactionsByIngest — Delete all transactions from a document
// ---------------------------------------------------------------------------
export function useDeleteTransactionsByIngest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ingestId: string) => deleteTransactionsByIngest(ingestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
    });
}
