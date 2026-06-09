import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { es } from 'date-fns/locale';
import TransactionFormModal from '@/components/transactions/TransactionFormModal';
import type { TransactionSummary } from '@/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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
    },
    fonts: {
        mono: 'JetBrains Mono',
        body: 'Inter',
        display: 'Bricolage Grotesque',
    },
    moduleAccents: {
        transactions: '#6366F1',
    },
    sxLabel: {
        fontFamily: 'JetBrains Mono',
        fontSize: '0.7rem',
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        fontWeight: 500,
    },
    sxLabelSmall: {},
    sxCardBase: {},
    sxAccentRule: () => ({}),
    sxGhostNumber: () => ({}),
    motion: {
        duration: { sm: '0.3s', md: '0.5s' },
        snap: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
    },
}));

vi.mock('@/components/transactions/TransactionItemTable', () => ({
    default: ({ items, onChange }: any) => (
        <div data-testid="transaction-item-table">
            {items.map((it: any, idx: number) => (
                <div key={idx} data-testid={`item-${idx}`}>
                    <input
                        data-testid={`item-desc-${idx}`}
                        value={it.descripcion}
                        onChange={(e) => {
                            const next = [...items];
                            next[idx] = { ...next[idx], descripcion: e.target.value };
                            onChange(next);
                        }}
                    />
                </div>
            ))}
        </div>
    ),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            {children}
        </LocalizationProvider>
    );
}

function renderModal(props: Partial<React.ComponentProps<typeof TransactionFormModal>> = {}) {
    const defaultProps = {
        open: true,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        companyNit: '800999888',
        loading: false,
        error: null,
    };
    return render(
        <Wrapper>
            <TransactionFormModal {...defaultProps} {...props} />
        </Wrapper>
    );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TransactionFormModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders create mode with DatePicker field', () => {
        renderModal();
        expect(screen.getByLabelText(/fecha/i)).toBeTruthy();
        expect(screen.getByText(/crear transacción manual/i)).toBeTruthy();
    });

    it('renders edit mode with pre-filled fecha from initialData', () => {
        const initialData: TransactionSummary = {
            id: 'tx-001',
            fecha: '2026-01-15T00:00:00Z',
            concepto: 'Servicios profesionales',
            total: 250000,
            status: 'PENDING',
            nit_emisor: '900123456',
            ingest_id: 'ingest-001',
        };
        renderModal({ initialData, onUpdate: vi.fn() });

        // DatePicker input should show a formatted date (timezone-safe check)
        const fechaInput = screen.getByLabelText(/fecha/i) as HTMLInputElement;
        expect(fechaInput.value).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);

        expect(screen.getByText(/editar transacción/i)).toBeTruthy();
        expect(screen.getByLabelText(/concepto/i)).toHaveValue('Servicios profesionales');
    });

    it('validates required fields on submit', async () => {
        const onSubmit = vi.fn();
        renderModal({ onSubmit });

        const guardarButton = screen.getByRole('button', { name: /guardar/i });
        fireEvent.click(guardarButton);

        await waitFor(() => {
            expect(screen.getByText(/complete todos los campos obligatorios/i)).toBeTruthy();
        });
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits when all fields are filled', async () => {
        const onSubmit = vi.fn();
        renderModal({ onSubmit });

        // Fill fecha via DatePicker input (simulate typing)
        const fechaInput = screen.getByLabelText(/fecha/i);
        fireEvent.change(fechaInput, { target: { value: '15/01/2026' } });

        fireEvent.change(screen.getByLabelText(/concepto/i), {
            target: { value: 'Factura de servicios' },
        });
        fireEvent.change(screen.getByLabelText(/nit emisor/i), {
            target: { value: '900123456' },
        });
        fireEvent.change(screen.getByLabelText(/nit receptor/i), {
            target: { value: '800999888' },
        });
        // Add item description and matching subtotal so computedTotal matches
        const itemDesc = screen.getByTestId('item-desc-0');
        fireEvent.change(itemDesc, { target: { value: 'Servicios' } });

        // Match total to the computed total from items (0 subtotal + 0 iva = 0)
        fireEvent.change(screen.getByLabelText(/total/i), {
            target: { value: '0' },
        });

        const guardarButton = screen.getByRole('button', { name: /guardar/i });
        fireEvent.click(guardarButton);

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledOnce();
        });

        const payload = onSubmit.mock.calls[0][0];
        expect(payload.concepto).toBe('Factura de servicios');
        expect(payload.nit_emisor).toBe('900123456');
        expect(payload.items).toHaveLength(1);
    });

    it('calls onUpdate in edit mode', async () => {
        const onUpdate = vi.fn();
        const initialData: TransactionSummary = {
            id: 'tx-001',
            fecha: '2026-01-15T00:00:00Z',
            concepto: 'Servicios',
            total: 100000,
            status: 'PENDING',
            nit_emisor: '900123456',
            ingest_id: 'ingest-001',
        };
        renderModal({ initialData, onUpdate });

        fireEvent.change(screen.getByLabelText(/concepto/i), {
            target: { value: 'Servicios actualizados' },
        });

        const itemDesc = screen.getByTestId('item-desc-0');
        fireEvent.change(itemDesc, { target: { value: 'Item actualizado' } });

        const guardarButton = screen.getByRole('button', { name: /guardar/i });
        fireEvent.click(guardarButton);

        await waitFor(() => {
            expect(onUpdate).toHaveBeenCalledOnce();
        });

        const [id, payload] = onUpdate.mock.calls[0];
        expect(id).toBe('tx-001');
        expect(payload.concepto).toBe('Servicios actualizados');
    });

    it('displays backend error when provided', () => {
        renderModal({ error: 'Error del servidor' });
        expect(screen.getByText(/error del servidor/i)).toBeTruthy();
    });

    it('disables guardar button when loading', () => {
        renderModal({ loading: true });
        const guardarButton = screen.getByRole('button', { name: /\.{3}/i });
        expect(guardarButton).toBeDisabled();
    });

    it('validates total mismatch with computed items total', async () => {
        renderModal();

        // Fill all required fields
        const fechaInput = screen.getByLabelText(/fecha/i);
        fireEvent.change(fechaInput, { target: { value: '15/01/2026' } });
        fireEvent.change(screen.getByLabelText(/concepto/i), {
            target: { value: 'Test' },
        });
        fireEvent.change(screen.getByLabelText(/nit emisor/i), {
            target: { value: '900123456' },
        });
        fireEvent.change(screen.getByLabelText(/nit receptor/i), {
            target: { value: '800999888' },
        });
        // Total doesn't match computed items (which is 0)
        fireEvent.change(screen.getByLabelText(/total/i), {
            target: { value: '999999' },
        });

        const guardarButton = screen.getByRole('button', { name: /guardar/i });
        fireEvent.click(guardarButton);

        await waitFor(() => {
            expect(screen.getByText(/no coincide con la suma de items/i)).toBeTruthy();
        });
    });
});
