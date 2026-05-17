import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

function makeMockTransaction(id: string = 'tx-001'): TransactionSummary {
    return {
        id,
        fecha: '2026-01-15',
        concepto: 'Factura de servicios',
        total: 150000,
        status: 'POSTED',
        nit_emisor: '900123456-7',
        ingest_id: 'ingest-001',
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TransactionTable — delete button', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders a delete button for each row', () => {
        const rows = [makeMockTransaction('tx-001'), makeMockTransaction('tx-002')];
        const onDeleteMock = vi.fn();

        render(
            <TransactionTable rows={rows} loading={false} error={null} onDelete={onDeleteMock} />
        );

        // Must have at least 2 delete buttons (one per transaction row)
        const deleteButtons = screen.getAllByRole('button', { name: /delete|trash|remove/i });
        expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('clicking delete button calls onDelete prop with the transaction id', () => {
        const onDeleteMock = vi.fn();
        const rows = [makeMockTransaction('tx-123')];

        render(
            <TransactionTable rows={rows} loading={false} error={null} onDelete={onDeleteMock} />
        );

        // Find delete button and click it
        const deleteButton = screen.getByRole('button', { name: /delete|trash|remove/i });
        fireEvent.click(deleteButton);

        // Confirm in dialog
        const confirmButton = screen.getByRole('button', { name: /^eliminar$/i });
        fireEvent.click(confirmButton);

        // The onDelete callback must be called with the transaction id
        expect(onDeleteMock).toHaveBeenCalledWith('tx-123');
    });

    it('shows confirmation dialog before calling onDelete', () => {
        const onDeleteMock = vi.fn();
        const rows = [makeMockTransaction('tx-456')];

        render(
            <TransactionTable rows={rows} loading={false} error={null} onDelete={onDeleteMock} />
        );

        // Click delete button
        const deleteButton = screen.getByRole('button', { name: /delete|trash|remove/i });
        fireEvent.click(deleteButton);

        // A confirmation dialog must appear
        const confirmDialog = screen.getByRole('dialog');
        expect(confirmDialog).toBeTruthy();

        // onDelete should NOT be called yet
        expect(onDeleteMock).not.toHaveBeenCalled();

        // User confirms deletion
        const confirmButton = screen.getByRole('button', { name: /^eliminar$/i });
        fireEvent.click(confirmButton);

        // Now onDelete should be called with the correct id
        expect(onDeleteMock).toHaveBeenCalledWith('tx-456');
    });
});
