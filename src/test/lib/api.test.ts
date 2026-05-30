import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPost = vi.fn();
const mockPatch = vi.fn();

vi.mock('@/lib/api/clients', () => ({
    ingestApiClient: {
        uploadFile: vi.fn(),
        cancelIngest: vi.fn(),
    },
}));

import { ingestApiClient } from '@/lib/api/clients';

describe('uploadFile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('appends parser_mode to FormData when provided', async () => {
        (ingestApiClient.uploadFile as ReturnType<typeof vi.fn>).mockResolvedValue({
            ingest_id: 'ingest_123',
            file_name: 'test.pdf',
            message: 'ok',
            status: 'uploaded',
        });

        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        await ingestApiClient.uploadFile(file, undefined, '800999888-2', 'factura', 'advanced');

        expect(ingestApiClient.uploadFile).toHaveBeenCalledWith(
            file,
            undefined,
            '800999888-2',
            'factura',
            'advanced'
        );
    });

    it('does NOT append parser_mode when omitted', async () => {
        (ingestApiClient.uploadFile as ReturnType<typeof vi.fn>).mockResolvedValue({
            ingest_id: 'ingest_123',
            file_name: 'test.pdf',
            message: 'ok',
            status: 'uploaded',
        });

        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        await ingestApiClient.uploadFile(file, undefined, '800999888-2', 'factura');

        expect(ingestApiClient.uploadFile).toHaveBeenCalledWith(
            file,
            undefined,
            '800999888-2',
            'factura'
        );
        const callArgs = (ingestApiClient.uploadFile as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(callArgs[4]).toBeUndefined();
    });

    it('appends multiple files when array is provided', async () => {
        (ingestApiClient.uploadFile as ReturnType<typeof vi.fn>).mockResolvedValue({
            ingest_id: 'ingest_123',
            file_name: 'bundle',
            message: 'ok',
            status: 'uploaded',
        });

        const fileA = new File(['content-a'], 'page-1.pdf', { type: 'application/pdf' });
        const fileB = new File(['content-b'], 'page-2.pdf', { type: 'application/pdf' });

        await ingestApiClient.uploadFile([fileA, fileB], undefined, '800999888-2');

        const callArgs = (ingestApiClient.uploadFile as ReturnType<typeof vi.fn>).mock.calls[0];
        const filesArg = callArgs[0] as File[];
        expect(Array.isArray(filesArg)).toBe(true);
        expect(filesArg).toHaveLength(2);
        expect(filesArg[0].name).toBe('page-1.pdf');
        expect(filesArg[1].name).toBe('page-2.pdf');
    });
});

describe('cancelIngest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (ingestApiClient.cancelIngest as ReturnType<typeof vi.fn>).mockResolvedValue({
            ingest_id: 'ingest_123',
            file_name: 'test.pdf',
            status: 'cancelled',
            raw_transactions: [],
        });
    });

    it('calls cancelIngest with correct id', async () => {
        await ingestApiClient.cancelIngest('ingest_123');
        expect(ingestApiClient.cancelIngest).toHaveBeenCalledWith('ingest_123');
    });
});
