// @vitest-environment node

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { apiClient } from '@/lib/api/core/apiClient';
import { CompanyApiClient } from '@/lib/api/clients/companyApiClient';
import {
    CompanySettingsResponse,
    CompanySettingsRequest,
    CompanyProfileSetupRequest,
    CompanySettingsApiResponse,
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

describe('CompanyApiClient', () => {
    const baseURL = 'http://localhost:8000';
    const client = apiClient;
    const companyClient = new CompanyApiClient(client);

    describe('getCompanySettings', () => {
        it('returns company settings for a given nit', async () => {
            const mockResponse: CompanySettingsResponse = {
                nit: '9001234561',
                nombre: 'Test Company',
                ciudad: 'Bogotá',
                codigo_ciiu: '6201',
                iva_responsable: true,
                es_declarante: true,
                tasa_retefuente_servicios: 0.04,
                tasa_retefuente_bienes: 0.025,
                tasa_retefuente_arrendamiento: 0.035,
                tasa_reteica: 0.00966,
                tasa_iva_general: 0.19,
                tasa_ica: 0.00966,
                tasa_renta: 0.35,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z',
            };

            server.use(
                http.get(`${baseURL}/api/v1/settings/company/9001234561`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await companyClient.getCompanySettings('9001234561');
            expect(result).toEqual(mockResponse);
        });

        it('returns null when company settings are not found (404)', async () => {
            server.use(
                http.get(`${baseURL}/api/v1/settings/company/9000000000`, () => {
                    return HttpResponse.json({ message: 'Not found' }, { status: 404 });
                })
            );

            const result = await companyClient.getCompanySettings('9000000000');
            expect(result).toBeNull();
        });

        it('throws on non-404 errors', async () => {
            server.use(
                http.get(`${baseURL}/api/v1/settings/company/9000000000`, () => {
                    return HttpResponse.json({ message: 'Server error' }, { status: 500 });
                })
            );

            await expect(companyClient.getCompanySettings('9000000000')).rejects.toMatchObject({
                status: 500,
            });
        });
    });

    describe('upsertCompanySettings', () => {
        it('puts settings and returns updated response', async () => {
            const payload: CompanySettingsRequest = {
                nombre: 'Updated Company',
                ciudad: 'Medellín',
                codigo_ciiu: '6202',
                iva_responsable: false,
                es_declarante: false,
                tasa_retefuente_servicios: 0.04,
                tasa_retefuente_bienes: 0.025,
                tasa_retefuente_arrendamiento: 0.035,
                tasa_reteica: 0.00966,
                tasa_iva_general: 0.19,
                tasa_ica: 0.00966,
                tasa_renta: 0.35,
            };

            const mockResponse: CompanySettingsResponse = {
                nit: '9001234561',
                ...payload,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-03T00:00:00Z',
            };

            server.use(
                http.put(`${baseURL}/api/v1/settings/company/9001234561`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await companyClient.upsertCompanySettings('9001234561', payload);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('setupCompanySettings', () => {
        it('posts setup payload and returns settings', async () => {
            const payload: CompanyProfileSetupRequest = {
                nombre: 'New Company',
                ciudad: 'Cali',
                codigo_ciiu: '6203',
                iva_responsable: true,
            };

            const mockResponse: CompanySettingsResponse = {
                nit: '9001234561',
                nombre: 'New Company',
                ciudad: 'Cali',
                codigo_ciiu: '6203',
                iva_responsable: true,
                es_declarante: false,
                tasa_retefuente_servicios: 0.04,
                tasa_retefuente_bienes: 0.025,
                tasa_retefuente_arrendamiento: 0.035,
                tasa_reteica: 0.00966,
                tasa_iva_general: 0.19,
                tasa_ica: 0.00966,
                tasa_renta: 0.35,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };

            server.use(
                http.post(`${baseURL}/api/v1/settings/company/9001234561/setup`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await companyClient.setupCompanySettings('9001234561', payload);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getCompanies', () => {
        it('returns list of companies', async () => {
            const mockResponse: CompanySettingsApiResponse[] = [
                {
                    nit: '9001234561',
                    nombre: 'Test Company',
                    ciudad: 'Bogotá',
                    codigo_ciiu: '6201',
                    iva_responsable: true,
                    tasa_retefuente_servicios: 0.04,
                    tasa_retefuente_bienes: 0.025,
                    tasa_retefuente_arrendamiento: 0.035,
                    tasa_reteica: 0.00966,
                    tasa_iva_general: 0.19,
                    tasa_ica: 0.00966,
                    tasa_renta: 0.35,
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-02T00:00:00Z',
                },
            ];

            server.use(
                http.get(`${baseURL}/api/v1/settings/companies`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await companyClient.getCompanies();
            expect(result).toEqual(mockResponse);
        });
    });

    describe('deleteCompany', () => {
        it('deletes company and resolves void', async () => {
            server.use(
                http.delete(`${baseURL}/api/v1/settings/company/9001234561`, () => {
                    return new HttpResponse(null, { status: 204 });
                })
            );

            await expect(companyClient.deleteCompany('9001234561')).resolves.toBeUndefined();
        });
    });

    describe('listMyCompanies', () => {
        it('returns list of user company memberships', async () => {
            const mockResponse = [{ user_id: 'user_1', company_nit: '9001234561' }];

            server.use(
                http.get(`${baseURL}/api/v1/auth/companies`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await companyClient.listMyCompanies();
            expect(result).toEqual(mockResponse);
        });
    });

    describe('joinCompany', () => {
        it('joins company and returns membership', async () => {
            const mockResponse = { user_id: 'user_1', company_nit: '9001234561' };

            server.use(
                http.post(`${baseURL}/api/v1/auth/companies/join`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await companyClient.joinCompany('9001234561');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('leaveCompany', () => {
        it('leaves company and resolves void', async () => {
            server.use(
                http.delete(`${baseURL}/api/v1/auth/companies/9001234561`, () => {
                    return new HttpResponse(null, { status: 204 });
                })
            );

            await expect(companyClient.leaveCompany('9001234561')).resolves.toBeUndefined();
        });
    });
});
