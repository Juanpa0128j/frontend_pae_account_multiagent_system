import type { ApiClient } from '../core/apiClient';
import type {
    BalanceSheet,
    ProfitAndLoss,
    CashFlow,
    IVAReport,
    WithholdingsReport,
    DashboardStatsResponse,
    FinancialStatementResponse,
    ReportExportDownload,
    TransactionListItem,
    TransactionDetailResponse,
    TransactionSearchParams,
    BookQueryParams,
    LibroDiarioLine,
    LibroMayorEntry,
    LibroAuxiliarLine,
    BalanceGeneralEntry,
    DerivationStatusResponse,
    ViaADerivationStatus,
    ReportExportParams,
    ReportExportFormat,
    ICADeclaracionResponse,
    RentaProvisionResponse,
    PerdidaFiscal,
    CreatePerdidaRequest,
    MonthlyTrendResponse,
    CreateTransactionPayload,
    UpdateTransactionPayload,
    ReprocessResponse,
    CreateTransactionResponse,
} from '@/types';

export class ReportApiClient {
    constructor(private readonly client: ApiClient) {}

    // -------------------------------------------------------------------------
    // Financial Reports
    // -------------------------------------------------------------------------

    async getBalance(company_nit?: string): Promise<BalanceSheet> {
        const response = await this.client.get<BalanceSheet>('/api/v1/reports/balance', {
            params: company_nit ? { company_nit } : undefined,
        });
        return response.data;
    }

    async getProfitAndLoss(company_nit?: string): Promise<ProfitAndLoss> {
        const response = await this.client.get<ProfitAndLoss>('/api/v1/reports/pnl', {
            params: company_nit ? { company_nit } : undefined,
        });
        return response.data;
    }

    async getCashFlow(company_nit?: string): Promise<CashFlow> {
        const response = await this.client.get<CashFlow>('/api/v1/reports/cashflow', {
            params: company_nit ? { company_nit } : undefined,
        });
        return response.data;
    }

    async getIVA(
        company_nit?: string,
        periodStart?: string,
        periodEnd?: string
    ): Promise<IVAReport> {
        const params: Record<string, string> = {};
        if (company_nit) params.company_nit = company_nit;
        if (periodStart) params.start_date = periodStart;
        if (periodEnd) params.end_date = periodEnd;
        const response = await this.client.get<IVAReport>('/api/v1/tax/iva', {
            params: Object.keys(params).length > 0 ? params : undefined,
        });
        return response.data;
    }

    async getWithholdings(
        company_nit?: string,
        periodStart?: string,
        periodEnd?: string
    ): Promise<WithholdingsReport> {
        const params: Record<string, string> = {};
        if (company_nit) params.company_nit = company_nit;
        if (periodStart) params.start_date = periodStart;
        if (periodEnd) params.end_date = periodEnd;
        const response = await this.client.get<WithholdingsReport>('/api/v1/tax/withholdings', {
            params: Object.keys(params).length > 0 ? params : undefined,
        });
        return response.data;
    }

    async getICA(
        company_nit: string,
        periodStart?: string,
        periodEnd?: string
    ): Promise<ICADeclaracionResponse> {
        const params: Record<string, string> = { company_nit };
        if (periodStart) params.start_date = periodStart;
        if (periodEnd) params.end_date = periodEnd;
        const response = await this.client.get<ICADeclaracionResponse>('/api/v1/tax/ica', {
            params,
        });
        return response.data;
    }

    async getRentaProvision(
        company_nit: string,
        periodStart?: string,
        periodEnd?: string
    ): Promise<RentaProvisionResponse> {
        const params: Record<string, string> = { company_nit };
        if (periodStart) params.start_date = periodStart;
        if (periodEnd) params.end_date = periodEnd;
        const response = await this.client.get<RentaProvisionResponse>(
            '/api/v1/tax/renta-provision',
            { params }
        );
        return response.data;
    }

    // -------------------------------------------------------------------------
    // Transactions
    // -------------------------------------------------------------------------

    async getTransactions(
        status?: string,
        company_nit?: string,
        options?: { signal?: AbortSignal }
    ): Promise<TransactionListItem[]> {
        const params: Record<string, string> = {};
        if (status) params.status = status;
        if (company_nit) params.company_nit = company_nit;
        const response = await this.client.get<TransactionListItem[]>('/api/v1/transactions', {
            params: Object.keys(params).length ? params : undefined,
            signal: options?.signal,
        });
        return response.data;
    }

