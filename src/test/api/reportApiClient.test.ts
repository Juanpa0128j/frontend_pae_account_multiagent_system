import { describe, it, expect, vi } from 'vitest';
import { ReportApiClient } from '@/lib/api/clients/reportApiClient';
import type { ApiClient } from '@/lib/api/core/apiClient';

function makeClient() {
    const get = vi.fn().mockResolvedValue({ data: {} });
    const client = new ReportApiClient({ get } as unknown as ApiClient);
    return { client, get };
}

/**
 * Regression: the /api/v1/tax/* endpoints read the period from `period_start` /
 * `period_end` query params (NOT `start_date` / `end_date`). Sending the wrong
 * names made the backend silently fall back to the current month, so the period
 * selector was ignored and every period rendered the current month's data.
 */
describe('ReportApiClient tax endpoints send period_start/period_end', () => {
    const start = '2026-03-01';
    const end = '2026-03-31';

    const cases: { name: string; call: (c: ReportApiClient) => Promise<unknown>; url: string }[] = [
        { name: 'getIVA', call: (c) => c.getIVA('900', start, end), url: '/api/v1/tax/iva' },
        {
            name: 'getWithholdings',
            call: (c) => c.getWithholdings('900', start, end),
            url: '/api/v1/tax/withholdings',
        },
        { name: 'getICA', call: (c) => c.getICA('900', start, end), url: '/api/v1/tax/ica' },
        {
            name: 'getRentaProvision',
            call: (c) => c.getRentaProvision('900', start, end),
            url: '/api/v1/tax/renta-provision',
        },
    ];

    for (const { name, call, url } of cases) {
        it(`${name} uses period_start/period_end, not start_date/end_date`, async () => {
            const { client, get } = makeClient();
            await call(client);

            const [calledUrl, config] = get.mock.calls[0];
            expect(calledUrl).toBe(url);
            expect(config.params).toMatchObject({
                period_start: start,
                period_end: end,
            });
            expect(config.params).not.toHaveProperty('start_date');
            expect(config.params).not.toHaveProperty('end_date');
        });
    }
});
