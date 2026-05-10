import { AxiosInstance, AxiosProgressEvent } from 'axios';
import { UploadResponse, IngestDetailResponse, PipelineTrace, ProcessResponse } from '@/types/api';
import { extractProcessIdFromText } from '@/lib/api/core/apiClient';
import { ApiError } from '@/lib/api/core/types';

export class IngestApiClient {
    constructor(private client: AxiosInstance) {}

    async uploadFile(
        file: File,
        onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
        companyNit?: string
    ): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        if (companyNit) {
            formData.append('company_nit', companyNit);
        }

        const response = await this.client.post<UploadResponse>('/api/v1/ingest/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress,
            timeout: 600000,
        });

        return response.data;
    }

    async getIngestDetail(ingestId: string): Promise<IngestDetailResponse> {
        const response = await this.client.get<IngestDetailResponse>(`/api/v1/ingest/${ingestId}`);
        return response.data;
    }

    async updateIngestClassification(
        ingestId: string,
        payload: { doc_type: string; confirmed: boolean }
    ): Promise<IngestDetailResponse> {
        const response = await this.client.patch<IngestDetailResponse>(
            `/api/v1/ingest/${ingestId}/classification`,
            payload
        );
        return response.data;
    }

    async getIngestTrace(ingestId: string): Promise<PipelineTrace> {
        const response = await this.client.get<PipelineTrace>(`/api/v1/ingest/${ingestId}/trace`);
        return response.data;
    }

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
                            apiError.detail ||
                            apiError.message ||
                            'Proceso ya existente recuperado',
                        process_id: processId,
                        status: apiError.process_status || 'RUNNING',
                    };
                }

                throw Object.assign(
                    new Error(
                        apiError.detail || apiError.message || 'Conflicto al iniciar el proceso.'
                    ),
                    {
                        ...apiError,
                    }
                );
            }

            throw error;
        }
    }
}
