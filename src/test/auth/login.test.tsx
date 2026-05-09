import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@supabase/auth-ui-react', () => ({
    Auth: ({ providers }: { providers: string[]; appearance: object }) => (
        <div data-testid="supabase-auth" data-providers={JSON.stringify(providers)}>
            auth-ui
        </div>
    ),
}));

vi.mock('@supabase/auth-ui-shared', () => ({ ThemeSupa: {} }));

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({ auth: {} }),
}));

vi.mock('@/lib/supabase/auth-theme', () => ({
    brutalistAuthTheme: {},
}));

describe('LoginPage', () => {
    it('renders the Supabase Auth component', async () => {
        const LoginPage = (await import('@/app/(auth)/login/page')).default;
        render(<LoginPage />);
        expect(screen.getByTestId('supabase-auth')).toBeInTheDocument();
    });

    it('includes google as an OAuth provider', async () => {
        const LoginPage = (await import('@/app/(auth)/login/page')).default;
        render(<LoginPage />);
        const auth = screen.getByTestId('supabase-auth');
        const providers = JSON.parse(auth.getAttribute('data-providers') ?? '[]');
        expect(providers).toContain('google');
    });

    it('shows the PAE Contable brand name', async () => {
        const LoginPage = (await import('@/app/(auth)/login/page')).default;
        render(<LoginPage />);
        expect(screen.getByText(/PAE Contable/i)).toBeInTheDocument();
    });
});
