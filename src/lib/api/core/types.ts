export interface ApiError {
    message: string;
    process_id?: string;
    status?: number;
    detail?: string;
    error_category?: string;
    error_code?: string;
}
