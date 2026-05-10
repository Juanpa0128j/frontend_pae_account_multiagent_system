export interface ApiError {
    message: string;
    status?: number;
    detail?: string;
    error_category?: string;
    error_code?: string;
    remediation?: string;
    process_status?: string;
}
