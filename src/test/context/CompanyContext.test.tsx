import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetSession = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: mockGetSession,
        },
    }),
}));

const mockListMyCompanies = vi.fn();
const mockGetCompanies = vi.fn();

vi.mock('@/lib/api', () => ({
    listMyCompanies: (...args: unknown[]) => mockListMyCompanies(...args),
    getCompanies: (...args: unknown[]) => mockGetCompanies(...args),
}));

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

import { CompanyProvider, useCompany } from '@/context/CompanyContext';

function makeWrapper() {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    };
}

function TestConsumer() {
    const { companies, activeNit, isLoading } = useCompany();
    return (
        <div>
            <span data-testid="loading">{String(isLoading)}</span>
            <span data-testid="count">{companies.length}</span>
            <span data-testid="activeNit">{activeNit ?? 'none'}</span>
        </div>
    );
}

function SetterConsumer() {
    const { setActiveNit } = useCompany();
    return (
        <button onClick={() => setActiveNit('900111222-1')} data-testid="set-btn">
            set
        </button>
    );
}

// Minimal CompanySettingsApiResponse stub
function makeCompany(nit: string) {
    return {
        nit,
        nombre: null,
        ciudad: null,
        codigo_ciiu: null,
        iva_responsable: false,
        tasa_retefuente_servicios: 0,
        tasa_retefuente_bienes: 0,
        tasa_retefuente_arrendamiento: 0,
        tasa_reteica: 0,
        tasa_iva_general: 0,
        tasa_ica: 0,
        tasa_renta: 0,
        created_at: null,
        updated_at: null,
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CompanyContext', () => {
    beforeEach(() => {
        mockGetSession.mockReset();
        mockListMyCompanies.mockReset();
        mockGetCompanies.mockReset();
        mockPush.mockReset();
        localStorage.clear();
    });

    it('fetches companies on mount when session exists', async () => {
        mockGetSession.mockResolvedValue({
            data: { session: { access_token: 'tok-abc' } },
        });
        mockListMyCompanies.mockResolvedValue([
            { user_id: 'u1', company_nit: '900111222-1' },
            { user_id: 'u1', company_nit: '800999888-1' },
        ]);
        mockGetCompanies.mockResolvedValue([
            makeCompany('900111222-1'),
            makeCompany('800999888-1'),
        ]);

        const Wrapper = makeWrapper();

        render(
            <Wrapper>
                <CompanyProvider>
                    <TestConsumer />
                </CompanyProvider>
            </Wrapper>
        );

        await waitFor(() => {
            expect(screen.getByTestId('count').textContent).toBe('2');
        });

        expect(mockListMyCompanies).toHaveBeenCalledTimes(1);
    });

    it('persists activeNit to localStorage on selection', async () => {
        mockGetSession.mockResolvedValue({
            data: { session: { access_token: 'tok-abc' } },
        });
        mockListMyCompanies.mockResolvedValue([{ user_id: 'u1', company_nit: '900111222-1' }]);
        mockGetCompanies.mockResolvedValue([makeCompany('900111222-1')]);

        const Wrapper = makeWrapper();

        render(
            <Wrapper>
                <CompanyProvider>
                    <SetterConsumer />
                </CompanyProvider>
            </Wrapper>
        );

        await act(async () => {
            screen.getByTestId('set-btn').click();
        });

        expect(localStorage.getItem('pae_active_nit')).toBe('900111222-1');
    });

    it('redirects to /companies when activeNit is not in user companies', async () => {
        mockGetSession.mockResolvedValue({
            data: { session: { access_token: 'tok-abc' } },
        });
        // Stale NIT in localStorage that user no longer belongs to
        localStorage.setItem('pae_active_nit', '000000000-9');
        mockListMyCompanies.mockResolvedValue([{ user_id: 'u1', company_nit: '900111222-1' }]);
        mockGetCompanies.mockResolvedValue([makeCompany('900111222-1')]);

        const Wrapper = makeWrapper();

        render(
            <Wrapper>
                <CompanyProvider>
                    <TestConsumer />
                </CompanyProvider>
            </Wrapper>
        );

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/companies');
        });
    });

    it('returns empty companies list and makes no API call when no session', async () => {
        mockGetSession.mockResolvedValue({ data: { session: null } });

        const Wrapper = makeWrapper();

        render(
            <Wrapper>
                <CompanyProvider>
                    <TestConsumer />
                </CompanyProvider>
            </Wrapper>
        );

        await waitFor(() => {
            expect(screen.getByTestId('count').textContent).toBe('0');
        });

        expect(mockListMyCompanies).not.toHaveBeenCalled();
        expect(mockGetCompanies).not.toHaveBeenCalled();
    });
});
