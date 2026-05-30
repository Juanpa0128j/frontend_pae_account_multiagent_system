import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PeriodReviewCard from '@/components/upload/PeriodReviewCard';
import type { PeriodReview } from '@/lib/api';

const baseReview: PeriodReview = {
    extracted_period_start: '2025-01-01',
    extracted_period_end: '2025-12-31',
    extracted_periodicidad: 'annual',
    extraction_confidence: 0.72,
    inferred_from_span: false,
    requires_review: true,
    review_reason: 'annual_high_value',
};

describe('PeriodReviewCard', () => {
    it('pre-fills the inputs from the extracted period', () => {
        render(
            <PeriodReviewCard
                fileName="balance_anual.pdf"
                review={baseReview}
                onConfirm={vi.fn()}
            />
        );

        const inputs = screen.getAllByDisplayValue(
            (value) => value === '2025-01-01' || value === '2025-12-31'
        );
        expect(inputs.length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText(/cierre anual/i)).toBeInTheDocument();
        expect(screen.getByText(/confianza 72%/i)).toBeInTheDocument();
    });

    it('calls onConfirm with the edited values when submitted', async () => {
        const onConfirm = vi.fn().mockResolvedValue(undefined);
        render(
            <PeriodReviewCard fileName="balance.pdf" review={baseReview} onConfirm={onConfirm} />
        );

        const submit = screen.getByRole('button', { name: /confirmar período/i });
        fireEvent.click(submit);

        await waitFor(() => {
            expect(onConfirm).toHaveBeenCalledWith({
                period_start: '2025-01-01',
                period_end: '2025-12-31',
                periodicidad: 'anual',
            });
        });
    });

    it('blocks submission when end < start', () => {
        const onConfirm = vi.fn();
        render(
            <PeriodReviewCard
                fileName="x.pdf"
                review={{
                    ...baseReview,
                    extracted_period_start: '2025-12-31',
                    extracted_period_end: '2025-01-01',
                }}
                onConfirm={onConfirm}
            />
        );

        expect(screen.getByText(/no puede ser anterior al inicio/i)).toBeInTheDocument();
        const submit = screen.getByRole('button', { name: /confirmar período/i });
        expect(submit).toBeDisabled();
        fireEvent.click(submit);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('flags low confidence as the review reason', () => {
        render(
            <PeriodReviewCard
                fileName="ambiguous.pdf"
                review={{
                    ...baseReview,
                    review_reason: 'low_confidence',
                    extraction_confidence: 0.42,
                }}
                onConfirm={vi.fn()}
            />
        );

        expect(screen.getByText(/extracción poco confiable/i)).toBeInTheDocument();
    });
});
