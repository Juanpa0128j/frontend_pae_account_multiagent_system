// @vitest-environment node

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { apiClient } from '@/lib/api/core/apiClient';
import { ProcessApiClient } from '@/lib/api/clients/processApiClient';
import { ProcessStatusResponse, ProcessResultResponse, PipelineTrace } from '@/types/api';

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
            signOut: vi.fn(() => Promise.resolve()),
        },
    }),
}));

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ProcessApiClient', () => {
    const baseURL = 'http://localhost:8000';
    const client = apiClient;
    const processClient = new ProcessApiClient(client);

    describe('getProcessStatus', () => {
        it('returns process status for a given id', async () => {
            const mockResponse: ProcessStatusResponse = {
                process_id: 'proc_123',
                status: 'running',
                current_stage: 'audit',
                current_agent: 'Auditor',
                progress: 0.75,
                error_message: undefined,
                error_category: undefined,
                error_code: undefined,
                remediation: undefined,
                agent_log: [],
                created_at: '2024-01-01T00:00:00Z',
                started_at: '2024-01-01T00:01:00Z',
                completed_at: undefined,
                has_warnings: false,
                trace_url: null,
                audit_review: null,
            };

            server.use(
                http.get(`${baseURL}/api/v1/process/status/proc_123`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await processClient.getProcessStatus('proc_123');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('confirmAuditReview', () => {
        it('posts audit confirmation and returns message with process_id', async () => {
            const mockResponse = { message: 'Audit review confirmed', process_id: 'proc_123' };

            server.use(
                http.post(`${baseURL}/api/v1/process/proc_123/audit-confirm`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await processClient.confirmAuditReview('proc_123');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getProcessResult', () => {
        it('returns process result for a given id', async () => {
            const mockResponse: ProcessResultResponse = {
                process_id: 'proc_123',
                ingest_id: 'ing_456',
                status: 'completed',
                transactions: [
                    {
                        id: 'txn_1',
                        fecha: '2024-01-01',
                        descripcion: 'Test transaction',
                        total: 100000,
                        nit_emisor: '9001234561',
                        items: [
                            {
                                cuenta_puc: '1105',
                                cuenta_nombre: 'Caja',
                                debito: 100000,
                                credito: 0,
                                tercero_nit: '9001234561',
                            },
                        ],
                    },
                ],
                error_message: undefined,
                error_category: undefined,
                error_code: undefined,
                remediation: undefined,
            };

            server.use(
                http.get(`${baseURL}/api/v1/process/result/proc_123`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await processClient.getProcessResult('proc_123');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getProcessTrace', () => {
        it('returns pipeline trace for a given process id', async () => {
            const mockResponse: PipelineTrace = {
                process_id: 'proc_123',
                overall_status: 'completed',
                steps: [],
                blockers: [],
                give_up: null,
            };

            server.use(
                http.get(`${baseURL}/api/v1/process/proc_123/trace`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await processClient.getProcessTrace('proc_123');
            expect(result).toEqual(mockResponse);
        });
    });
});
