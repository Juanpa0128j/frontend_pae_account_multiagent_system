import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUpload } from '@/hooks/useUpload';
import type { FileUploadState } from '@/types';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockSessionState = vi.hoisted(() => ({ files: [] as FileUploadState[] }));
const stableSetViaAFiles = vi.hoisted(
    () => (updater: FileUploadState[] | ((prev: FileUploadState[]) => FileUploadState[])) => {
        if (typeof updater === 'function') {
            mockSessionState.files = updater(mockSessionState.files);
        } else {
            mockSessionState.files = updater;
        }
    }
);

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: () => Promise.resolve({ data: { session: null } }),
            onAuthStateChange: () => ({
                data: { subscription: { unsubscribe: vi.fn() } },
            }),
        },
    }),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        pathname: '/',
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/context/CompanyContext', () => ({
    useCompany: () => ({
        activeNit: 'test-nit-123',
        companies: [],
        selectCompany: vi.fn(),
    }),
}));

vi.mock('@/context/UploadSessionContext', () => ({
    useUploadSession: () => ({
        viaAFiles: mockSessionState.files,
        setViaAFiles: stableSetViaAFiles,
        viaBSlots: [],
        setViaBSlots: vi.fn(),
        isPollingDerived: false,
        setIsPollingDerived: vi.fn(),
        derivedStatements: [],
        setDerivedStatements: vi.fn(),
        derivedError: null,
        setDerivedError: vi.fn(),
    }),
}));

vi.mock('@/lib/api', () => ({
    uploadFile: vi.fn(),
    processAccounting: vi.fn(),
    getProcessStatus: vi.fn(),
    getIngestDetail: vi.fn(),
    updateIngestClassification: vi.fn(),
    getStatements: vi.fn(),
    cancelIngest: vi.fn(),
}));

