import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ProcessAuditPanel from '@/components/upload/ProcessAuditPanel';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/hooks', () => ({
    useProcessStatus: () => ({ data: null }),
    useProcessTrace: () => ({ data: null, isLoading: false, isError: false }),
    useIngestTrace: () => ({ data: null, isLoading: false, isError: false }),
    useIngestDetail: () => ({ data: null }),
    useConfirmAuditReview: () => ({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
    }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@tanstack/react-query')>();
    return {
        ...actual,
        useQuery: () => ({ data: null, isLoading: false, isError: false }),
        useMutation: () => ({
            mutate: vi.fn(),
            isPending: false,
            isSuccess: false,
            isError: false,
        }),
        useQueryClient: () => ({
            invalidateQueries: vi.fn(),
        }),
    };
});

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProcessAuditPanel', () => {
    it('renders single file name label without file list', () => {
        render(
            <ProcessAuditPanel
                file={{
                    status: 'done',
                    label: 'doc.pdf',
                    file_names: ['doc.pdf'],
                }}
            />
        );

        // label shown
        expect(screen.getAllByText('doc.pdf').length).toBeGreaterThan(0);
        // no multi-file list rendered (single file)
        expect(screen.queryByRole('list')).toBeNull();
    });

    it('renders all bundled file names when multiple files', () => {
        render(
            <ProcessAuditPanel
                file={{
                    status: 'done',
                    label: 'doc.pdf +2',
                    file_names: ['page1.pdf', 'page2.pdf', 'page3.pdf'],
                }}
            />
        );

        expect(screen.getByText('page1.pdf')).toBeTruthy();
        expect(screen.getByText('page2.pdf')).toBeTruthy();
        expect(screen.getByText('page3.pdf')).toBeTruthy();
    });
});
