import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks — only the ingest client is exercised by waitForIngestCompletion
// ---------------------------------------------------------------------------

const mockGetIngestDetail = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/clients', () => ({
    ingestApiClient: {
        getIngestDetail: mockGetIngestDetail,
        uploadFile: vi.fn(),
        updateIngestClassification: vi.fn(),
        cancelIngest: vi.fn(),
        getIngestTrace: vi.fn(),
        getPendingReviewJobs: vi.fn(),
        confirmAuditReview: vi.fn(),
    },
    processApiClient: {
        processAccounting: vi.fn(),
        getProcessStatus: vi.fn(),
        getProcessResult: vi.fn(),
        getProcessTrace: vi.fn(),
        cancelProcess: vi.fn(),
        confirmAuditReview: vi.fn(),
    },
    reportApiClient: {
        getStatements: vi.fn(),
    },
}));

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: () => Promise.resolve({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
    }),
}));

import { waitForIngestCompletion } from '@/hooks/useUpload';

describe('waitForIngestCompletion — transient rejection tolerance', () => {
    beforeEach(() => {
        mockGetIngestDetail.mockReset();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('resolves normally when the first poll already returns completed', async () => {
        mockGetIngestDetail.mockResolvedValueOnce({ status: 'completed' });

        const promise = waitForIngestCompletion('ing_1');
        await vi.runAllTimersAsync();

        await expect(promise).resolves.toEqual({ status: 'completed' });
    });

    it('tolerates a single transient rejection (no-response blip) then completes', async () => {
        mockGetIngestDetail
            .mockRejectedValueOnce(new Error('Sin respuesta del servidor. Verifique su conexión.'))
            .mockResolvedValueOnce({ status: 'completed' });

        const promise = waitForIngestCompletion('ing_1');
        await vi.runAllTimersAsync();

        await expect(promise).resolves.toEqual({ status: 'completed' });
    });

    it('tolerates two consecutive transient rejections then completes', async () => {
        mockGetIngestDetail
            .mockRejectedValueOnce(new Error('blip 1'))
            .mockRejectedValueOnce(new Error('blip 2'))
            .mockResolvedValueOnce({ status: 'completed' });

        const promise = waitForIngestCompletion('ing_1');
        await vi.runAllTimersAsync();

        await expect(promise).resolves.toEqual({ status: 'completed' });
    });

    it('throws once transient rejections exceed the retry budget', async () => {
        mockGetIngestDetail.mockRejectedValue(new Error('persistent failure'));

        const settled = waitForIngestCompletion('ing_1').then(
            () => ({ ok: true as const }),
            (err: unknown) => ({ ok: false as const, err })
        );
        await vi.runAllTimersAsync();

        const result = await settled;
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.err).toBeInstanceOf(Error);
            expect((result.err as Error).message).toBe('persistent failure');
        }
    });
});
