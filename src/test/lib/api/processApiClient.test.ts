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

describe('ProcessApiClient', () => {
    let client: ApiClient;
    beforeEach(() => {
        client = makeClient();
        vi.clearAllMocks();
        vi.resetModules();
    });

    it('processAccounting posts to /api/v1/process/accounting/{ingestId}', async () => {
        (client.post as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { process_id: 'proc_1', message: 'ok', status: 'RUNNING' },
        });
        const { ProcessApiClient } = await import('@/lib/api/clients/processApiClient');
        const result = await new ProcessApiClient(client).processAccounting('ing_1');
        expect(client.post).toHaveBeenCalledWith('/api/v1/process/accounting/ing_1');
        expect(result.process_id).toBe('proc_1');
    });

    it('getProcessStatus calls GET /api/v1/process/status/{processId}', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { status: 'processing' },
        });
        const { ProcessApiClient } = await import('@/lib/api/clients/processApiClient');
        await new ProcessApiClient(client).getProcessStatus('proc_1');
        expect(client.get).toHaveBeenCalledWith('/api/v1/process/status/proc_1');
    });

    it('getProcessResult calls GET /api/v1/process/result/{processId}', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
        const { ProcessApiClient } = await import('@/lib/api/clients/processApiClient');
        await new ProcessApiClient(client).getProcessResult('proc_1');
        expect(client.get).toHaveBeenCalledWith('/api/v1/process/result/proc_1');
    });

    it('getProcessTrace calls GET /api/v1/process/{processId}/trace', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { steps: [] } });
        const { ProcessApiClient } = await import('@/lib/api/clients/processApiClient');
        await new ProcessApiClient(client).getProcessTrace('proc_1');
        expect(client.get).toHaveBeenCalledWith('/api/v1/process/proc_1/trace');
    });

    it('cancelProcess posts to /api/v1/process/{processId}/cancel', async () => {
        (client.post as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { cancelled: true },
        });
        const { ProcessApiClient } = await import('@/lib/api/clients/processApiClient');
        await new ProcessApiClient(client).cancelProcess('proc_1');
        expect(client.post).toHaveBeenCalledWith('/api/v1/process/proc_1/cancel');
    });
});
