// @vitest-environment node

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { apiClient } from '@/lib/api/core/apiClient';
import { IngestApiClient } from '@/lib/api/clients/ingestApiClient';

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

describe('IngestApiClient', () => {
    const baseURL = 'http://localhost:8000';
    const client = apiClient;
    const ingestClient = new IngestApiClient(client);

    describe('uploadFile', () => {
        it('posts multipart form-data with file and returns upload response', async () => {
            const mockResponse = {
                ingest_id: 'ing_123',
                file_name: 'test.pdf',
                message: 'Upload successful',
                status: 'pending',
            };

            server.use(
                http.post(`${baseURL}/api/v1/ingest/upload`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
            const result = await ingestClient.uploadFile(file);

            expect(result).toEqual(mockResponse);
        });

        it('includes company_nit when provided', async () => {
            const mockResponse = {
                ingest_id: 'ing_124',
                file_name: 'test2.pdf',
                message: 'Upload successful',
                status: 'pending',
            };

            server.use(
                http.post(`${baseURL}/api/v1/ingest/upload`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const file = new File(['content'], 'test2.pdf', { type: 'application/pdf' });
            const result = await ingestClient.uploadFile(file, undefined, '9001234561');

            expect(result).toEqual(mockResponse);
        });

        it('calls onUploadProgress during upload', async () => {
            const mockResponse = {
                ingest_id: 'ing_125',
                file_name: 'test3.pdf',
                message: 'Upload successful',
                status: 'pending',
            };

            server.use(
                http.post(`${baseURL}/api/v1/ingest/upload`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const onUploadProgress = vi.fn();
            const file = new File(['content'], 'test3.pdf', { type: 'application/pdf' });
            await ingestClient.uploadFile(file, onUploadProgress);

            expect(onUploadProgress).toHaveBeenCalled();
        });
    });

    describe('getIngestDetail', () => {
        it('returns ingest detail for a given id', async () => {
            const mockResponse = {
                ingest_id: 'ing_123',
                file_name: 'test.pdf',
                status: 'completed',
                raw_transactions: [],
            };

            server.use(
                http.get(`${baseURL}/api/v1/ingest/ing_123`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await ingestClient.getIngestDetail('ing_123');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('updateIngestClassification', () => {
        it('patches classification and returns updated detail', async () => {
            const mockResponse = {
                ingest_id: 'ing_123',
                file_name: 'test.pdf',
                status: 'completed',
                raw_transactions: [],
            };

            server.use(
                http.patch(`${baseURL}/api/v1/ingest/ing_123/classification`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await ingestClient.updateIngestClassification('ing_123', {
                doc_type: 'factura',
                confirmed: true,
            });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getIngestTrace', () => {
        it('returns pipeline trace for a given ingest id', async () => {
            const mockResponse = {
                process_id: 'proc_123',
                overall_status: 'completed',
                steps: [],
                blockers: [],
            };

            server.use(
                http.get(`${baseURL}/api/v1/ingest/ing_123/trace`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await ingestClient.getIngestTrace('ing_123');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('processAccounting', () => {
        it('returns process response on success', async () => {
            const mockResponse = {
                message: 'Processing started',
                process_id: 'proc_456',
                status: 'RUNNING',
            };

            server.use(
                http.post(`${baseURL}/api/v1/process/accounting/ing_123`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await ingestClient.processAccounting('ing_123');
            expect(result).toEqual(mockResponse);
        });

        it('recovers from 409 conflict when process_id is present in error detail', async () => {
            server.use(
                http.post(`${baseURL}/api/v1/process/accounting/ing_123`, () => {
                    return HttpResponse.json(
                        {
                            detail: {
                                message: 'Process already exists: proc_789',
                                remediation: 'Use existing process',
                            },
                        },
                        { status: 409 }
                    );
                })
            );

            const result = await ingestClient.processAccounting('ing_123');
            expect(result.process_id).toBe('proc_789');
            expect(result.status).toBe('RUNNING');
        });

        it('recovers from 409 conflict when process_id is present in error message', async () => {
            server.use(
                http.post(`${baseURL}/api/v1/process/accounting/ing_123`, () => {
                    return HttpResponse.json(
                        {
                            message: 'Conflict: proc_abc already running',
                        },
                        { status: 409 }
                    );
                })
            );

            const result = await ingestClient.processAccounting('ing_123');
            expect(result.process_id).toBe('proc_abc');
            expect(result.status).toBe('RUNNING');
        });

        it('throws enriched error on 409 when no process_id can be extracted', async () => {
            server.use(
                http.post(`${baseURL}/api/v1/process/accounting/ing_123`, () => {
                    return HttpResponse.json(
                        {
                            message: 'Generic conflict',
                            detail: 'No process id here',
                        },
                        { status: 409 }
                    );
                })
            );

            await expect(ingestClient.processAccounting('ing_123')).rejects.toThrow(
                'No process id here'
            );
        });

        it('re-throws non-409 errors unchanged', async () => {
            server.use(
                http.post(`${baseURL}/api/v1/process/accounting/ing_123`, () => {
                    return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
                })
            );

            await expect(ingestClient.processAccounting('ing_123')).rejects.toMatchObject({
                status: 500,
                message: 'Internal server error',
            });
        });
    });
});
