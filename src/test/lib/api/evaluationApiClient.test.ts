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

describe('EvaluationApiClient', () => {
    let client: ApiClient;

    beforeEach(() => {
        client = makeClient();
        vi.clearAllMocks();
    });

    it('getRun calls GET /api/v1/evaluation/run', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { status: 'ok', metrics: { schema_compliance: 1, double_entry_integrity: 1 } },
        });
        const { EvaluationApiClient } = await import('@/lib/api/clients/evaluationApiClient');
        const api = new EvaluationApiClient(client);
        const result = await api.getRun();
        expect(client.get).toHaveBeenCalledWith('/api/v1/evaluation/run');
        expect(result.status).toBe('ok');
    });

    it('getSchemaCompliance calls GET /api/v1/evaluation/schema-compliance', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: {
                overall_compliance_rate: 0.95,
                per_agent_compliance_rate: {},
                total_validations: 10,
                total_passed: 9,
                total_failed: 1,
                per_agent_detail: {},
            },
        });
        const { EvaluationApiClient } = await import('@/lib/api/clients/evaluationApiClient');
        const api = new EvaluationApiClient(client);
        const result = await api.getSchemaCompliance();
        expect(client.get).toHaveBeenCalledWith('/api/v1/evaluation/schema-compliance');
        expect(result.overall_compliance_rate).toBe(0.95);
    });

    it('getEvaluationMetrics calls GET /api/v1/evaluation/schema-compliance with optional signal', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: {
                overall_compliance_rate: 1,
                per_agent_compliance_rate: {},
                total_validations: 5,
                total_passed: 5,
                total_failed: 0,
                per_agent_detail: {},
            },
        });
        const { EvaluationApiClient } = await import('@/lib/api/clients/evaluationApiClient');
        const api = new EvaluationApiClient(client);
        const ctrl = new AbortController();
        await api.getEvaluationMetrics({ signal: ctrl.signal });
        expect(client.get).toHaveBeenCalledWith('/api/v1/evaluation/schema-compliance', {
            signal: ctrl.signal,
        });
    });

    it('getEvaluationMetrics works without options', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: {
                overall_compliance_rate: 1,
                per_agent_compliance_rate: {},
                total_validations: 0,
                total_passed: 0,
                total_failed: 0,
                per_agent_detail: {},
            },
        });
        const { EvaluationApiClient } = await import('@/lib/api/clients/evaluationApiClient');
        const api = new EvaluationApiClient(client);
        await api.getEvaluationMetrics();
        expect(client.get).toHaveBeenCalledWith('/api/v1/evaluation/schema-compliance', {
            signal: undefined,
        });
    });

    it('resetMetrics calls POST /api/v1/evaluation/reset-metrics', async () => {
        (client.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'reset' } });
        const { EvaluationApiClient } = await import('@/lib/api/clients/evaluationApiClient');
        const api = new EvaluationApiClient(client);
        const result = await api.resetMetrics();
        expect(client.post).toHaveBeenCalledWith('/api/v1/evaluation/reset-metrics');
        expect(result.status).toBe('reset');
    });

    it('getRagStatus calls GET /api/v1/evaluation/rag-status', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: {
                status: 'ready',
                normativa_collection: { name: 'norm', document_count: 5 },
                empresa_collections: [],
                total_collections: 1,
            },
        });
        const { EvaluationApiClient } = await import('@/lib/api/clients/evaluationApiClient');
        const api = new EvaluationApiClient(client);
        const result = await api.getRagStatus();
        expect(client.get).toHaveBeenCalledWith('/api/v1/evaluation/rag-status');
        expect(result.status).toBe('ready');
    });

    it('getApiRootStatus calls GET /', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { message: 'ok', status: 'running' },
        });
        const { EvaluationApiClient } = await import('@/lib/api/clients/evaluationApiClient');
        const api = new EvaluationApiClient(client);
        const result = await api.getApiRootStatus();
        expect(client.get).toHaveBeenCalledWith('/');
        expect(result.message).toBe('ok');
    });

    it('getHealthStatus calls GET /health', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'healthy' } });
        const { EvaluationApiClient } = await import('@/lib/api/clients/evaluationApiClient');
        const api = new EvaluationApiClient(client);
        const result = await api.getHealthStatus();
        expect(client.get).toHaveBeenCalledWith('/health');
        expect(result.status).toBe('healthy');
    });
});
