import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPut } = vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockPut: vi.fn(),
}));

vi.mock('axios', () => {
    const interceptors = {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
    };
    const instance = {
        interceptors,
        get: mockGet,
        post: vi.fn(),
        put: mockPut,
        delete: vi.fn(),
        patch: vi.fn(),
    };
    const mockAxios = {
        create: vi.fn(() => instance),
        isAxiosError: vi.fn(),
    };
    return { default: mockAxios, ...mockAxios };
});

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            signOut: vi.fn().mockResolvedValue({}),
        },
    }),
}));

import { getNationalRates, upsertNationalRate } from '@/lib/api';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useNationalRates, useUpsertNationalRate } from '@/hooks/useTax';

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return React.createElement(QueryClientProvider, { client: qc }, children);
}

const SAMPLE_RATE = {
    code: 'retefuente_servicios',
    value: 0.04,
    descripcion: 'Retención en la fuente — servicios generales',
    norma_referencia: 'Art. 392 ET',
    vigente_desde: '2023-01-01',
};

describe('getNationalRates', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls GET /api/v1/settings/national-rates', async () => {
        mockGet.mockResolvedValue({ data: [SAMPLE_RATE] });
        const result = await getNationalRates();
        expect(mockGet).toHaveBeenCalledWith('/api/v1/settings/national-rates');
        expect(result[0].code).toBe('retefuente_servicios');
    });
});

describe('upsertNationalRate', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls PUT /api/v1/settings/national-rates/{code}', async () => {
        const payload = {
            value: 0.038,
            descripcion: 'Servicios',
            norma_referencia: 'Art. 392 ET',
            vigente_desde: '2026-01-01',
        };
        mockPut.mockResolvedValue({ data: { ...payload, code: 'retefuente_servicios' } });
        await upsertNationalRate('retefuente_servicios', payload);
        expect(mockPut).toHaveBeenCalledWith(
            '/api/v1/settings/national-rates/retefuente_servicios',
            payload
        );
    });
});

describe('useNationalRates', () => {
    it('returns data from getNationalRates', async () => {
        mockGet.mockResolvedValue({ data: [SAMPLE_RATE] });
        const { result } = renderHook(() => useNationalRates(), { wrapper });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data![0].code).toBe('retefuente_servicios');
    });
});

describe('useUpsertNationalRate', () => {
    it('calls upsertNationalRate and invalidates nationalRates cache', async () => {
        const payload = {
            value: 0.038,
            descripcion: 'Servicios',
            norma_referencia: 'Art. 392 ET',
            vigente_desde: '2026-01-01',
        };
        mockPut.mockResolvedValue({ data: { ...payload, code: 'retefuente_servicios' } });
        const { result } = renderHook(() => useUpsertNationalRate(), { wrapper });
        result.current.mutate({ code: 'retefuente_servicios', payload });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(mockPut).toHaveBeenCalledWith(
            '/api/v1/settings/national-rates/retefuente_servicios',
            payload
        );
    });
});
