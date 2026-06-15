import type { ApiClient } from '@/lib/api/core/apiClient';
import type {
    TaxConstantsResponse,
    UvtValue,
    BaseMinima,
    PreflightResponse,
    TaxFormType,
    GenerateDraftRequest,
    TaxDeclarationDraft,
    UpdateFieldRequest,
    TaxCalendarResponse,
    F220Response,
    ExogenaResponse,
    TarifaRenta,
    CreateTarifaRequest,
    ReteicaTarifa,
    ReteicaTarifaUpsertRequest,
    TaxConcept,
    TaxConceptUpsertRequest,
    NationalRate,
    NationalRateUpdateRequest,
    EffectiveRate,
    CompanyRateOverrideRequest,
    SpecialTax,
    SpecialTaxCreateRequest,
} from '@/types';

export class TaxApiClient {
    constructor(private readonly client: ApiClient) {}

    // ── Tax Constants ──────────────────────────────────────────────────────

    async getTaxConstants(year: number): Promise<TaxConstantsResponse> {
        const response = await this.client.get<TaxConstantsResponse>('/api/v1/tax/constants', {
            params: { year },
        });
        return response.data;
    }

    async upsertUvt(payload: UvtValue): Promise<UvtValue> {
        const response = await this.client.put<UvtValue>('/api/v1/tax/constants/uvt', payload);
        return response.data;
    }

    async upsertBaseMinima(payload: BaseMinima): Promise<BaseMinima> {
        const response = await this.client.put<BaseMinima>(
            '/api/v1/tax/constants/base-minima',
            payload
        );
        return response.data;
    }

    // ── Declaration Preflight ──────────────────────────────────────────────

    async getDeclarationPreflight(params: {
        companyNit: string;
        formType: TaxFormType;
        periodStart: string;
        periodEnd: string;
    }): Promise<PreflightResponse> {
        const response = await this.client.get<PreflightResponse>(
            '/api/v1/tax/declarations/preflight',
            {
                params: {
                    company_nit: params.companyNit,
                    form_type: params.formType,
                    period_start: params.periodStart,
                    period_end: params.periodEnd,
                },
            }
        );
        return response.data;
    }

    // ── Declarations CRUD ──────────────────────────────────────────────────

    async generateDeclarationDraft(data: GenerateDraftRequest): Promise<TaxDeclarationDraft> {
        const response = await this.client.post<TaxDeclarationDraft>(
            '/api/v1/tax/declarations/generate',
            data
        );
        return response.data;
    }

    async getDeclarationDraft(draftId: string): Promise<TaxDeclarationDraft> {
        const response = await this.client.get<TaxDeclarationDraft>(
            `/api/v1/tax/declarations/${draftId}`
        );
        return response.data;
    }

    async updateDraftField(
        draftId: string,
        data: UpdateFieldRequest
    ): Promise<TaxDeclarationDraft> {
        const response = await this.client.patch<TaxDeclarationDraft>(
            `/api/v1/tax/declarations/${draftId}/fields`,
            data
        );
        return response.data;
    }

    async reviewDraft(draftId: string): Promise<TaxDeclarationDraft> {
        const response = await this.client.post<TaxDeclarationDraft>(
            `/api/v1/tax/declarations/${draftId}/review`
        );
        return response.data;
    }

    async fileDraft(draftId: string, dian_acknowledgment?: string): Promise<TaxDeclarationDraft> {
        const response = await this.client.post<TaxDeclarationDraft>(
            `/api/v1/tax/declarations/${draftId}/file`,
            dian_acknowledgment ? { dian_acknowledgment } : {}
        );
        return response.data;
    }

    async reopenDraft(draftId: string, reason: string): Promise<TaxDeclarationDraft> {
        const response = await this.client.post<TaxDeclarationDraft>(
            `/api/v1/tax/declarations/${draftId}/reopen`,
            { reason }
        );
        return response.data;
    }

    // ── Tax Calendar ───────────────────────────────────────────────────────

