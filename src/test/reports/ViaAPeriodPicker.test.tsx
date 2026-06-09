import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ViaAPeriodPicker, {
    annualPeriod,
    monthlyPeriod,
} from '@/app/reports/derivation/_components/ViaAPeriodPicker';

describe('period helpers', () => {
    it('annualPeriod spans Jan 1 → Dec 31', () => {
        expect(annualPeriod(2024)).toEqual({
            period_type: 'annual',
            period_start: '2024-01-01',
            period_end: '2024-12-31',
        });
    });

    it('monthlyPeriod uses the correct last day per month', () => {
        expect(monthlyPeriod(2024, 2)).toEqual({
            period_type: 'monthly',
            period_start: '2024-02-01',
            period_end: '2024-02-29', // 2024 is a leap year
        });
        expect(monthlyPeriod(2025, 6)).toEqual({
            period_type: 'monthly',
            period_start: '2025-06-01',
            period_end: '2025-06-30',
        });
    });
});

describe('ViaAPeriodPicker', () => {
    it('switches to monthly mode and emits a monthly period', () => {
        const onChange = vi.fn();
        render(
            <ViaAPeriodPicker
                value={annualPeriod(2024)}
                onChange={onChange}
                journalRange={{ earliest: '2024-06-14', latest: '2024-12-14' }}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /mensual/i }));

        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ period_type: 'monthly' }));
    });

    it('switches to custom mode and reveals date inputs', () => {
        const onChange = vi.fn();
        render(
            <ViaAPeriodPicker
                value={annualPeriod(2024)}
                onChange={onChange}
                journalRange={{ earliest: '2024-06-14', latest: '2024-12-14' }}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /personalizado/i }));
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ period_type: 'custom' }));
    });

    it('shows the resolved period range', () => {
        render(
            <ViaAPeriodPicker
                value={annualPeriod(2024)}
                onChange={vi.fn()}
                journalRange={{ earliest: '2024-01-01', latest: '2024-12-31' }}
            />
        );
        expect(screen.getByText(/2024-01-01 → 2024-12-31/)).toBeInTheDocument();
    });

    it('steps the year back/forward with the arrows (annual)', () => {
        const onChange = vi.fn();
        render(
            <ViaAPeriodPicker
                value={annualPeriod(2024)}
                onChange={onChange}
                journalRange={{ earliest: '2024-01-01', latest: '2024-12-31' }}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /año anterior/i }));
        expect(onChange).toHaveBeenLastCalledWith(annualPeriod(2023));

        fireEvent.click(screen.getByRole('button', { name: /año siguiente/i }));
        expect(onChange).toHaveBeenLastCalledWith(annualPeriod(2025));
    });

    it('steps months across the year boundary', () => {
        const onChange = vi.fn();
        render(
            <ViaAPeriodPicker
                value={monthlyPeriod(2025, 1)}
                onChange={onChange}
                journalRange={{ earliest: '2024-01-01', latest: '2025-12-31' }}
            />
        );

        // January → previous month rolls to December of the prior year.
        fireEvent.click(screen.getByRole('button', { name: /mes anterior/i }));
        expect(onChange).toHaveBeenLastCalledWith(monthlyPeriod(2024, 12));
    });
});
