import { AxiosInstance } from 'axios';
import { ProcessStatusResponse, ProcessResultResponse, PipelineTrace } from '@/types/api';

export class ProcessApiClient {
    constructor(private client: AxiosInstance) {}

    async getProcessStatus(processId: string): Promise<ProcessStatusResponse> {
        const response = await this.client.get<ProcessStatusResponse>(
            `/api/v1/process/status/${processId}`
        );
        return response.data;
    }

    async confirmAuditReview(processId: string): Promise<{ message: string; process_id: string }> {
        const response = await this.client.post<{ message: string; process_id: string }>(
            `/api/v1/process/${processId}/audit-confirm`
        );
        return response.data;
    }

    async getProcessResult(processId: string): Promise<ProcessResultResponse> {
        const response = await this.client.get<ProcessResultResponse>(
            `/api/v1/process/result/${processId}`
        );
        return response.data;
    }

    async getProcessTrace(processId: string): Promise<PipelineTrace> {
        const response = await this.client.get<PipelineTrace>(`/api/v1/process/${processId}/trace`);
        return response.data;
    }
}
