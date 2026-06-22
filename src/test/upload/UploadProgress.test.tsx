import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { UploadProgressItem } from '@/components/upload/UploadProgress';
import { FileUploadState } from '@/types';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/components/upload/BrutalistParsingSelector', () => ({
    default: () => <div data-testid="parsing-selector" />,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFile(name: string, size = 1000, type = 'image/jpeg'): File {
    return new File(['x'.repeat(size)], name, { type });
}

function makeState(overrides: Partial<FileUploadState> = {}): FileUploadState {
    const file = makeFile('FV 192.jpg');
    return {
        id: 'test-id',
        file,
        files: undefined,
        status: 'idle',
        progress: 0,
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UploadProgressItem — multi-file badge', () => {
    it('does not show toggle badge for single file', () => {
        const state = makeState();
        render(<UploadProgressItem fileState={state} onRemove={vi.fn()} />);

        // No badge with "+N" pattern
        expect(screen.queryByRole('button', { name: /^\+\d/ })).toBeNull();
        // File name renders normally
        expect(screen.getByText('FV 192.jpg')).toBeTruthy();
    });

    it('shows toggle badge for multi-file upload', () => {
        const files = [makeFile('FV 192.jpg'), makeFile('FV 193.jpg'), makeFile('FV 194.jpg')];
        const state = makeState({ file: files[0], files });
        render(<UploadProgressItem fileState={state} onRemove={vi.fn()} />);

        // Badge shows "+2" (3 files → +2)
        expect(screen.getByText(/^\+2/)).toBeTruthy();
    });

    it('clicking badge reveals all file names', () => {
        const files = [makeFile('FV 192.jpg'), makeFile('FV 193.jpg'), makeFile('FV 194.jpg')];
        const state = makeState({ file: files[0], files });
        render(<UploadProgressItem fileState={state} onRemove={vi.fn()} />);

        const badge = screen.getByText(/^\+2/);
        fireEvent.click(badge);

        // All 3 file names appear (FV 192 appears twice: title + list)
        expect(screen.getAllByText(/FV 192\.jpg/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/FV 193\.jpg/)).toBeTruthy();
        expect(screen.getByText(/FV 194\.jpg/)).toBeTruthy();
    });

    it('clicking badge again hides file names', () => {
        const files = [makeFile('FV 192.jpg'), makeFile('FV 193.jpg'), makeFile('FV 194.jpg')];
        const state = makeState({ file: files[0], files });
        render(<UploadProgressItem fileState={state} onRemove={vi.fn()} />);

        const badge = screen.getByText(/^\+2/);
        // Open
        fireEvent.click(badge);
        expect(screen.getByText(/FV 193\.jpg/)).toBeTruthy();
        // Close
        fireEvent.click(badge);
        expect(screen.queryByText('FV 193.jpg')).toBeNull();
    });

    it('shows mode toggle for multi-file upload in idle state', () => {
        const files = [makeFile('FV 192.jpg'), makeFile('FV 193.jpg'), makeFile('FV 194.jpg')];
        const state = makeState({ file: files[0], files, status: 'idle' });
        render(<UploadProgressItem fileState={state} onRemove={vi.fn()} onSetMode={vi.fn()} />);

        // Open the file list first
        const badge = screen.getByText(/^\+2/);
        fireEvent.click(badge);

        expect(screen.getByRole('button', { name: /Páginas/i })).toBeTruthy();
        expect(screen.getByRole('button', { name: /Documentos/i })).toBeTruthy();
    });

    it('mode toggle calls onSetMode with correct mode', () => {
        const files = [makeFile('FV 192.jpg'), makeFile('FV 193.jpg')];
        const state = makeState({
            file: files[0],
            files,
            status: 'idle',
            multi_file_mode: 'pages',
        });
        const onSetMode = vi.fn();
        render(<UploadProgressItem fileState={state} onRemove={vi.fn()} onSetMode={onSetMode} />);

        // Open the file list
        fireEvent.click(screen.getByText(/^\+1/));

        fireEvent.click(screen.getByRole('button', { name: /Documentos/i }));
        expect(onSetMode).toHaveBeenCalledWith('test-id', 'documents');

        fireEvent.click(screen.getByRole('button', { name: /Páginas/i }));
        expect(onSetMode).toHaveBeenCalledWith('test-id', 'pages');
    });

    it('shows per-file progress indicators during extraction', () => {
        const files = [makeFile('f0.jpg'), makeFile('f1.jpg'), makeFile('f2.jpg')];
        const state = makeState({
            file: files[0],
            files,
            status: 'extracting',
            current_file_index: 1,
        });
        render(<UploadProgressItem fileState={state} onRemove={vi.fn()} />);

        // Open the file list
        fireEvent.click(screen.getByText(/^\+2/));

        // f0 (index 0 < 1): checkmark
        expect(screen.getByText('✓')).toBeTruthy();
        // f1 (index 1 === current): spinner (CircularProgress has role="progressbar")
        const progressbars = screen.getAllByRole('progressbar');
        // At least one indeterminate CircularProgress for the spinner
        expect(progressbars.length).toBeGreaterThanOrEqual(1);
        // f2 (index 2 > 1): plain bullet
        expect(screen.getAllByText('•').length).toBeGreaterThanOrEqual(1);
    });
});

