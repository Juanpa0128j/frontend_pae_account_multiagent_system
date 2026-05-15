import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { UploadProgressItem } from '@/components/upload/UploadProgress';
import { FileUploadState } from '@/types';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

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
});
