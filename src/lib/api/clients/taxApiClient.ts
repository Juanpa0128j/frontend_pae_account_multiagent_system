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

    async fileDraft(
        draftId: string,
        dian_acknowledgment?: string
    ): Promise<TaxDeclarationDraft> {
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
        ivaRegime?: 'bimestral' | 'cuatrimestral'
    ): Promise<TaxCalendarResponse> {
        const params: Record<string, string | number> = { nit };
        if (year) params.year = year;
        if (ivaRegime) params.iva_regime = ivaRegime;

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
        const response = await this.client.get<ExogenaResponse>(
            `/api/v1/tax/exogena/${formato}`,
            { params: { company_nit: companyNit, year } }
        );
        return response.data;
    }

    // ── Tarifas Renta ──────────────────────────────────────────────────────

    async getTarifasRenta(year?: number): Promise<TarifaRenta[]> {
        const response = await this.client.get<{ tarifas: TarifaRenta[] }>(
            '/api/v1/tax/tarifas-renta',
            { params: year ? { year } : {} }
        );
        return response.data.tarifas;
    }

    async createOrUpdateTarifa(payload: CreateTarifaRequest): Promise<TarifaRenta> {
        const response = await this.client.post<TarifaRenta>('/api/v1/tax/tarifas-renta', payload);
        return response.data;
    }

    async deleteTarifa(id: number): Promise<void> {
        await this.client.delete(`/api/v1/tax/tarifas-renta/${id}`);
    }

    // ── ReteICA Tarifas ────────────────────────────────────────────────────

    async listReteicaTarifas(municipio?: string): Promise<ReteicaTarifa[]> {
        const params: Record<string, string> = {};
        if (municipio) params.municipio = municipio;
        const response = await this.client.get<ReteicaTarifa[]>('/api/v1/tax/reteica-tarifas', {
            params,
        });
        return response.data;
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

    async listTaxConcepts(activo = true): Promise<TaxConcept[]> {
        const response = await this.client.get<TaxConcept[]>('/api/v1/tax/concepts', {
            params: { activo },
        });
        return response.data;
    }

    async upsertTaxConcept(payload: TaxConceptUpsertRequest): Promise<TaxConcept> {
        const response = await this.client.put<TaxConcept>('/api/v1/tax/concepts', payload);
        return response.data;
    }

    async softDeleteTaxConcept(code: string): Promise<void> {
        await this.client.delete(`/api/v1/tax/concepts/${code}`);
    }
}
