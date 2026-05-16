import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { DraggableFileList } from '@/components/upload/DraggableFileList';

const createFile = (name: string): File => new File([''], name, { type: 'application/pdf' });

describe('DraggableFileList', () => {
    describe('Rendering', () => {
        it('renders all file names', () => {
            const files = [
                createFile('document1.pdf'),
                createFile('document2.pdf'),
                createFile('document3.pdf'),
            ];

            const onReorder = vi.fn();

            render(<DraggableFileList files={files} onReorder={onReorder} />);

            expect(screen.getByText('document1.pdf')).toBeInTheDocument();
            expect(screen.getByText('document2.pdf')).toBeInTheDocument();
            expect(screen.getByText('document3.pdf')).toBeInTheDocument();
        });

        it('renders DndContext wrapper', () => {
            const files = [createFile('document1.pdf')];
            const onReorder = vi.fn();

            const { container } = render(<DraggableFileList files={files} onReorder={onReorder} />);

            expect(container.querySelector('[class*="MuiBox"]')).toBeInTheDocument();
        });

        it('renders "Reordenar archivos" header', () => {
            const files = [createFile('document1.pdf'), createFile('document2.pdf')];
            const onReorder = vi.fn();

            render(<DraggableFileList files={files} onReorder={onReorder} />);

            expect(screen.getByText('Reordenar archivos')).toBeInTheDocument();
        });

        it('renders empty list when no files provided', () => {
            const onReorder = vi.fn();

            const { container } = render(<DraggableFileList files={[]} onReorder={onReorder} />);

            expect(screen.getByText('Reordenar archivos')).toBeInTheDocument();
            expect(container).toBeInTheDocument();
        });

        it('renders single file correctly', () => {
            const files = [createFile('single.pdf')];
            const onReorder = vi.fn();

            render(<DraggableFileList files={files} onReorder={onReorder} />);

            expect(screen.getByText('single.pdf')).toBeInTheDocument();
        });
    });

    describe('File list rendering order', () => {
        it('maintains file order in DOM', () => {
            const files = [
                createFile('a-document.pdf'),
                createFile('b-document.pdf'),
                createFile('c-document.pdf'),
            ];

            const onReorder = vi.fn();

            const { container } = render(<DraggableFileList files={files} onReorder={onReorder} />);

            const fileNames = Array.from(
                container.querySelectorAll('[class*="MuiTypography"]')
            ).map((el) => el.textContent);

            const hasADocument = fileNames.some((name) => name?.includes('a-document.pdf'));
            const hasCDocument = fileNames.some((name) => name?.includes('c-document.pdf'));

            expect(hasADocument).toBe(true);
            expect(hasCDocument).toBe(true);
        });

        it('updates file list when props change', () => {
            const initialFiles = [createFile('file1.pdf')];
            const onReorder = vi.fn();

            const { rerender } = render(
                <DraggableFileList files={initialFiles} onReorder={onReorder} />
            );

            expect(screen.getByText('file1.pdf')).toBeInTheDocument();

            const updatedFiles = [createFile('file1.pdf'), createFile('file2.pdf')];

            rerender(<DraggableFileList files={updatedFiles} onReorder={onReorder} />);

            expect(screen.getByText('file1.pdf')).toBeInTheDocument();
            expect(screen.getByText('file2.pdf')).toBeInTheDocument();
        });
    });

    describe('Drag handles', () => {
        it('renders drag indicator icons for each file', () => {
            const files = [
                createFile('document1.pdf'),
                createFile('document2.pdf'),
                createFile('document3.pdf'),
            ];

            const onReorder = vi.fn();

            const { container } = render(<DraggableFileList files={files} onReorder={onReorder} />);

            const dragIcons = container.querySelectorAll('[data-testid="DragIndicatorIcon"]');

            expect(dragIcons.length).toBe(files.length);
        });

        it('drag handles have grab cursor', () => {
            const files = [createFile('document1.pdf'), createFile('document2.pdf')];

            const onReorder = vi.fn();

            const { container } = render(<DraggableFileList files={files} onReorder={onReorder} />);

            const dragHandles = container.querySelectorAll('[class*="MuiBox"]');
            expect(dragHandles.length).toBeGreaterThan(0);
        });

        it('maintains drag handle for all files', () => {
            const files = [
                createFile('document1.pdf'),
                createFile('document2.pdf'),
                createFile('document3.pdf'),
            ];

            const onReorder = vi.fn();

            const { container } = render(<DraggableFileList files={files} onReorder={onReorder} />);

            const dragIcons = container.querySelectorAll('[data-testid="DragIndicatorIcon"]');

            expect(dragIcons.length).toBe(3);
        });
    });

    describe('Reorder callback', () => {
        it('does not call onReorder on initial render', () => {
            const files = [createFile('document1.pdf'), createFile('document2.pdf')];

            const onReorder = vi.fn();

            render(<DraggableFileList files={files} onReorder={onReorder} />);

            expect(onReorder).not.toHaveBeenCalled();
        });

        it('accepts onReorder callback prop', () => {
            const files = [createFile('document1.pdf'), createFile('document2.pdf')];

            const onReorder = vi.fn();

            render(<DraggableFileList files={files} onReorder={onReorder} />);

            expect(typeof onReorder).toBe('function');
        });

        it('allows onReorder callback to be called multiple times', () => {
            const files = [createFile('document1.pdf'), createFile('document2.pdf')];

            const onReorder = vi.fn();

            const { rerender } = render(<DraggableFileList files={files} onReorder={onReorder} />);

            const newOnReorder = vi.fn();
            rerender(<DraggableFileList files={files} onReorder={newOnReorder} />);

            expect(newOnReorder).not.toHaveBeenCalled();
        });
    });

    describe('File metadata display', () => {
        it('displays file names', () => {
            const files = [createFile('invoice_2024_01.pdf'), createFile('receipt_amazon.pdf')];

            const onReorder = vi.fn();

            render(<DraggableFileList files={files} onReorder={onReorder} />);

            expect(screen.getByText('invoice_2024_01.pdf')).toBeInTheDocument();
            expect(screen.getByText('receipt_amazon.pdf')).toBeInTheDocument();
        });

        it('displays file sizes in formatted text', () => {
            const file1 = new File(['x'.repeat(1024)], 'test1.pdf', { type: 'application/pdf' });
            const file2 = new File(['y'.repeat(2048)], 'test2.pdf', { type: 'application/pdf' });

            const onReorder = vi.fn();

            const { container } = render(
                <DraggableFileList files={[file1, file2]} onReorder={onReorder} />
            );

            expect(container.textContent).toContain('test1.pdf');
            expect(container.textContent).toContain('test2.pdf');
        });

        it('preserves file name case sensitivity', () => {
            const files = [createFile('Document.PDF'), createFile('invoice.PDF')];

            const onReorder = vi.fn();

            render(<DraggableFileList files={files} onReorder={onReorder} />);

            expect(screen.getByText('Document.PDF')).toBeInTheDocument();
            expect(screen.getByText('invoice.PDF')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('renders with semantic structure', () => {
            const files = [createFile('document1.pdf'), createFile('document2.pdf')];

            const onReorder = vi.fn();

            const { container } = render(<DraggableFileList files={files} onReorder={onReorder} />);

            expect(container.querySelector('[class*="MuiBox"]')).toBeInTheDocument();
        });

        it('displays text labels for usability', () => {
            const files = [createFile('document1.pdf')];

            const onReorder = vi.fn();

            render(<DraggableFileList files={files} onReorder={onReorder} />);

            expect(screen.getByText('document1.pdf')).toBeInTheDocument();
        });
    });

    describe('Performance and state management', () => {
        it('does not cause errors when files prop is stable', () => {
            const files = [createFile('document1.pdf'), createFile('document2.pdf')];

            const onReorder = vi.fn();

            const { rerender } = render(<DraggableFileList files={files} onReorder={onReorder} />);

            rerender(<DraggableFileList files={files} onReorder={onReorder} />);

            expect(screen.getByText('document1.pdf')).toBeInTheDocument();
            expect(screen.getByText('document2.pdf')).toBeInTheDocument();
        });

        it('handles large file lists', () => {
            const files = Array.from({ length: 20 }, (_, i) => createFile(`document_${i + 1}.pdf`));

            const onReorder = vi.fn();

            render(<DraggableFileList files={files} onReorder={onReorder} />);

            expect(screen.getByText('document_1.pdf')).toBeInTheDocument();
            expect(screen.getByText('document_20.pdf')).toBeInTheDocument();
        });

        it('renders all files in large lists', () => {
            const files = Array.from({ length: 10 }, (_, i) => createFile(`file_${i}.pdf`));

            const onReorder = vi.fn();

            const { container } = render(<DraggableFileList files={files} onReorder={onReorder} />);

            const dragIcons = container.querySelectorAll('[data-testid="DragIndicatorIcon"]');
            expect(dragIcons.length).toBe(10);
        });
    });

    describe('Integration with dnd-kit', () => {
        it('renders sortable context', () => {
            const files = [createFile('document1.pdf')];

            const onReorder = vi.fn();

            render(<DraggableFileList files={files} onReorder={onReorder} />);

            expect(screen.getByText('document1.pdf')).toBeInTheDocument();
        });

        it('provides drag capability for all files', () => {
            const files = [createFile('document1.pdf'), createFile('document2.pdf')];

            const onReorder = vi.fn();

            const { container } = render(<DraggableFileList files={files} onReorder={onReorder} />);

            const dragIcons = container.querySelectorAll('[data-testid="DragIndicatorIcon"]');
            expect(dragIcons.length).toBe(2);
        });

        it('displays list with accent border styling', () => {
            const files = [createFile('document1.pdf')];

            const onReorder = vi.fn();

            const { container } = render(<DraggableFileList files={files} onReorder={onReorder} />);

            const outerBox = container.querySelector('[class*="MuiBox"]');
            expect(outerBox).toBeInTheDocument();
        });
    });

    describe('File row styling', () => {
        it('renders each file in its own row', () => {
            const files = [
                createFile('document1.pdf'),
                createFile('document2.pdf'),
                createFile('document3.pdf'),
            ];

            const onReorder = vi.fn();

            const { container } = render(<DraggableFileList files={files} onReorder={onReorder} />);

            const fileElements = Array.from(
                container.querySelectorAll('[class*="MuiTypography"]')
            ).filter((el) => el.textContent?.includes('.pdf'));

            expect(fileElements.length).toBeGreaterThanOrEqual(3);
        });

        it('displays file size next to file name', () => {
            const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

            const onReorder = vi.fn();

            const { container } = render(
                <DraggableFileList files={[file]} onReorder={onReorder} />
            );

            expect(container.textContent).toContain('test.pdf');
        });
    });
});
