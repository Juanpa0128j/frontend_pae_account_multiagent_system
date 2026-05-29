import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => {
    const interceptors = {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
    };
    const mockAxios = {
        create: vi.fn(() => ({
            interceptors,
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            patch: vi.fn(),
        })),
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
        defaults: { headers: { common: {} } },
        interceptors,
        isAxiosError: vi.fn(),
    };
    return { default: mockAxios, ...mockAxios };
});

import {
    listReteicaTarifas,
    upsertReteicaTarifa,
    deleteReteicaTarifa,
    listTaxConcepts,
    upsertTaxConcept,
    softDeleteTaxConcept,
} from '@/lib/api';

describe('ReteicaTarifa API functions', () => {
    beforeEach(() => vi.clearAllMocks());

    it('listReteicaTarifas calls GET /api/v1/tax/reteica-tarifas', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: [] });
        await listReteicaTarifas();
        expect(axios.get).toHaveBeenCalledWith('/api/v1/tax/reteica-tarifas', { params: {} });
    });

    it('listReteicaTarifas passes municipio filter', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: [] });
        await listReteicaTarifas('bogota');
        expect(axios.get).toHaveBeenCalledWith('/api/v1/tax/reteica-tarifas', {
            params: { municipio: 'bogota' },
        });
    });

    it('upsertReteicaTarifa calls PUT /api/v1/tax/reteica-tarifas', async () => {
        const payload = { municipio: 'bogota', ciiu_seccion: 'J', tasa: 0.00966 };
        vi.mocked(axios.put).mockResolvedValue({
            data: { id: 1, ...payload, fuente: null, base_minima_uvt: null },
        });
        const result = await upsertReteicaTarifa(payload);
        expect(axios.put).toHaveBeenCalledWith('/api/v1/tax/reteica-tarifas', payload);
        expect(result.id).toBe(1);
    });

    it('deleteReteicaTarifa calls DELETE /api/v1/tax/reteica-tarifas/{id}', async () => {
        vi.mocked(axios.delete).mockResolvedValue({ data: null });
        await deleteReteicaTarifa(1);
        expect(axios.delete).toHaveBeenCalledWith('/api/v1/tax/reteica-tarifas/1');
    });
});

describe('TaxConcept API functions', () => {
    beforeEach(() => vi.clearAllMocks());

    it('listTaxConcepts calls GET /api/v1/tax/concepts with activo=true by default', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: [] });
        await listTaxConcepts();
        expect(axios.get).toHaveBeenCalledWith('/api/v1/tax/concepts', {
            params: { activo: true },
        });
    });

    it('upsertTaxConcept calls PUT /api/v1/tax/concepts', async () => {
        const payload = {
            code: 'compras_pj',
            label: 'Compras PJ',
            renglon_350: '01',
            aplica_a: 'PJ',
            categoria: 'compras',
        };
        vi.mocked(axios.put).mockResolvedValue({
            data: {
                ...payload,
                activo: true,
                tarifa_default: null,
                base_minima_uvt: null,
                art_referencia: null,
            },
        });
        await upsertTaxConcept(payload);
        expect(axios.put).toHaveBeenCalledWith('/api/v1/tax/concepts', payload);
    });

    it('softDeleteTaxConcept calls DELETE /api/v1/tax/concepts/{code}', async () => {
        vi.mocked(axios.delete).mockResolvedValue({ data: null });
        await softDeleteTaxConcept('compras_pj');
        expect(axios.delete).toHaveBeenCalledWith('/api/v1/tax/concepts/compras_pj');
    });
});
