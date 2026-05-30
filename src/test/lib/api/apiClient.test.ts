import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
    },
};

vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => mockAxiosInstance),
        isAxiosError: vi.fn((e) => e?.isAxiosError === true),
    },
    __esModule: true,
}));

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok' } } }),
        },
    }),
}));

describe('ApiClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    afterEach(() => {
        vi.resetModules();
    });

    it('exposes get, post, put, patch, delete methods', async () => {
        const { apiClient } = await import('@/lib/api/core/apiClient');
        expect(typeof apiClient.get).toBe('function');
        expect(typeof apiClient.post).toBe('function');
        expect(typeof apiClient.put).toBe('function');
        expect(typeof apiClient.patch).toBe('function');
        expect(typeof apiClient.delete).toBe('function');
    });

    it('registers request and response interceptors', async () => {
        await import('@/lib/api/core/apiClient');
        expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
        expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
});
