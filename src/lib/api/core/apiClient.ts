import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type { ApiError } from './types';

// ============================================================================
// Helper functions — copied verbatim from src/lib/api.ts
// ============================================================================

const PROCESS_ID_REGEX = /(proc_[A-Za-z0-9_-]+)/i;

function extractProcessIdFromText(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const text = value.trim();
    if (!text) return undefined;

    const match = text.match(PROCESS_ID_REGEX);
    return match?.[1];
}

function normalizeErrorText(value: unknown): string | undefined {
    if (typeof value === 'string') {
        const text = value.trim();
        return text.length > 0 ? text : undefined;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    if (Array.isArray(value)) {
        const parts = value
            .map((item) => normalizeErrorText(item))
            .filter((item): item is string => Boolean(item));
        return parts.length > 0 ? parts.join(' | ') : undefined;
    }

    if (value && typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const msg = normalizeErrorText(obj.message);
        const remediation = normalizeErrorText(obj.remediation);

        if (msg && remediation) {
            return `${msg} ${remediation}`;
        }

        const nested =
            normalizeErrorText(obj.detail) ||
            msg ||
            normalizeErrorText(obj.error) ||
            normalizeErrorText(obj.msg);

        if (nested) return nested;

        try {
            return JSON.stringify(value);
        } catch {
            return undefined;
        }
    }

    return undefined;
}

// ============================================================================
// ApiClient
// ============================================================================

export class ApiClient {
    readonly axios: AxiosInstance;

    constructor() {
        this.axios = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
        this._registerInterceptors();
    }

    private _registerInterceptors(): void {
        // Auth interceptor — attach Bearer token from the Clerk session.
        this.axios.interceptors.request.use(async (config) => {
            if (typeof window !== 'undefined') {
                const clerk = (
                    window as unknown as {
                        Clerk?: {
                            loaded?: boolean;
                            load?: () => Promise<unknown>;
                            session?: { getToken: () => Promise<string | null> };
                        };
                    }
                ).Clerk;
                if (clerk && !clerk.loaded && typeof clerk.load === 'function') {
                    try {
                        await clerk.load();
                    } catch {
                        /* ignore; proceed without token */
                    }
                }
                const token = await clerk?.session?.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
            return config;
        });

        // Error normalization interceptor — copied verbatim from src/lib/api.ts
        this.axios.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error: AxiosError<ApiError>) => {
                if (error?.response?.status === 401 && typeof window !== 'undefined') {
                    const clerk = (
                        window as unknown as {
                            Clerk?: { loaded?: boolean; signOut?: () => Promise<void> };
                        }
                    ).Clerk;
                    if (clerk?.loaded) {
                        await clerk.signOut?.();
                        window.location.href = '/login';
                    }
                    // Clerk not loaded yet: transient race — do not force logout; let the error propagate.
                }
                const responseData = error.response?.data as unknown;
                const responseObj =
                    responseData && typeof responseData === 'object'
                        ? (responseData as Record<string, unknown>)
                        : undefined;

                const customError: ApiError = {
                    message: 'An unexpected error occurred',
                    status: error.response?.status,
                };

                if (error.response) {
                    const detail = responseObj?.detail;
                    const detailObj =
                        detail && typeof detail === 'object'
                            ? (detail as Record<string, unknown>)
                            : undefined;
                    const structuredMessage = normalizeErrorText(detailObj?.message);
                    const structuredRemediation = normalizeErrorText(detailObj?.remediation);

                    customError.message =
                        structuredMessage ||
                        normalizeErrorText(responseObj?.message) ||
                        normalizeErrorText(responseObj?.detail) ||
                        error.message ||
                        'Request failed';
                    customError.detail =
                        structuredRemediation || normalizeErrorText(responseObj?.detail);
                    if (detailObj?.error_category) {
                        (customError as ApiError & { error_category?: string }).error_category =
                            String(detailObj.error_category);
                    }
                    if (detailObj?.error_code) {
                        (customError as ApiError & { error_code?: string }).error_code = String(
                            detailObj.error_code
                        );
                    }
                } else if (error.request) {
                    customError.message = 'Sin respuesta del servidor. Verifique su conexión.';
                } else {
                    customError.message = error.message;
                }

                const enrichedError = Object.assign(new Error(customError.message), customError);
                return Promise.reject(enrichedError);
            }
        );
    }

    get<T = unknown>(...args: Parameters<AxiosInstance['get']>) {
        return this.axios.get<T>(...args);
    }
    post<T = unknown>(...args: Parameters<AxiosInstance['post']>) {
        return this.axios.post<T>(...args);
    }
    put<T = unknown>(...args: Parameters<AxiosInstance['put']>) {
        return this.axios.put<T>(...args);
    }
    patch<T = unknown>(...args: Parameters<AxiosInstance['patch']>) {
        return this.axios.patch<T>(...args);
    }
    delete<T = unknown>(...args: Parameters<AxiosInstance['delete']>) {
        return this.axios.delete<T>(...args);
    }
}

export const apiClient = new ApiClient();

// Re-export helpers for domain clients that need them
export { extractProcessIdFromText, normalizeErrorText };
