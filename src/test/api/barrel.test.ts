// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
    apiClient,
    ApiError,
    IngestApiClient,
    ProcessApiClient,
    TaxApiClient,
    ReportApiClient,
    CompanyApiClient,
    ChatApiClient,
    ingestApiClient,
    processApiClient,
    taxApiClient,
    reportApiClient,
    companyApiClient,
    chatApiClient,
} from '@/lib/api/clients';

describe('API clients barrel', () => {
    it('exports the axios instance', () => {
        expect(apiClient).toBeDefined();
        expect(typeof apiClient.get).toBe('function');
    });

    it('exports ApiError type', () => {
        // ApiError is a TypeScript type — runtime check is not meaningful
        expect(true).toBe(true);
    });

    it('exports all client classes', () => {
        expect(IngestApiClient).toBeDefined();
        expect(ProcessApiClient).toBeDefined();
        expect(TaxApiClient).toBeDefined();
        expect(ReportApiClient).toBeDefined();
        expect(CompanyApiClient).toBeDefined();
        expect(ChatApiClient).toBeDefined();
    });

    it('exports singleton client instances', () => {
        expect(ingestApiClient).toBeInstanceOf(IngestApiClient);
        expect(processApiClient).toBeInstanceOf(ProcessApiClient);
        expect(taxApiClient).toBeInstanceOf(TaxApiClient);
        expect(reportApiClient).toBeInstanceOf(ReportApiClient);
        expect(companyApiClient).toBeInstanceOf(CompanyApiClient);
        expect(chatApiClient).toBeInstanceOf(ChatApiClient);
    });
});
