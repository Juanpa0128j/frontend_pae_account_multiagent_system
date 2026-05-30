import type { ApiClient } from '@/lib/api/core/apiClient';
import type {
    UploadResponse,
    IngestDetailResponse,
    PipelineTrace,
    ProcessStatusResponse,
} from '@/types';

export class IngestApiClient {
    constructor(private readonly client: ApiClient) {}

    async uploadFile(
        file: File | File[],
        onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void,
        company_nit?: string,
        doc_type?: string,
        parser_mode?: string,
        multi_file_mode?: string
    ): Promise<UploadResponse> {
        const formData = new FormData();
        const files = Array.isArray(file) ? file : [file];
        files.forEach((f) => formData.append('files', f));
        if (company_nit) {
            formData.append('company_nit', company_nit);
        }
        if (doc_type) {
            formData.append('doc_type', doc_type);
        }
        if (parser_mode) {
            formData.append('parser_mode', parser_mode);
        }
        formData.append('multi_file_mode', multi_file_mode ?? 'pages');

        const response = await this.client.post<UploadResponse>('/api/v1/ingest/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress,
            timeout: 600000, // 10 minutes for large file uploads
        });

        return response.data;
    }

    async getIngestDetail(ingestId: string): Promise<IngestDetailResponse> {
        const response = await this.client.get<IngestDetailResponse>(`/api/v1/ingest/${ingestId}`);
        return response.data;
    }

    async cancelIngest(ingestId: string): Promise<IngestDetailResponse> {
        const response = await this.client.patch<IngestDetailResponse>(
            `/api/v1/ingest/${ingestId}/cancel`
        );
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

    async getPendingReviewJobs(companyNit: string): Promise<ProcessStatusResponse[]> {
        const response = await this.client.get<ProcessStatusResponse[]>(
            `/api/v1/process/pending-review`,
            { params: { company_nit: companyNit } }
        );
        return response.data;
    }

    async confirmAuditReview(processId: string): Promise<{ message: string; process_id: string }> {
        const response = await this.client.post<{ message: string; process_id: string }>(
            `/api/v1/process/${processId}/audit-confirm`
        );
        return response.data;
    }
}
