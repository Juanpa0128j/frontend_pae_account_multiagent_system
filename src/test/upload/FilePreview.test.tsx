import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import FilePreview from '@/components/upload/FilePreview';
import { FileUploadState } from '@/types';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/components/common/MoneyDisplay', () => ({
    default: ({ value }: { value: number }) => <span>{value}</span>,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFile(name = 'test.pdf'): File {
    return new File(['x'], name, { type: 'application/pdf' });
}

function makeDoneState(overrides?: Partial<FileUploadState['extracted']>): FileUploadState {
    return {
        file: makeFile(),
        id: 'test-id',
        status: 'done',
        progress: 100,
        extracted: {
            fecha: '2026-05-14',
            concepto: 'Factura test',
            ...overrides,
        },
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FilePreview', () => {
    it('shows "Archivo origen" row when source_file is set', () => {
        const fs = makeDoneState({ source_file: 'documento_origen.pdf' });
        render(<FilePreview files={[fs]} />);
        expect(screen.getByText('Archivo origen')).toBeTruthy();
        expect(screen.getByText('documento_origen.pdf')).toBeTruthy();
    });

    it('does not show "Archivo origen" row when source_file is null', () => {
        const fs = makeDoneState({ source_file: null });
        render(<FilePreview files={[fs]} />);
        expect(screen.queryByText('Archivo origen')).toBeNull();
    });

    it('does not show "Archivo origen" row when source_file is undefined', () => {
        const fs = makeDoneState({ source_file: undefined });
        render(<FilePreview files={[fs]} />);
        expect(screen.queryByText('Archivo origen')).toBeNull();
    });
});
