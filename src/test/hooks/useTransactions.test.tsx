import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTransactions } from '@/hooks/useTransactions';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockGetTransactions = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/clients', () => ({
    reportApiClient: {
        getTransactions: mockGetTransactions,
    },
    evaluationApiClient: {},
    processApiClient: {},
}));

vi.mock('@/context/CompanyContext', () => ({
    useCompany: () => ({ activeNit: '800999888' }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useTransactions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetTransactions.mockResolvedValue([]);
    });

    it('does not pass a limit by default (full list for the transactions page)', async () => {
        renderHook(() => useTransactions(), { wrapper });
        await waitFor(() => expect(mockGetTransactions).toHaveBeenCalled());
        expect(mockGetTransactions).toHaveBeenCalledWith(
            undefined,
            '800999888',
            expect.objectContaining({ limit: undefined })
        );
    });

    it('passes limit=6 through to the client when requested by the dashboard', async () => {
        renderHook(() => useTransactions(undefined, { limit: 6 }), { wrapper });
        await waitFor(() => expect(mockGetTransactions).toHaveBeenCalled());
        expect(mockGetTransactions).toHaveBeenCalledWith(
            undefined,
            '800999888',
            expect.objectContaining({ limit: 6 })
        );
    });

    it('keeps limited and full queries independent via distinct cache keys', async () => {
        // Both consumers share one QueryClient (one provider) but must hit the
        // network separately because `limit` is part of the query key.
        mockGetTransactions.mockImplementation(async (_status, _nit, opts) =>
            opts?.limit === 6
                ? [{ id: 'recent', status: 'posted' }]
                : [
                      { id: 'recent', status: 'posted' },
                      { id: 'old', status: 'posted' },
                  ]
        );

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });
        const sharedWrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const limited = renderHook(() => useTransactions(undefined, { limit: 6 }), {
            wrapper: sharedWrapper,
        });
        const full = renderHook(() => useTransactions(), { wrapper: sharedWrapper });

        await waitFor(() => expect(limited.result.current.data).toBeDefined());
        await waitFor(() => expect(full.result.current.data).toBeDefined());

        expect(limited.result.current.data).toHaveLength(1);
        expect(full.result.current.data).toHaveLength(2);
        // Two distinct fetches — caches never overwrote each other.
        expect(mockGetTransactions).toHaveBeenCalledTimes(2);
    });
});
