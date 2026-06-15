import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAvailablePeriods } from '@/hooks/useReports';
import type { AvailablePeriodsResponse } from '@/types';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockGetAvailablePeriods = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/clients', () => ({
    reportApiClient: {
        getAvailablePeriods: mockGetAvailablePeriods,
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

const mockPeriods: AvailablePeriodsResponse = {
    balance_general: ['2024-12-31', '2024-06-30'],
    estado_resultados: ['2024-12-31', '2024-06-30'],
    libro_auxiliar: ['2024-12-31'],
};

describe('useAvailablePeriods', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetAvailablePeriods.mockResolvedValue(mockPeriods);
    });

    it('returns available periods data from the API', async () => {
        const { result } = renderHook(() => useAvailablePeriods(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockPeriods);
    });

    it('calls getAvailablePeriods with the active NIT', async () => {
        renderHook(() => useAvailablePeriods(), { wrapper });

        await waitFor(() => expect(mockGetAvailablePeriods).toHaveBeenCalled());

        expect(mockGetAvailablePeriods).toHaveBeenCalledWith('800999888');
    });

    it('does not fetch when enabled=false', () => {
        renderHook(() => useAvailablePeriods(false), { wrapper });

        expect(mockGetAvailablePeriods).not.toHaveBeenCalled();
    });

    it('exposes balance_general periods array', async () => {
        const { result } = renderHook(() => useAvailablePeriods(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.balance_general).toEqual(['2024-12-31', '2024-06-30']);
    });
});
