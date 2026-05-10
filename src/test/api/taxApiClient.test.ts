// @vitest-environment node

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { apiClient } from '@/lib/api/core/apiClient';
import { TaxApiClient } from '@/lib/api/clients/taxApiClient';
import {
    IVAReport,
    WithholdingsReport,
    TaxDeclarationDraft,
    TaxCalendarResponse,
    F220Response,
    ExogenaResponse,
    GenerateDraftRequest,
} from '@/types/api';

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
            signOut: vi.fn(() => Promise.resolve()),
        },
    }),
}));

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('TaxApiClient', () => {
    const baseURL = 'http://localhost:8000';
    const client = apiClient;
    const taxClient = new TaxApiClient(client);

    describe('getIVA', () => {
        it('returns IVA report for the current company', async () => {
            const mockResponse: IVAReport = {
                period_end: '2024-01-31',
                period_start: '2024-01-01',
                company_nit: '9001234561',
                iva_generado: 19000,
                iva_descontable: 9500,
                iva_a_pagar: 9500,
                iva_status: 'saldo_a_pagar',
                referencias: ['Ref1'],
            };

            server.use(
                http.get(`${baseURL}/api/v1/tax/iva`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await taxClient.getIVA();
            expect(result).toEqual(mockResponse);
        });

        it('includes company_nit query param when provided', async () => {
            const mockResponse: IVAReport = {
                period_end: '2024-01-31',
                period_start: '2024-01-01',
                company_nit: '9001234561',
                iva_generado: 19000,
                iva_descontable: 9500,
                iva_a_pagar: 9500,
                iva_status: 'saldo_a_pagar',
                referencias: ['Ref1'],
            };

            let capturedUrl: string | undefined;
            server.use(
                http.get(`${baseURL}/api/v1/tax/iva`, ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json(mockResponse);
                })
            );

            await taxClient.getIVA('9001234561');
            expect(capturedUrl).toContain('company_nit=9001234561');
        });
    });

    describe('getWithholdings', () => {
        it('returns withholdings report for the current company', async () => {
            const mockResponse: WithholdingsReport = {
                period_end: '2024-01-31',
                period_start: '2024-01-01',
                company_nit: '9001234561',
                retencion_en_la_fuente: 5000,
                retencion_en_la_fuente_status: 'saldo_a_pagar',
                retencion_ica: 2000,
                retencion_ica_status: 'saldo_a_pagar',
                total_retenciones: 7000,
                total_retenciones_status: 'saldo_a_pagar',
                referencias: ['Ref1'],
            };

            server.use(
                http.get(`${baseURL}/api/v1/tax/withholdings`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await taxClient.getWithholdings();
            expect(result).toEqual(mockResponse);
        });
    });

    describe('generateDeclarationDraft', () => {
        it('posts payload and returns a declaration draft', async () => {
            const payload: GenerateDraftRequest = {
                company_nit: '9001234561',
                form_type: 'F300',
                period_start: '2024-01-01',
                period_end: '2024-01-31',
            };

            const mockResponse: TaxDeclarationDraft = {
                draft_id: 'draft_123',
                company_nit: '9001234561',
                form_type: 'F300',
                period_start: '2024-01-01',
                period_end: '2024-01-31',
                year: 2024,
                status: 'draft',
                fields: [],
                warnings: [],
                created_at: '2024-02-01T00:00:00Z',
                updated_at: undefined,
            };

            server.use(
                http.post(`${baseURL}/api/v1/tax/declarations/generate`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await taxClient.generateDeclarationDraft(payload);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getDeclarationDraft', () => {
        it('returns a declaration draft by id', async () => {
            const mockResponse: TaxDeclarationDraft = {
                draft_id: 'draft_123',
                company_nit: '9001234561',
                form_type: 'F300',
                period_start: '2024-01-01',
                period_end: '2024-01-31',
                year: 2024,
                status: 'draft',
                fields: [],
                warnings: [],
                created_at: '2024-02-01T00:00:00Z',
                updated_at: undefined,
            };

            server.use(
                http.get(`${baseURL}/api/v1/tax/declarations/draft_123`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await taxClient.getDeclarationDraft('draft_123');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('updateDraftField', () => {
        it('patches a field value and returns updated draft', async () => {
            const mockResponse: TaxDeclarationDraft = {
                draft_id: 'draft_123',
                company_nit: '9001234561',
                form_type: 'F300',
                period_start: '2024-01-01',
                period_end: '2024-01-31',
                year: 2024,
                status: 'draft',
                fields: [
                    {
                        label: 'Ingresos brutos',
                        value: 1000000,
                        source: 'system',
                        renglon: '100',
                        confidence: 'high',
                        requires_review: false,
                    },
                ],
                warnings: [],
                created_at: '2024-02-01T00:00:00Z',
                updated_at: '2024-02-02T00:00:00Z',
            };

            server.use(
                http.patch(`${baseURL}/api/v1/tax/declarations/draft_123/fields`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await taxClient.updateDraftField('draft_123', '100', 1000000);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getTaxCalendar', () => {
        it('returns tax calendar for the default year', async () => {
            const mockResponse: TaxCalendarResponse = {
                nit: '9001234561',
                year: 2024,
                iva_regime: 'bimestral',
                generated_at: '2024-01-01T00:00:00Z',
                obligations: [],
            };

            server.use(
                http.get(`${baseURL}/api/v1/tax/calendar`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await taxClient.getTaxCalendar('9001234561');
            expect(result).toEqual(mockResponse);
        });

        it('includes year query param when provided', async () => {
            const mockResponse: TaxCalendarResponse = {
                nit: '9001234561',
                year: 2025,
                iva_regime: 'bimestral',
                generated_at: '2025-01-01T00:00:00Z',
                obligations: [],
            };

            let capturedUrl: string | undefined;
            server.use(
                http.get(`${baseURL}/api/v1/tax/calendar`, ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json(mockResponse);
                })
            );

            await taxClient.getTaxCalendar('9001234561', 2025);
            expect(capturedUrl).toContain('year=2025');
        });
    });

    describe('getF220Certificates', () => {
        it('returns F220 certificates for a given year', async () => {
            const mockResponse: F220Response = {
                company_nit: '9001234561',
                year: 2024,
                total_certificates: 2,
                certificates: [],
            };

            server.use(
                http.post(`${baseURL}/api/v1/tax/certificates/f220`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await taxClient.getF220Certificates('9001234561', 2024);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getExogenaFormat', () => {
        it('returns exogena data for the given format and year', async () => {
            const mockResponse: ExogenaResponse = {
                formato: '1001',
                company_nit: '9001234561',
                year: 2024,
                total_rows: 10,
                invalid_rows: 0,
                rows: [],
            };

            server.use(
                http.get(`${baseURL}/api/v1/tax/exogena/1001`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await taxClient.getExogenaFormat('1001', '9001234561', 2024);
            expect(result).toEqual(mockResponse);
        });
    });
});
