import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useBuildFirstLevelViaA, useDeriveSecondaryViaA } from '@/hooks/useReports';

const mockBuild = vi.fn();
const mockDerive = vi.fn();

vi.mock('@/lib/api/clients', () => ({
    reportApiClient: {
        buildFirstLevelViaA: (...args: unknown[]) => mockBuild(...args),
        deriveSecondaryViaA: (...args: unknown[]) => mockDerive(...args),
    },
}));

vi.mock('@/context/CompanyContext', () => ({
    useCompany: () => ({ activeNit: '900123456' }),
}));

let invalidateSpy: ReturnType<typeof vi.fn>;

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    invalidateSpy = vi.fn();
    queryClient.invalidateQueries = invalidateSpy as never;
    function Wrapper({ children }: { children: React.ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }
    return Wrapper;
}

beforeEach(() => {
    vi.clearAllMocks();
    mockBuild.mockResolvedValue({ status: 'ok', frequency: 'annual', first_level: {} });
    mockDerive.mockResolvedValue({ status: 'ok', derived: {} });
});

describe('useBuildFirstLevelViaA', () => {
    it('calls the client and invalidates derivation/statements queries', async () => {
        const { result } = renderHook(() => useBuildFirstLevelViaA(), {
            wrapper: createWrapper(),
        });

        await result.current.mutateAsync({
            company_nit: '900123456',
            period_start: '2025-01-01',
            period_end: '2025-12-31',
            period_type: 'annual',
        });

        expect(mockBuild).toHaveBeenCalledWith('900123456', '2025-01-01', '2025-12-31', 'annual');
        await waitFor(() => {
            const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey?.[0]);
            expect(keys).toContain('derivationStatusViaA');
            expect(keys).toContain('statements');
        });
    });
});

describe('useDeriveSecondaryViaA', () => {
    it('calls the client and invalidates derivation/statements queries', async () => {
        const { result } = renderHook(() => useDeriveSecondaryViaA(), {
            wrapper: createWrapper(),
        });

        await result.current.mutateAsync({
            company_nit: '900123456',
            period_start: '2025-01-01',
            period_end: '2025-12-31',
        });

        expect(mockDerive).toHaveBeenCalledWith('900123456', '2025-01-01', '2025-12-31');
        await waitFor(() => {
            const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey?.[0]);
            expect(keys).toContain('derivationStatusViaA');
        });
    });
});
