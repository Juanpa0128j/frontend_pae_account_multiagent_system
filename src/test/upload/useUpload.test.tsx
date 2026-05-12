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
        _file: File,
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
        file: File,
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
    const file = new File(['content'], name, { type: 'application/pdf' });
    return {
        file,
        id: `id-${name}`,
        status: 'idle',
        progress: 0,
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

    it('exposes parserMode defaulting to fast and a setter', () => {
        const { result } = renderHook(() => useUpload(), { wrapper });
        expect(result.current.parserMode).toBe('fast');
        expect(typeof result.current.setParserMode).toBe('function');
    });

    it('calls uploadFile with the selected parser_mode', async () => {
        mockViaAFiles = [makeFileState('doc.pdf')];

        const { result } = renderHook(() => useUpload(), { wrapper });

        // Change parser mode before uploading
        act(() => {
            result.current.setParserMode('premium');
        });

        // Trigger upload using the freshly-bound callback after re-render
        await act(async () => {
            await result.current.uploadAll();
        });

        await waitFor(() => {
            expect(mockUploadFile).toHaveBeenCalledTimes(1);
        });

        const uploadCall = mockUploadFile.mock.calls[0]!;
        expect(uploadCall[0]).toBeInstanceOf(File);
        expect((uploadCall[0] as File).name).toBe('doc.pdf');
        expect(uploadCall[4]).toBe('premium');
    });
});
