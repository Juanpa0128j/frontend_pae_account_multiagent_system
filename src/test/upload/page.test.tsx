import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import UploadPage from '@/app/upload/page';

// ---------------------------------------------------------------------------
// Mutable mock state so tests can vary returned values
// ---------------------------------------------------------------------------

let mockUploadMode: 'via-a' | 'via-b' = 'via-a';
let mockFiles: any[] = [];

const mockSetFileParserMode = vi.fn();
const mockSetSlotParserMode = vi.fn();
const mockSetUploadMode = vi.fn();
const mockUploadAll = vi.fn();

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

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

vi.mock('@/hooks/useUpload', () => ({
    useUpload: () => ({
        files: mockFiles,
        addFiles: vi.fn(),
        removeFile: vi.fn(),
        clearAll: vi.fn(),
        uploadAll: mockUploadAll,
        resumeIngest: vi.fn(),
        resumeAfterConfirm: vi.fn(),
        hasFiles: mockFiles.length > 0,
        isUploading: false,
        allDone: false,
        setFileParserMode: mockSetFileParserMode,
    }),
    useViaBUpload: () => ({
        slots: [
            {
                docType: 'balance_general',
                label: 'Balance General',
                file: null,
                status: 'idle',
                progress: 0,
                parser_mode: 'fast',
            },
            {
                docType: 'estado_resultados',
                label: 'Estado de Resultados',
                file: null,
                status: 'idle',
                progress: 0,
                parser_mode: 'fast',
            },
            {
                docType: 'libro_auxiliar',
                label: 'Libro Auxiliar',
                file: null,
                status: 'idle',
                progress: 0,
                parser_mode: 'fast',
            },
        ],
        setSlotFile: vi.fn(),
        setSlotParserMode: mockSetSlotParserMode,
        hasAnyFileSelected: false,
        startUpload: vi.fn(),
        resumeSlot: vi.fn(),
        resetSlots: vi.fn(),
        isUploading: false,
        allDone: false,
    }),
}));

vi.mock('@/hooks/useTransactions', () => ({
    useTransactions: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/context/CompanyContext', () => ({
    useCompany: () => ({
        activeCompany: { name: 'Test Co', nit: '123', locked_pathway: null },
        activeNit: '123',
    }),
    CompanyProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/context/UploadSessionContext', () => ({
    useUploadSession: () => ({
        uploadMode: mockUploadMode,
        setUploadMode: mockSetUploadMode,
        viaAFiles: [],
        setViaAFiles: vi.fn(),
        viaBSlots: [],
        setViaBSlots: vi.fn(),
        isPollingDerived: false,
        setIsPollingDerived: vi.fn(),
        derivedStatements: [],
        setDerivedStatements: vi.fn(),
        derivedError: null,
        setDerivedError: vi.fn(),
    }),
    UploadSessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/brutalist/BrutalistButton', () => ({
    default: vi.fn(({ children, subLabel, variant, onClick }) => (
        <button data-variant={variant} data-sublabel={subLabel} onClick={onClick}>
            {children}
            {subLabel && <span>{subLabel}</span>}
        </button>
    )),
}));

vi.mock('@/components/brutalist', () => ({
    BrutalistPageHero: () => <div data-testid="hero">Hero</div>,
    BrutalistEmptyState: () => <div>Empty</div>,
}));

vi.mock('@/components/common/DataTable', () => ({
    default: () => <div>DataTable</div>,
}));

vi.mock('@/components/common/StatusBadge', () => ({
    default: () => <div>StatusBadge</div>,
}));

vi.mock('@/components/upload/DropZone', () => ({
    default: () => <div>DropZone</div>,
}));

vi.mock('@/components/upload/UploadProgress', () => ({
    default: ({
        files,
        renderExpanded,
    }: {
        files: any[];
        renderExpanded?: (fs: any) => React.ReactNode;
    }) => (
        <div data-testid="upload-progress">
            {files.map((fs: any) => (
                <div key={fs.id} data-testid={`file-${fs.id}`}>
                    <span>{fs.file.name}</span>
                    {renderExpanded?.(fs)}
                </div>
            ))}
        </div>
    ),
}));

vi.mock('@/components/upload/ProcessAuditPanel', () => ({
    default: () => <div>ProcessAuditPanel</div>,
}));

vi.mock('@/components/upload/FilePreview', () => ({
    default: () => <div>FilePreview</div>,
}));

vi.mock('@/components/upload/ClassificationReviewCard', () => ({
    default: () => <div>ClassificationReviewCard</div>,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UploadPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUploadMode = 'via-a';
        mockFiles = [];
    });

    it('renders upload page without global selector', () => {
        render(<UploadPage />);
        expect(screen.getByText('Documentos fuente (Via A)')).toBeInTheDocument();
        // Global selector is gone — selector is per-file now
        expect(screen.queryByText('// MODO DE EXTRACCIÓN')).not.toBeInTheDocument();
    });

    it('renders Via B slots without global selector', () => {
        mockUploadMode = 'via-b';
        render(<UploadPage />);
        expect(screen.getByText('Balance General')).toBeInTheDocument();
        // Global selector is gone — selector is per-slot now
        expect(screen.queryByText('// MODO DE EXTRACCIÓN')).not.toBeInTheDocument();
    });

    it('does not render separate classification review section when file is in review status', () => {
        mockFiles = [
            {
                id: '1',
                file: { name: 'test.pdf', size: 100, type: 'application/pdf' },
                status: 'review',
                classification_review: { predicted_type: 'invoice', confidence: 0.9 },
            },
        ];
        render(<UploadPage />);
        expect(screen.queryByText('// REVISION DE CLASIFICACION')).not.toBeInTheDocument();
    });

    it('renders ClassificationReviewCard inline when file is in review status', () => {
        mockFiles = [
            {
                id: '1',
                file: { name: 'test.pdf', size: 100, type: 'application/pdf' },
                status: 'review',
                classification_review: { predicted_type: 'invoice', confidence: 0.9 },
            },
        ];
        render(<UploadPage />);
        expect(screen.getByText('ClassificationReviewCard')).toBeInTheDocument();
    });

    it('renders Via A upload panel without sticky on mobile', () => {
        mockUploadMode = 'via-a';
        mockFiles = [
            {
                id: 'f1',
                file: { name: 'test.pdf', size: 1000, type: 'application/pdf' },
                status: 'idle',
                progress: 0,
            },
        ];
        render(<UploadPage />);
        expect(screen.getByText('// PANEL DE CONTROL')).toBeInTheDocument();
    });
});
