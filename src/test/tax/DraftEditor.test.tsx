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
