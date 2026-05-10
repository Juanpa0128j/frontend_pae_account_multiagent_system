'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/clients';
import type { TransactionSummary } from '@/types';
import type {
    TransactionSearchParams,
    RunResponse,
    TransactionListItem,
    TransactionDetailResponse,
} from '@/types/api';
import { useCompany } from '@/context/CompanyContext';

// Re-export for convenience
export type { TransactionSummary };

const getRun = async (): Promise<RunResponse> => {
    const response = await apiClient.get<RunResponse>('/api/v1/evaluation/run');
    return response.data;
};

const getTransactions = async (
    status?: string,
    company_nit?: string,
    options?: { signal?: AbortSignal }
): Promise<TransactionListItem[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (company_nit) params.company_nit = company_nit;
    const response = await apiClient.get<TransactionListItem[]>('/api/v1/transactions', {
        params: Object.keys(params).length ? params : undefined,
        signal: options?.signal,
    });
    return response.data;
};

const searchTransactions = async (
    params: TransactionSearchParams,
    options?: { signal?: AbortSignal }
): Promise<TransactionListItem[]> => {
    const response = await apiClient.get<TransactionListItem[]>('/api/v1/transactions/search', {
        params,
        signal: options?.signal,
    });
    return response.data;
};

const getTransactionDetail = async (
    id: string,
    options?: { signal?: AbortSignal }
): Promise<TransactionDetailResponse> => {
    const response = await apiClient.get<TransactionDetailResponse>(`/api/v1/transactions/${id}`, {
        signal: options?.signal,
    });
    return response.data;
};

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
        staleTime: 15 * 1000,
        enabled: !!activeNit,
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