    async getTransactionDetail(
        id: string,
        options?: { signal?: AbortSignal }
    ): Promise<TransactionDetailResponse> {
        const response = await this.client.get<TransactionDetailResponse>(
            `/api/v1/transactions/${id}`,
            { signal: options?.signal }
        );
        return response.data;
    }

    async searchTransactions(
        params: TransactionSearchParams,
        options?: { signal?: AbortSignal }
    ): Promise<TransactionListItem[]> {
        const response = await this.client.get<TransactionListItem[]>(
            '/api/v1/transactions/search',
            { params, signal: options?.signal }
        );
        return response.data;
    }

    async deleteTransaction(id: string): Promise<void> {
        await this.client.delete(`/api/v1/transactions/${id}`);
    }

    async deleteTransactionsByIngest(ingestId: string): Promise<{ deleted: number }> {
        const response = await this.client.delete<{ deleted: number }>(
            `/api/v1/transactions/by-ingest/${ingestId}`
        );
        return response.data;
    }

    async setTransactionFecha(
        transactionId: string,
        fecha: string
    ): Promise<{ id: string; fecha: string }> {
        const response = await this.client.patch<{ id: string; fecha: string }>(
            `/api/v1/transactions/${transactionId}/fecha`,
            { fecha }
        );
        return response.data;
    }

    async createTransaction(payload: CreateTransactionPayload): Promise<CreateTransactionResponse> {
        const response = await this.client.post<CreateTransactionResponse>(
            '/api/v1/transactions',
            payload
        );
        return response.data;
    }

    async updateTransaction(
        id: string,
        payload: UpdateTransactionPayload
    ): Promise<{ id: string; fecha: string; concepto: string; total: number; status: string }> {
        const response = await this.client.patch<{
            id: string;
            fecha: string;
            concepto: string;
            total: number;
            status: string;
        }>(`/api/v1/transactions/${id}`, payload);
        return response.data;
    }

    async reprocessTransaction(
        id: string,
        payload?: CreateTransactionPayload
    ): Promise<ReprocessResponse> {
        const response = await this.client.post<ReprocessResponse>(
            `/api/v1/transactions/${id}/reprocess`,
            payload ?? {}
        );
        return response.data;
    }

    // -------------------------------------------------------------------------
    // Books (Libros Contables)
    // -------------------------------------------------------------------------

    async getLibroDiario(fecha_inicio?: string, fecha_fin?: string): Promise<LibroDiarioLine[]> {
        const response = await this.client.get<LibroDiarioLine[]>('/api/v1/books/', {
            params: { tipo: 'diario', fecha_inicio, fecha_fin },
        });
        return response.data;
    }

    async getLibroMayor(fecha_inicio?: string, fecha_fin?: string): Promise<LibroMayorEntry[]> {
        const response = await this.client.get<LibroMayorEntry[]>('/api/v1/books/', {
            params: { tipo: 'mayor', fecha_inicio, fecha_fin },
        });
        return response.data;
    }

    async getLibroAuxiliar(
        cuenta_puc: string,
        fecha_inicio?: string,
        fecha_fin?: string
    ): Promise<LibroAuxiliarLine[]> {
        const response = await this.client.get<LibroAuxiliarLine[]>('/api/v1/books/', {
            params: { tipo: 'auxiliar', cuenta_puc, fecha_inicio, fecha_fin },
        });
        return response.data;
    }

    async getBalanceGeneral(fecha_fin?: string): Promise<BalanceGeneralEntry[]> {
        const response = await this.client.get<BalanceGeneralEntry[]>('/api/v1/books/', {
            params: { tipo: 'balance', fecha_fin },
        });
        return response.data;
    }

    async getBooks(params: BookQueryParams): Promise<unknown[]> {
        const { signal, ...queryParams } = params;
        const response = await this.client.get<unknown[]>('/api/v1/books/', {
            params: queryParams,
            signal,
        });
        return response.data;
    }

    // -------------------------------------------------------------------------
    // Dashboard
    // -------------------------------------------------------------------------

    async getDashboardStats(company_nit?: string): Promise<DashboardStatsResponse> {
        const response = await this.client.get<DashboardStatsResponse>('/api/v1/dashboard/stats', {
            params: company_nit ? { company_nit } : undefined,
        });
        return response.data;
    }

    async getMonthlyTrend(company_nit?: string, months = 6): Promise<MonthlyTrendResponse> {
        const response = await this.client.get<MonthlyTrendResponse>(
            '/api/v1/dashboard/monthly-trend',
            { params: { months, ...(company_nit ? { company_nit } : {}) } }
        );
        return response.data;
    }

