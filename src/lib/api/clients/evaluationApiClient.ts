import type { ApiClient } from '@/lib/api/core/apiClient';
import type {
    RunResponse,
    SchemaComplianceMetrics,
    RAGStatusResponse,
    RootStatusResponse,
    HealthResponse,
} from '@/types';

export class EvaluationApiClient {
    constructor(private readonly client: ApiClient) {}

    async getRun(): Promise<RunResponse> {
        const response = await this.client.get<RunResponse>('/api/v1/evaluation/run');
        return response.data;
    }

    async getSchemaCompliance(): Promise<SchemaComplianceMetrics> {
        const response = await this.client.get<SchemaComplianceMetrics>(
            '/api/v1/evaluation/schema-compliance'
        );
        return response.data;
    }

    async getEvaluationMetrics(options?: {
        signal?: AbortSignal;
    }): Promise<SchemaComplianceMetrics> {
        const response = await this.client.get<SchemaComplianceMetrics>(
            '/api/v1/evaluation/schema-compliance',
            { signal: options?.signal }
        );
        return response.data;
    }

    async resetMetrics(): Promise<{ status: string }> {
        const response = await this.client.post<{ status: string }>(
            '/api/v1/evaluation/reset-metrics'
        );
        return response.data;
    }

    async getRagStatus(): Promise<RAGStatusResponse> {
        const response = await this.client.get<RAGStatusResponse>('/api/v1/evaluation/rag-status');
        return response.data;
    }

    async getApiRootStatus(): Promise<RootStatusResponse> {
        const response = await this.client.get<RootStatusResponse>('/');
        return response.data;
    }

    async getHealthStatus(): Promise<HealthResponse> {
        const response = await this.client.get<HealthResponse>('/health');
        return response.data;
    }
}
