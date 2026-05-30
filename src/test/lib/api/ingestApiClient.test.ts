import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiClient } from '@/lib/api/core/apiClient';

function makeClient(): ApiClient {
    return {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    } as unknown as ApiClient;
}

describe('IngestApiClient', () => {
    let client: ApiClient;

    beforeEach(() => {
        client = makeClient();
        vi.clearAllMocks();
    });

    it('uploadFile posts to /api/v1/ingest/upload with FormData', async () => {
        (client.post as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { ingest_id: 'ing_1', file_name: 'f.pdf', message: 'ok', status: 'uploaded' },
        });
        const { IngestApiClient } = await import('@/lib/api/clients/ingestApiClient');
        const api = new IngestApiClient(client);
        const file = new File(['x'], 'f.pdf', { type: 'application/pdf' });
        const result = await api.uploadFile(file, undefined, 'nit_1', 'factura');
        expect(client.post).toHaveBeenCalledWith(
            '/api/v1/ingest/upload',
            expect.any(FormData),
            expect.any(Object)
        );
        expect(result.ingest_id).toBe('ing_1');
    });

    it('uploadFile appends parser_mode when provided', async () => {
        (client.post as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { ingest_id: 'ing_2', file_name: 'f.pdf', message: 'ok', status: 'uploaded' },
        });
        const { IngestApiClient } = await import('@/lib/api/clients/ingestApiClient');
        const api = new IngestApiClient(client);
        const file = new File(['x'], 'f.pdf', { type: 'application/pdf' });
        await api.uploadFile(file, undefined, 'nit_1', 'factura', 'advanced');
        const fd = (client.post as ReturnType<typeof vi.fn>).mock.calls[0][1] as FormData;
        expect(fd.get('parser_mode')).toBe('advanced');
    });

    it('getIngestDetail calls GET /api/v1/ingest/{id}', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { ingest_id: 'ing_1' },
        });
        const { IngestApiClient } = await import('@/lib/api/clients/ingestApiClient');
        const api = new IngestApiClient(client);
        await api.getIngestDetail('ing_1');
        expect(client.get).toHaveBeenCalledWith('/api/v1/ingest/ing_1');
    });

    it('cancelIngest calls PATCH /api/v1/ingest/{id}/cancel', async () => {
        (client.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
        const { IngestApiClient } = await import('@/lib/api/clients/ingestApiClient');
        const api = new IngestApiClient(client);
        await api.cancelIngest('ing_1');
        expect(client.patch).toHaveBeenCalledWith('/api/v1/ingest/ing_1/cancel');
    });

    it('updateIngestClassification calls PATCH /api/v1/ingest/{id}/classification', async () => {
        (client.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
        const { IngestApiClient } = await import('@/lib/api/clients/ingestApiClient');
        const api = new IngestApiClient(client);
        await api.updateIngestClassification('ing_1', { doc_type: 'factura', confirmed: true });
        expect(client.patch).toHaveBeenCalledWith('/api/v1/ingest/ing_1/classification', {
            doc_type: 'factura',
            confirmed: true,
        });
    });

    it('getIngestTrace calls GET /api/v1/ingest/{id}/trace', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { steps: [] } });
        const { IngestApiClient } = await import('@/lib/api/clients/ingestApiClient');
        const api = new IngestApiClient(client);
        await api.getIngestTrace('ing_1');
        expect(client.get).toHaveBeenCalledWith('/api/v1/ingest/ing_1/trace');
    });

    it('getPendingReviewJobs calls GET /api/v1/process/pending-review with company_nit param', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
        const { IngestApiClient } = await import('@/lib/api/clients/ingestApiClient');
        const api = new IngestApiClient(client);
        await api.getPendingReviewJobs('nit_1');
        expect(client.get).toHaveBeenCalledWith('/api/v1/process/pending-review', {
            params: { company_nit: 'nit_1' },
        });
    });

    it('confirmAuditReview calls POST /api/v1/process/{id}/audit-confirm', async () => {
        (client.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
        const { IngestApiClient } = await import('@/lib/api/clients/ingestApiClient');
        const api = new IngestApiClient(client);
        await api.confirmAuditReview('ing_1');
        expect(client.post).toHaveBeenCalledWith('/api/v1/process/ing_1/audit-confirm');
    });
});
