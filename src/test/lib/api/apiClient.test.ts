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

const mockSignOut = vi.fn();

// Stub window.Clerk with loaded:true + load so existing assertions hold.
vi.stubGlobal('Clerk', {
    loaded: true,
    load: vi.fn().mockResolvedValue(undefined),
    session: { getToken: vi.fn().mockResolvedValue('tok') },
    signOut: mockSignOut,
});

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

    it('does not call signOut when 401 arrives while Clerk.loaded is false', async () => {
        // Clerk present but not yet loaded — simulates the pre-load race condition.
        vi.stubGlobal('Clerk', {
            loaded: false,
            load: vi.fn().mockResolvedValue(undefined),
            session: { getToken: vi.fn().mockResolvedValue(null) },
            signOut: mockSignOut,
        });

        await import('@/lib/api/core/apiClient');

        // Grab the error handler registered on the response interceptor.
        const responseUseCalls = mockAxiosInstance.interceptors.response.use.mock
            .calls as Array<[unknown, (e: unknown) => Promise<unknown>]>;
        expect(responseUseCalls.length).toBeGreaterThan(0);
        const errorHandler = responseUseCalls[0][1];

        // Construct a minimal 401 AxiosError-shaped object.
        const fake401 = {
            response: { status: 401, data: {} },
            request: {},
            message: 'Unauthorized',
            isAxiosError: true,
        };

        // Call should NOT throw but should propagate a rejected promise (error normalization).
        await expect(errorHandler(fake401)).rejects.toBeDefined();

        // The critical assertion: signOut must NOT have been called.
        expect(mockSignOut).not.toHaveBeenCalled();
    });
});
