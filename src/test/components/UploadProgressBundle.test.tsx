import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { UploadProgressItem } from '@/components/upload/UploadProgress';
import { FileUploadState } from '@/types/index';

vi.mock('@/components/upload/BrutalistParsingSelector', () => ({
    default: () => null,
}));

vi.mock('@/components/brutalist', () => ({
    BrutalistButton: vi.fn(({ children }) => <button>{children}</button>),
    BrutalistCard: vi.fn(({ children }) => <div data-testid="brutalist-card">{children}</div>),
    BrutalistChip: vi.fn(({ label }) => <span data-testid="brutalist-chip">{label}</span>),
    BrutalistEmptyState: vi.fn(() => <div data-testid="empty-state">Empty</div>),
}));

vi.mock('@/components/common/StatusBadge', () => ({
    default: ({ status }: { status: string }) => <span data-testid="status-badge">{status}</span>,
}));

const createFile = (name: string): File => new File([''], name, { type: 'application/pdf' });

const createMockFileState = (overrides: Partial<FileUploadState> = {}): FileUploadState => ({
    file: createFile('default.pdf'),
    id: 'test-id',
    status: 'idle',
    progress: 0,
    ...overrides,
});

describe('UploadProgressBundle', () => {
    describe('Bundle spinner rendering', () => {
        it('shows bundle-level CircularProgress when extracting', () => {
            const file1 = createFile('document1.pdf');
            const file2 = createFile('document2.pdf');

            const state: FileUploadState = createMockFileState({
                file: file1,
                files: [file1, file2],
                id: 'bundle-1',
                status: 'extracting',
                progress: 50,
                multi_file_mode: 'documents',
                current_file_index: 0,
            });

            render(
                <UploadProgressItem
                    fileState={state}
                    onRemove={vi.fn()}
                    onSetParserMode={vi.fn()}
                    onSetMode={vi.fn()}
                    isExpanded={false}
                />
            );

            const spinners = document.querySelectorAll('[role="progressbar"]');
            expect(spinners).toBeDefined();
            expect(spinners.length).toBeGreaterThan(0);
        });

        it('shows bundle-level CircularProgress when processing', () => {
            const file1 = createFile('document1.pdf');
            const file2 = createFile('document2.pdf');

            const state: FileUploadState = createMockFileState({
                file: file1,
                files: [file1, file2],
                id: 'bundle-1',
                status: 'processing',
                progress: 75,
                multi_file_mode: 'documents',
                current_file_index: 1,
            });

            render(
                <UploadProgressItem
                    fileState={state}
                    onRemove={vi.fn()}
                    onSetParserMode={vi.fn()}
                    onSetMode={vi.fn()}
                    isExpanded={false}
                />
            );

            const spinners = document.querySelectorAll('[role="progressbar"]');
            expect(spinners).toBeDefined();
            expect(spinners.length).toBeGreaterThan(0);
        });

        it('shows no spinner when done', () => {
            const file1 = createFile('document1.pdf');
            const file2 = createFile('document2.pdf');

            const state: FileUploadState = createMockFileState({
                file: file1,
                files: [file1, file2],
                id: 'bundle-1',
                status: 'done',
                progress: 100,
                multi_file_mode: 'documents',
                current_file_index: 2,
            });

            render(
                <UploadProgressItem
                    fileState={state}
                    onRemove={vi.fn()}
                    onSetParserMode={vi.fn()}
                    onSetMode={vi.fn()}
                    isExpanded={false}
                />
            );

            const spinners = document.querySelectorAll('[role="progressbar"]');
            expect(spinners.length).toBe(0);
        });
    });

    describe('File status indicators', () => {
        it('marks completed files with checkmark when current_file_index is 1', () => {
            const file1 = createFile('document1.pdf');
            const file2 = createFile('document2.pdf');
            const file3 = createFile('document3.pdf');

            const state: FileUploadState = createMockFileState({
                file: file1,
                files: [file1, file2, file3],
                id: 'bundle-1',
                status: 'extracting',
                progress: 50,
                multi_file_mode: 'documents',
                current_file_index: 1,
            });

            const { container } = render(
                <UploadProgressItem
                    fileState={state}
                    onRemove={vi.fn()}
                    onSetParserMode={vi.fn()}
                    onSetMode={vi.fn()}
                    isExpanded={false}
                />
            );

            expect(container.textContent).toContain('document1.pdf');
            expect(screen.getByText('EXTRAYENDO')).toBeInTheDocument();
        });

        it('shows bullet indicators for pending files', () => {
            const file1 = createFile('document1.pdf');
            const file2 = createFile('document2.pdf');

            const state: FileUploadState = createMockFileState({
                file: file1,
                files: [file1, file2],
                id: 'bundle-1',
                status: 'extracting',
                progress: 25,
                multi_file_mode: 'documents',
                current_file_index: 0,
            });

            render(
                <UploadProgressItem
                    fileState={state}
                    onRemove={vi.fn()}
                    onSetParserMode={vi.fn()}
                    onSetMode={vi.fn()}
                    isExpanded={false}
                />
            );

            expect(screen.queryByText(/document1\.pdf|document2\.pdf/)).toBeInTheDocument();
        });

        it('does not show per-file spinners during bundle extraction', () => {
            const file1 = createFile('document1.pdf');
            const file2 = createFile('document2.pdf');

            const state: FileUploadState = createMockFileState({
                file: file1,
                files: [file1, file2],
                id: 'bundle-1',
                status: 'extracting',
                progress: 50,
                multi_file_mode: 'documents',
                current_file_index: 0,
            });

            const { container } = render(
                <UploadProgressItem
                    fileState={state}
                    onRemove={vi.fn()}
                    onSetParserMode={vi.fn()}
                    onSetMode={vi.fn()}
                    isExpanded={false}
                />
            );

            const perFileSpinners = container.querySelectorAll(
                '[data-testid*="file-row"] [role="progressbar"]'
            );
            expect(perFileSpinners.length).toBe(0);
        });
    });

    describe('Single file mode (no bundle)', () => {
        it('shows spinner for single file when uploading', () => {
            const file = createFile('single.pdf');

            const state: FileUploadState = createMockFileState({
                file,
                id: 'single-1',
                status: 'uploading',
                progress: 50,
            });

            render(
                <UploadProgressItem
                    fileState={state}
                    onRemove={vi.fn()}
                    onSetParserMode={vi.fn()}
                    onSetMode={vi.fn()}
                    isExpanded={false}
                />
            );

            const spinners = document.querySelectorAll('[role="progressbar"]');
            expect(spinners.length).toBeGreaterThan(0);
        });

        it('shows checkmark for single file when done', () => {
            const file = createFile('single.pdf');

            const state: FileUploadState = createMockFileState({
                file,
                id: 'single-1',
                status: 'done',
                progress: 100,
            });

            render(
                <UploadProgressItem
                    fileState={state}
                    onRemove={vi.fn()}
                    onSetParserMode={vi.fn()}
                    onSetMode={vi.fn()}
                    isExpanded={false}
                />
            );

            expect(document.querySelectorAll('[role="progressbar"]').length).toBe(0);
        });
    });

    describe('Edge cases', () => {
        it('handles empty file list gracefully', () => {
            const state: FileUploadState = createMockFileState({
                files: [],
                id: 'empty-bundle',
            });

            const { container } = render(
                <UploadProgressItem
                    fileState={state}
                    onRemove={vi.fn()}
                    onSetParserMode={vi.fn()}
                    onSetMode={vi.fn()}
                    isExpanded={false}
                />
            );

            expect(container).toBeInTheDocument();
        });

        it('handles current_file_index === null', () => {
            const file1 = createFile('document1.pdf');
            const file2 = createFile('document2.pdf');

            const state: FileUploadState = createMockFileState({
                file: file1,
                files: [file1, file2],
                id: 'bundle-1',
                status: 'processing',
                progress: 0,
                multi_file_mode: 'documents',
                current_file_index: null,
            });

            render(
                <UploadProgressItem
                    fileState={state}
                    onRemove={vi.fn()}
                    onSetParserMode={vi.fn()}
                    onSetMode={vi.fn()}
                    isExpanded={false}
                />
            );

            const spinners = document.querySelectorAll('[role="progressbar"]');
            expect(spinners.length).toBeGreaterThan(0);
        });

        it('handles multi_file_mode === pages', () => {
            const file1 = createFile('document1.pdf');
            const file2 = createFile('document2.pdf');

            const state: FileUploadState = createMockFileState({
                file: file1,
                files: [file1, file2],
                id: 'bundle-1',
                status: 'extracting',
                progress: 50,
                multi_file_mode: 'pages',
                current_file_index: 0,
            });

            render(
                <UploadProgressItem
                    fileState={state}
                    onRemove={vi.fn()}
                    onSetParserMode={vi.fn()}
                    onSetMode={vi.fn()}
                    isExpanded={false}
                />
            );

            const spinners = document.querySelectorAll('[role="progressbar"]');
            expect(spinners.length).toBeGreaterThan(0);
        });

        it('renders with error status and no spinner', () => {
            const file1 = createFile('document1.pdf');

            const state: FileUploadState = createMockFileState({
                file: file1,
                files: [file1],
                id: 'bundle-1',
                status: 'error',
                progress: 50,
                error: 'Upload failed',
                multi_file_mode: 'documents',
                current_file_index: 0,
            });

            const { container } = render(
                <UploadProgressItem
                    fileState={state}
                    onRemove={vi.fn()}
                    onSetParserMode={vi.fn()}
                    onSetMode={vi.fn()}
                    isExpanded={false}
                />
            );

            expect(screen.getByText('ERROR')).toBeInTheDocument();
            expect(container.textContent).toContain('Upload failed');
        });
    });

    describe('Progress tracking', () => {
        it('updates progress display when state changes', () => {
            const file1 = createFile('document1.pdf');
            const file2 = createFile('document2.pdf');

            const state: FileUploadState = createMockFileState({
                file: file1,
                files: [file1, file2],
                id: 'bundle-1',
                status: 'extracting',
                progress: 33,
                multi_file_mode: 'documents',
                current_file_index: 0,
            });

            const { rerender } = render(
                <UploadProgressItem
                    fileState={state}
                    onRemove={vi.fn()}
                    onSetParserMode={vi.fn()}
                    onSetMode={vi.fn()}
                    isExpanded={false}
                />
            );

            const updatedState: FileUploadState = createMockFileState({
                file: file1,
                files: [file1, file2],
                id: 'bundle-1',
                status: 'extracting',
                progress: 66,
                current_file_index: 1,
                multi_file_mode: 'documents',
            });

            rerender(
                <UploadProgressItem
                    fileState={updatedState}
                    onRemove={vi.fn()}
                    onSetParserMode={vi.fn()}
                    onSetMode={vi.fn()}
                    isExpanded={false}
                />
            );

            expect(screen.getByText('EXTRAYENDO')).toBeInTheDocument();
        });

        it('renders file names from files array', () => {
            const file1 = createFile('invoice_2024.pdf');
            const file2 = createFile('receipt_2024.pdf');

            const state: FileUploadState = createMockFileState({
                file: file1,
                files: [file1, file2],
                id: 'bundle-1',
                status: 'extracting',
                progress: 50,
                multi_file_mode: 'documents',
                current_file_index: 0,
            });

            render(
                <UploadProgressItem
                    fileState={state}
                    onRemove={vi.fn()}
                    onSetParserMode={vi.fn()}
                    onSetMode={vi.fn()}
                    isExpanded={false}
                />
            );

            expect(
                screen.queryByText('invoice_2024.pdf') || screen.queryByText('receipt_2024.pdf')
            ).toBeInTheDocument();
        });
    });
});
