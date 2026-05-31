import axios from 'axios';
import type { ApiClient } from '@/lib/api/core/apiClient';
import type {
    CompanySettingsResponse,
    CompanySettingsApiResponse,
    CompanySettingsRequest,
    CompanyProfileSetupRequest,
    CuentaPUC,
    CuentaPUCRequest,
    CompanyMembership,
} from '@/types';

export class CompanyApiClient {
    constructor(private readonly client: ApiClient) {}

    /**
     * GET /api/v1/settings/company/{nit}
     */
    async getCompanySettings(nit: string): Promise<CompanySettingsResponse | null> {
        try {
            const response = await this.client.get<CompanySettingsResponse>(
                `/api/v1/settings/company/${nit}`
            );
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            // Handle enriched errors from ApiClient interceptor (not AxiosError instances)
            if (error && typeof error === 'object' && 'status' in error) {
                const e = error as { status?: number };
                if (e.status === 404) return null;
            }
            throw error;
        }
    }

    /**
     * PUT /api/v1/settings/company/{nit}
     */
    async upsertCompanySettings(
        nit: string,
        payload: CompanySettingsRequest
    ): Promise<CompanySettingsResponse> {
        const response = await this.client.put<CompanySettingsResponse>(
            `/api/v1/settings/company/${nit}`,
            payload
        );
        return response.data;
    }

    /**
     * POST /api/v1/settings/company/{nit}/setup
     */
    async setupCompanySettings(
        nit: string,
        payload: CompanyProfileSetupRequest
    ): Promise<CompanySettingsResponse> {
        const response = await this.client.post<CompanySettingsResponse>(
            `/api/v1/settings/company/${nit}/setup`,
            payload
        );
        return response.data;
    }

    /**
     * GET /api/v1/settings/companies
     */
    async getCompanies(): Promise<CompanySettingsApiResponse[]> {
        const response = await this.client.get<CompanySettingsApiResponse[]>(
            '/api/v1/settings/companies'
        );
        return response.data;
    }

    /**
     * DELETE /api/v1/settings/company/{nit}
     */
    async deleteCompany(nit: string): Promise<void> {
        await this.client.delete(`/api/v1/settings/company/${encodeURIComponent(nit)}`);
    }

    /**
     * GET /api/v1/settings/municipios
     */
    async getMunicipios(): Promise<string[]> {
        const response = await this.client.get<string[]>('/api/v1/settings/municipios');
        return response.data;
    }

    /**
     * GET /api/v1/puc
     */
    async getPucList(params?: {
        company_nit?: string;
        search?: string;
        include_inactive?: boolean;
        limit?: number;
    }): Promise<CuentaPUC[]> {
        const response = await this.client.get<CuentaPUC[]>('/api/v1/puc', { params });
        return response.data;
    }

    /**
     * GET /api/v1/puc/{codigo}
     */
    async getPuc(codigo: string): Promise<CuentaPUC> {
        const response = await this.client.get<CuentaPUC>(`/api/v1/puc/${codigo}`);
        return response.data;
    }

    /**
     * POST /api/v1/puc
     */
    async createPuc(payload: CuentaPUCRequest & { company_nit?: string }): Promise<CuentaPUC> {
        const response = await this.client.post<CuentaPUC>('/api/v1/puc', payload);
        return response.data;
    }

    /**
     * PUT /api/v1/puc/{codigo}
     */
    async updatePuc(
        codigo: string,
        payload: CuentaPUCRequest & { company_nit?: string }
    ): Promise<CuentaPUC> {
        const response = await this.client.put<CuentaPUC>(`/api/v1/puc/${codigo}`, payload);
        return response.data;
    }

    /**
     * DELETE /api/v1/puc/{codigo}
     */
    async deletePuc(codigo: string, company_nit?: string): Promise<void> {
        if (company_nit) {
            await this.client.delete(`/api/v1/puc/${codigo}`, { params: { company_nit } });
        } else {
            await this.client.delete(`/api/v1/puc/${codigo}`);
        }
    }

    /**
     * GET /api/v1/auth/companies
     */
    async listMyCompanies(): Promise<CompanyMembership[]> {
        const { data } = await this.client.get<CompanyMembership[]>('/api/v1/auth/companies');
        return data;
    }

    /**
     * POST /api/v1/auth/companies/join
     */
    async joinCompany(nit: string): Promise<CompanyMembership> {
        const { data } = await this.client.post<CompanyMembership>('/api/v1/auth/companies/join', {
            nit,
        });
        return data;
    }

    /**
     * DELETE /api/v1/auth/companies/{nit}
     */
    async leaveCompany(nit: string): Promise<void> {
        await this.client.delete(`/api/v1/auth/companies/${nit}`);
    }
}
