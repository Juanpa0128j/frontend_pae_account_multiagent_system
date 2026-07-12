import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ProcessAuditPanel from '@/components/upload/ProcessAuditPanel';

// ---------------------------------------------------------------------------
// Mutable trace-hook return so each test can inject a different error shape.
// ---------------------------------------------------------------------------

const traceState = vi.hoisted(() => ({
    ret: { data: null, isLoading: false, isError: false, error: null } as {
        data: unknown;
        isLoading: boolean;
        isError: boolean;
        error: unknown;
    },
}));

vi.mock('@/hooks', () => ({
    useProcessStatus: () => ({ data: null }),
    useProcessTrace: () => ({ data: null, isLoading: false, isError: false, error: null }),
    useIngestTrace: () => traceState.ret,
    useIngestDetail: () => ({ data: null }),
    useConfirmAuditReview: () => ({
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
    }),
}));

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: () => Promise.resolve({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
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
        useQueryClient: () => ({ invalidateQueries: vi.fn() }),
    };
});

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

const FATAL_ALERT_TEXT = /detalle no está disponible/i;

describe('ProcessAuditPanel — trace endpoint 409 (still processing)', () => {
    beforeEach(() => {
        traceState.ret = { data: null, isLoading: false, isError: false, error: null };
    });

    it('does NOT surface the fatal "detalle no está disponible" alert on a 409 trace response', () => {
        traceState.ret = {
            data: null,
            isLoading: false,
            isError: true,
            error: { status: 409, error_code: 'INGEST_NOT_COMPLETE' },
        };

        render(
            <ProcessAuditPanel
                file={{
                    status: 'done',
                    trace_kind: 'ingest',
                    ingest_id: 'ing_1',
                    has_warnings: true,
                }}
            />
        );

        expect(screen.queryByText(FATAL_ALERT_TEXT)).toBeNull();
        // A neutral "still processing" state is shown instead.
        expect(screen.getByText(/se está procesando/i)).toBeTruthy();
    });

    it('still surfaces the fatal alert for a real error (500) trace response', () => {
        traceState.ret = {
            data: null,
            isLoading: false,
            isError: true,
            error: { status: 500 },
        };

        render(
            <ProcessAuditPanel
                file={{ status: 'error', trace_kind: 'ingest', ingest_id: 'ing_1' }}
            />
        );

        expect(screen.getByText(FATAL_ALERT_TEXT)).toBeTruthy();
    });
});
