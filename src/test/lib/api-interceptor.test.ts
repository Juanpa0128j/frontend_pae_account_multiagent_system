import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetToken = vi.fn();

// Stub window.Clerk before the apiClient module loads so the request
// interceptor picks up the Clerk session from window.
vi.stubGlobal('Clerk', {
    session: { getToken: mockGetToken },
    signOut: vi.fn(),
});

describe('Axios auth interceptor', () => {
    beforeEach(() => {
        vi.resetModules();
        mockGetToken.mockReset();
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
});
