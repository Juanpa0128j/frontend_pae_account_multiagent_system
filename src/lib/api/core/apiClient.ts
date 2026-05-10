import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { createClient } from '@/lib/supabase/client';
import { ApiError } from './types';

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

const apiClient: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds
});

apiClient.interceptors.request.use(async (config) => {
    const supabase = createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ApiError>) => {
        if (error?.response?.status === 401) {
            const supabase = createClient();
            await supabase.auth.signOut();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        const responseData = error.response?.data as unknown;
        const responseObj =
            responseData && typeof responseData === 'object'
                ? (responseData as Record<string, unknown>)
                : undefined;

        const customError: ApiError = {
            message: 'Ocurrió un error inesperado',
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
                'La solicitud falló';
            customError.detail = structuredRemediation || normalizeErrorText(responseObj?.detail);
            if (detailObj?.error_category) {
                customError.error_category = String(detailObj.error_category);
            }
            if (detailObj?.error_code) {
                customError.error_code = String(detailObj.error_code);
            }
            if (typeof responseObj?.status === 'string') {
                customError.process_status = responseObj.status;
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

export { apiClient, extractProcessIdFromText, normalizeErrorText };
export default apiClient;
