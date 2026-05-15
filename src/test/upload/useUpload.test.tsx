import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUpload } from '@/hooks/useUpload';
import type { FileUploadState } from '@/types';
import type { UploadResponse, IngestDetailResponse, ProcessResponse } from '@/lib/api';

// ---------------------------------------------------------------------------
// Mutable mock state
// ---------------------------------------------------------------------------

let mockViaAFiles: FileUploadState[] = [];
const mockSetViaAFiles = vi.fn((updater: any) => {
    if (typeof updater === 'function') {
        mockViaAFiles = updater(mockViaAFiles);
    } else {
        mockViaAFiles = updater;
    }
});

const mockUploadFile = vi.fn(
    (
        _file: File | File[],
        _onProgress?: unknown,
        _companyNit?: string,
        _docType?: string,
        parserMode?: string
    ): Promise<UploadResponse> =>
        Promise.resolve({
            ingest_id: 'ingest-1',
            file_name: 'test.pdf',
            message: 'ok',
            status: 'uploaded',
        })
);

const mockGetIngestDetail = vi.fn(
    (_ingestId: string): Promise<IngestDetailResponse> =>
        Promise.resolve({
            ingest_id: 'ingest-1',
            file_name: 'test.pdf',
            status: 'completed',
            raw_transactions: [],
            extraction_errors: [],
        })
);

const mockProcessAccounting = vi.fn(
    (_ingestId: string): Promise<ProcessResponse> =>
        Promise.resolve({
            process_id: 'proc-1',
            status: 'completed',
            message: 'ok',
        })
);

const mockGetProcessStatus = vi.fn(
    (_processId: string): Promise<{ status: string }> =>
        Promise.resolve({
            status: 'completed',
        })
);

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/context/CompanyContext', () => ({
    useCompany: () => ({ activeNit: '800999888-1' }),
}));

vi.mock('@/context/UploadSessionContext', () => ({
    useUploadSession: () => ({
        viaAFiles: mockViaAFiles,
        setViaAFiles: mockSetViaAFiles,
        viaBSlots: [],
        setViaBSlots: vi.fn(),
        isPollingDerived: false,
        setIsPollingDerived: vi.fn(),
        derivedStatements: [],
        setDerivedStatements: vi.fn(),
        derivedError: null,
        setDerivedError: vi.fn(),
        uploadMode: 'via-a',
        setUploadMode: vi.fn(),
    }),
}));

