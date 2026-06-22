import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@clerk/nextjs', () => ({
    SignIn: ({ routing, path, signUpUrl }: { routing: string; path: string; signUpUrl: string }) => (
        <div
            data-testid="clerk-sign-in"
            data-routing={routing}
            data-path={path}
            data-sign-up-url={signUpUrl}
        >
            clerk-sign-in
        </div>
    ),
}));

describe('LoginPage', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders the Clerk SignIn component', async () => {
        const LoginPage = (await import('@/app/(auth)/login/[[...rest]]/page')).default;
        render(<LoginPage />);
        expect(screen.getByTestId('clerk-sign-in')).toBeInTheDocument();
    });

    it('configures routing="path" on the SignIn component', async () => {
        const LoginPage = (await import('@/app/(auth)/login/[[...rest]]/page')).default;
        render(<LoginPage />);
        expect(screen.getByTestId('clerk-sign-in')).toHaveAttribute('data-routing', 'path');
    });

    it('sets path="/login" on the SignIn component', async () => {
        const LoginPage = (await import('@/app/(auth)/login/[[...rest]]/page')).default;
        render(<LoginPage />);
        expect(screen.getByTestId('clerk-sign-in')).toHaveAttribute('data-path', '/login');
    });

    it('points signUpUrl to /signup', async () => {
        const LoginPage = (await import('@/app/(auth)/login/[[...rest]]/page')).default;
        render(<LoginPage />);
        expect(screen.getByTestId('clerk-sign-in')).toHaveAttribute('data-sign-up-url', '/signup');
    });
});
