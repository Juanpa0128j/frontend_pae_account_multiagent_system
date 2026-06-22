/**
 * TDD RED phase — settings/page.tsx destructive confirmations
 *
 * These tests assert that the three destructive actions (deactivate PUC,
 * delete ReteICA rate, delete special tax) open a Dialog with text
 * "CONFIRMAR ELIMINACIÓN" instead of calling window.confirm.
 *
 * They are expected to FAIL until the Dialog implementation is added.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any dynamic imports
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

const mockDeletePucMutateAsync = vi.fn().mockResolvedValue(undefined);
const mockDeleteReteicaMutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/usePuc', () => ({
    useCreatePuc: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdatePuc: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeletePuc: () => ({ mutateAsync: mockDeletePucMutateAsync, isPending: false }),
    useCompanyPuc: () => ({
        data: [
            {
                codigo: '1105',
                nombre: 'Banco Nacional',
                clase: 1,
                naturaleza: 'debito',
                grupo: '11',
                cuenta: '1105',
                subcuenta: null,
                activa: true,
                is_active_for_company: true,
                descripcion: '',
            },
        ],
        isLoading: false,
    }),
    useToggleCompanyPuc: () => ({ mutateAsync: vi.fn(), isPending: false }),
    usePucList: () => ({
        data: [
            {
                codigo: '1105',
                nombre: 'Banco Nacional',
                clase: 1,
                naturaleza: 'debito',
                grupo: '11',
                cuenta: '1105',
                subcuenta: null,
                activa: true,
                is_active_for_company: true,
                descripcion: '',
            },
        ],
        isLoading: false,
    }),
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
                fuente: null,
                base_minima_uvt: null,
            },
        ],
        isLoading: false,
    }),
    useUpsertReteicaTarifa: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeleteReteicaTarifa: () => ({ mutateAsync: mockDeleteReteicaMutateAsync, isPending: false }),
    useTaxConcepts: () => ({ data: [], isLoading: false }),
    useUpsertTaxConcept: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useSoftDeleteTaxConcept: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useNationalRates: () => ({ data: [], isLoading: false }),
    useUpsertNationalRate: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useEffectiveRates: () => ({ data: [], isLoading: false }),
    useUpsertCompanyRateOverride: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/useSettings', () => ({
    useCompanySettings: () => ({
        data: {
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
        },
        isLoading: false,
        isFetching: false,
    }),
    useSetupCompanySettings: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpsertCompanySettings: () => ({ mutateAsync: vi.fn(), isPending: false }),
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
    BrutalistPageHero: ({ title }: { title: string }) => <div data-testid="page-hero">{title}</div>,
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
// Import the component under test AFTER mocks are in place
// ---------------------------------------------------------------------------

import SettingsPage from '@/app/settings/page';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderSettings() {
    return render(<SettingsPage />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SettingsPage — destructive confirmations use Dialog, not window.confirm', () => {
    beforeEach(() => {
        vi.spyOn(window, 'confirm').mockImplementation(() => true);
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('deactivate PUC shows confirmation dialog instead of window.confirm', async () => {
        renderSettings();

        // Wait for the page to finish loading (Suspense + lazy import)
        // The PUC section renders a table with the account 1105
        await screen.findByText('Banco Nacional');

        // Find all buttons and click the delete icon button next to the PUC row.
        // The delete button renders as an icon-only button (DeleteIcon svg) —
        // it's the button that triggers setConfirmDeletePucId.
        // We look for the button containing DeleteIcon by finding all buttons
        // in the document and clicking the one after the Edit button for row 1105.
        const allButtons = screen.getAllByRole('button');
        // The PUC row has Edit (icon only) then Delete (icon only).
        // Find the delete button by looking for buttons with no accessible text
        // that appear after "Banco Nacional" row.
        // Strategy: find button whose text content is empty (icon-only) near the PUC table.
        const iconOnlyButtons = allButtons.filter(
            (btn) => btn.textContent === '' || btn.textContent?.trim() === ''
        );
        // Click the first icon-only button — that's the Edit; click the second — that's Delete.
        // But to be safe, click the last icon-only button before the ReteICA section.
        // Alternatively, find by aria-label or title if present.
        // The simplest reliable approach: find all buttons, the delete one is right after edit.
        // There should be at least 2 icon-only buttons for the 1105 row (edit + delete).
        expect(iconOnlyButtons.length).toBeGreaterThanOrEqual(2);
        // Click the second icon-only button (Delete for PUC row)
        fireEvent.click(iconOnlyButtons[1]);

        // window.confirm must NOT have been called
        expect(window.confirm).not.toHaveBeenCalled();

        // A Dialog with "CONFIRMAR ELIMINACIÓN" must appear
        await waitFor(() => {
            expect(screen.getByText(/CONFIRMAR ELIMINACIÓN/i)).toBeInTheDocument();
        });
    });

    it('delete ReteICA rate shows confirmation dialog instead of window.confirm', async () => {
        renderSettings();

        // Wait for ReteICA section — ELIMINAR button appears when table renders
        const eliminateButtons = await screen.findAllByRole('button', { name: /ELIMINAR/i });
        fireEvent.click(eliminateButtons[0]);

        // window.confirm must NOT have been called
        expect(window.confirm).not.toHaveBeenCalled();

        // A Dialog with "CONFIRMAR ELIMINACIÓN" must appear
        await waitFor(() => {
            expect(screen.getByText(/CONFIRMAR ELIMINACIÓN/i)).toBeInTheDocument();
        });
    });

    it('delete special tax shows confirmation dialog instead of window.confirm', async () => {
        renderSettings();

        // Wait for special taxes to load (async loadSpecialTaxes effect via taxApiClient.getSpecialTaxes)
        await screen.findByText('Impuesto bolsas plásticas');

        // The special tax delete button is an icon-only button (DeleteIcon).
        // After the special taxes table renders, new icon-only buttons appear.
        // Find all buttons and click the delete one for the special tax row.
        // The row has: Edit button (text "Editar"), Delete button (icon only).
        const editButtons = screen.getAllByRole('button', { name: /Editar/i });
        // The delete button is the next sibling button after the edit button.
        // Find all buttons and locate the one right after the last "Editar" button.
        const allButtons = screen.getAllByRole('button');
        const lastEditIdx = allButtons.lastIndexOf(editButtons[editButtons.length - 1]);
        const deleteBtn = allButtons[lastEditIdx + 1];
        expect(deleteBtn).toBeDefined();
        fireEvent.click(deleteBtn);

        // window.confirm must NOT have been called
        expect(window.confirm).not.toHaveBeenCalled();

        // A Dialog with "CONFIRMAR ELIMINACIÓN" must appear
        await waitFor(() => {
            expect(screen.getByText(/CONFIRMAR ELIMINACIÓN/i)).toBeInTheDocument();
        });
    });
});
