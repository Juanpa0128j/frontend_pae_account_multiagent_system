import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ViaADerivationTab, {
    splitFirstLevelPeriods,
} from '@/app/reports/derivation/_components/ViaADerivationTab';
import type { ViaADerivationStatus } from '@/types';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockUseStatus = vi.fn();
const mockBuildMutate = vi.fn();
const mockDeriveMutate = vi.fn();

vi.mock('@/hooks', () => ({
    useDerivationStatusViaA: () => mockUseStatus(),
    useBuildFirstLevelViaA: () => ({ mutateAsync: mockBuildMutate, isPending: false }),
    useDeriveSecondaryViaA: () => ({ mutateAsync: mockDeriveMutate, isPending: false }),
}));

vi.mock('@/context/CompanyContext', () => ({
    useCompany: () => ({ activeCompany: { nit: '900123456' } }),
}));

// Stub PeriodSelector so we can fire onChange + assert the generate wiring.
vi.mock('@/components/common/PeriodSelector', () => ({
    __esModule: true,
    default: ({
        onChange,
    }: {
        onChange: (v: { startDate: string; endDate: string; periodType: string }) => void;
    }) => (
        <button
            data-testid="period-stub"
            onClick={() =>
                onChange({ startDate: '2025-01-01', endDate: '2025-12-31', periodType: 'year' })
            }
        >
            period
        </button>
    ),
}));

function statusFixture(overrides?: Partial<ViaADerivationStatus>): ViaADerivationStatus {
    return {
        company_nit: '900123456',
        first_level_periods: [
            {
                period_start: '2025-01-01T00:00:00+00:00',
                period_end: '2025-12-31T23:59:59+00:00',
                types: ['balance_general', 'estado_resultados', 'libro_auxiliar'],
                frequency: 'annual',
                eligible_for_secondary: true,
            },
            {
                period_start: '2025-06-01T00:00:00+00:00',
                period_end: '2025-06-30T23:59:59+00:00',
                types: ['balance_general', 'estado_resultados'],
                frequency: 'monthly',
                eligible_for_secondary: false,
            },
        ],
        ready_periods: [{ period_start: '2025-01-01', period_end: '2025-12-31' }],
        monthly_periods: [
            { period_start: '2025-06-01', period_end: '2025-06-30', loaded_types: [] },
        ],
        derived_periods: [],
        is_ready: true,
        minimum_requirements: { paths: [], annual_only: true },
        journal_date_range: { earliest: '2025-01-05', latest: '2025-12-20' },
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    mockBuildMutate.mockResolvedValue({ status: 'ok' });
    mockDeriveMutate.mockResolvedValue({ status: 'ok' });
});

describe('splitFirstLevelPeriods', () => {
    it('separates annual from non-annual periods', () => {
        const { annual, monthly } = splitFirstLevelPeriods(statusFixture());
        expect(annual).toHaveLength(1);
        expect(monthly).toHaveLength(1);
        expect(annual[0].frequency).toBe('annual');
    });

    it('returns empty arrays for null status', () => {
        const { annual, monthly } = splitFirstLevelPeriods(null);
        expect(annual).toEqual([]);
        expect(monthly).toEqual([]);
    });
});

describe('ViaADerivationTab', () => {
    it('renders both steps with annual eligible and monthly informational', () => {
        mockUseStatus.mockReturnValue({
            data: statusFixture(),
            isLoading: false,
            refetch: vi.fn(),
        });

        render(<ViaADerivationTab />);

        expect(screen.getByText(/Generar desde los asientos/i)).toBeInTheDocument();
        expect(screen.getByText(/Derivar estados secundarios/i)).toBeInTheDocument();
        // Annual close section + the monthly informational lock row.
        expect(screen.getByText(/CIERRES ANUALES \(1\)/i)).toBeInTheDocument();
        expect(screen.getByText(/NO ANUAL, NO DERIVABLE/i)).toBeInTheDocument();
    });

    it('disables Generar when there is no journal range', () => {
        mockUseStatus.mockReturnValue({
            data: statusFixture({ journal_date_range: { earliest: null, latest: null } }),
            isLoading: false,
            refetch: vi.fn(),
        });

        render(<ViaADerivationTab />);
        const generar = screen.getByRole('button', { name: /generar/i });
        expect(generar).toBeDisabled();
    });

    it('calls build mutation with mapped frequency + dates on Generar', async () => {
        mockUseStatus.mockReturnValue({
            data: statusFixture(),
            isLoading: false,
            refetch: vi.fn(),
        });

        render(<ViaADerivationTab />);

        // Drive the stubbed PeriodSelector to set the annual period.
        fireEvent.click(screen.getByTestId('period-stub'));
        fireEvent.click(screen.getByRole('button', { name: /generar/i }));

        await waitFor(() => {
            expect(mockBuildMutate).toHaveBeenCalledWith({
                company_nit: '900123456',
                period_start: '2025-01-01',
                period_end: '2025-12-31',
                period_type: 'annual',
            });
        });
    });

    it('derives the annual period via the secondary mutation', async () => {
        mockUseStatus.mockReturnValue({
            data: statusFixture(),
            isLoading: false,
            refetch: vi.fn(),
        });

        render(<ViaADerivationTab />);

        const derivar = screen.getByRole('button', { name: /^derivar$/i });
        fireEvent.click(derivar);

        await waitFor(() => {
            expect(mockDeriveMutate).toHaveBeenCalledWith({
                company_nit: '900123456',
                period_start: '2025-01-01',
                period_end: '2025-12-31',
            });
        });
    });

    it('shows the empty state when no first-level periods exist', () => {
        mockUseStatus.mockReturnValue({
            data: statusFixture({ first_level_periods: [], ready_periods: [] }),
            isLoading: false,
            refetch: vi.fn(),
        });

        render(<ViaADerivationTab />);
        expect(screen.getByText(/Aún no generas estados de primer nivel/i)).toBeInTheDocument();
    });
});
