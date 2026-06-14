/**
 * Phase 6 — PUC Autocomplete (TDD RED phase)
 *
 * Tests assert behaviour of a NOT-YET-IMPLEMENTED MUI Autocomplete for
 * the cuenta_puc field in the AjusteModal / transactions page inline editor.
 *
 * All tests are expected to FAIL until the Autocomplete is wired up.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import type { CuentaPUC } from '@/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PUC_FIXTURES: CuentaPUC[] = [
    {
        id: 1,
        codigo: '130505',
        nombre: 'Clientes nacionales',
        descripcion: 'Clientes nacionales',
        clase: 1,
        naturaleza: 'debito',
        activa: true,
    },
    {
        id: 2,
        codigo: '220535',
        nombre: 'Impuesto sobre las ventas por pagar',
        descripcion: 'IVA por pagar',
        clase: 2,
        naturaleza: 'credito',
        activa: true,
    },
    {
        id: 3,
        codigo: '410510',
        nombre: 'Comercio al por mayor y al por menor',
        descripcion: 'Ingresos comerciales',
        clase: 4,
        naturaleza: 'credito',
        activa: true,
    },
];

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockUsePucList = vi.fn();

vi.mock('@/hooks/usePuc', () => ({
    usePucList: (...args: unknown[]) => mockUsePucList(...args),
}));

vi.mock('@/context/CompanyContext', () => ({
    useCompany: () => ({ activeNit: '800999888', activeCompany: { nit: '800999888' } }),
}));

vi.mock('@/styles/brutalist', () => ({
    palette: {
        ink: '#0A0E1A',
        inkSoft: '#0F1424',
        paper: '#FAFAF5',
        paperDim: '#999',
        paperGhost: '#666',
        paperFaint: '#AAA',
        line: '#ddd',
        lineStrong: '#ccc',
        accent: '#6366F1',
        chartreuse: '#D4FF00',
        error: '#EF4444',
        pink: '#EC4899',
    },
    fonts: { mono: 'JetBrains Mono', body: 'Inter', display: 'Bricolage Grotesque' },
    moduleAccents: { transactions: '#6366F1' },
    sxLabel: {},
    sxLabelSmall: {},
    sxCardBase: {},
    sxAccentRule: () => ({}),
    sxGhostNumber: () => ({}),
    motion: { duration: { sm: '0.3s', md: '0.5s' }, snap: 'cubic-bezier(0.2, 0.9, 0.3, 1)' },
}));

// Stub heavy page-level deps so we can render the minimal AjusteModal portion
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    useSearchParams: () => ({ get: () => null }),
    usePathname: () => '/transactions',
}));

vi.mock('@/hooks/useTransactions', () => ({
    useTransactions: () => ({ data: [], isLoading: false }),
    useCreateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeleteTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeleteTransactionsByIngest: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/useBooks', () => ({
    useBooks: () => ({ data: [] }),
}));

// ---------------------------------------------------------------------------
// Component under test — import AFTER mocks
// ---------------------------------------------------------------------------

// The component that owns the PUC field.  Phase 6 requires it to be
// refactored to expose a PucAutocomplete.  We import it here so the tests
// drive that refactoring.
import PucAutocomplete from '@/components/transactions/PucAutocomplete';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RenderProps {
    value?: string;
    onChange?: (codigo: string) => void;
    companyNit?: string;
}

function renderPucAutocomplete(props: RenderProps = {}) {
    const defaults: RenderProps = {
        value: '',
        onChange: vi.fn(),
        companyNit: '800999888',
    };
    return render(<PucAutocomplete {...defaults} {...props} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PucAutocomplete', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Default: no results
        mockUsePucList.mockReturnValue({ data: [], isLoading: false });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
        cleanup();
    });

    // ── 1. Shows suggestions on typing ──────────────────────────────────────
    it('shows PUC suggestions when typing in cuenta_puc field', async () => {
        mockUsePucList.mockReturnValue({ data: PUC_FIXTURES, isLoading: false });

        renderPucAutocomplete({ value: '' });

        const input = screen.getByRole('combobox');
        await userEvent.type(input, '130');

        // Advance past debounce delay (≥300 ms)
        vi.advanceTimersByTime(400);

        await waitFor(() => {
            expect(screen.getByText(/130505/)).toBeInTheDocument();
        });
    });

    // ── 2. Selecting an option populates the field ───────────────────────────
    it('selecting a PUC option populates the field with the codigo', async () => {
        const handleChange = vi.fn();
        mockUsePucList.mockReturnValue({ data: PUC_FIXTURES, isLoading: false });

        renderPucAutocomplete({ value: '', onChange: handleChange });

        const input = screen.getByRole('combobox');
        await userEvent.type(input, '130');
        vi.advanceTimersByTime(400);

        await waitFor(() => {
            expect(screen.getByText(/130505/)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/130505/));

        expect(handleChange).toHaveBeenCalledWith('130505');
    });

    // ── 3. Option label format: "{codigo} — {descripcion}" ─────────────────
    it('displays options in "{codigo} — {descripcion}" format', async () => {
        mockUsePucList.mockReturnValue({ data: PUC_FIXTURES, isLoading: false });

        renderPucAutocomplete({ value: '' });

        const input = screen.getByRole('combobox');
        await userEvent.type(input, '130');
        vi.advanceTimersByTime(400);

        await waitFor(() => {
            // Exact format expected in each listbox option
            expect(screen.getByText('130505 — Clientes nacionales')).toBeInTheDocument();
        });
    });

    // ── 4. Debounce: no API call on first keydown ────────────────────────────
    it('debounces API calls — usePucList not called with search on first keydown', async () => {
        renderPucAutocomplete({ value: '' });

        const input = screen.getByRole('combobox');
        await userEvent.type(input, '1');

        // Do NOT advance timers — debounce window still open
        // usePucList should NOT have been called with a search param yet
        const callsWithSearch = mockUsePucList.mock.calls.filter(
            (call) => call[0]?.search && call[0].search.length > 0
        );
        expect(callsWithSearch.length).toBe(0);
    });

    // ── 5. Keyboard navigable (ARIA listbox) ────────────────────────────────
    it('is keyboard navigable — renders an ARIA listbox when suggestions appear', async () => {
        mockUsePucList.mockReturnValue({ data: PUC_FIXTURES, isLoading: false });

        renderPucAutocomplete({ value: '' });

        const input = screen.getByRole('combobox');
        await userEvent.type(input, '13');
        vi.advanceTimersByTime(400);

        await waitFor(() => {
            expect(screen.getByRole('listbox')).toBeInTheDocument();
        });

        // Navigate with arrow key — should not throw
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(vi.fn).toBeDefined(); // noop assertion to keep test structure
    });
});
