import { describe, it, expect, vi } from 'vitest';

// Clerk middleware runs in Next.js edge runtime; unit-testing the full
// clerkMiddleware() wiring requires a complete edge mock that is out of scope
// for a unit test suite.  The route-protection logic is covered by Playwright
// E2E tests.  This file is intentionally minimal — it simply verifies that
// the middleware module exports the expected shape so TypeScript stays happy.

vi.mock('@clerk/nextjs/server', () => ({
    clerkMiddleware: vi.fn((handler) => handler),
    createRouteMatcher: vi.fn(() => vi.fn()),
}));

describe('middleware module', () => {
    it('exports a default function and a config object with a matcher', async () => {
        const mod = await import('@/middleware');
        expect(typeof mod.default).toBe('function');
        expect(Array.isArray(mod.config.matcher)).toBe(true);
    });
});
