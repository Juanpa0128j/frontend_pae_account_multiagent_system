/**
 * TDD — dashboard reclassification visibility badge.
 *
 * When GET /api/v1/dashboard/stats returns `cuentas_reclasificadas` with PUC
 * codes, the dashboard must show a `// CUENTA RECLASIFICADA` warning chip near
 * the Total Activos KPI. Absent when the field is [] or undefined.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import type { DashboardStatsResponse } from '@/types';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
    usePathname: () => '/',
}));

// Skip the lazy-loaded recharts chart entirely.
vi.mock('next/dynamic', () => ({
    default: () => {
        const Stub = () => null;
        return Stub;
    },
}));

vi.mock('@/hooks/useTransactions', () => ({
    useTransactions: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/context/CompanyContext', () => ({
    useCompany: () => ({
        activeCompany: { nit: '800999888-2', nombre: 'ACME SAS' },
        activeNit: '800999888-2',
    }),
}));

const mockUseDashboardStats = vi.fn();

vi.mock('@/hooks/useDashboard', () => ({
    useDashboardStats: () => mockUseDashboardStats(),
    useMonthlyTrend: () => ({ data: { data: [] }, isLoading: false }),
}));

import DashboardPage from '@/app/page';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStats(overrides: Partial<DashboardStatsResponse> = {}): DashboardStatsResponse {
    return {
        documentos_pendientes: 2,
        transacciones_procesadas_mes: 10,
        alertas_activas: 0,
        total_activos_cop: 12_500_000,
        total_pasivos_cop: 8_000_000,
        utilidad_neta_cop: 4_500_000,
        efectivo_disponible_cop: 1_000_000,
        iva_por_pagar: 0,
        total_retenciones: 0,
        transacciones_por_estado: {},
        ...overrides,
    };
}

function renderWithStats(stats: DashboardStatsResponse) {
    mockUseDashboardStats.mockReturnValue({ data: stats, isLoading: false });
    return render(<DashboardPage />);
}

const CHIP_TEXT = /CUENTA RECLASIFICADA/i;

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('dashboard reclassification chip', () => {
    it('renders the warning chip when cuentas_reclasificadas has codes', () => {
        renderWithStats(makeStats({ cuentas_reclasificadas: ['130505'] }));

        expect(screen.getByText(CHIP_TEXT)).toBeInTheDocument();
    });

    it('does not render the chip when cuentas_reclasificadas is empty', () => {
        renderWithStats(makeStats({ cuentas_reclasificadas: [] }));

        expect(screen.queryByText(CHIP_TEXT)).not.toBeInTheDocument();
    });

    it('does not render the chip when cuentas_reclasificadas is undefined', () => {
        renderWithStats(makeStats());

        expect(screen.queryByText(CHIP_TEXT)).not.toBeInTheDocument();
    });
});
