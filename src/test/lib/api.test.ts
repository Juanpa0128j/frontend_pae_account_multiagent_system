import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockGet = vi.fn();

vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => ({
            post: mockPost,
            patch: mockPatch,
            get: mockGet,
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

describe('uploadFile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPost.mockResolvedValue({
            data: {
                ingest_id: 'ingest_123',
                file_name: 'test.pdf',
                message: 'ok',
                status: 'uploaded',
            },
        });
    });

    it('appends parser_mode to FormData when provided', async () => {
        const { uploadFile } = await import('@/lib/api');
        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        await uploadFile(file, undefined, '800999888-2', 'factura', 'advanced');

        const [url, formData] = mockPost.mock.calls[0];
        expect(url).toBe('/api/v1/ingest/upload');
        expect(formData.get('parser_mode')).toBe('advanced');
    });

    it('does NOT append parser_mode when omitted', async () => {
        const { uploadFile } = await import('@/lib/api');
        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        await uploadFile(file, undefined, '800999888-2', 'factura');

        const [url, formData] = mockPost.mock.calls[0];
        expect(url).toBe('/api/v1/ingest/upload');
        expect(formData.get('parser_mode')).toBeNull();
    });
});

describe('cancelIngest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPatch.mockResolvedValue({
            data: {
                ingest_id: 'ingest_123',
                file_name: 'test.pdf',
                status: 'cancelled',
                raw_transactions: [],
            },
        });
    });

    it('calls PATCH /api/v1/ingest/{id}/cancel', async () => {
        const { cancelIngest } = await import('@/lib/api');
        await cancelIngest('ingest_123');

        expect(mockPatch).toHaveBeenCalledWith('/api/v1/ingest/ingest_123/cancel');
    });
});
