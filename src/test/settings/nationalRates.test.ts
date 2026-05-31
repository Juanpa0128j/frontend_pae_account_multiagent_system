import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetNationalRates = vi.hoisted(() => vi.fn());
const mockUpsertNationalRate = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/clients', () => ({
    taxApiClient: {
        getNationalRates: mockGetNationalRates,
        upsertNationalRate: mockUpsertNationalRate,
        listReteicaTarifas: vi.fn(),
        upsertReteicaTarifa: vi.fn(),
        deleteReteicaTarifa: vi.fn(),
        listTaxConcepts: vi.fn(),
        upsertTaxConcept: vi.fn(),
        softDeleteTaxConcept: vi.fn(),
        getIVA: vi.fn(),
        getWithholdings: vi.fn(),
        getICA: vi.fn(),
        getRentaProvision: vi.fn(),
        getDeclarationPreflight: vi.fn(),
        generateDeclarationDraft: vi.fn(),
        getDeclarationDraft: vi.fn(),
        updateDraftField: vi.fn(),
        reviewDraft: vi.fn(),
        fileDraft: vi.fn(),
        reopenDraft: vi.fn(),
        getTaxCalendar: vi.fn(),
        generateF220Certificates: vi.fn(),
        getExogenaFormat: vi.fn(),
        getTaxConstants: vi.fn(),
        upsertUvt: vi.fn(),
        upsertBaseMinima: vi.fn(),
        getTarifasRenta: vi.fn(),
        createOrUpdateTarifa: vi.fn(),
        deleteTarifa: vi.fn(),
    },
    reportApiClient: {
        getPerdidasAcumuladas: vi.fn(),
        createOrUpdatePerdida: vi.fn(),
        deletePerdida: vi.fn(),
    },
}));

vi.mock('@/context/CompanyContext', () => ({
    useCompany: () => ({ activeNit: 'test-nit' }),
}));

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

describe('useNationalRates', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns data from taxApiClient.getNationalRates', async () => {
        mockGetNationalRates.mockResolvedValue([SAMPLE_RATE]);
        const { result } = renderHook(() => useNationalRates(), { wrapper });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data![0].code).toBe('retefuente_servicios');
    });
});

describe('useUpsertNationalRate', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls taxApiClient.upsertNationalRate and invalidates nationalRates cache', async () => {
        const payload = {
            value: 0.038,
            descripcion: 'Servicios',
            norma_referencia: 'Art. 392 ET',
            vigente_desde: '2026-01-01',
        };
        mockUpsertNationalRate.mockResolvedValue({ ...payload, code: 'retefuente_servicios' });
        const { result } = renderHook(() => useUpsertNationalRate(), { wrapper });
        result.current.mutate({ code: 'retefuente_servicios', payload });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(mockUpsertNationalRate).toHaveBeenCalledWith('retefuente_servicios', payload);
    });
});