vi.mock('@/lib/api', () => ({
    uploadFile: (
        file: File | File[],
        onProgress?: unknown,
        companyNit?: string,
        docType?: string,
        parserMode?: string
    ) => mockUploadFile(file, onProgress, companyNit, docType, parserMode),
    getIngestDetail: (ingestId: string) => mockGetIngestDetail(ingestId),
    processAccounting: (ingestId: string) => mockProcessAccounting(ingestId),
    getProcessStatus: (processId: string) => mockGetProcessStatus(processId),
    updateIngestClassification: vi.fn(() => Promise.resolve({ status: 'completed' })),
    getStatements: vi.fn(() => Promise.resolve([])),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function makeFileState(name: string): FileUploadState {
    return {
        file: new File(['test'], name, { type: 'application/pdf' }),
        id: `id-${name}`,
        status: 'idle',
        progress: 0,
        parser_mode: 'fast',
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useUpload', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockViaAFiles = [];
    });

    it('exposes setFileParserMode for per-document mode selection', () => {
        const { result } = renderHook(() => useUpload(), { wrapper });
        expect(typeof result.current.setFileParserMode).toBe('function');
    });

    it('calls uploadFile with per-document parser_mode defaulting to fast', async () => {
        mockViaAFiles = [makeFileState('doc.pdf')];

        const { result } = renderHook(() => useUpload(), { wrapper });

        // Trigger upload
        await act(async () => {
            await result.current.uploadAll();
        });

        await waitFor(() => {
            expect(mockUploadFile).toHaveBeenCalledTimes(1);
        });

        const uploadCall = mockUploadFile.mock.calls[0]!;
        expect(Array.isArray(uploadCall[0])).toBe(true);
        expect((uploadCall[0] as File[])[0].name).toBe('doc.pdf');
        expect(uploadCall[4]).toBe('fast');
    });

    it('setFileParserMode updates the file parser_mode via setFiles', () => {
        mockViaAFiles = [makeFileState('doc.pdf')];

        const { result } = renderHook(() => useUpload(), { wrapper });

        act(() => {
            result.current.setFileParserMode('id-doc.pdf', 'premium');
        });

        expect(mockSetViaAFiles).toHaveBeenCalled();
        const updater = mockSetViaAFiles.mock.calls[0][0];
        const updated = updater(mockViaAFiles);
        expect(updated[0].parser_mode).toBe('premium');
    });

    it('calls uploadFile with per-document parser_mode when file has premium', async () => {
        mockViaAFiles = [{ ...makeFileState('doc.pdf'), parser_mode: 'premium' }];

        const { result } = renderHook(() => useUpload(), { wrapper });

        await act(async () => {
            await result.current.uploadAll();
        });

        await waitFor(() => {
            expect(mockUploadFile).toHaveBeenCalledTimes(1);
        });

        const uploadCall = mockUploadFile.mock.calls[0]!;
        expect(uploadCall[4]).toBe('premium');
    });

    it('batches multi-page uploads into a single uploadFile call', async () => {
        const fileA = new File(['a'], 'page-1.pdf', { type: 'application/pdf' });
        const fileB = new File(['b'], 'page-2.pdf', { type: 'application/pdf' });
        mockViaAFiles = [
            {
                ...makeFileState('page-1.pdf'),
                file: fileA,
                files: [fileA, fileB],
            },
        ];

        const { result } = renderHook(() => useUpload(), { wrapper });

        await act(async () => {
            await result.current.uploadAll();
        });

        await waitFor(() => {
            expect(mockUploadFile).toHaveBeenCalledTimes(1);
        });

        const uploadCall = mockUploadFile.mock.calls[0]!;
        expect(Array.isArray(uploadCall[0])).toBe(true);
        expect((uploadCall[0] as File[]).map((f) => f.name)).toEqual(['page-1.pdf', 'page-2.pdf']);
    });

    it('counts pending documents across grouped files', () => {
        const fileA = new File(['a'], 'page-1.pdf', { type: 'application/pdf' });
        const fileB = new File(['b'], 'page-2.pdf', { type: 'application/pdf' });
        mockViaAFiles = [
            { ...makeFileState('group.pdf'), file: fileA, files: [fileA, fileB] },
            makeFileState('single.pdf'),
        ];

        const { result } = renderHook(() => useUpload(), { wrapper });

        expect(result.current.pendingDocumentsCount).toBe(3);
    });

    it('treats extracting files as uploading', () => {
        mockViaAFiles = [{ ...makeFileState('doc.pdf'), status: 'extracting' }];

        const { result } = renderHook(() => useUpload(), { wrapper });

        expect(result.current.isUploading).toBe(true);
    });

    it('file_names from ingest response stored in FileUploadState', async () => {
        mockGetIngestDetail.mockResolvedValueOnce({
            ingest_id: 'ingest-1',
            file_name: 'bundle.pdf',
            status: 'completed',
            file_names: ['a.pdf', 'b.pdf'],
            raw_transactions: [],
            extraction_errors: [],
        });

        mockViaAFiles = [makeFileState('bundle.pdf')];

        const { result } = renderHook(() => useUpload(), { wrapper });

        await act(async () => {
            await result.current.uploadAll();
        });

        await waitFor(() => {
            const fileState = mockViaAFiles[0];
            expect(fileState?.file_names).toEqual(['a.pdf', 'b.pdf']);
        });
    });

    it('single file upload stores file_names with one entry', async () => {
        mockGetIngestDetail.mockResolvedValueOnce({
            ingest_id: 'ingest-1',
            file_name: 'doc.pdf',
            status: 'completed',
            file_names: ['doc.pdf'],
            raw_transactions: [],
            extraction_errors: [],
        });

        mockViaAFiles = [makeFileState('doc.pdf')];

        const { result } = renderHook(() => useUpload(), { wrapper });

        await act(async () => {
            await result.current.uploadAll();
        });

        await waitFor(() => {
            const fileState = mockViaAFiles[0];
            expect(fileState?.file_names).toEqual(['doc.pdf']);
        });
    });
});