    // -------------------------------------------------------------------------
    // Financial Statements (Via B pipeline)
    // -------------------------------------------------------------------------

    async getStatements(
        params?: {
            company_nit?: string;
            statement_type?: string;
            source_mode?: string;
            start_date?: string;
            end_date?: string;
        },
        opts?: { signal?: AbortSignal }
    ): Promise<FinancialStatementResponse[]> {
        const response = await this.client.get<FinancialStatementResponse[]>(
            '/api/v1/reports/statements',
            { params, signal: opts?.signal }
        );
        return response.data;
    }

    async getStatement(statementId: string): Promise<FinancialStatementResponse> {
        const response = await this.client.get<FinancialStatementResponse>(
            `/api/v1/reports/statements/${statementId}`
        );
        return response.data;
    }

    // -------------------------------------------------------------------------
    // Vía B Manual Derivation
    // -------------------------------------------------------------------------

    async getDerivationStatus(company_nit: string): Promise<DerivationStatusResponse> {
        const response = await this.client.get<DerivationStatusResponse>(
            '/api/v1/reports/derivation/status',
            { params: { company_nit } }
        );
        return response.data;
    }

    async runDerivation(
        company_nit: string,
        start_date: string,
        end_date: string
    ): Promise<{ status: string; result: Record<string, unknown> }> {
        const response = await this.client.post<{
            status: string;
            result: Record<string, unknown>;
        }>('/api/v1/reports/derivation/run', null, {
            params: { company_nit, start_date, end_date },
        });
        return response.data;
    }

    async getDerivationStatusViaA(company_nit: string): Promise<ViaADerivationStatus> {
        const response = await this.client.get<ViaADerivationStatus>(
            '/api/v1/reports/derivation/status-via-a',
            { params: { company_nit } }
        );
        return response.data;
    }

    async runDerivationViaA(
        company_nit: string,
        start_date: string,
        end_date: string
    ): Promise<{
        status: string;
        first_level: Record<string, unknown>;
        derived: Record<string, unknown>;
        prior_period_warning?: string;
    }> {
        const response = await this.client.post<{
            status: string;
            first_level: Record<string, unknown>;
            derived: Record<string, unknown>;
            prior_period_warning?: string;
        }>('/api/v1/reports/derivation/run-via-a', null, {
            params: { company_nit, start_date, end_date },
        });
        return response.data;
    }

    // -------------------------------------------------------------------------
    // Exports
    // -------------------------------------------------------------------------

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

        const contentDisposition = (response as { headers: Record<string, string> }).headers[
            'content-disposition'
        ];
        const filename =
            extractFilenameFromContentDisposition(contentDisposition) ??
            `${params.report_type}_${params.statement_id}.${params.format === 'excel' ? 'xlsx' : 'pdf'}`;

        return {
            blob: response.data,
            filename,
            contentType: String(
                (response as { headers: Record<string, string> }).headers['content-type'] ??
                    'application/octet-stream'
            ),
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

    // -------------------------------------------------------------------------
    // Perdidas Fiscales
    // -------------------------------------------------------------------------

    async getPerdidasAcumuladas(nit: string, year?: number): Promise<PerdidaFiscal[]> {
        const params: Record<string, string | number> = { nit };
        if (year) params.year = year;
        // Backend returns the list directly (response_model=list[PerdidaFiscalResponse]).
        // Tolerate the legacy wrapped shape {perdidas: [...]} so older mocks
        // and any reverse-proxy that wraps the body still work.
        const response = await this.client.get<PerdidaFiscal[] | { perdidas: PerdidaFiscal[] }>(
            '/api/v1/tax/perdidas-acumuladas',
            { params }
        );
        const raw = response.data;
        return Array.isArray(raw) ? raw : (raw?.perdidas ?? []);
    }

    async createOrUpdatePerdida(payload: CreatePerdidaRequest): Promise<PerdidaFiscal> {
        const response = await this.client.post<PerdidaFiscal>(
            '/api/v1/tax/perdidas-acumuladas',
            payload
        );
        return response.data;
    }

    async deletePerdida(id: number): Promise<void> {
        await this.client.delete(`/api/v1/tax/perdidas-acumuladas/${id}`);
    }
}

// ---------------------------------------------------------------------------
// Private helper — mirrors extractFilenameFromContentDisposition in api.ts
// ---------------------------------------------------------------------------

function extractFilenameFromContentDisposition(
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

    const plainMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
    if (plainMatch?.[1]) {
        return plainMatch[1].trim();
    }

    return null;
}
