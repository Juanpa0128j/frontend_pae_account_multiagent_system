import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSession = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: mockGetSession,
            signOut: vi.fn().mockResolvedValue({}),
        },
    }),
}));

describe('Axios auth interceptor', () => {
    beforeEach(() => {
        vi.resetModules();
        mockGetSession.mockReset();
    });

    it('adds Authorization header when session exists', async () => {
        mockGetSession.mockResolvedValue({
            data: { session: { access_token: 'test-token-abc' } },
        });

        const { apiClient } = await import('@/lib/api/core/apiClient');

        let capturedHeaders: Record<string, string> = {};
        const interceptorId = apiClient.interceptors.request.use((config) => {
            capturedHeaders = config.headers as Record<string, string>;
            return config;
        });

        // Trigger a request (will fail network-wise, that's fine)
        try {
            await apiClient.get('/test-endpoint-that-does-not-exist');
        } catch {
            // network error expected
        }

        apiClient.interceptors.request.eject(interceptorId);
        expect(capturedHeaders['Authorization']).toBe('Bearer test-token-abc');
    });

    it('does not add Authorization header when no session', async () => {
        mockGetSession.mockResolvedValue({ data: { session: null } });

        const { apiClient } = await import('@/lib/api/core/apiClient');

        let capturedHeaders: Record<string, string> = {};
        const interceptorId = apiClient.interceptors.request.use((config) => {
            capturedHeaders = config.headers as Record<string, string>;
            return config;
        });

        try {
            await apiClient.get('/test-endpoint-that-does-not-exist');
        } catch {
            // network error expected
        }

        apiClient.interceptors.request.eject(interceptorId);
        expect(capturedHeaders['Authorization']).toBeUndefined();
    });
});
