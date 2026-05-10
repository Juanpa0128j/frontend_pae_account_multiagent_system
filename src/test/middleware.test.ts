import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock must be before import
vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
    })),
}));

describe('middleware', () => {
    it('redirects unauthenticated user from protected route to /login', async () => {
        const { middleware } = await import('@/middleware');
        const req = new NextRequest('http://localhost:3000/');
        const res = await middleware(req);
        expect(res?.status).toBe(307);
        expect(res?.headers.get('location')).toContain('/login');
    });

    it('allows unauthenticated user to access /login', async () => {
        const { middleware } = await import('@/middleware');
        const req = new NextRequest('http://localhost:3000/login');
        const res = await middleware(req);
        // Should not redirect to login again
        const location = res?.headers.get('location');
        expect(location).toBeNull();
    });
});
