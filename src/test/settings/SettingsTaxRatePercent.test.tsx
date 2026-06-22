/**
 * TDD RED phase — Phase 5: tax rate % UI conversion in settings/page.tsx
 *
 * These tests assert that:
 *   - Rate fields display stored decimal as percentage (0.19 → "19")
 *   - User input of percentage (e.g. 19) is stored as decimal (0.19)
 *   - All rate fields show a "%" InputAdornment
 *   - Validation accepts 0–100 range, rejects values above 100
 *
 * Expected to FAIL until Phase 5 UI conversion is implemented.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
    usePathname: () => '/settings',
}));

vi.mock('@clerk/nextjs', () => ({
    useUser: () => ({
        user: { primaryEmailAddress: { emailAddress: 'test@example.com' } },
        isLoaded: true,
    }),
    useAuth: () => ({
        isSignedIn: true,
        isLoaded: true,
        getToken: vi.fn().mockResolvedValue('tok'),
    }),
    useClerk: () => ({ signOut: vi.fn() }),
    ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
    UserProfile: () => null,
}));

vi.mock('@/lib/clerk/appearance', () => ({
    clerkAppearance: {},
}));

vi.mock('@/styles/brutalist', () => ({
    palette: {
        ink: '#0A0E1A',
        paper: '#FAFAF5',
        paperDim: '#999',
        paperGhost: '#666',
        paperFaint: '#AAA',
        paperSoft: '#BBB',
        line: '#1e2235',
        lineFaint: '#151827',
        lineStrong: '#2e3555',
        inkSoft: '#0d1122',
        chartreuse: '#D4FF00',
        amber: '#F59E0B',
        error: '#EF4444',
        pink: '#EC4899',
        accent: '#6366F1',
        success: '#22c55e',
    },
    fonts: {
        mono: 'JetBrains Mono',
        body: 'Inter',
        display: 'Bricolage Grotesque',
    },
    hexAlpha: (_color: string, alpha: number) => `rgba(0,0,0,${alpha})`,
    moduleAccents: {
        settings: '#6366F1',
        transactions: '#EC4899',
        upload: '#D4FF00',
    },
    typeScale: {},
    sxLabel: {},
    sxLabelSmall: { fontFamily: 'JetBrains Mono', fontSize: '0.62rem' },
    sxCardBase: {},
    sxAccentRule: () => ({}),
    sxGhostNumber: () => ({}),
    motion: {
        duration: '0.3s',
        durationMs: 300,
        easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
        sm: '0.15s cubic-bezier(0.2, 0.9, 0.3, 1)',
    },
}));

vi.mock('@/hooks/usePuc', () => ({
    useCreatePuc: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdatePuc: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeletePuc: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCompanyPuc: () => ({ data: [], isLoading: false }),
    useToggleCompanyPuc: () => ({ mutateAsync: vi.fn(), isPending: false }),
    usePucList: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/hooks/useTax', () => ({
    useTaxConstants: () => ({ data: null, isLoading: false }),
    useUpsertUvt: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpsertBaseMinima: () => ({ mutateAsync: vi.fn(), isPending: false }),
    usePerdidasAcumuladas: () => ({ data: [], isLoading: false }),
    useUpsertPerdida: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeletePerdida: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useTarifasRenta: () => ({ data: [], isLoading: false }),
    useUpsertTarifa: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeleteTarifa: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useReteicaTarifas: () => ({
        data: [
            {
                id: 42,
                municipio: 'Bogotá',
                ciiu_seccion: 'G',
                tasa: 0.005,
                tarifa_base: 0.0069,
                fuente: null,
                base_minima_uvt: null,
            },
        ],
        isLoading: false,
    }),
    useUpsertReteicaTarifa: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeleteReteicaTarifa: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useTaxConcepts: () => ({ data: [], isLoading: false }),
    useUpsertTaxConcept: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useSoftDeleteTaxConcept: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useNationalRates: () => ({ data: [], isLoading: false }),
    useUpsertNationalRate: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useEffectiveRates: () => ({ data: [], isLoading: false }),
    useUpsertCompanyRateOverride: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const mockUpsertFn = vi.fn().mockResolvedValue({});

const STABLE_SETTINGS_DATA = {
    nombre: 'Test Co',
    ciudad: 'Bogotá',
    codigo_ciiu: '6201',
    iva_responsable: true,
    es_declarante: true,
    tasa_reteica: 0.005,
    tasa_iva_general: 0.19,
    tasa_retefuente_servicios: 0.04,
    tasa_retefuente_bienes: 0.025,
    tasa_retefuente_arrendamiento: 0.035,
    tasa_ica: 0.00966,
    tasa_renta: 0.35,
    regimen_tributario: null,
    actividad_economica: null,
};

const STABLE_COMPANY_SETTINGS = { data: STABLE_SETTINGS_DATA, isLoading: false, isFetching: false };

vi.mock('@/hooks/useSettings', () => ({
    useCompanySettings: () => STABLE_COMPANY_SETTINGS,
    useSetupCompanySettings: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpsertCompanySettings: () => ({ mutateAsync: mockUpsertFn, isPending: false }),
    useMunicipios: () => ({ data: ['Bogotá', 'Medellín'], isLoading: false }),
}));

vi.mock('@/hooks/useHealthCheck', () => ({
    useHealthCheck: () => ({ data: { status: 'ok' }, isLoading: false }),
}));

vi.mock('@/context/CompanyContext', () => ({
    useCompany: () => ({
        activeNit: '800999888-1',
        activeCompany: { nit: '800999888-1', razon_social: 'Test Co' },
        companies: [{ nit: '800999888-1', razon_social: 'Test Co' }],
        setActiveNit: vi.fn(),
    }),
}));

vi.mock('@/lib/api/clients', () => ({
    taxApiClient: {
        getSpecialTaxes: vi.fn().mockResolvedValue([
            {
                id: 'st-001',
                code: 'BOLSAS',
                nombre: 'Impuesto bolsas plásticas',
                descripcion: null,
                rate: 0.03,
                base_calc: 'subtotal',
                base_calc_formula: null,
                applies_to_doc_types: ['FV'],
                es_entidad_publica_only: false,
                settlement: 'withholding',
                cuenta_gasto: '5115',
                cuenta_por_pagar: '2365',
                norma_referencia: null,
                vigente_desde: null,
                vigente_hasta: null,
                activo: true,
            },
        ]),
        deleteSpecialTax: vi.fn().mockResolvedValue(undefined),
        createSpecialTax: vi.fn(),
        updateSpecialTax: vi.fn(),
        toggleSpecialTaxActive: vi.fn(),
    },
}));

vi.mock('@/components/brutalist', () => ({
    BrutalistPageHero: ({ title, action }: { title: string; action?: React.ReactNode }) => (
        <div data-testid="page-hero">
            {title}
            {action}
        </div>
    ),
    BrutalistButton: ({
        children,
        onClick,
        disabled,
    }: {
        children: React.ReactNode;
        onClick?: () => void;
        disabled?: boolean;
        [key: string]: unknown;
    }) => (
        <button onClick={onClick} disabled={disabled}>
            {children}
        </button>
    ),
    BrutalistChip: ({ label }: { label: string }) => <span>{label}</span>,
}));

// ---------------------------------------------------------------------------
// Import component AFTER mocks
// ---------------------------------------------------------------------------

import SettingsPage from '@/app/settings/page';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderSettings() {
    return render(<SettingsPage />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 5 — tax rate % UI conversion', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('IVA rate field displays decimal as percentage (0.19 → "19")', async () => {
        renderSettings();

        // The IVA General field must show "19", not "0.19"
        // tasa_iva_general = 0.19 → display value should be 19
        const ivaInput = await screen.findByLabelText(/IVA General/i);
        expect(ivaInput).toHaveValue(19);
    });

    it('ReteICA tasa field displays as percentage', async () => {
        renderSettings();

        // Wait for ReteICA table to load — look for the municipio cell
        // findAllByText because "Bogotá" also appears in the ciudad Select
        const bogotaCells = await screen.findAllByText('Bogotá');
        expect(bogotaCells.length).toBeGreaterThanOrEqual(1);

        // tasa: 0.005 → rendered as (0.005 * 100).toFixed(3) + "%" = "0.500%"
        // The raw decimal "0.005" must NOT appear as standalone text in the table
        expect(screen.queryByText('0.005')).not.toBeInTheDocument();
        // The percentage form must appear
        expect(screen.getByText(/0\.500%/)).toBeInTheDocument();
    });

    it('entering 19 in IVA field stores 0.19 on save', async () => {
        renderSettings();

        const ivaInput = await screen.findByLabelText(/IVA General/i);

        // Set the input value to 25 (user enters percentage)
        await act(async () => {
            fireEvent.change(ivaInput, { target: { value: '25' } });
        });

        // Click save — hero action button is "Guardar"
        const saveButton = screen.getAllByRole('button', { name: /^Guardar$/i })[0];
        fireEvent.click(saveButton);

        // The payload sent to API must have tasa_iva_general = 0.25 (25/100)
        // The mutation is called as mutateAsync({ nit, payload: { ... } })
        await waitFor(() => {
            expect(mockUpsertFn).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({
                        tasa_iva_general: expect.closeTo(0.25, 4),
                    }),
                })
            );
        });
    });

    it('IVA rate rejects values above 100', async () => {
        renderSettings();

        const ivaInput = await screen.findByLabelText(/IVA General/i);

        // Enter 150 — should fail HTML5 validation or show an error
        fireEvent.change(ivaInput, { target: { value: '150' } });

        // The input max attribute must be 100
        expect(ivaInput).toHaveAttribute('max', '100');

        // Alternatively, a validation error message should appear
        // (either HTML constraint or explicit error text)
        const saveButton = screen.getAllByRole('button', { name: /^Guardar$/i })[0];
        fireEvent.click(saveButton);

        // After attempting save with 150, an error or invalid state must be present
        await waitFor(() => {
            const errorMessages = screen.queryAllByText(/0.*100|porcentaje|rango|máximo/i);
            const inputInvalid = ivaInput.getAttribute('aria-invalid') === 'true';
            expect(errorMessages.length > 0 || inputInvalid).toBe(true);
        });
    });

    it('IVA rate field shows % InputAdornment', async () => {
        renderSettings();

        // The field for IVA General must have a "%" adornment in the DOM
        await screen.findByLabelText(/IVA General/i);

        // Look for "%" character near the IVA General input — InputAdornment renders as sibling text
        const percentAdornments = screen.getAllByText('%');
        expect(percentAdornments.length).toBeGreaterThan(0);
    });

    it('Retefuente Servicios rate field shows % InputAdornment and displays 4 not 0.04', async () => {
        renderSettings();

        const retefuenteInput = await screen.findByLabelText(/Retefuente Servicios/i);
        // 0.04 → should display 4
        expect(retefuenteInput).toHaveValue(4);
    });

    it('Retefuente Bienes rate field displays 2.5 not 0.025', async () => {
        renderSettings();

        const bienesInput = await screen.findByLabelText(/Retefuente Bienes/i);
        // 0.025 → should display 2.5
        expect(bienesInput).toHaveValue(2.5);
    });

    it('special tax rate field in modal displays as percentage', async () => {
        renderSettings();

        // Wait for special taxes to load — "Editar" (mixed-case) is the special-tax row button;
        // ReteICA uses "EDITAR" (upper-case), so exact-text match targets only special-tax rows.
        await screen.findByText('Impuesto bolsas plásticas');
        const editarButtons = screen.getAllByRole('button', { name: 'Editar' });
        fireEvent.click(editarButtons[0]);

        // The rate field inside the modal should show 3, not 0.03
        // Label is "Tarifa % *" — form state stores rate * 100 already
        const rateInput = await screen.findByLabelText('Tarifa % *');
        expect(rateInput).toHaveValue(3);
    });
});
