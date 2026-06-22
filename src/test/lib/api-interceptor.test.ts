import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetToken = vi.fn();
const mockSignOut = vi.fn();

// Stub window.Clerk before the apiClient module loads so the request
// interceptor picks up the Clerk session from window.
// loaded:true and load present so existing token/401 assertions hold.
vi.stubGlobal('Clerk', {
    loaded: true,
    load: vi.fn().mockResolvedValue(undefined),
    session: { getToken: mockGetToken },
    signOut: mockSignOut,
});

describe('Axios auth interceptor', () => {
    beforeEach(() => {
        vi.resetModules();
        mockGetToken.mockReset();
        mockSignOut.mockReset();
    });

    it('adds Authorization header when Clerk token exists', async () => {
        mockGetToken.mockResolvedValue('test-token-abc');

        const { apiClient } = await import('@/lib/api/clients');

        let capturedHeaders: Record<string, string> = {};
        const interceptorId = apiClient.axios.interceptors.request.use((config) => {
            capturedHeaders = config.headers as Record<string, string>;
            return config;
        });

        try {
            await apiClient.get('/test-endpoint-that-does-not-exist');
        } catch {
            // network error expected
        }

        apiClient.axios.interceptors.request.eject(interceptorId);
        expect(capturedHeaders['Authorization']).toBe('Bearer test-token-abc');
    });

    it('does not add Authorization header when no Clerk token', async () => {
        mockGetToken.mockResolvedValue(null);

        const { apiClient } = await import('@/lib/api/clients');

        let capturedHeaders: Record<string, string> = {};
        const interceptorId = apiClient.axios.interceptors.request.use((config) => {
            capturedHeaders = config.headers as Record<string, string>;
            return config;
        });

        try {
            await apiClient.get('/test-endpoint-that-does-not-exist');
        } catch {
            // network error expected
        }

        apiClient.axios.interceptors.request.eject(interceptorId);
        expect(capturedHeaders['Authorization']).toBeUndefined();
    });

    it('awaits clerk.load() before reading token when Clerk is not yet loaded', async () => {
        // Simulate Clerk present but not yet loaded — pre-load race condition.
        const mockLoad = vi.fn().mockResolvedValue(undefined);
        const mockGetTokenUnloaded = vi.fn().mockResolvedValue(null);
        vi.stubGlobal('Clerk', {
            loaded: false,
            load: mockLoad,
            session: { getToken: mockGetTokenUnloaded },
            signOut: mockSignOut,
        });

        const { apiClient } = await import('@/lib/api/clients');

        let capturedHeaders: Record<string, string> = {};
        const interceptorId = apiClient.axios.interceptors.request.use((config) => {
            capturedHeaders = config.headers as Record<string, string>;
            return config;
        });

        try {
            await apiClient.get('/test-endpoint-that-does-not-exist');
        } catch {
            // network error expected
        }

        apiClient.axios.interceptors.request.eject(interceptorId);

        // clerk.load() must have been called to await initialization.
        expect(mockLoad).toHaveBeenCalled();
        // No token returned — Authorization header must be absent.
        expect(capturedHeaders['Authorization']).toBeUndefined();
    });
});
