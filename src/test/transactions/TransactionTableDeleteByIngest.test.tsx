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

vi.mock('@/styles/brutalist', () => ({
    palette: {
        paperDim: '#999',
        paper: '#FFF',
        paperGhost: '#666',
        paperFaint: '#AAA',
        line: '#ddd',
        error: '#EF4444',
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

describe('TransactionTable — delete by ingest button', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders a "delete by ingest" button for each row when onDeleteByIngest prop is provided', () => {
        const rows = [
            makeMockTransaction('tx-001', 'ingest-001'),
            makeMockTransaction('tx-002', 'ingest-001'),
        ];
        const onDeleteByIngestMock = vi.fn();

        render(
            <TransactionTable
                rows={rows}
                loading={false}
                error={null}
                onDeleteByIngest={onDeleteByIngestMock}
            />
        );

        // Must have at least 2 delete-by-ingest buttons (one per transaction row)
        const deleteByIngestButtons = screen.getAllByRole('button', { name: /documento|ingest/i });
        expect(deleteByIngestButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('clicking the delete-by-ingest button shows a confirmation dialog', () => {
        const onDeleteByIngestMock = vi.fn();
        const rows = [makeMockTransaction('tx-001', 'ingest-abc')];

        render(
            <TransactionTable
                rows={rows}
                loading={false}
                error={null}
                onDeleteByIngest={onDeleteByIngestMock}
            />
        );

        // Click delete-by-ingest button
        const deleteByIngestButton = screen.getByRole('button', { name: /documento|ingest/i });
        fireEvent.click(deleteByIngestButton);

        // A confirmation dialog must appear
        const confirmDialog = screen.getByRole('dialog');
        expect(confirmDialog).toBeTruthy();

        // onDeleteByIngest should NOT be called yet
        expect(onDeleteByIngestMock).not.toHaveBeenCalled();
    });

    it('confirming the dialog calls onDeleteByIngest with the ingest_id', () => {
        const onDeleteByIngestMock = vi.fn();
        const rows = [makeMockTransaction('tx-001', 'ingest-abc')];

        render(
            <TransactionTable
                rows={rows}
                loading={false}
                error={null}
                onDeleteByIngest={onDeleteByIngestMock}
            />
        );

        // Click delete-by-ingest button
        const deleteByIngestButton = screen.getByRole('button', { name: /documento|ingest/i });
        fireEvent.click(deleteByIngestButton);

        // Confirm in dialog
        const confirmButton = screen.getByRole('button', { name: /^eliminar documento$/i });
        fireEvent.click(confirmButton);

        // The onDeleteByIngest callback must be called with the ingest_id
        expect(onDeleteByIngestMock).toHaveBeenCalledWith('ingest-abc');
    });

    it('does not render the button when onDeleteByIngest prop is not provided', () => {
        const rows = [makeMockTransaction('tx-001', 'ingest-001')];

        render(<TransactionTable rows={rows} loading={false} error={null} />);

        // Should not have delete-by-ingest buttons when prop is not provided
        const deleteByIngestButtons = screen.queryAllByRole('button', {
            name: /documento|ingest/i,
        });
        expect(deleteByIngestButtons.length).toBe(0);
    });
});
