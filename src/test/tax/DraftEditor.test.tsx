import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DraftEditor from '../../app/tax/components/DraftEditor';
import type { TaxDeclarationDraft } from '../../types';

vi.mock('../../app/tax/components/AjustesFiscalesPanel', () => ({
    AjustesFiscalesPanel: () => <div data-testid="ajustes-panel">AjustesFiscalesPanel</div>,
}));

const mockDraftF2516: TaxDeclarationDraft = {
    draft_id: 'draft-1',
    company_nit: '800999888',
    form_type: 'F2516',
    period_start: '2024-01-01',
    period_end: '2024-12-31',
    year: 2024,
    status: 'draft',
    fields: [],
    warnings: [],
    created_at: '2024-01-01T00:00:00Z',
};

const mockDraftF350: TaxDeclarationDraft = {
    ...mockDraftF2516,
    form_type: 'F350',
    draft_id: 'draft-2',
};

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('DraftEditor F2516 integration', () => {
    it('renders AjustesFiscalesPanel for F2516', () => {
        render(
            <DraftEditor
                draftId="draft-1"
                draft={mockDraftF2516}
                isLoading={false}
                onClose={vi.fn()}
            />,
            { wrapper }
        );
        expect(screen.getByTestId('ajustes-panel')).toBeInTheDocument();
    });

    it('does NOT render AjustesFiscalesPanel for F350', () => {
        render(
            <DraftEditor
                draftId="draft-2"
                draft={mockDraftF350}
                isLoading={false}
                onClose={vi.fn()}
            />,
            { wrapper }
        );
        expect(screen.queryByTestId('ajustes-panel')).not.toBeInTheDocument();
    });
});

const mockDraftF300WithSections: TaxDeclarationDraft = {
    draft_id: 'draft-3',
    company_nit: '900123456',
    form_type: 'F300',
    period_start: '2026-01-01',
    period_end: '2026-02-28',
    year: 2026,
    status: 'draft',
    fields: [
        {
            renglon: '28',
            label: 'Por operaciones gravadas a la tarifa general',
            value: 1_000_000,
            source: 'tipo_iva=gravado_19',
            confidence: 'high',
            requires_review: false,
            seccion: 'Ingresos',
            es_subtotal: false,
        },
        {
            renglon: '41',
            label: 'Total ingresos brutos',
            value: 1_000_000,
            source: 'calculado',
            confidence: 'high',
            requires_review: false,
            seccion: 'Ingresos',
            es_subtotal: true,
        },
        {
            renglon: '84',
            label: 'Saldo a favor del período fiscal anterior',
            value: 0,
            source: 'diligenciar_manual',
            confidence: 'low',
            requires_review: true,
            seccion: 'Liquidación privada',
            es_subtotal: false,
        },
    ],
    warnings: [],
    created_at: '2026-01-01T00:00:00Z',
};

describe('DraftEditor official-casilla rendering', () => {
    it('groups fields by their official section header', () => {
        render(
            <DraftEditor
                draftId="draft-3"
                draft={mockDraftF300WithSections}
                isLoading={false}
                onClose={vi.fn()}
            />,
            { wrapper }
        );
        expect(screen.getByText('// Ingresos')).toBeInTheDocument();
        expect(screen.getByText('// Liquidación privada')).toBeInTheDocument();
        // Casilla labels are shown (one per field row).
        expect(screen.getAllByText('// CASILLA')).toHaveLength(3);
    });

    it('suppresses the edit button on subtotal casillas', () => {
        render(
            <DraftEditor
                draftId="draft-3"
                draft={mockDraftF300WithSections}
                isLoading={false}
                onClose={vi.fn()}
            />,
            { wrapper }
        );
        // Only the two non-subtotal fields (28 and 84) are editable in draft
        // status; casilla 41 (subtotal) has no edit affordance.
        expect(screen.getAllByTestId('EditIcon')).toHaveLength(2);
    });
});
