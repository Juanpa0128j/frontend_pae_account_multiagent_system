import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@/lib/api/clients', () => ({
    reportApiClient: {
        deleteTransaction: vi.fn(),
    },
}));

import { reportApiClient } from '@/lib/api/clients';

describe('deleteTransaction', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('calls deleteTransaction with correct id', async () => {
        (reportApiClient.deleteTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(
            undefined
        );

        await reportApiClient.deleteTransaction('tx-123');

        expect(reportApiClient.deleteTransaction).toHaveBeenCalledWith('tx-123');
    });

    it('resolves on 204 response', async () => {
        (reportApiClient.deleteTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(
            undefined
        );

        const result = await reportApiClient.deleteTransaction('tx-456');

        expect(result).toBeUndefined();
    });

    it('throws on 4xx response', async () => {
        const axiosError = new Error('Not Found');
        (axiosError as any).response = {
            status: 404,
            statusText: 'Not Found',
        };

        (reportApiClient.deleteTransaction as ReturnType<typeof vi.fn>).mockRejectedValue(
            axiosError
        );

        await expect(reportApiClient.deleteTransaction('tx-invalid')).rejects.toThrow();
    });
});
