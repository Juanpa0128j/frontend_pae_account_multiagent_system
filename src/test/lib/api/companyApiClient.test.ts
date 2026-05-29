import { describe, it, expect, vi, beforeEach } from 'vitest';
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

function makeClient(): ApiClient {
    return {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    } as unknown as ApiClient;
}

describe('CompanyApiClient', () => {
    let client: ApiClient;

    beforeEach(() => {
        client = makeClient();
        vi.clearAllMocks();
    });

    // ── getCompanySettings ──────────────────────────────────────────────────

    it('getCompanySettings calls GET /api/v1/settings/company/{nit}', async () => {
        const mock: CompanySettingsResponse = {
            nit: '900123',
            iva_responsable: true,
            tasa_retefuente_servicios: 4,
            tasa_retefuente_bienes: 2.5,
            tasa_retefuente_arrendamiento: 3.5,
            tasa_reteica: 0.69,
            tasa_iva_general: 19,
            tasa_ica: 0.69,
            tasa_renta: 35,
        };
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mock });
        const { CompanyApiClient } = await import('@/lib/api/clients/companyApiClient');
        const api = new CompanyApiClient(client);
        const result = await api.getCompanySettings('900123');
        expect(client.get).toHaveBeenCalledWith('/api/v1/settings/company/900123');
        expect(result).toEqual(mock);
    });

    it('getCompanySettings returns null on 404', async () => {
        const err = Object.assign(new Error('Not Found'), {
            isAxiosError: true,
            response: { status: 404 },
        });
        (client.get as ReturnType<typeof vi.fn>).mockRejectedValue(err);
        const { CompanyApiClient } = await import('@/lib/api/clients/companyApiClient');
        const api = new CompanyApiClient(client);
        const result = await api.getCompanySettings('000');
        expect(result).toBeNull();
    });

    // ── upsertCompanySettings ───────────────────────────────────────────────

    it('upsertCompanySettings calls PUT /api/v1/settings/company/{nit}', async () => {
        const payload: CompanySettingsRequest = {
            iva_responsable: true,
            tasa_retefuente_servicios: 4,
            tasa_retefuente_bienes: 2.5,
            tasa_retefuente_arrendamiento: 3.5,
            tasa_reteica: 0.69,
            tasa_iva_general: 19,
            tasa_ica: 0.69,
            tasa_renta: 35,
        };
        const mock: CompanySettingsResponse = { nit: '900123', ...payload };
        (client.put as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mock });
        const { CompanyApiClient } = await import('@/lib/api/clients/companyApiClient');
        const api = new CompanyApiClient(client);
        const result = await api.upsertCompanySettings('900123', payload);
        expect(client.put).toHaveBeenCalledWith('/api/v1/settings/company/900123', payload);
        expect(result.nit).toBe('900123');
    });

    // ── setupCompanySettings ────────────────────────────────────────────────

    it('setupCompanySettings calls POST /api/v1/settings/company/{nit}/setup', async () => {
        const payload: CompanyProfileSetupRequest = {
            ciudad: 'Bogotá',
            codigo_ciiu: '4711',
            iva_responsable: true,
        };
        const mock: CompanySettingsResponse = {
            nit: '900123',
            iva_responsable: true,
            tasa_retefuente_servicios: 4,
            tasa_retefuente_bienes: 2.5,
            tasa_retefuente_arrendamiento: 3.5,
            tasa_reteica: 0.69,
            tasa_iva_general: 19,
            tasa_ica: 0.69,
            tasa_renta: 35,
        };
        (client.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mock });
        const { CompanyApiClient } = await import('@/lib/api/clients/companyApiClient');
        const api = new CompanyApiClient(client);
        const result = await api.setupCompanySettings('900123', payload);
        expect(client.post).toHaveBeenCalledWith('/api/v1/settings/company/900123/setup', payload);
        expect(result.nit).toBe('900123');
    });

    // ── getCompanies ────────────────────────────────────────────────────────

    it('getCompanies calls GET /api/v1/settings/companies', async () => {
        const mock: CompanySettingsApiResponse[] = [
            {
                nit: '900123',
                nombre: 'Acme',
                ciudad: 'Bogotá',
                codigo_ciiu: '4711',
                iva_responsable: true,
                tasa_retefuente_servicios: 4,
                tasa_retefuente_bienes: 2.5,
                tasa_retefuente_arrendamiento: 3.5,
                tasa_reteica: 0.69,
                tasa_iva_general: 19,
                tasa_ica: 0.69,
                tasa_renta: 35,
                created_at: null,
                updated_at: null,
            },
        ];
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mock });
        const { CompanyApiClient } = await import('@/lib/api/clients/companyApiClient');
        const api = new CompanyApiClient(client);
        const result = await api.getCompanies();
        expect(client.get).toHaveBeenCalledWith('/api/v1/settings/companies');
        expect(result).toHaveLength(1);
    });

    // ── deleteCompany ───────────────────────────────────────────────────────

    it('deleteCompany calls DELETE /api/v1/settings/company/{encoded nit}', async () => {
        (client.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: undefined });
        const { CompanyApiClient } = await import('@/lib/api/clients/companyApiClient');
        const api = new CompanyApiClient(client);
        await api.deleteCompany('900123');
        expect(client.delete).toHaveBeenCalledWith(
            `/api/v1/settings/company/${encodeURIComponent('900123')}`
        );
    });

    // ── getMunicipios ───────────────────────────────────────────────────────

    it('getMunicipios calls GET /api/v1/settings/municipios', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: ['Bogotá', 'Medellín'],
        });
        const { CompanyApiClient } = await import('@/lib/api/clients/companyApiClient');
        const api = new CompanyApiClient(client);
        const result = await api.getMunicipios();
        expect(client.get).toHaveBeenCalledWith('/api/v1/settings/municipios');
        expect(result).toContain('Bogotá');
    });

    // ── getPucList ──────────────────────────────────────────────────────────

    it('getPucList calls GET /api/v1/puc without params when none given', async () => {
        const mock: CuentaPUC[] = [];
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mock });
        const { CompanyApiClient } = await import('@/lib/api/clients/companyApiClient');
        const api = new CompanyApiClient(client);
        await api.getPucList();
        expect(client.get).toHaveBeenCalledWith('/api/v1/puc', { params: undefined });
    });

    it('getPucList passes params when provided', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
        const { CompanyApiClient } = await import('@/lib/api/clients/companyApiClient');
        const api = new CompanyApiClient(client);
        await api.getPucList({ search: 'caja', include_inactive: false, limit: 10 });
        expect(client.get).toHaveBeenCalledWith('/api/v1/puc', {
            params: { search: 'caja', include_inactive: false, limit: 10 },
        });
    });

    // ── getPuc ──────────────────────────────────────────────────────────────

    it('getPuc calls GET /api/v1/puc/{codigo}', async () => {
        const mock: CuentaPUC = {
            id: 1,
            codigo: '1105',
            nombre: 'Caja',
            clase: 1,
            naturaleza: 'debito',
            activa: true,
        };
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mock });
        const { CompanyApiClient } = await import('@/lib/api/clients/companyApiClient');
        const api = new CompanyApiClient(client);
        const result = await api.getPuc('1105');
        expect(client.get).toHaveBeenCalledWith('/api/v1/puc/1105');
        expect(result.codigo).toBe('1105');
    });

    // ── createPuc ───────────────────────────────────────────────────────────

    it('createPuc calls POST /api/v1/puc', async () => {
        const payload: CuentaPUCRequest = {
            codigo: '1110',
            nombre: 'Bancos',
            clase: 1,
            naturaleza: 'debito',
        };
        const mock: CuentaPUC = { id: 2, ...payload, activa: true };
        (client.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mock });
        const { CompanyApiClient } = await import('@/lib/api/clients/companyApiClient');
        const api = new CompanyApiClient(client);
        const result = await api.createPuc(payload);
        expect(client.post).toHaveBeenCalledWith('/api/v1/puc', payload);
        expect(result.codigo).toBe('1110');
    });

    // ── updatePuc ───────────────────────────────────────────────────────────

    it('updatePuc calls PUT /api/v1/puc/{codigo}', async () => {
        const payload: CuentaPUCRequest = {
            codigo: '1110',
            nombre: 'Bancos Nacionales',
            clase: 1,
            naturaleza: 'debito',
        };
        const mock: CuentaPUC = { id: 2, ...payload, activa: true };
        (client.put as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mock });
        const { CompanyApiClient } = await import('@/lib/api/clients/companyApiClient');
        const api = new CompanyApiClient(client);
        const result = await api.updatePuc('1110', payload);
        expect(client.put).toHaveBeenCalledWith('/api/v1/puc/1110', payload);
        expect(result.nombre).toBe('Bancos Nacionales');
    });

    // ── listMyCompanies ─────────────────────────────────────────────────────

    it('listMyCompanies calls GET /api/v1/auth/companies', async () => {
        const mock: CompanyMembership[] = [{ user_id: 'u1', company_nit: '900123' }];
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mock });
        const { CompanyApiClient } = await import('@/lib/api/clients/companyApiClient');
        const api = new CompanyApiClient(client);
        const result = await api.listMyCompanies();
        expect(client.get).toHaveBeenCalledWith('/api/v1/auth/companies');
        expect(result).toHaveLength(1);
    });

    // ── joinCompany ─────────────────────────────────────────────────────────

    it('joinCompany calls POST /api/v1/auth/companies/join with nit', async () => {
        const mock: CompanyMembership = { user_id: 'u1', company_nit: '900123' };
        (client.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mock });
        const { CompanyApiClient } = await import('@/lib/api/clients/companyApiClient');
        const api = new CompanyApiClient(client);
        const result = await api.joinCompany('900123');
        expect(client.post).toHaveBeenCalledWith('/api/v1/auth/companies/join', { nit: '900123' });
        expect(result.company_nit).toBe('900123');
    });

    // ── leaveCompany ────────────────────────────────────────────────────────

    it('leaveCompany calls DELETE /api/v1/auth/companies/{nit}', async () => {
        (client.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: undefined });
        const { CompanyApiClient } = await import('@/lib/api/clients/companyApiClient');
        const api = new CompanyApiClient(client);
        await api.leaveCompany('900123');
        expect(client.delete).toHaveBeenCalledWith('/api/v1/auth/companies/900123');
    });
});