    async getTaxCalendar(
        nit: string,
        year?: number,
        ivaRegime?: 'bimestral' | 'cuatrimestral',
        icaPeriodicidad?: 'anual' | 'bimestral'
    ): Promise<TaxCalendarResponse> {
        const params: Record<string, string | number> = { nit };
        if (year) params.year = year;
        if (ivaRegime) params.iva_regime = ivaRegime;
        // ICA is municipal — only request it when explicitly chosen. Backend
        // returns estimated dates flagged "(estimado — confirme calendario municipal)".
        if (icaPeriodicidad) params.ica_periodicidad = icaPeriodicidad;

        const response = await this.client.get<TaxCalendarResponse>('/api/v1/tax/calendar', {
            params,
        });
        return response.data;
    }

    // ── F220 Certificates ──────────────────────────────────────────────────

    async generateF220Certificates(companyNit: string, year: number): Promise<F220Response> {
        const response = await this.client.post<F220Response>(
            '/api/v1/tax/certificates/f220',
            null,
            { params: { company_nit: companyNit, year } }
        );
        return response.data;
    }

    // ── Exógena ────────────────────────────────────────────────────────────

    async getExogenaFormat(
        formato: '1001' | '2276',
        companyNit: string,
        year: number
    ): Promise<ExogenaResponse> {
        const response = await this.client.get<ExogenaResponse>(`/api/v1/tax/exogena/${formato}`, {
            params: { company_nit: companyNit, year },
        });
        return response.data;
    }

    // ── Tarifas Renta ──────────────────────────────────────────────────────

    // Statutory renta rates are system-wide (Colombian law per régimen) — not scoped per company.
    async getTarifasRenta(options?: {
        company_nit?: string;
        year?: number;
    }): Promise<TarifaRenta[]> {
        const params: Record<string, string | number> = {};
        if (options?.company_nit) params.company_nit = options.company_nit;
        if (options?.year) params.year = options.year;

        const response = await this.client.get<TarifaRenta[]>('/api/v1/tax/tarifas-renta', {
            params,
        });
        return response.data ?? [];
    }

    async createOrUpdateTarifa(payload: CreateTarifaRequest): Promise<TarifaRenta> {
        const response = await this.client.post<TarifaRenta>('/api/v1/tax/tarifas-renta', payload);
        return response.data;
    }

    async deleteTarifa(id: number): Promise<void> {
        await this.client.delete(`/api/v1/tax/tarifas-renta/${id}`);
    }

    // ── ReteICA Tarifas ────────────────────────────────────────────────────

    async listReteicaTarifas(nit: string, municipio?: string): Promise<ReteicaTarifa[]> {
        const params: Record<string, string> = { company_nit: nit };
        if (municipio) params.municipio = municipio;
        const response = await this.client.get<ReteicaTarifa[]>('/api/v1/tax/reteica-tarifas', {
            params,
        });
        return response.data ?? [];
    }

    async upsertReteicaTarifa(payload: ReteicaTarifaUpsertRequest): Promise<ReteicaTarifa> {
        const response = await this.client.put<ReteicaTarifa>(
            '/api/v1/tax/reteica-tarifas',
            payload
        );
        return response.data;
    }

    async deleteReteicaTarifa(id: number): Promise<void> {
        await this.client.delete(`/api/v1/tax/reteica-tarifas/${id}`);
    }

    // ── Tax Concepts ───────────────────────────────────────────────────────

    async listTaxConcepts(_nit: string, activo?: boolean): Promise<TaxConcept[]> {
        // Backend /api/v1/tax/concepts endpoint is currently empty;
        // concepts are returned embedded in the constants endpoint.
        const constants = await this.getTaxConstants(new Date().getFullYear());
        const concepts = constants.tax_concepts ?? [];
        if (activo === undefined) return concepts;
        return concepts.filter((c) => c.activo === activo);
    }

    async upsertTaxConcept(payload: TaxConceptUpsertRequest): Promise<TaxConcept> {
        const response = await this.client.put<TaxConcept>('/api/v1/tax/concepts', payload);
        return response.data;
    }

    async softDeleteTaxConcept(code: string): Promise<void> {
        await this.client.delete(`/api/v1/tax/concepts/${code}`);
    }

    // ── National Rates ─────────────────────────────────────────────────────

    async getNationalRates(): Promise<NationalRate[]> {
        const response = await this.client.get<NationalRate[]>('/api/v1/settings/national-rates');
        return response.data ?? [];
    }