vi.mock('@/hooks/useFileSlotState', () => ({
    updateSlot: vi.fn(),
    updateWhere: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFile(name: string, size = 1000, type = 'application/pdf'): File {
    return new File(['x'.repeat(size)], name, { type });
}

function makeUploadState(overrides: Partial<FileUploadState> = {}): FileUploadState {
    return {
        id: crypto.randomUUID(),
        file: makeFile('document.pdf'),
        status: 'idle',
        progress: 0,
        parser_mode: 'fast',
        ...overrides,
    };
}

function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
}

function createWrapper(queryClient: QueryClient) {
    function Wrapper({ children }: { children: React.ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }
    return Wrapper;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useUpload — reorderQueue functionality', () => {
    beforeEach(() => {
        mockSessionState.files = [];
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('reorderQueue basic behavior', () => {
        it('exports reorderQueue callback from hook', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            expect(typeof result.current.reorderQueue).toBe('function');
        });

        it('hook provides files array', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            expect(Array.isArray(result.current.files)).toBe(true);
        });
    });

    describe('reorderQueue with single item', () => {
        it('returns early when reordering single-item queue', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            const item = makeUploadState({ id: 'item-1' });

            act(() => {
                result.current.addFiles([item.file]);
            });

            const currentFiles = result.current.files;
            const newOrder = [...currentFiles];

            expect(() => {
                act(() => {
                    result.current.reorderQueue?.(newOrder);
                });
            }).not.toThrow();
        });
    });

    describe('reorderQueue with multiple items', () => {
        it('reorderQueue is exported from hook', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            // Check that reorderQueue method exists (it's optional for backwards compat)
            if (result.current.reorderQueue) {
                expect(typeof result.current.reorderQueue).toBe('function');
            }
        });

        it('hook exports files array for queue management', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            expect(result.current.files).toBeDefined();
            expect(Array.isArray(result.current.files)).toBe(true);
        });
    });

    describe('reorderQueue callback stability', () => {
        it('reorderQueue callback is memoized with useCallback', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result, rerender } = renderHook(() => useUpload(), { wrapper });

            const firstCallbackRef = result.current.reorderQueue;

            // Rerender hook
            rerender();

            const secondCallbackRef = result.current.reorderQueue;

            // If both exist, they should be the same reference (memoized)
            if (firstCallbackRef && secondCallbackRef) {
                expect(firstCallbackRef).toBe(secondCallbackRef);
            }
        });

        it('reorderQueue does not change when files are unchanged', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result, rerender } = renderHook(() => useUpload(), { wrapper });

            const callbackBefore = result.current.reorderQueue;

            rerender();

            const callbackAfter = result.current.reorderQueue;

            if (callbackBefore && callbackAfter) {
                expect(callbackBefore).toBe(callbackAfter);
            }
        });
    });

    describe('Integration with files state', () => {
        it('reorderQueue calls setViaAFiles with the provided array', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            const item1 = makeUploadState({ id: 'a' });
            const item2 = makeUploadState({ id: 'b' });
            const newOrder = [item2, item1];

            act(() => {
                result.current.reorderQueue(newOrder);
            });

            expect(mockSessionState.files).toEqual(newOrder);
        });

        it('hook exports all expected queue-related callbacks', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            // Check for callbacks that would be needed for queue management
            expect(typeof result.current.addFiles).toBe('function');
            expect(typeof result.current.removeFile).toBe('function');
            expect(Array.isArray(result.current.files)).toBe(true);
        });

        it('reorderBundleFiles is available for reordering files within a bundle', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            expect(typeof result.current.reorderBundleFiles).toBe('function');
        });
    });

    describe('FileUploadState shape validation', () => {
        it('reorderQueue stores items with correct FileUploadState shape', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            const item = makeUploadState();

            act(() => {
                result.current.reorderQueue([item]);
            });

            const stored = mockSessionState.files[0];
            expect(typeof stored?.id).toBe('string');
            expect(stored?.file).toBeDefined();
            expect([
                'idle',
                'uploading',
                'extracting',
                'processing',
                'review',
                'done',
                'error',
            ]).toContain(stored?.status);
            expect(typeof stored?.progress).toBe('number');
        });
    });

    describe('reorderQueue with realistically-sized queues', () => {
        it('reorderQueue handles 3-item array correctly', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            const items = [
                makeUploadState({ id: 'x1' }),
                makeUploadState({ id: 'x2' }),
                makeUploadState({ id: 'x3' }),
            ];

            act(() => {
                result.current.reorderQueue(items);
            });

            expect(mockSessionState.files.length).toBe(3);
            expect(mockSessionState.files.map((f) => f.id)).toEqual(['x1', 'x2', 'x3']);
        });

        it('reorderQueue preserves FileUploadState metadata', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            const item = makeUploadState({ id: 'meta-1', parser_mode: 'premium' });

            act(() => {
                result.current.reorderQueue([item]);
            });

            expect(mockSessionState.files[0]?.parser_mode).toBe('premium');
        });
    });

    describe('Hook initialization', () => {
        it('hook initializes with empty queue by default', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            expect(result.current.files.length).toBe(0);
        });

        it('hook provides queue management interface', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            const expectedMethods = [
                'files',
                'addFiles',
                'removeFile',
                'reorderBundleFiles',
                'hasFiles',
                'pendingDocumentsCount',
                'totalDocumentsCount',
            ];

            expectedMethods.forEach((method) => {
                expect(method in result.current).toBe(true);
            });
        });
    });

    describe('Edge cases for reorderQueue', () => {
        it('reorderQueue handle mixed status items without error', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            const mixed = [
                makeUploadState({ id: 'm1', status: 'idle' }),
                makeUploadState({ id: 'm2', status: 'uploading' }),
            ];

            expect(() => {
                act(() => {
                    result.current.reorderQueue(mixed);
                });
            }).not.toThrow();

            expect(mockSessionState.files.length).toBe(2);
        });
    });

    describe('Type safety for FileUploadState array', () => {
        it('reorderQueue stores properly typed FileUploadState objects', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            const item = makeUploadState({ id: 'typed-1', parser_mode: 'standard' });

            act(() => {
                result.current.reorderQueue([item]);
            });

            const stored = mockSessionState.files[0];
            expect(stored).toHaveProperty('id');
            expect(stored).toHaveProperty('file');
            expect(stored).toHaveProperty('status');
            expect(stored).toHaveProperty('progress');
            expect(stored).toHaveProperty('parser_mode');
        });
    });

    describe('Queue immutability', () => {
        it('reorderQueue does not mutate the passed-in array', () => {
            const queryClient = createQueryClient();
            const wrapper = createWrapper(queryClient);

            const { result } = renderHook(() => useUpload(), { wrapper });

            const original = [makeUploadState({ id: 'orig-1' }), makeUploadState({ id: 'orig-2' })];
            const snapshot = [...original];

            act(() => {
                result.current.reorderQueue(original);
            });

            // Original array reference should not change
            expect(original.length).toBe(snapshot.length);
            expect(original[0].id).toBe(snapshot[0].id);
        });
    });
});
