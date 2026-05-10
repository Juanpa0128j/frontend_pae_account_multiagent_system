// @vitest-environment node

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { apiClient } from '@/lib/api/core/apiClient';
import { ReportApiClient } from '@/lib/api/clients/reportApiClient';
import {
    BalanceSheet,
    ProfitAndLoss,
    CashFlow,
    LibroMayorEntry,
    LibroAuxiliarLine,
    MonthlyTrendResponse,
    DashboardStatsResponse,
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

describe('ReportApiClient', () => {
    const baseURL = 'http://localhost:8000';
    const client = apiClient;
    const reportClient = new ReportApiClient(client);

    describe('getBalance', () => {
        it('returns balance sheet for the current company', async () => {
            const mockResponse: BalanceSheet = {
                period_start: '2024-01-01',
                period_end: '2024-01-31',
                company_nit: '9001234561',
                activos: 1000000,
                pasivos: 500000,
                patrimonio: 500000,
                utilidad_neta: 100000,
                patrimonio_total: 500000,
                cuadre: true,
            };

            server.use(
                http.get(`${baseURL}/api/v1/reports/balance`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await reportClient.getBalance();
            expect(result).toEqual(mockResponse);
        });

        it('includes company_nit query param when provided', async () => {
            const mockResponse: BalanceSheet = {
                period_start: '2024-01-01',
                period_end: '2024-01-31',
                company_nit: '9001234561',
                activos: 1000000,
                pasivos: 500000,
                patrimonio: 500000,
                utilidad_neta: 100000,
                patrimonio_total: 500000,
                cuadre: true,
            };

            let capturedUrl: string | undefined;
            server.use(
                http.get(`${baseURL}/api/v1/reports/balance`, ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json(mockResponse);
                })
            );

            await reportClient.getBalance('9001234561');
            expect(capturedUrl).toContain('company_nit=9001234561');
        });
    });

    describe('getProfitAndLoss', () => {
        it('returns profit and loss statement', async () => {
            const mockResponse: ProfitAndLoss = {
                period_start: '2024-01-01',
                period_end: '2024-01-31',
                company_nit: '9001234561',
                ingresos: [{ codigo: '4105', nombre: 'Ingresos', saldo: 2000000 }],
                costo_ventas: [{ codigo: '6105', nombre: 'Costos', saldo: 800000 }],
                gastos: [{ codigo: '5105', nombre: 'Gastos', saldo: 400000 }],
                total_ingresos: 2000000,
                total_costo_ventas: 800000,
                total_gastos: 400000,
                utilidad_bruta: 1200000,
                utilidad_neta: 800000,
            };

            server.use(
                http.get(`${baseURL}/api/v1/reports/pnl`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await reportClient.getProfitAndLoss();
            expect(result).toEqual(mockResponse);
        });

        it('includes company_nit query param when provided', async () => {
            const mockResponse: ProfitAndLoss = {
                period_start: '2024-01-01',
                period_end: '2024-01-31',
                company_nit: '9001234561',
                ingresos: [],
                costo_ventas: [],
                gastos: [],
                total_ingresos: 0,
                total_costo_ventas: 0,
                total_gastos: 0,
                utilidad_bruta: 0,
                utilidad_neta: 0,
            };

            let capturedUrl: string | undefined;
            server.use(
                http.get(`${baseURL}/api/v1/reports/pnl`, ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json(mockResponse);
                })
            );

            await reportClient.getProfitAndLoss('9001234561');
            expect(capturedUrl).toContain('company_nit=9001234561');
        });
    });

    describe('getCashFlow', () => {
        it('returns cash flow statement', async () => {
            const mockResponse: CashFlow = {
                period_start: '2024-01-01',
                period_end: '2024-01-31',
                company_nit: '9001234561',
                cuentas_efectivo: [{ codigo: '1105', nombre: 'Caja', saldo: 500000 }],
                total_efectivo: 500000,
            };

            server.use(
                http.get(`${baseURL}/api/v1/reports/cashflow`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await reportClient.getCashFlow();
            expect(result).toEqual(mockResponse);
        });

        it('includes company_nit query param when provided', async () => {
            const mockResponse: CashFlow = {
                period_start: '2024-01-01',
                period_end: '2024-01-31',
                company_nit: '9001234561',
                cuentas_efectivo: [],
                total_efectivo: 0,
            };

            let capturedUrl: string | undefined;
            server.use(
                http.get(`${baseURL}/api/v1/reports/cashflow`, ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json(mockResponse);
                })
            );

            await reportClient.getCashFlow('9001234561');
            expect(capturedUrl).toContain('company_nit=9001234561');
        });
    });

    describe('getGeneralLedger', () => {
        it('returns general ledger entries with params', async () => {
            const mockResponse = {
                entries: [{ id: '1', cuenta: '1105', descripcion: 'Caja' }],
            };

            let capturedUrl: string | undefined;
            server.use(
                http.get(`${baseURL}/api/v1/reports/general-ledger`, ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await reportClient.getGeneralLedger({
                company_nit: '9001234561',
                fecha_inicio: '2024-01-01',
                fecha_fin: '2024-01-31',
            });
            expect(result).toEqual(mockResponse);
            expect(capturedUrl).toContain('company_nit=9001234561');
            expect(capturedUrl).toContain('fecha_inicio=2024-01-01');
            expect(capturedUrl).toContain('fecha_fin=2024-01-31');
        });
    });

    describe('getLibroMayor', () => {
        it('returns libro mayor entries with params', async () => {
            const mockResponse: LibroMayorEntry[] = [
                {
                    cuenta_puc: '1105',
                    cuenta_nombre: 'Caja',
                    saldo_inicial: 0,
                    total_debitos: 100000,
                    total_creditos: 0,
                    saldo_final: 100000,
                },
            ];

            let capturedUrl: string | undefined;
            server.use(
                http.get(`${baseURL}/api/v1/reports/libro-mayor`, ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await reportClient.getLibroMayor({
                company_nit: '9001234561',
                fecha_inicio: '2024-01-01',
                fecha_fin: '2024-01-31',
            });
            expect(result).toEqual(mockResponse);
            expect(capturedUrl).toContain('company_nit=9001234561');
        });
    });

    describe('getLibroAuxiliar', () => {
        it('returns libro auxiliar lines with params', async () => {
            const mockResponse: LibroAuxiliarLine[] = [
                {
                    fecha: '2024-01-01',
                    comprobante: 'COMP-1',
                    tercero_nit: '9001234561',
                    descripcion: 'Pago',
                    debito: 50000,
                    credito: 0,
                },
            ];

            let capturedUrl: string | undefined;
            server.use(
                http.get(`${baseURL}/api/v1/reports/libro-auxiliar`, ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await reportClient.getLibroAuxiliar({
                cuenta_puc: '1105',
                company_nit: '9001234561',
                fecha_inicio: '2024-01-01',
                fecha_fin: '2024-01-31',
            });
            expect(result).toEqual(mockResponse);
            expect(capturedUrl).toContain('cuenta_puc=1105');
        });
    });

    describe('getMonthlyTrend', () => {
        it('returns monthly trend with default months', async () => {
            const mockResponse: MonthlyTrendResponse = {
                data: [{ month: '2024-01', ingresos: 1000000, gastos: 500000 }],
            };

            let capturedUrl: string | undefined;
            server.use(
                http.get(`${baseURL}/api/v1/dashboard/monthly-trend`, ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await reportClient.getMonthlyTrend();
            expect(result).toEqual(mockResponse);
            expect(capturedUrl).toContain('months=6');
        });

        it('includes company_nit and custom months', async () => {
            const mockResponse: MonthlyTrendResponse = {
                data: [{ month: '2024-01', ingresos: 1000000, gastos: 500000 }],
            };

            let capturedUrl: string | undefined;
            server.use(
                http.get(`${baseURL}/api/v1/dashboard/monthly-trend`, ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await reportClient.getMonthlyTrend('9001234561', 12);
            expect(result).toEqual(mockResponse);
            expect(capturedUrl).toContain('company_nit=9001234561');
            expect(capturedUrl).toContain('months=12');
        });
    });

    describe('getDashboardStats', () => {
        it('returns dashboard stats', async () => {
            const mockResponse: DashboardStatsResponse = {
                documentos_pendientes: 2,
                transacciones_procesadas_mes: 10,
                alertas_activas: 0,
                total_activos_cop: 1000000,
                total_pasivos_cop: 500000,
                utilidad_neta_cop: 100000,
                efectivo_disponible_cop: 200000,
                iva_por_pagar: 19000,
                total_retenciones: 7000,
                transacciones_por_estado: { POSTED: 10 },
            };

            server.use(
                http.get(`${baseURL}/api/v1/dashboard/stats`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await reportClient.getDashboardStats();
            expect(result).toEqual(mockResponse);
        });

        it('includes company_nit query param when provided', async () => {
            const mockResponse: DashboardStatsResponse = {
                documentos_pendientes: 0,
                transacciones_procesadas_mes: 0,
                alertas_activas: 0,
                total_activos_cop: 0,
                total_pasivos_cop: 0,
                utilidad_neta_cop: 0,
                efectivo_disponible_cop: 0,
                iva_por_pagar: 0,
                total_retenciones: 0,
                transacciones_por_estado: {},
            };

            let capturedUrl: string | undefined;
            server.use(
                http.get(`${baseURL}/api/v1/dashboard/stats`, ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json(mockResponse);
                })
            );

            await reportClient.getDashboardStats('9001234561');
            expect(capturedUrl).toContain('company_nit=9001234561');
        });
    });

    describe('exportReport', () => {
        it('returns blob for pdf export', async () => {
            const blob = new Blob(['pdf content'], { type: 'application/pdf' });

            server.use(
                http.get(`${baseURL}/api/v1/reports/export/balance`, () => {
                    return new HttpResponse(blob, {
                        headers: { 'Content-Type': 'application/pdf' },
                    });
                })
            );

            const result = await reportClient.exportReport('balance', 'pdf');
            expect(result).toBe('pdf content');
        });

        it('includes company_nit and format in query params', async () => {
            const blob = new Blob(['excel content'], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });

            let capturedUrl: string | undefined;
            server.use(
                http.get(`${baseURL}/api/v1/reports/export/pnl`, ({ request }) => {
                    capturedUrl = request.url;
                    return new HttpResponse(blob, {
                        headers: {
                            'Content-Type':
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        },
                    });
                })
            );

            await reportClient.exportReport('pnl', 'excel', '9001234561');
            expect(capturedUrl).toContain('format=excel');
            expect(capturedUrl).toContain('company_nit=9001234561');
        });
    });
});
