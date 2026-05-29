import type { ApiClient } from '@/lib/api/core/apiClient';
import { extractProcessIdFromText } from '@/lib/api/core/apiClient';
import type {
    ProcessResponse,
    ProcessStatusResponse,
    ProcessResultResponse,
    ProcessCancelResponse,
    PipelineTrace,
    ApiError,
} from '@/types';

export class ProcessApiClient {
    constructor(private readonly client: ApiClient) {}

    /**
     * POST /api/v1/process/accounting/{ingest_id}
     * Processes accounting data for a specific ingest
     */
    async processAccounting(ingestId: string): Promise<ProcessResponse> {
        try {
            const response = await this.client.post<ProcessResponse>(
                `/api/v1/process/accounting/${ingestId}`
            );
            return response.data;
        } catch (error: unknown) {
            const apiError = error as ApiError;

            if (apiError?.status === 409) {
                const processId =
                    extractProcessIdFromText(apiError.detail) ||
                    extractProcessIdFromText(apiError.message);

                if (processId) {
                    return {
                        message:
                            apiError.detail || apiError.message || 'Proceso ya existente recuperado',
                        process_id: processId,
                        status: 'RUNNING',
                    };
                }

                throw Object.assign(
                    new Error(
                        apiError.detail || apiError.message || 'Conflicto al iniciar el proceso.'
                    ),
                    { ...apiError }
                );
            }

            throw error;
        }
    }

    /**
     * GET /api/v1/process/status/{process_id}
     * Polls the status of an asynchronous processing job
     */
    async getProcessStatus(processId: string): Promise<ProcessStatusResponse> {
        const response = await this.client.get<ProcessStatusResponse>(
            `/api/v1/process/status/${processId}`
        );
        return response.data;
    }

    /**
     * GET /api/v1/process/result/{process_id}
     * Retrieves the final processed transactions for a completed process job
     */
    async getProcessResult(processId: string): Promise<ProcessResultResponse> {
        const response = await this.client.get<ProcessResultResponse>(
            `/api/v1/process/result/${processId}`
        );
        return response.data;
    }

    /**
     * GET /api/v1/process/{process_id}/trace
     * Retrieves the structured accountant-facing process trace
     */
    async getProcessTrace(processId: string): Promise<PipelineTrace> {
        const response = await this.client.get<PipelineTrace>(
            `/api/v1/process/${processId}/trace`
        );
        return response.data;
    }

    /**
     * POST /api/v1/process/{process_id}/cancel
     * Cancels a process job (cooperative — marks CANCELLED server-side)
     */
    async cancelProcess(processId: string): Promise<ProcessCancelResponse> {
        const response = await this.client.post<ProcessCancelResponse>(
            `/api/v1/process/${processId}/cancel`
        );
        return response.data;
    }
}
