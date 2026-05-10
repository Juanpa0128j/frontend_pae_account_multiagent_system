import { AxiosInstance } from 'axios';
import {
    CompanySettingsResponse,
    CompanySettingsRequest,
    CompanyProfileSetupRequest,
    CompanySettingsApiResponse,
    CuentaPUC,
    CuentaPUCRequest,
} from '@/types/api';

export class CompanyApiClient {
    constructor(private client: AxiosInstance) {}

    async getCompanySettings(nit: string): Promise<CompanySettingsResponse | null> {
        try {
            const response = await this.client.get<CompanySettingsResponse>(
                `/api/v1/settings/company/${nit}`
            );
            return response.data;
        } catch (error: unknown) {
            const axiosError = error as { response?: { status: number }; status?: number };
            if (axiosError.response?.status === 404 || axiosError.status === 404) {
                return null;
            }
            throw error;
        }
    }

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

    async getCompanies(): Promise<CompanySettingsApiResponse[]> {
        const response = await this.client.get<CompanySettingsApiResponse[]>(
            '/api/v1/settings/companies'
        );
        return response.data;
    }

    async deleteCompany(nit: string): Promise<void> {
        await this.client.delete(`/api/v1/settings/company/${encodeURIComponent(nit)}`);
    }

    async listMyCompanies(): Promise<{ user_id: string; company_nit: string }[]> {
        const response =
            await this.client.get<{ user_id: string; company_nit: string }[]>(
                '/api/v1/auth/companies'
            );
        return response.data;
    }

    async joinCompany(nit: string): Promise<{ user_id: string; company_nit: string }> {
        const response = await this.client.post<{ user_id: string; company_nit: string }>(
            '/api/v1/auth/companies/join',
            { nit }
        );
        return response.data;
    }

    async leaveCompany(nit: string): Promise<void> {
        await this.client.delete(`/api/v1/auth/companies/${nit}`);
    }

    async getPucList(params?: {
        search?: string;
        include_inactive?: boolean;
        limit?: number;
    }): Promise<CuentaPUC[]> {
        const response = await this.client.get<CuentaPUC[]>('/api/v1/puc', { params });
        return response.data;
    }

    async getPuc(codigo: string): Promise<CuentaPUC> {
        const response = await this.client.get<CuentaPUC>(`/api/v1/puc/${codigo}`);
        return response.data;
    }

    async createPuc(payload: CuentaPUCRequest): Promise<CuentaPUC> {
        const response = await this.client.post<CuentaPUC>('/api/v1/puc', payload);
        return response.data;
    }

    async updatePuc(codigo: string, payload: CuentaPUCRequest): Promise<CuentaPUC> {
        const response = await this.client.put<CuentaPUC>(`/api/v1/puc/${codigo}`, payload);
        return response.data;
    }
}
