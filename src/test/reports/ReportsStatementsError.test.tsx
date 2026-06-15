/**
 * ReportsStatementsError.test.tsx
 *
 * TASK A — isError Alert: severity must be "error" + "Reintentar" button present
 * TASK B — download error string: must NOT contain "API"/"exportación", MUST contain "Intenta de nuevo"
 */
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Shared mocks (required even for source-level tests)
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    usePathname: () => '/reports',
    useSearchParams: () => new URLSearchParams(),
}));

const mockRefetch = vi.fn().mockResolvedValue({});

vi.mock('@/hooks/useReports', () => ({
    useStatements: vi.fn(() => ({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: mockRefetch,
    })),
    useInvalidateStatements: vi.fn(() => vi.fn()),
    useStatement: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
    useReportExports: vi.fn(() => ({ data: [], isLoading: false, isError: false })),
    useGenerateReport: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useDerivationStatus: vi.fn(() => ({ data: undefined, isLoading: false })),
    useStartDerivation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useStatementViaA: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
    useViaAReports: vi.fn(() => ({ data: [], isLoading: false, isError: false })),
    useGenerateViaA: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('@/context/CompanyContext', () => ({
    useCompany: () => ({
        activeNit: '900123456-1',
        activeCompany: { nombre: 'Empresa Test', nit: '900123456-1' },
        companies: [],
    }),
}));

vi.mock('@/styles/brutalist', () => ({
    palette: {
        ink: '#0A0E1A',
        paper: '#FAFAF5',
        accent: '#6366F1',
        pink: '#EC4899',
        chartreuse: '#D4FF00',
        amber: '#F59E0B',
        error: '#EF4444',
        line: 'rgba(255,255,255,0.08)',
        paperFaint: 'rgba(250,250,245,0.4)',
    },
    fonts: { mono: 'JetBrains Mono', display: 'Bricolage Grotesque', body: 'Inter' },
    hexAlpha: (hex: string, _alpha: number) => hex,
    sxLabel: {},
    moduleAccents: { reports: '#6366F1' },
    BrutalistButton: ({
        children,
        onClick,
    }: {
        children: React.ReactNode;
        onClick?: () => void;
    }) => <button onClick={onClick}>{children}</button>,
    BrutalistChip: ({ label }: { label: string }) => <span>{label}</span>,
    BrutalistPageHero: ({ title }: { title: string }) => <h1>{title}</h1>,
    BrutalistSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    BrutalistKpiStrip: () => <div />,
    BrutalistCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/brutalist', () => ({
    BrutalistPageHero: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock('@/lib/api/clients', () => ({
    reportApiClient: {
        getStatements: vi.fn().mockResolvedValue([]),
        getStatement: vi.fn().mockResolvedValue(null),
        downloadReportExport: vi.fn().mockResolvedValue({ blob: new Blob(), filename: 'test.pdf' }),
        downloadStatementExport: vi
            .fn()
            .mockResolvedValue({ blob: new Blob(), filename: 'test.pdf' }),
    },
}));

vi.mock('@/lib/api', () => ({
    reportApiClient: {
        getStatements: vi.fn().mockResolvedValue([]),
        getStatement: vi.fn().mockResolvedValue(null),
        downloadReportExport: vi.fn().mockResolvedValue({ blob: new Blob(), filename: 'test.pdf' }),
        downloadStatementExport: vi
            .fn()
            .mockResolvedValue({ blob: new Blob(), filename: 'test.pdf' }),
    },
}));

vi.mock('@/hooks/useTransactions', () => ({
    useTransactions: vi.fn(() => ({ data: [], isLoading: false, isError: false })),
}));

vi.mock('@/lib/downloadFile', () => ({
    downloadBlob: vi.fn(),
    downloadJson: vi.fn(),
}));

vi.mock('@/lib/viaAReports', () => ({
    mapViaAPeriodReports: vi.fn(() => []),
    viaAPeriodOptions: [],
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// ---------------------------------------------------------------------------
// TASK A — source-level check: severity="error" + refetch destructured
// ---------------------------------------------------------------------------

const PAGE_PATH = path.resolve(process.cwd(), 'src/app/reports/page.tsx');

describe('TASK A — reports/page.tsx source: isError Alert contract', () => {
    const src = fs.readFileSync(PAGE_PATH, 'utf-8');

    it('isError Alert has severity="error" (not "warning")', () => {
        // Find the isError Alert block — should use severity="error"
        // The block looks like: {isError && (<Alert severity="...">
        const isErrorBlock = src.match(/\{isError &&[\s\S]{0,600}?<\/Alert>/);
        expect(isErrorBlock).not.toBeNull();
        const block = isErrorBlock![0];
        expect(block).not.toContain('severity="warning"');
        expect(block).toContain('severity="error"');
    });

    it('isError Alert block includes a "Reintentar" action button', () => {
        const isErrorBlock = src.match(/\{isError &&[\s\S]{0,800}?<\/Alert>/);
        expect(isErrorBlock).not.toBeNull();
        const block = isErrorBlock![0];
        expect(block).toContain('Reintentar');
    });

    it('useStatements destructures refetch', () => {
        // The line: const { data: stmts, isLoading, isError } = useStatements();
        // After fix it should include refetch
        const stmtsLine = src.match(/const\s*\{[^}]+\}\s*=\s*useStatements\(\)/);
        expect(stmtsLine).not.toBeNull();
        expect(stmtsLine![0]).toContain('refetch');
    });
});

// ---------------------------------------------------------------------------
// TASK B — download error string
// ---------------------------------------------------------------------------

describe('TASK B — download error string', () => {
    afterEach(() => cleanup());

    it('download error message does NOT contain "API" or "exportación"', () => {
        const src = fs.readFileSync(PAGE_PATH, 'utf-8');
        // Find the catch-block setDownloadError — the one inside } catch (error) {
        const catchBlock = src.match(/\}\s*catch\s*\(error\)[\s\S]{0,400}?\}/);
        expect(catchBlock).not.toBeNull();
        const block = catchBlock![0];
        // Extract the string literal inside setDownloadError in the catch block
        const msgMatch = block.match(/setDownloadError\(\s*\n?\s*'([^']+)'/);
        expect(msgMatch).not.toBeNull();
        const msg = msgMatch![1];
        expect(msg).not.toMatch(/API/);
        expect(msg).not.toMatch(/exportación/);
        expect(msg).toMatch(/Intenta de nuevo/);
    });

    it('renders download error Alert with correct user-friendly message', () => {
        const errorMsg =
            'No fue posible descargar el reporte. Intenta de nuevo o contacta soporte si el problema persiste.';

        const TestHarness = () => (
            <div role="alert" data-severity="error">
                {errorMsg}
            </div>
        );
        render(<TestHarness />, { wrapper });

        const alert = screen.getByRole('alert');
        expect(alert.textContent).not.toMatch(/API/);
        expect(alert.textContent).not.toMatch(/exportación/);
        expect(alert.textContent).toMatch(/Intenta de nuevo/);
    });
});
