import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock domain clients
// ---------------------------------------------------------------------------

const mockListReteicaTarifas = vi.hoisted(() => vi.fn());
const mockListTaxConcepts = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/clients', () => ({
    taxApiClient: {
        listReteicaTarifas: mockListReteicaTarifas,
        upsertReteicaTarifa: vi.fn(),
        deleteReteicaTarifa: vi.fn(),
        listTaxConcepts: mockListTaxConcepts,
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

import { useReteicaTarifas, useTaxConcepts } from '@/hooks/useTax';

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useReteicaTarifas', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns data from listReteicaTarifas', async () => {
        mockListReteicaTarifas.mockResolvedValue([
            {
                id: 1,
                municipio: 'bogota',
                ciiu_seccion: 'J',
                tasa: 0.00966,
                fuente: null,
                base_minima_uvt: 4,
            },
        ]);
        const { result } = renderHook(() => useReteicaTarifas(), { wrapper });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data![0].municipio).toBe('bogota');
    });
});

describe('useTaxConcepts', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns data from listTaxConcepts', async () => {
        mockListTaxConcepts.mockResolvedValue([
            {
                code: 'compras_pj',
                label: 'Compras PJ',
                renglon_350: '01',
                aplica_a: 'PJ',
                categoria: 'compras',
                tarifa_default: 0.025,
                base_minima_uvt: 27,
                art_referencia: null,
                activo: true,
            },
        ]);
        const { result } = renderHook(() => useTaxConcepts(), { wrapper });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data![0].code).toBe('compras_pj');
    });
});
