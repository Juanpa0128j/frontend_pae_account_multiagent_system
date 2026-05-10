import { AxiosInstance } from 'axios';
import {
    BalanceSheet,
    ProfitAndLoss,
    CashFlow,
    LibroMayorEntry,
    LibroAuxiliarLine,
    MonthlyTrendResponse,
    DashboardStatsResponse,
    ReportExportType,
    ReportExportFormat,
    FinancialStatementResponse,
    ReportExportParams,
    ReportExportDownload,
} from '@/types/api';

export interface GeneralLedgerResponse {
    entries: Array<Record<string, unknown>>;
}

export interface GeneralLedgerParams {
    company_nit?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
}

export interface LibroMayorParams {
    company_nit?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
}

export interface LibroAuxiliarParams {
    cuenta_puc: string;
    company_nit?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
}

export class ReportApiClient {
    constructor(private client: AxiosInstance) {}

    async getBalance(companyNit?: string): Promise<BalanceSheet> {
        const response = await this.client.get<BalanceSheet>('/api/v1/reports/balance', {
            params: companyNit ? { company_nit: companyNit } : undefined,
        });
        return response.data;
    }

    async getProfitAndLoss(companyNit?: string): Promise<ProfitAndLoss> {
        const response = await this.client.get<ProfitAndLoss>('/api/v1/reports/pnl', {
            params: companyNit ? { company_nit: companyNit } : undefined,
        });
        return response.data;
    }

    async getCashFlow(companyNit?: string): Promise<CashFlow> {
        const response = await this.client.get<CashFlow>('/api/v1/reports/cashflow', {
            params: companyNit ? { company_nit: companyNit } : undefined,
        });
        return response.data;
    }

    async getGeneralLedger(params?: GeneralLedgerParams): Promise<GeneralLedgerResponse> {
        const response = await this.client.get<GeneralLedgerResponse>(
            '/api/v1/reports/general-ledger',
            {
                params,
            }
        );
        return response.data;
    }

    async getLibroMayor(params?: LibroMayorParams): Promise<LibroMayorEntry[]> {
        const response = await this.client.get<LibroMayorEntry[]>('/api/v1/reports/libro-mayor', {
            params,
        });
        return response.data;
    }

    async getLibroAuxiliar(params?: LibroAuxiliarParams): Promise<LibroAuxiliarLine[]> {
        const response = await this.client.get<LibroAuxiliarLine[]>(
            '/api/v1/reports/libro-auxiliar',
            {
                params,
            }
        );
        return response.data;
    }

    async getMonthlyTrend(companyNit?: string, months = 6): Promise<MonthlyTrendResponse> {
        const response = await this.client.get<MonthlyTrendResponse>(
            '/api/v1/dashboard/monthly-trend',
            {
                params: { months, ...(companyNit ? { company_nit: companyNit } : {}) },
            }
        );
        return response.data;
    }

    async getDashboardStats(companyNit?: string): Promise<DashboardStatsResponse> {
        const response = await this.client.get<DashboardStatsResponse>('/api/v1/dashboard/stats', {
            params: companyNit ? { company_nit: companyNit } : undefined,
        });
        return response.data;
    }

    async exportReport(
        type: ReportExportType,
        format: ReportExportFormat,
        companyNit?: string
    ): Promise<Blob> {
        const response = await this.client.get<Blob>(`/api/v1/reports/export/${type}`, {
            params: { format, ...(companyNit ? { company_nit: companyNit } : {}) },
            responseType: 'blob',
        });
        return response.data;
    }

    async getStatements(params?: {
        company_nit?: string;
        statement_type?: string;
        source_mode?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<FinancialStatementResponse[]> {
        const response = await this.client.get<FinancialStatementResponse[]>(
            '/api/v1/reports/statements',
            { params }
        );
        return response.data;
    }

    async getStatement(statementId: string): Promise<FinancialStatementResponse> {
        const response = await this.client.get<FinancialStatementResponse>(
            `/api/v1/reports/statements/${statementId}`
        );
        return response.data;
    }

    async getBooks(params: {
        tipo: 'diario' | 'mayor' | 'auxiliar' | 'balance';
        fecha_inicio?: string;
        fecha_fin?: string;
        cuenta_puc?: string;
        tercero_nit?: string;
        company_nit?: string;
        signal?: AbortSignal;
    }): Promise<any[]> {
        const { signal, ...queryParams } = params;
        const response = await this.client.get('/api/v1/books/', {
            params: queryParams,
            signal,
        });
        return response.data;
    }

    async downloadReportExport(params: ReportExportParams): Promise<ReportExportDownload> {
        if (!params.company_nit || params.company_nit.trim().length === 0) {
            throw new Error('company_nit is required when statement_id is provided');
        }

        const endpoint = `/api/v1/reports/${params.report_type}/download/${params.format}`;

        const response = await this.client.get<Blob>(endpoint, {
            params: {
                statement_id: params.statement_id,
                company_name: params.company_name,
                company_nit: params.company_nit,
            },
            responseType: 'blob',
        });

        const contentDisposition = response.headers['content-disposition'];
        const filename =
            this.extractFilenameFromContentDisposition(contentDisposition) ??
            `${params.report_type}_${params.statement_id}.${params.format === 'excel' ? 'xlsx' : 'pdf'}`;

        return {
            blob: response.data,
            filename,
            contentType: String(response.headers['content-type'] ?? 'application/octet-stream'),
        };
    }

    async downloadStatementExport(
        statementType:
            | 'libro_diario'
            | 'libro_auxiliar'
            | 'cambios_patrimonio'
            | 'notas_estados_financieros',
        format: ReportExportFormat,
        statementId: string,
        companyName: string = 'Empresa',
        companyNit: string
    ): Promise<ReportExportDownload> {
        return this.downloadReportExport({
            report_type: statementType,
            format,
            statement_id: statementId,
            company_name: companyName,
            company_nit: companyNit,
        });
    }

    private extractFilenameFromContentDisposition(
        contentDisposition: string | undefined
    ): string | null {
        if (!contentDisposition) return null;

        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (utf8Match?.[1]) {
            try {
                return decodeURIComponent(utf8Match[1]).replace(/[\"']/g, '');
            } catch {
                return utf8Match[1].replace(/[\"']/g, '');
            }
        }

        const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
        if (plainMatch?.[1]) {
            return plainMatch[1].trim();
        }

        return null;
    }
}
