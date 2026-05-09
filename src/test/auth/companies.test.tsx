import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockListCompanies = vi.fn();
const mockJoinCompany = vi.fn();

vi.mock('@/lib/api', () => ({
    listMyCompanies: (...args: unknown[]) => mockListCompanies(...args),
    joinCompany: (...args: unknown[]) => mockJoinCompany(...args),
}));

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({ auth: { getUser: vi.fn() } }),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('CompaniesPage', () => {
    beforeEach(() => {
        mockListCompanies.mockResolvedValue([{ company_nit: '800999888-1', user_id: 'u1' }]);
        mockJoinCompany.mockResolvedValue({ company_nit: '123456789-1', user_id: 'u1' });
    });

    it('renders the page title', async () => {
        const CompaniesPage = (await import('@/app/companies/page')).default;
        render(<CompaniesPage />, { wrapper });
        const matches = await screen.findAllByText(/empresas/i);
        expect(matches.length).toBeGreaterThan(0);
    });

    it('lists user companies from API', async () => {
        const CompaniesPage = (await import('@/app/companies/page')).default;
        render(<CompaniesPage />, { wrapper });
        expect(await screen.findByText('800999888-1')).toBeInTheDocument();
    });

    it('shows join form with NIT input', async () => {
        const CompaniesPage = (await import('@/app/companies/page')).default;
        render(<CompaniesPage />, { wrapper });
        expect(await screen.findByPlaceholderText(/NIT/i)).toBeInTheDocument();
    });

    it('calls joinCompany on form submit', async () => {
        const CompaniesPage = (await import('@/app/companies/page')).default;
        render(<CompaniesPage />, { wrapper });

        const input = await screen.findByPlaceholderText(/NIT/i);
        fireEvent.change(input, { target: { value: '123456789-1' } });
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => {
            expect(mockJoinCompany).toHaveBeenCalledWith('123456789-1');
        });
    });
});
