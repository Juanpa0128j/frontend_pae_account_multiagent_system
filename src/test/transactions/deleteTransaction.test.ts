import { describe, it, expect, vi, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockDelete = vi.fn();

vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => ({
            delete: mockDelete,
            post: vi.fn(),
            patch: vi.fn(),
            get: vi.fn(),
            interceptors: {
                request: { use: vi.fn(), eject: vi.fn() },
                response: { use: vi.fn(), eject: vi.fn() },
            },
        })),
        isAxiosError: vi.fn(),
    },
    __esModule: true,
}));

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            signOut: vi.fn().mockResolvedValue({}),
        },
    }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('deleteTransaction', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('calls DELETE /api/v1/transactions/{id}', async () => {
        mockDelete.mockResolvedValue({ status: 204, data: null });

        const { deleteTransaction } = await import('@/lib/api');
        await deleteTransaction('tx-123');

        expect(mockDelete).toHaveBeenCalledWith('/api/v1/transactions/tx-123');
    });

    it('resolves on 204 response', async () => {
        mockDelete.mockResolvedValue({
            status: 204,
            data: null,
        });

        const { deleteTransaction } = await import('@/lib/api');
        const result = await deleteTransaction('tx-456');

        expect(result).toBeUndefined();
    });

    it('throws on 4xx response', async () => {
        const axiosError = new Error('Not Found');
        (axiosError as any).response = {
            status: 404,
            statusText: 'Not Found',
        };

        mockDelete.mockRejectedValue(axiosError);

        const { deleteTransaction } = await import('@/lib/api');

        await expect(deleteTransaction('tx-invalid')).rejects.toThrow();
    });
});
