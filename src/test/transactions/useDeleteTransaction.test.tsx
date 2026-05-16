import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/api', () => ({
    deleteTransaction: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        },
    }),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    function Wrapper({ children }: { children: React.ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }
    return Wrapper;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDeleteTransaction', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('calling mutate calls deleteTransaction with correct id', async () => {
        const { deleteTransaction } = await import('@/lib/api');
        const mockDeleteTransaction = deleteTransaction as ReturnType<typeof vi.fn>;
        mockDeleteTransaction.mockResolvedValue(undefined);

        const { useDeleteTransaction } = await import('@/hooks/useTransactions');
        const { result } = renderHook(() => useDeleteTransaction(), {
            wrapper: createWrapper(),
        });

        result.current.mutate('tx-123');

        await waitFor(() => {
            expect(mockDeleteTransaction).toHaveBeenCalledWith('tx-123');
        });
    });

    it('on success, queryClient.invalidateQueries is called for transactions', async () => {
        const { deleteTransaction } = await import('@/lib/api');
        const mockDeleteTransaction = deleteTransaction as ReturnType<typeof vi.fn>;
        mockDeleteTransaction.mockResolvedValue(undefined);

        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });

        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { useDeleteTransaction } = await import('@/hooks/useTransactions');
        const { result } = renderHook(() => useDeleteTransaction(), { wrapper });

        result.current.mutate('tx-456');

        await waitFor(() => {
            expect(invalidateSpy).toHaveBeenCalledWith({
                queryKey: ['transactions'],
            });
        });
    });
});
