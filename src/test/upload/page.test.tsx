import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import UploadPage from '@/app/upload/page';

// ---------------------------------------------------------------------------
// Mutable mock state so tests can vary returned values
// ---------------------------------------------------------------------------

let mockUploadMode: 'via-a' | 'via-b' = 'via-a';
let mockParserMode = 'fast';

const mockSetParserMode = vi.fn((mode: string) => {
    mockParserMode = mode;
});
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
        files: [],
        addFiles: vi.fn(),
        removeFile: vi.fn(),
        clearAll: vi.fn(),
        uploadAll: mockUploadAll,
        resumeIngest: vi.fn(),
        resumeAfterConfirm: vi.fn(),
        hasFiles: false,
        isUploading: false,
        allDone: false,
        parserMode: mockParserMode,
        setParserMode: mockSetParserMode,
    }),
    useViaBUpload: () => ({
        slots: [
            {
                docType: 'balance_general',
                label: 'Balance General',
                file: null,
                status: 'idle',
                progress: 0,
            },
            {
                docType: 'estado_resultados',
                label: 'Estado de Resultados',
                file: null,
                status: 'idle',
                progress: 0,
            },
            {
                docType: 'libro_auxiliar',
                label: 'Libro Auxiliar',
                file: null,
                status: 'idle',
                progress: 0,
            },
        ],
        setSlotFile: vi.fn(),
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
    default: () => <div>UploadProgress</div>,
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
        mockParserMode = 'fast';
    });

    it('renders BrutalistParsingSelector in Via A mode', () => {
        render(<UploadPage />);
        expect(screen.getByText('// MODO DE EXTRACCIÓN')).toBeInTheDocument();
        expect(screen.getByText('RÁPIDO')).toBeInTheDocument();
        expect(screen.getByText('ESTÁNDAR')).toBeInTheDocument();
        expect(screen.getByText('PREMIUM')).toBeInTheDocument();
        expect(screen.getByText('GPT-4O')).toBeInTheDocument();
    });

    it('calls setParserMode when a parsing mode is selected', () => {
        render(<UploadPage />);
        fireEvent.click(screen.getByText('PREMIUM'));
        expect(mockSetParserMode).toHaveBeenCalledTimes(1);
        expect(mockSetParserMode).toHaveBeenCalledWith('premium');
    });

    it('does not render BrutalistParsingSelector in Via B mode', () => {
        mockUploadMode = 'via-b';
        render(<UploadPage />);
        expect(screen.queryByText('// MODO DE EXTRACCIÓN')).not.toBeInTheDocument();
        expect(screen.queryByText('RÁPIDO')).not.toBeInTheDocument();
    });
});
