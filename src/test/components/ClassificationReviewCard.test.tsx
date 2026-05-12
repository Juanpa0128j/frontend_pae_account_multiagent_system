import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ClassificationReviewCard from '@/components/upload/ClassificationReviewCard';

vi.mock('@/components/brutalist/BrutalistButton', () => ({
    default: vi.fn(({ children, variant, accent, size, onClick, disabled, loading }) => (
        <button
            data-variant={variant}
            data-accent={accent}
            data-size={size}
            data-disabled={disabled}
            data-loading={loading}
            onClick={onClick}
        >
            {children}
        </button>
    )),
}));

vi.mock('@/components/brutalist/BrutalistCard', () => ({
    default: vi.fn(({ children }) => <div data-testid="brutalist-card">{children}</div>),
}));

vi.mock('@/components/brutalist/BrutalistChip', () => ({
    default: vi.fn(({ label }) => <span data-testid="brutalist-chip">{label}</span>),
}));

const baseReview = {
    predicted_type: 'invoice',
    predicted_label: 'Factura',
    confidence: 0.85,
    available_types: [
        { value: 'invoice', label: 'Factura' },
        { value: 'receipt', label: 'Recibo' },
    ],
    wrong_upload_area: false,
};

const wrongAreaReview = {
    ...baseReview,
    wrong_upload_area: true,
    available_types: [
        { value: 'balance_general', label: 'Balance General' },
        { value: 'estado_resultados', label: 'Estado de Resultados' },
    ],
};

describe('ClassificationReviewCard', () => {
    it('renders cancel button when onCancel prop is provided', () => {
        render(
            <ClassificationReviewCard
                fileName="test.pdf"
                review={baseReview}
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        expect(screen.getByText('// DESCARTAR ARCHIVO')).toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
        const onCancel = vi.fn();
        render(
            <ClassificationReviewCard
                fileName="test.pdf"
                review={baseReview}
                onConfirm={vi.fn()}
                onCancel={onCancel}
            />
        );
        fireEvent.click(screen.getByText('// DESCARTAR ARCHIVO'));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not render cancel button when onCancel is omitted', () => {
        render(
            <ClassificationReviewCard fileName="test.pdf" review={baseReview} onConfirm={vi.fn()} />
        );
        expect(screen.queryByText('// DESCARTAR ARCHIVO')).not.toBeInTheDocument();
    });

    it('renders cancel button in wrong_upload_area mode when onCancel is provided', () => {
        render(
            <ClassificationReviewCard
                fileName="test.pdf"
                review={wrongAreaReview}
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        expect(screen.getByText('// DESCARTAR ARCHIVO')).toBeInTheDocument();
    });
});
