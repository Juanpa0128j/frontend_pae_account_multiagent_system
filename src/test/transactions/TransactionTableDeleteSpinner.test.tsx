import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import React from 'react';
import TransactionTable from '@/components/transactions/TransactionTable';
import { TransactionSummary } from '@/hooks/useTransactions';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        },
    }),
}));

vi.mock('@/styles/brutalist', () => ({
    palette: {
        paperDim: '#999',
        paper: '#FFF',
        paperGhost: '#666',
        paperFaint: '#AAA',
        line: '#ddd',
        error: '#EF4444',
        chartreuse: '#D4FF00',
    },
    fonts: {
        mono: 'JetBrains Mono',
        body: 'Inter',
    },
    hexAlpha: (color: string, alpha: number) => `rgba(0,0,0,${alpha})`,
    moduleAccents: {
        transactions: '#6366F1',
    },
    typeScale: {},
    sxLabel: {},
    sxLabelSmall: {},
    sxCardBase: {},
    sxAccentRule: () => ({}),
    sxGhostNumber: () => ({}),
    motion: {
        duration: '0.3s',
        durationMs: 300,
        easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
        sm: 'sm-value',
    },
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeMockTransaction(
    id: string = 'tx-001',
    ingestId: string = 'ingest-001'
): TransactionSummary {
    return {
        id,
        fecha: '2026-01-15',
        concepto: 'Factura de servicios',
        total: 150000,
        status: 'POSTED',
        nit_emisor: '900123456-7',
        ingest_id: ingestId,
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TransactionTable — delete in-flight spinner / disable', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('shows a progress indicator and disables the confirm button while a by-ingest delete is pending', () => {
        const rows = [makeMockTransaction('tx-001', 'ingest-abc')];

        const { rerender } = render(
            <TransactionTable
                rows={rows}
                loading={false}
                error={null}
                onDeleteByIngest={vi.fn()}
                isDeletingByIngest={false}
            />
        );

        // Open the confirmation dialog.
        fireEvent.click(screen.getByRole('button', { name: /documento|ingest/i }));
        expect(screen.getByRole('dialog')).toBeTruthy();

        // Flip the mutation into the pending state.
        rerender(
            <TransactionTable
                rows={rows}
                loading={false}
                error={null}
                onDeleteByIngest={vi.fn()}
                isDeletingByIngest={true}
            />
        );

        const dialog = screen.getByRole('dialog');
        const confirmButton = within(dialog).getByRole('button', {
            name: /eliminar documento/i,
        });
        expect(confirmButton).toBeDisabled();
        // A brutalist spinner (CircularProgress -> role progressbar) must be shown.
        expect(within(dialog).getByRole('progressbar')).toBeTruthy();
    });

    it('does not call onDeleteByIngest a second time while the delete is already in flight', () => {
        const onDeleteByIngestMock = vi.fn();
        const rows = [makeMockTransaction('tx-001', 'ingest-abc')];

        const { rerender } = render(
            <TransactionTable
                rows={rows}
                loading={false}
                error={null}
                onDeleteByIngest={onDeleteByIngestMock}
                isDeletingByIngest={false}
            />
        );

        // Open dialog and confirm once.
        fireEvent.click(screen.getByRole('button', { name: /documento|ingest/i }));
        fireEvent.click(screen.getByRole('button', { name: /eliminar documento/i }));
        expect(onDeleteByIngestMock).toHaveBeenCalledTimes(1);

        // Mutation is now in flight — the dialog stays open with a disabled button.
        rerender(
            <TransactionTable
                rows={rows}
                loading={false}
                error={null}
                onDeleteByIngest={onDeleteByIngestMock}
                isDeletingByIngest={true}
            />
        );

        // A frantic second click must NOT fire the mutation again.
        fireEvent.click(screen.getByRole('button', { name: /eliminar documento/i }));
        expect(onDeleteByIngestMock).toHaveBeenCalledTimes(1);
    });

    it('disables the single-delete row button while a single delete is pending', () => {
        const rows = [makeMockTransaction('tx-001', 'ingest-abc')];

        render(
            <TransactionTable
                rows={rows}
                loading={false}
                error={null}
                onDelete={vi.fn()}
                isDeleting={true}
            />
        );

        expect(screen.getByRole('button', { name: /^delete$/i })).toBeDisabled();
    });
});
