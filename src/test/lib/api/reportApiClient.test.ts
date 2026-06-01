import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiClient } from '@/lib/api/core/apiClient';
import type {
    BalanceSheet,
    IVAReport,
    WithholdingsReport,
    DashboardStatsResponse,
    ReportExportDownload,
} from '@/types';

function makeClient(): ApiClient {
    return {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    } as unknown as ApiClient;
}

describe('ReportApiClient', () => {
    let client: ApiClient;

    beforeEach(async () => {
        client = makeClient();
        vi.clearAllMocks();
    });

    describe('getBalance', () => {
        it('calls GET /api/v1/reports/balance without params when no nit', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            const data: BalanceSheet = {
                period_start: null,
                period_end: '2026-01-31',
                company_nit: null,
                activos: 100,
                pasivos: 50,
                patrimonio: 50,
                utilidad_neta: 10,
                patrimonio_total: 60,
                cuadre: true,
            };
            vi.mocked(client.get).mockResolvedValueOnce({ data } as never);
            const result = await apiClient.getBalance();
            expect(client.get).toHaveBeenCalledWith('/api/v1/reports/balance', {
                params: undefined,
            });
            expect(result).toEqual(data);
        });

        it('passes company_nit as param when provided', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            vi.mocked(client.get).mockResolvedValueOnce({ data: {} } as never);
            await apiClient.getBalance('800999888-2');
            expect(client.get).toHaveBeenCalledWith('/api/v1/reports/balance', {
                params: { company_nit: '800999888-2' },
            });
        });
    });

    describe('getProfitAndLoss', () => {
        it('calls GET /api/v1/reports/pnl', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            vi.mocked(client.get).mockResolvedValueOnce({ data: {} } as never);
            await apiClient.getProfitAndLoss();
            expect(client.get).toHaveBeenCalledWith('/api/v1/reports/pnl', { params: undefined });
        });
    });

    describe('getCashFlow', () => {
        it('calls GET /api/v1/reports/cashflow', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            vi.mocked(client.get).mockResolvedValueOnce({ data: {} } as never);
            await apiClient.getCashFlow('123');
            expect(client.get).toHaveBeenCalledWith('/api/v1/reports/cashflow', {
                params: { company_nit: '123' },
            });
        });
    });

    describe('getIVA', () => {
        it('calls GET /api/v1/tax/iva with start_date/end_date params', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            const data: IVAReport = {
                period_end: '2026-01-31',
                period_start: '2026-01-01',
                company_nit: null,
                iva_generado: 100,
                iva_descontable: 50,
                iva_a_pagar: 50,
                referencias: [],
            };
            vi.mocked(client.get).mockResolvedValueOnce({ data } as never);
            const result = await apiClient.getIVA('nit1', '2026-01-01', '2026-01-31');
            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/iva', {
                params: {
                    company_nit: 'nit1',
                    start_date: '2026-01-01',
                    end_date: '2026-01-31',
                },
            });
            expect(result).toEqual(data);
        });
    });

    describe('getWithholdings', () => {
        it('calls GET /api/v1/tax/withholdings', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            const data: WithholdingsReport = {
                period_end: '2026-01-31',
                period_start: null,
                company_nit: null,
                retencion_en_la_fuente: 0,
                retencion_ica: 0,
                total_retenciones: 0,
                referencias: [],
            };
            vi.mocked(client.get).mockResolvedValueOnce({ data } as never);
            const result = await apiClient.getWithholdings();
            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/withholdings', {
                params: undefined,
            });
            expect(result).toEqual(data);
        });
    });

    describe('getTransactions', () => {
        it('calls GET /api/v1/transactions with status and company_nit', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            vi.mocked(client.get).mockResolvedValueOnce({ data: [] } as never);
            await apiClient.getTransactions('POSTED', 'nit2');
            expect(client.get).toHaveBeenCalledWith('/api/v1/transactions', {
                params: { status: 'POSTED', company_nit: 'nit2' },
                signal: undefined,
            });
        });
    });

    describe('getTransactionDetail', () => {
        it('calls GET /api/v1/transactions/{id}', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            vi.mocked(client.get).mockResolvedValueOnce({ data: {} } as never);
            await apiClient.getTransactionDetail('tx-123');
            expect(client.get).toHaveBeenCalledWith('/api/v1/transactions/tx-123', {
                signal: undefined,
            });
        });
    });

    describe('deleteTransaction', () => {
        it('calls DELETE /api/v1/transactions/{id}', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined } as never);
            await apiClient.deleteTransaction('tx-456');
            expect(client.delete).toHaveBeenCalledWith('/api/v1/transactions/tx-456');
        });
    });

    describe('deleteTransactionsByIngest', () => {
        it('calls DELETE /api/v1/transactions/by-ingest/{ingestId}', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            vi.mocked(client.delete).mockResolvedValueOnce({ data: { deleted: 3 } } as never);
            const result = await apiClient.deleteTransactionsByIngest('ing-1');
            expect(client.delete).toHaveBeenCalledWith('/api/v1/transactions/by-ingest/ing-1');
            expect(result).toEqual({ deleted: 3 });
        });
    });

    describe('setTransactionFecha', () => {
        it('calls PATCH /api/v1/transactions/{id}/fecha', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            vi.mocked(client.patch).mockResolvedValueOnce({
                data: { id: 'tx-1', fecha: '2026-01-15' },
            } as never);
            const result = await apiClient.setTransactionFecha('tx-1', '2026-01-15');
            expect(client.patch).toHaveBeenCalledWith('/api/v1/transactions/tx-1/fecha', {
                fecha: '2026-01-15',
            });
            expect(result).toEqual({ id: 'tx-1', fecha: '2026-01-15' });
        });
    });

    describe('getLibroDiario', () => {
        it('calls GET /api/v1/books/ with tipo=diario', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            vi.mocked(client.get).mockResolvedValueOnce({ data: [] } as never);
            await apiClient.getLibroDiario('2026-01-01', '2026-01-31');
            expect(client.get).toHaveBeenCalledWith('/api/v1/books/', {
                params: { tipo: 'diario', fecha_inicio: '2026-01-01', fecha_fin: '2026-01-31' },
            });
        });
    });

    describe('getDashboardStats', () => {
        it('calls GET /api/v1/dashboard/stats', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            const data: DashboardStatsResponse = {
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
            vi.mocked(client.get).mockResolvedValueOnce({ data } as never);
            const result = await apiClient.getDashboardStats('nit3');
            expect(client.get).toHaveBeenCalledWith('/api/v1/dashboard/stats', {
                params: { company_nit: 'nit3' },
            });
            expect(result).toEqual(data);
        });
    });

    describe('getMonthlyTrend', () => {
        it('calls GET /api/v1/dashboard/monthly-trend with months param', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            vi.mocked(client.get).mockResolvedValueOnce({ data: { data: [] } } as never);
            await apiClient.getMonthlyTrend('nit4', 12);
            expect(client.get).toHaveBeenCalledWith('/api/v1/dashboard/monthly-trend', {
                params: { months: 12, company_nit: 'nit4' },
            });
        });
    });

    describe('getStatements', () => {
        it('calls GET /api/v1/reports/statements', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            vi.mocked(client.get).mockResolvedValueOnce({ data: [] } as never);
            await apiClient.getStatements({ company_nit: 'nit5' });
            expect(client.get).toHaveBeenCalledWith('/api/v1/reports/statements', {
                params: { company_nit: 'nit5' },
                signal: undefined,
            });
        });
    });

    describe('getDerivationStatus', () => {
        it('calls GET /api/v1/reports/derivation/status', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            vi.mocked(client.get).mockResolvedValueOnce({ data: {} } as never);
            await apiClient.getDerivationStatus('nit6');
            expect(client.get).toHaveBeenCalledWith('/api/v1/reports/derivation/status', {
                params: { company_nit: 'nit6' },
            });
        });
    });

    describe('runDerivation', () => {
        it('calls POST /api/v1/reports/derivation/run with query params', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            vi.mocked(client.post).mockResolvedValueOnce({
                data: { status: 'ok', result: {} },
            } as never);
            const result = await apiClient.runDerivation('nit7', '2026-01-01', '2026-01-31');
            expect(client.post).toHaveBeenCalledWith('/api/v1/reports/derivation/run', null, {
                params: { company_nit: 'nit7', start_date: '2026-01-01', end_date: '2026-01-31' },
            });
            expect(result).toEqual({ status: 'ok', result: {} });
        });
    });

    describe('downloadReportExport', () => {
        it('calls GET with responseType blob and builds result', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            const blob = new Blob(['pdf'], { type: 'application/pdf' });
            vi.mocked(client.get).mockResolvedValueOnce({
                data: blob,
                headers: {
                    'content-disposition': 'attachment; filename="balance.pdf"',
                    'content-type': 'application/pdf',
                },
            } as never);
            const result: ReportExportDownload = await apiClient.downloadReportExport({
                report_type: 'balance',
                format: 'pdf',
                statement_id: 'stmt-1',
                company_nit: 'nit8',
            });
            expect(client.get).toHaveBeenCalledWith(
                '/api/v1/reports/balance/download/pdf',
                expect.objectContaining({ responseType: 'blob' })
            );
            expect(result.filename).toBe('balance.pdf');
        });

        it('throws when company_nit is empty', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            await expect(
                apiClient.downloadReportExport({
                    report_type: 'balance',
                    format: 'pdf',
                    statement_id: 'stmt-1',
                    company_nit: '  ',
                })
            ).rejects.toThrow('company_nit is required');
        });
    });

    describe('getPerdidasAcumuladas', () => {
        it('calls GET /api/v1/tax/perdidas-acumuladas and returns perdidas array', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            const perdidas = [
                {
                    id: 1,
                    company_nit: 'nit9',
                    year: 2025,
                    monto_perdida: 1000,
                    monto_compensado: 0,
                    monto_pendiente: 1000,
                },
            ];
            vi.mocked(client.get).mockResolvedValueOnce({ data: { perdidas } } as never);
            const result = await apiClient.getPerdidasAcumuladas('nit9', 2025);
            expect(client.get).toHaveBeenCalledWith('/api/v1/tax/perdidas-acumuladas', {
                params: { nit: 'nit9', year: 2025 },
            });
            expect(result).toEqual(perdidas);
        });

        it('handles backend list-direct shape (response_model=list[...])', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            const perdidas = [
                {
                    id: 1,
                    company_nit: 'nit9',
                    year: 2025,
                    monto_perdida: 1000,
                    monto_compensado: 0,
                    monto_pendiente: 1000,
                },
            ];
            vi.mocked(client.get).mockResolvedValueOnce({ data: perdidas } as never);
            const result = await apiClient.getPerdidasAcumuladas('nit9', 2025);
            expect(result).toEqual(perdidas);
        });
    });

    describe('deletePerdida', () => {
        it('calls DELETE /api/v1/tax/perdidas-acumuladas/{id}', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined } as never);
            await apiClient.deletePerdida(42);
            expect(client.delete).toHaveBeenCalledWith('/api/v1/tax/perdidas-acumuladas/42');
        });
    });

    describe('runDerivationViaA', () => {
        it('returns prior_period_warning when present in response', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            const responseData = {
                status: 'ok',
                first_level: {},
                derived: {},
                prior_period_warning: 'Período anterior incompleto',
            };
            vi.mocked(client.post).mockResolvedValueOnce({ data: responseData } as never);
            const result = await apiClient.runDerivationViaA('nit1', '2026-01-01', '2026-01-31');
            expect(result.prior_period_warning).toBe('Período anterior incompleto');
        });

        it('returns undefined prior_period_warning when absent', async () => {
            const { ReportApiClient } = await import('@/lib/api/clients/reportApiClient');
            const apiClient = new ReportApiClient(client);
            vi.mocked(client.post).mockResolvedValueOnce({
                data: { status: 'ok', first_level: {}, derived: {} },
            } as never);
            const result = await apiClient.runDerivationViaA('nit1', '2026-01-01', '2026-01-31');
            expect(result.prior_period_warning).toBeUndefined();
        });
    });
});
