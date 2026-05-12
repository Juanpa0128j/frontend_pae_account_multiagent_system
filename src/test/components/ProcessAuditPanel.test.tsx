import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ProcessAuditPanel, { AuditFindingList } from '@/components/upload/ProcessAuditPanel';

vi.mock('@/hooks', () => ({
    useProcessStatus: () => ({ data: null }),
    useProcessTrace: () => ({ data: null, isLoading: false, isError: false }),
    useIngestTrace: () => ({ data: null, isLoading: false, isError: false }),
    useConfirmAuditReview: () => ({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
    }),
}));

vi.mock('@/components/common/StatusBadge', () => ({
    default: () => <span>StatusBadge</span>,
}));

vi.mock('@/components/agent/AgentTimeline', () => ({
    default: () => <div>AgentTimeline</div>,
}));

vi.mock('@/components/brutalist', () => ({
    BrutalistButton: vi.fn(({ children }) => <button>{children}</button>),
    BrutalistCard: vi.fn(({ children }) => <div data-testid="brutalist-card">{children}</div>),
    BrutalistChip: vi.fn(({ label }) => <span data-testid="brutalist-chip">{label}</span>),
    BrutalistEmptyState: vi.fn(() => <div>Empty</div>),
}));

describe('ProcessAuditPanel', () => {
    it('maps NO_CONTADOR_ASIENTOS to SIN_ASIENTOS_CONTABLES chip text', () => {
        render(
            <ProcessAuditPanel
                file={{
                    status: 'error',
                    error_code: 'NO_CONTADOR_ASIENTOS',
                }}
            />
        );
        expect(screen.getByText('SIN_ASIENTOS_CONTABLES')).toBeInTheDocument();
    });

    it('shows remediation text when error_code is NO_CONTADOR_ASIENTOS', () => {
        render(
            <ProcessAuditPanel
                file={{
                    status: 'error',
                    error_code: 'NO_CONTADOR_ASIENTOS',
                    remediation: 'Verifique que el documento contenga asientos contables.',
                }}
            />
        );
        expect(
            screen.getByText('Verifique que el documento contenga asientos contables.')
        ).toBeInTheDocument();
    });

    it('maps extraction_error category to ERROR_EXTRACCIÓN', () => {
        render(
            <ProcessAuditPanel
                file={{
                    status: 'error',
                    error_category: 'extraction_error',
                }}
            />
        );
        expect(screen.getByText('ERROR_EXTRACCIÓN')).toBeInTheDocument();
    });

    it('maps SCHEMA_VALIDATION_EXHAUSTED to VALIDACIÓN_ESQUEMA_AGOTADA chip text', () => {
        render(
            <ProcessAuditPanel
                file={{
                    status: 'error',
                    error_code: 'SCHEMA_VALIDATION_EXHAUSTED',
                }}
            />
        );
        expect(screen.getByText('VALIDACIÓN_ESQUEMA_AGOTADA')).toBeInTheDocument();
    });

    it('localizes rule_id in AuditFindingList to Spanish', () => {
        render(
            <AuditFindingList
                title="// HALLAZGOS"
                findings={[
                    {
                        rule_id: 'SCHEMA_VALIDATION_EXHAUSTED',
                        user_message_es: 'El agente no pudo generar una respuesta válida.',
                    },
                ]}
                accent="#EF4444"
            />
        );
        expect(screen.getByText('VALIDACIÓN_ESQUEMA_AGOTADA')).toBeInTheDocument();
    });
});
