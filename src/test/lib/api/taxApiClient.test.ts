import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiClient } from '@/lib/api/core/apiClient';
import { TaxApiClient } from '@/lib/api/clients/taxApiClient';

function makeClient(): ApiClient {
    return {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    } as unknown as ApiClient;
}

describe('TaxApiClient', () => {
    let client: ApiClient;
    let tax: TaxApiClient;

    beforeEach(() => {
        client = makeClient();
        tax = new TaxApiClient(client);
        vi.clearAllMocks();
    });

    // ── Tax Constants ──────────────────────────────────────────────────────

    describe('getTaxConstants', () => {
        it('calls GET /api/v1/tax/constants with year param', async () => {
            const mockData = { uvt: { year: 2025, value: 49799 }, base_minima: [] };
            vi.mocked(client.get).mockResolvedValueOnce({ data: mockData } as never);

            const result = await tax.getTaxConstants(2025);

            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/constants', {
                params: { year: 2025 },
            });
            expect(result).toEqual(mockData);
        });
    });

    describe('upsertUvt', () => {
        it('calls PUT /api/v1/tax/constants/uvt', async () => {
            const payload = { year: 2025, value: 49799 };
            vi.mocked(client.put).mockResolvedValueOnce({ data: payload } as never);

            const result = await tax.upsertUvt(payload);

            expect(client.put).toHaveBeenCalledWith('/api/v1/tax/constants/uvt', payload);
            expect(result).toEqual(payload);
        });
    });

    describe('upsertBaseMinima', () => {
        it('calls PUT /api/v1/tax/constants/base-minima', async () => {
            const payload = { concepto: 'honorarios', uvt_units: 10, year: 2025 };
            vi.mocked(client.put).mockResolvedValueOnce({ data: payload } as never);

            const result = await tax.upsertBaseMinima(payload);

            expect(client.put).toHaveBeenCalledWith('/api/v1/tax/constants/base-minima', payload);
            expect(result).toEqual(payload);
        });
    });

    // ── Declaration Preflight ──────────────────────────────────────────────

    describe('getDeclarationPreflight', () => {
        it('calls GET /api/v1/tax/declarations/preflight with snake_case params', async () => {
            const mockData = {
                ready: true,
                form_type: 'F300',
                period_start: '2025-01-01',
                period_end: '2025-03-31',
                checks: [],
                blockers: 0,
                warnings: 0,
            };
            vi.mocked(client.get).mockResolvedValueOnce({ data: mockData } as never);

            const result = await tax.getDeclarationPreflight({
                companyNit: '900123456-1',
                formType: 'F300',
                periodStart: '2025-01-01',
                periodEnd: '2025-03-31',
            });

            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/declarations/preflight', {
                params: {
                    company_nit: '900123456-1',
                    form_type: 'F300',
                    period_start: '2025-01-01',
                    period_end: '2025-03-31',
                },
            });
            expect(result).toEqual(mockData);
        });
    });

    // ── Declaration CRUD ───────────────────────────────────────────────────

    describe('generateDeclarationDraft', () => {
        it('calls POST /api/v1/tax/declarations/generate', async () => {
            const payload = {
                company_nit: '900123456-1',
                form_type: 'F350' as const,
                period_start: '2025-01-01',
                period_end: '2025-03-31',
            };
            const mockDraft = {
                draft_id: 'draft-1',
                ...payload,
                year: 2025,
                status: 'draft',
                fields: [],
                warnings: [],
                created_at: '',
            };
            vi.mocked(client.post).mockResolvedValueOnce({ data: mockDraft } as never);

            const result = await tax.generateDeclarationDraft(payload);

            expect(client.post).toHaveBeenCalledWith('/api/v1/tax/declarations/generate', payload);
            expect(result).toEqual(mockDraft);
        });
    });

    describe('getDeclarationDraft', () => {
        it('calls GET /api/v1/tax/declarations/:id', async () => {
            const mockDraft = {
                draft_id: 'draft-abc',
                company_nit: '900',
                form_type: 'F110',
                period_start: '',
                period_end: '',
                year: 2025,
                status: 'draft',
                fields: [],
                warnings: [],
                created_at: '',
            };
            vi.mocked(client.get).mockResolvedValueOnce({ data: mockDraft } as never);

            const result = await tax.getDeclarationDraft('draft-abc');

            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/declarations/draft-abc');
            expect(result).toEqual(mockDraft);
        });
    });

    describe('updateDraftField', () => {
        it('calls PATCH /api/v1/tax/declarations/:id/fields', async () => {
            const mockDraft = {
                draft_id: 'd1',
                company_nit: '900',
                form_type: 'F300',
                period_start: '',
                period_end: '',
                year: 2025,
                status: 'draft',
                fields: [],
                warnings: [],
                created_at: '',
            };
            vi.mocked(client.patch).mockResolvedValueOnce({ data: mockDraft } as never);

            const result = await tax.updateDraftField('d1', { renglon: '42', value: 1000 });

            expect(client.patch).toHaveBeenCalledWith('/api/v1/tax/declarations/d1/fields', {
                renglon: '42',
                value: 1000,
            });
            expect(result).toEqual(mockDraft);
        });
    });

    describe('reviewDraft', () => {
        it('calls POST /api/v1/tax/declarations/:id/review', async () => {
            const mockDraft = {
                draft_id: 'd1',
                company_nit: '',
                form_type: '',
                period_start: '',
                period_end: '',
                year: 2025,
                status: 'reviewed',
                fields: [],
                warnings: [],
                created_at: '',
            };
            vi.mocked(client.post).mockResolvedValueOnce({ data: mockDraft } as never);

            await tax.reviewDraft('d1');

            expect(client.post).toHaveBeenCalledWith('/api/v1/tax/declarations/d1/review');
        });
    });

    describe('fileDraft', () => {
        it('calls POST /api/v1/tax/declarations/:id/file with empty body when no ack', async () => {
            vi.mocked(client.post).mockResolvedValueOnce({ data: {} } as never);

            await tax.fileDraft('d1');

            expect(client.post).toHaveBeenCalledWith('/api/v1/tax/declarations/d1/file', {});
        });

        it('sends dian_acknowledgment when provided', async () => {
            vi.mocked(client.post).mockResolvedValueOnce({ data: {} } as never);

            await tax.fileDraft('d1', 'ACK-123');

            expect(client.post).toHaveBeenCalledWith('/api/v1/tax/declarations/d1/file', {
                dian_acknowledgment: 'ACK-123',
            });
        });
    });

    describe('reopenDraft', () => {
        it('calls POST /api/v1/tax/declarations/:id/reopen with reason', async () => {
            vi.mocked(client.post).mockResolvedValueOnce({ data: {} } as never);

            await tax.reopenDraft('d1', 'corregir error');

            expect(client.post).toHaveBeenCalledWith('/api/v1/tax/declarations/d1/reopen', {
                reason: 'corregir error',
            });
        });
    });

    // ── Tax Calendar ───────────────────────────────────────────────────────

    describe('getTaxCalendar', () => {
        it('calls GET /api/v1/tax/calendar with nit param', async () => {
            const mockCal = {
                nit: '900',
                year: 2025,
                iva_regime: 'bimestral',
                generated_at: '',
                obligations: [],
            };
            vi.mocked(client.get).mockResolvedValueOnce({ data: mockCal } as never);

            const result = await tax.getTaxCalendar('900', 2025);

            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/calendar', {
                params: { nit: '900', year: 2025 },
            });
            expect(result).toEqual(mockCal);
        });

        it('omits optional params when not provided', async () => {
            vi.mocked(client.get).mockResolvedValueOnce({ data: {} } as never);

            await tax.getTaxCalendar('900');

            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/calendar', {
                params: { nit: '900' },
            });
        });
    });

    // ── F220 Certificates ──────────────────────────────────────────────────

    describe('generateF220Certificates', () => {
        it('calls POST /api/v1/tax/certificates/f220 with query params', async () => {
            const mockResp = {
                company_nit: '900',
                year: 2025,
                total_certificates: 0,
                certificates: [],
            };
            vi.mocked(client.post).mockResolvedValueOnce({ data: mockResp } as never);

            const result = await tax.generateF220Certificates('900', 2025);

            expect(client.post).toHaveBeenCalledWith('/api/v1/tax/certificates/f220', null, {
                params: { company_nit: '900', year: 2025 },
            });
            expect(result).toEqual(mockResp);
        });
    });

    // ── Exógena ────────────────────────────────────────────────────────────

    describe('getExogenaFormat', () => {
        it('calls GET /api/v1/tax/exogena/:formato', async () => {
            const mockResp = {
                formato: '1001',
                company_nit: '900',
                year: 2025,
                total_rows: 0,
                invalid_rows: 0,
                rows: [],
            };
            vi.mocked(client.get).mockResolvedValueOnce({ data: mockResp } as never);

            const result = await tax.getExogenaFormat('1001', '900', 2025);

            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/exogena/1001', {
                params: { company_nit: '900', year: 2025 },
            });
            expect(result).toEqual(mockResp);
        });
    });

    // ── Tarifas Renta ──────────────────────────────────────────────────────

    describe('getTarifasRenta', () => {
        it('calls GET /api/v1/tax/tarifas-renta and returns tarifas array', async () => {
            const mockTarifas = [
                {
                    id: 1,
                    regimen: 'ordinario',
                    actividad: null,
                    tarifa_base: 35,
                    sobretasa: 0,
                    tarifa_efectiva: 35,
                    year_from: 2023,
                    year_to: null,
                    base_legal: null,
                    notas: null,
                },
            ];
            vi.mocked(client.get).mockResolvedValueOnce({
                data: { tarifas: mockTarifas },
            } as never);

            const result = await tax.getTarifasRenta({ year: 2025 });

            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/tarifas-renta', {
                params: { year: 2025 },
            });
            expect(result).toEqual(mockTarifas);
        });

        it('sends empty params when year not provided', async () => {
            vi.mocked(client.get).mockResolvedValueOnce({ data: { tarifas: [] } } as never);

            await tax.getTarifasRenta();

            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/tarifas-renta', { params: {} });
        });
    });

    describe('createOrUpdateTarifa', () => {
        it('calls POST /api/v1/tax/tarifas-renta', async () => {
            const payload = {
                regimen: 'ordinario' as const,
                actividad: null,
                tarifa_base: 35,
                sobretasa: 0,
                year_from: 2025,
                year_to: null,
                base_legal: null,
                notas: null,
            };
            const mockResult = { id: 5, ...payload, tarifa_efectiva: 35 };
            vi.mocked(client.post).mockResolvedValueOnce({ data: mockResult } as never);

            const result = await tax.createOrUpdateTarifa(payload);

            expect(client.post).toHaveBeenCalledWith('/api/v1/tax/tarifas-renta', payload);
            expect(result).toEqual(mockResult);
        });
    });

    describe('deleteTarifa', () => {
        it('calls DELETE /api/v1/tax/tarifas-renta/:id', async () => {
            vi.mocked(client.delete).mockResolvedValueOnce({} as never);

            await tax.deleteTarifa(7);

            expect(client.delete).toHaveBeenCalledWith('/api/v1/tax/tarifas-renta/7');
        });
    });

    // ── ReteICA Tarifas ────────────────────────────────────────────────────

    describe('listReteicaTarifas', () => {
        it('sends GET /api/v1/tax/reteica-tarifas with company_nit in params', async () => {
            const mockData = [
                {
                    id: 1,
                    municipio: 'Bogotá',
                    ciiu_seccion: 'G',
                    tasa: 0.005,
                    fuente: null,
                    base_minima_uvt: null,
                },
            ];
            vi.mocked(client.get).mockResolvedValueOnce({ data: mockData } as never);

            const result = await tax.listReteicaTarifas('900123456-1');

            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/reteica-tarifas', {
                params: { company_nit: '900123456-1' },
            });
            expect(result).toEqual(mockData);
        });

        it('sends both company_nit and municipio params when municipio is provided', async () => {
            const mockData = [
                {
                    id: 1,
                    municipio: 'Medellín',
                    ciiu_seccion: 'G',
                    tasa: 0.005,
                    fuente: null,
                    base_minima_uvt: null,
                },
            ];
            vi.mocked(client.get).mockResolvedValueOnce({ data: mockData } as never);

            const result = await tax.listReteicaTarifas('900123456-1', 'Medellín');

            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/reteica-tarifas', {
                params: { company_nit: '900123456-1', municipio: 'Medellín' },
            });
            expect(result).toEqual(mockData);
        });
    });

    describe('upsertReteicaTarifa', () => {
        it('calls PUT /api/v1/tax/reteica-tarifas', async () => {
            const payload = { municipio: 'Bogotá', ciiu_seccion: 'G', tasa: 0.005 };
            const mockResult = { id: 1, ...payload, fuente: null, base_minima_uvt: null };
            vi.mocked(client.put).mockResolvedValueOnce({ data: mockResult } as never);

            const result = await tax.upsertReteicaTarifa(payload);

            expect(client.put).toHaveBeenCalledWith('/api/v1/tax/reteica-tarifas', payload);
            expect(result).toEqual(mockResult);
        });
    });

    describe('deleteReteicaTarifa', () => {
        it('calls DELETE /api/v1/tax/reteica-tarifas/:id', async () => {
            vi.mocked(client.delete).mockResolvedValueOnce({} as never);

            await tax.deleteReteicaTarifa(3);

            expect(client.delete).toHaveBeenCalledWith('/api/v1/tax/reteica-tarifas/3');
        });
    });

    // ── Tax Concepts ───────────────────────────────────────────────────────

    describe('listTaxConcepts', () => {
        it('sends GET /api/v1/tax/concepts with company_nit in params and no activo by default', async () => {
            const mockData = [
                {
                    code: 'HON',
                    label: 'Honorarios',
                    renglon_350: '40',
                    aplica_a: 'personas',
                    tarifa_default: 0.11,
                    base_minima_uvt: 10,
                    categoria: 'retención',
                    art_referencia: null,
                    activo: true,
                },
            ];
            vi.mocked(client.get).mockResolvedValueOnce({ data: mockData } as never);

            const result = await tax.listTaxConcepts('900123456-1');

            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/concepts', {
                params: { company_nit: '900123456-1' },
            });
            expect(result).toEqual(mockData);
        });

        it('sends both company_nit and activo params when activo is true', async () => {
            const mockData = [
                {
                    code: 'HON',
                    label: 'Honorarios',
                    renglon_350: '40',
                    aplica_a: 'personas',
                    tarifa_default: 0.11,
                    base_minima_uvt: 10,
                    categoria: 'retención',
                    art_referencia: null,
                    activo: true,
                },
            ];
            vi.mocked(client.get).mockResolvedValueOnce({ data: mockData } as never);

            const result = await tax.listTaxConcepts('900123456-1', true);

            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/concepts', {
                params: { company_nit: '900123456-1', activo: true },
            });
            expect(result).toEqual(mockData);
        });

        it('sends company_nit and activo=false when activo is false', async () => {
            vi.mocked(client.get).mockResolvedValueOnce({ data: [] } as never);

            await tax.listTaxConcepts('900123456-1', false);

            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/concepts', {
                params: { company_nit: '900123456-1', activo: false },
            });
        });
    });

    describe('upsertTaxConcept', () => {
        it('calls PUT /api/v1/tax/concepts', async () => {
            const payload = {
                code: 'HON',
                label: 'Honorarios',
                renglon_350: '40',
                aplica_a: 'personas',
                categoria: 'retención',
            };
            const mockResult = {
                ...payload,
                tarifa_default: null,
                base_minima_uvt: null,
                art_referencia: null,
                activo: true,
            };
            vi.mocked(client.put).mockResolvedValueOnce({ data: mockResult } as never);

            const result = await tax.upsertTaxConcept(payload);

            expect(client.put).toHaveBeenCalledWith('/api/v1/tax/concepts', payload);
            expect(result).toEqual(mockResult);
        });
    });

    describe('softDeleteTaxConcept', () => {
        it('calls DELETE /api/v1/tax/concepts/:code', async () => {
            vi.mocked(client.delete).mockResolvedValueOnce({} as never);

            await tax.softDeleteTaxConcept('HON');

            expect(client.delete).toHaveBeenCalledWith('/api/v1/tax/concepts/HON');
        });
    });
});