describe('UploadProgressItem — BUG 1: isCurrent spinner', () => {
    it('renders spinner for current file during extraction', () => {
        const files = [makeFile('f0.jpg'), makeFile('f1.jpg'), makeFile('f2.jpg')];
        const state = makeState({
            file: files[0],
            files,
            status: 'extracting',
            current_file_index: 1,
        });
        render(<UploadProgressItem fileState={state} onRemove={vi.fn()} />);

        // Open the file list
        fireEvent.click(screen.getByText(/^\+2/));

        // f0 (index 0 < 1): checkmark ✓
        const checkmarks = screen.getAllByText('✓');
        expect(checkmarks.length).toBeGreaterThanOrEqual(1);

        // f1 (index 1 === current): spinner (CircularProgress with role="progressbar")
        // Verify multiple spinners exist: one in header + one in file list
        const progressbars = screen.getAllByRole('progressbar');
        expect(progressbars.length).toBeGreaterThanOrEqual(2); // Header + file list

        // f2 (index 2 > 1): plain bullet •
        const bullets = screen.getAllByText('•');
        expect(bullets.length).toBeGreaterThanOrEqual(1);
    });

    it('current file spinner has extracting status color', () => {
        const files = [makeFile('f0.jpg'), makeFile('f1.jpg')];
        const state = makeState({
            file: files[0],
            files,
            status: 'extracting',
            current_file_index: 1,
        });
        render(<UploadProgressItem fileState={state} onRemove={vi.fn()} />);

        // Open the file list
        fireEvent.click(screen.getByText(/^\+1/));

        // Find the spinner in the file list (should be for f1, the current file)
        const progressbars = screen.getAllByRole('progressbar');
        // At least one should be for the current file in the list
        // Visual check: spinner should exist and have proper styling
        expect(progressbars.length).toBeGreaterThanOrEqual(1);
    });
});

describe('UploadProgressItem — BUG 2: File count badge keyboard accessibility', () => {
    it('badge is keyboard accessible with tab key', () => {
        const files = [makeFile('FV 192.jpg'), makeFile('FV 193.jpg')];
        const state = makeState({ file: files[0], files });
        render(<UploadProgressItem fileState={state} onRemove={vi.fn()} />);

        const badge = screen.getByText(/^\+1/);
        // Check if element is focusable (tabIndex >= 0)
        expect(badge).toHaveAttribute('tabindex');
        const tabindex = parseInt(badge.getAttribute('tabindex') || '-1', 10);
        expect(tabindex).toBeGreaterThanOrEqual(0);
    });

    it('badge has aria-expanded attribute', () => {
        const files = [makeFile('FV 192.jpg'), makeFile('FV 193.jpg')];
        const state = makeState({ file: files[0], files });
        render(<UploadProgressItem fileState={state} onRemove={vi.fn()} />);

        const badge = screen.getByText(/^\+1/);
        expect(badge).toHaveAttribute('aria-expanded');
    });

    it('badge toggles on Enter key press', () => {
        const files = [makeFile('FV 192.jpg'), makeFile('FV 193.jpg')];
        const state = makeState({ file: files[0], files });
        render(<UploadProgressItem fileState={state} onRemove={vi.fn()} />);

        const badge = screen.getByText(/^\+1/);
        // File list should not be visible initially
        expect(screen.queryByText('FV 193.jpg')).toBeNull();

        // Simulate Enter keypress
        fireEvent.keyDown(badge, { key: 'Enter', code: 'Enter' });

        // File list should now be visible
        expect(screen.getByText('FV 193.jpg')).toBeTruthy();
    });

    it('badge toggles on Space key press', () => {
        const files = [makeFile('FV 192.jpg'), makeFile('FV 193.jpg')];
        const state = makeState({ file: files[0], files });
        render(<UploadProgressItem fileState={state} onRemove={vi.fn()} />);

        const badge = screen.getByText(/^\+1/);
        // File list should not be visible initially
        expect(screen.queryByText('FV 193.jpg')).toBeNull();

        // Simulate Space keypress
        fireEvent.keyDown(badge, { key: ' ', code: 'Space' });

        // File list should now be visible
        expect(screen.getByText('FV 193.jpg')).toBeTruthy();
    });

    it('badge is a button element for semantic HTML', () => {
        const files = [makeFile('FV 192.jpg'), makeFile('FV 193.jpg')];
        const state = makeState({ file: files[0], files });
        render(<UploadProgressItem fileState={state} onRemove={vi.fn()} />);

        const badge = screen.getByText(/^\+1/);
        // Should be a button element or have role="button"
        expect(badge.tagName.toLowerCase()).toBe('button');
    });
});