    async upsertNationalRate(
        code: string,
        payload: NationalRateUpdateRequest
    ): Promise<NationalRate> {
        const response = await this.client.put<NationalRate>(
            `/api/v1/settings/national-rates/${code}`,
            payload
        );
        return response.data;
    }

    // ── Per-Company Rate Overrides ─────────────────────────────────────────────

    /**
     * GET /api/v1/settings/company/{nit}/rates
     * Returns effective rates: company override → national fallback.
     * Rows where overridden=true carry the company-specific value.
     */
    async getEffectiveRates(nit: string): Promise<EffectiveRate[]> {
        const response = await this.client.get<EffectiveRate[]>(
            `/api/v1/settings/company/${nit}/rates`
        );
        return response.data ?? [];
    }

    /**
     * PUT /api/v1/settings/company/{nit}/rates/{code}
     * Upsert a per-company rate override.
     */
    async upsertCompanyRateOverride(
        nit: string,
        code: string,
        payload: CompanyRateOverrideRequest
    ): Promise<EffectiveRate> {
        const response = await this.client.put<EffectiveRate>(
            `/api/v1/settings/company/${nit}/rates/${code}`,
            payload
        );
        return response.data;
    }

    // ── Special Taxes ──────────────────────────────────────────────────────

    async getSpecialTaxes(companyNit: string): Promise<SpecialTax[]> {
        const response = await this.client.get<SpecialTax[]>('/api/v1/settings/special-taxes', {
            params: { company_nit: companyNit },
        });
        return response.data ?? [];
    }

    async createSpecialTax(data: SpecialTaxCreateRequest): Promise<SpecialTax> {
        const response = await this.client.post<SpecialTax>('/api/v1/settings/special-taxes', data);
        return response.data;
    }

    async updateSpecialTax(
        id: string,
        data: Partial<SpecialTaxCreateRequest>
    ): Promise<SpecialTax> {
        const response = await this.client.put<SpecialTax>(
            `/api/v1/settings/special-taxes/${id}`,
            data
        );
        return response.data;
    }

    async deleteSpecialTax(id: string): Promise<void> {
        await this.client.delete(`/api/v1/settings/special-taxes/${id}`);
    }

    async toggleSpecialTaxActive(id: string): Promise<SpecialTax> {
        const response = await this.client.patch<SpecialTax>(
            `/api/v1/settings/special-taxes/${id}/toggle-active`
        );
        return response.data;
    }

    exportDeclarationDraft(draft: TaxDeclarationDraft): {
        filename: string;
        content: string;
        mimeType: string;
    } {
        const escapeCSV = (value: string | number): string => {
            const str = String(value);
            const escaped = str.replace(/"/g, '""');
            return `"${escaped}"`;
        };
        const headers = ['Renglón', 'Concepto', 'Valor', 'Fuente', 'Confianza', 'Estado'];
        const rows = draft.fields.map((field) => [
            escapeCSV(field.renglon),
            escapeCSV(field.label),
            escapeCSV(field.value),
            escapeCSV(field.source),
            escapeCSV(field.confidence.toUpperCase()),
            escapeCSV(field.requires_review ? 'REVISAR' : 'OK'),
        ]);
        const warningsSection = draft.warnings?.length
            ? draft.warnings
                  .map((w) => `# ADVERTENCIA: Renglón ${w.field} - ${w.message}`)
                  .join('\n') + '\n\n'
            : '';
        const csvContent =
            warningsSection +
            `// Formulario: ${draft.form_type}\n` +
            `// Período: ${draft.period_start} a ${draft.period_end}\n` +
            `// Empresa NIT: ${draft.company_nit}\n` +
            `// Generado: ${new Date().toISOString()}\n` +
            `// Total campos: ${draft.fields.length}\n` +
            `// Campos por revisar: ${draft.fields.filter((f) => f.requires_review).length}\n\n` +
            headers.join(',') +
            '\n' +
            rows.map((row) => row.join(',')).join('\n');
        const filename = `${draft.form_type}_${draft.period_start}_${draft.company_nit}.csv`;
        return { filename, content: csvContent, mimeType: 'text/csv;charset=utf-8;' };
    }
}
