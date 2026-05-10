import { AxiosInstance } from 'axios';
import {
    IVAReport,
    WithholdingsReport,
    TaxDeclarationDraft,
    TaxCalendarResponse,
    F220Response,
    ExogenaResponse,
    GenerateDraftRequest,
    ICADeclaracionResponse,
    RentaProvisionResponse,
} from '@/types/api';

export type DeclarationDraftPayload = GenerateDraftRequest;
export type DeclarationDraftResponse = TaxDeclarationDraft;

export class TaxApiClient {
    constructor(private client: AxiosInstance) {}

    async getIVA(companyNit?: string): Promise<IVAReport> {
        const response = await this.client.get<IVAReport>('/api/v1/tax/iva', {
            params: companyNit ? { company_nit: companyNit } : undefined,
        });
        return response.data;
    }

    async getWithholdings(companyNit?: string): Promise<WithholdingsReport> {
        const response = await this.client.get<WithholdingsReport>('/api/v1/tax/withholdings', {
            params: companyNit ? { company_nit: companyNit } : undefined,
        });
        return response.data;
    }

    async generateDeclarationDraft(
        payload: DeclarationDraftPayload
    ): Promise<DeclarationDraftResponse> {
        const response = await this.client.post<DeclarationDraftResponse>(
            '/api/v1/tax/declarations/generate',
            payload
        );
        return response.data;
    }

    async getDeclarationDraft(id: string): Promise<DeclarationDraftResponse> {
        const response = await this.client.get<DeclarationDraftResponse>(
            `/api/v1/tax/declarations/${id}`
        );
        return response.data;
    }

    async updateDraftField(
        id: string,
        field: string,
        value: unknown
    ): Promise<DeclarationDraftResponse> {
        const response = await this.client.patch<DeclarationDraftResponse>(
            `/api/v1/tax/declarations/${id}/fields`,
            { renglon: field, value }
        );
        return response.data;
    }

    async getTaxCalendar(
        companyNit: string,
        year?: number,
        ivaRegime?: 'bimestral' | 'cuatrimestral'
    ): Promise<TaxCalendarResponse> {
        const params: Record<string, string | number> = { company_nit: companyNit };
        if (year) params.year = year;
        if (ivaRegime) params.iva_regime = ivaRegime;
        const response = await this.client.get<TaxCalendarResponse>('/api/v1/tax/calendar', {
            params,
        });
        return response.data;
    }

    async getF220Certificates(companyNit: string, year: number): Promise<F220Response> {
        const response = await this.client.post<F220Response>(
            '/api/v1/tax/certificates/f220',
            null,
            {
                params: { company_nit: companyNit, year },
            }
        );
        return response.data;
    }

    async getExogenaFormat(
        formato: string,
        companyNit: string,
        year: number
    ): Promise<ExogenaResponse> {
        const response = await this.client.get<ExogenaResponse>(`/api/v1/tax/exogena/${formato}`, {
            params: { company_nit: companyNit, year },
        });
        return response.data;
    }

    async getICA(companyNit?: string): Promise<ICADeclaracionResponse> {
        const response = await this.client.get<ICADeclaracionResponse>('/api/v1/tax/ica', {
            params: companyNit ? { company_nit: companyNit } : undefined,
        });
        return response.data;
    }

    async getRentaProvision(companyNit?: string): Promise<RentaProvisionResponse> {
        const response = await this.client.get<RentaProvisionResponse>(
            '/api/v1/tax/renta-provision',
            {
                params: companyNit ? { company_nit: companyNit } : undefined,
            }
        );
        return response.data;
    }
}

/**
 * Export declaration draft to CSV format
 * Client-side export for DIAN declaration drafts
 */
export function exportDeclarationDraft(draft: TaxDeclarationDraft): {
    filename: string;
    content: string;
    mimeType: string;
} {
    // Helper to escape CSV values
    const escapeCSV = (value: string | number): string => {
        const str = String(value);
        // Escape quotes and wrap in quotes if contains special chars
        const escaped = str.replace(/"/g, '""');
        return `"${escaped}"`;
    };

    // Build CSV content
    const headers = ['Renglón', 'Concepto', 'Valor', 'Fuente', 'Confianza', 'Estado'];
    const rows = draft.fields.map((field) => [
        escapeCSV(field.renglon),
        escapeCSV(field.label),
        escapeCSV(field.value),
        escapeCSV(field.source),
        escapeCSV(field.confidence.toUpperCase()),
        escapeCSV(field.requires_review ? 'REVISAR' : 'OK'),
    ]);

    // Add warnings as comments at the top
    const warningsSection = draft.warnings?.length
        ? draft.warnings.map((w) => `# ADVERTENCIA: Renglón ${w.field} - ${w.message}`).join('\n') +
          '\n\n'
        : '';

    // Build CSV
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

    return {
        filename,
        content: csvContent,
        mimeType: 'text/csv;charset=utf-8;',
    };
}
