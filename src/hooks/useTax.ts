'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getIVA,
    getWithholdings,
    getICA,
    getRentaProvision,
    generateDeclarationDraft,
    getDeclarationDraft,
    updateDraftField,
    getTaxCalendar,
    generateF220Certificates,
    getExogenaFormat,
    getTaxConstants,
    upsertUvt,
    upsertBaseMinima,
    getPerdidasAcumuladas,
    createOrUpdatePerdida,
    deletePerdida,
    getTarifasRenta,
    createOrUpdateTarifa,
    deleteTarifa,
    type UpdateFieldRequest,
    type UvtValue,
    type BaseMinima,
    type CreatePerdidaRequest,
    type CreateTarifaRequest,
} from '@/lib/api';
import { useCompany } from '@/context/CompanyContext';

// ============================================================================
// Existing Hooks
// ============================================================================

interface UsePeriodParams {
    periodStart?: string;
    periodEnd?: string;
}

interface UseIVAParams extends UsePeriodParams {
    enabled?: boolean;
}

export function useIVA({ enabled = true, periodStart, periodEnd }: UseIVAParams = {}) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['tax', 'iva', activeNit, periodStart, periodEnd],
        queryFn: () => getIVA(activeNit!, periodStart, periodEnd),
        staleTime: 5 * 60 * 1000,
        enabled: enabled && !!activeNit,
    });
}

interface UseWithholdingsParams extends UsePeriodParams {
    enabled?: boolean;
}

export function useWithholdings({
    enabled = true,
    periodStart,
    periodEnd,
}: UseWithholdingsParams = {}) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['tax', 'withholdings', activeNit, periodStart, periodEnd],
        queryFn: () => getWithholdings(activeNit!, periodStart, periodEnd),
        staleTime: 5 * 60 * 1000,
        enabled: enabled && !!activeNit,
    });
}

interface UseICAParams extends UsePeriodParams {
    companyNitFallback: string;
}

export function useICA({ companyNitFallback, periodStart, periodEnd }: UseICAParams) {
    const { activeNit } = useCompany();
    const nit = activeNit ?? companyNitFallback;
    return useQuery({
        queryKey: ['tax', 'ica', nit, periodStart, periodEnd],
        queryFn: () => getICA(nit, periodStart, periodEnd),
        enabled: !!nit,
        staleTime: 5 * 60 * 1000,
    });
}

interface UseRentaProvisionParams extends UsePeriodParams {
    companyNitFallback: string;
}

export function useRentaProvision({
    companyNitFallback,
    periodStart,
    periodEnd,
}: UseRentaProvisionParams) {
    const { activeNit } = useCompany();
    const nit = activeNit ?? companyNitFallback;
    return useQuery({
        queryKey: ['tax', 'renta-provision', nit, periodStart, periodEnd],
        queryFn: () => getRentaProvision(nit, periodStart, periodEnd),
        enabled: !!nit,
        staleTime: 5 * 60 * 1000,
    });
}

// ============================================================================
// New Hooks - Declaration Drafts
// ============================================================================

export function useGenerateDeclarationDraft() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: generateDeclarationDraft,
        onSuccess: (data) => {
            // Invalidate drafts list cache
            queryClient.invalidateQueries({ queryKey: ['tax', 'drafts'] });
            // Pre-cache the new draft
            queryClient.setQueryData(['tax', 'draft', data.draft_id], data);
        },
    });
}

export function useDeclarationDraft(draftId: string | null) {
    return useQuery({
        queryKey: ['tax', 'draft', draftId],
        queryFn: () => getDeclarationDraft(draftId!),
        enabled: !!draftId,
        staleTime: 1 * 60 * 1000, // 1 minute - drafts can change frequently
    });
}

export function useUpdateDraftField(draftId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateFieldRequest) => updateDraftField(draftId!, data),
        onSuccess: (updatedDraft) => {
            // Update the draft cache with new data
            queryClient.setQueryData(['tax', 'draft', draftId], updatedDraft);
        },
    });
}

// ============================================================================
// New Hooks - Tax Calendar
// ============================================================================

export function useTaxCalendar(year?: number, ivaRegime?: 'bimestral' | 'cuatrimestral') {
    const { activeNit } = useCompany();

    return useQuery({
        queryKey: ['tax', 'calendar', activeNit, year, ivaRegime],
        queryFn: () => getTaxCalendar(activeNit!, year, ivaRegime),
        enabled: !!activeNit,
        staleTime: 60 * 60 * 1000, // 1 hour - calendar doesn't change often
    });
}

// ============================================================================
// New Hooks - F220 Certificates
// ============================================================================

export function useF220Certificates(year: number) {
    const { activeNit } = useCompany();

    return useQuery({
        queryKey: ['tax', 'certificates', 'f220', activeNit, year],
        queryFn: () => generateF220Certificates(activeNit!, year),
        enabled: !!activeNit && year > 0,
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}

// ============================================================================
// New Hooks - Exogena
// ============================================================================

export function useExogenaFormat(formato: '1001' | '2276', year: number) {
    const { activeNit } = useCompany();

    return useQuery({
        queryKey: ['tax', 'exogena', formato, activeNit, year],
        queryFn: () => getExogenaFormat(formato, activeNit!, year),
        enabled: !!activeNit && year > 0,
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}

// ============================================================================
// Tax Constants — UVT + Base Mínima
// ============================================================================

export function useTaxConstants(year: number) {
    return useQuery({
        queryKey: ['tax', 'constants', year],
        queryFn: () => getTaxConstants(year),
        staleTime: 60 * 60 * 1000, // 1 hour
        enabled: year > 0,
    });
}

export function useUpsertUvt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UvtValue) => upsertUvt(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tax', 'constants', variables.year] });
        },
    });
}

export function useUpsertBaseMinima() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: BaseMinima) => upsertBaseMinima(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tax', 'constants', variables.year] });
        },
    });
}

// ============================================================================
// Pérdidas Fiscales Acumuladas (Art. 147 ET)
// ============================================================================

export function usePerdidasAcumuladas(year?: number) {
    const { activeNit } = useCompany();

    return useQuery({
        queryKey: ['tax', 'perdidas', activeNit, year],
        queryFn: () => getPerdidasAcumuladas(activeNit!, year),
        staleTime: 5 * 60 * 1000,
        enabled: !!activeNit,
    });
}

export function useUpsertPerdida() {
    const queryClient = useQueryClient();
    const { activeNit } = useCompany();

    return useMutation({
        mutationFn: (payload: CreatePerdidaRequest) => createOrUpdatePerdida(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tax', 'perdidas', activeNit] });
        },
    });
}

export function useDeletePerdida() {
    const queryClient = useQueryClient();
    const { activeNit } = useCompany();

    return useMutation({
        mutationFn: (id: number) => deletePerdida(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tax', 'perdidas', activeNit] });
        },
    });
}

// ============================================================================
// Tarifas de Renta (Regulatorias)
// ============================================================================

export function useTarifasRenta(year?: number) {
    return useQuery({
        queryKey: ['tax', 'tarifas-renta', year],
        queryFn: () => getTarifasRenta(year),
        staleTime: 60 * 60 * 1000, // 1 hour — regulatory data changes rarely
        enabled: year === undefined || year > 0,
    });
}

export function useUpsertTarifa() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateTarifaRequest) => createOrUpdateTarifa(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tax', 'tarifas-renta'] });
        },
    });
}

export function useDeleteTarifa() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteTarifa(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tax', 'tarifas-renta'] });
        },
    });
}
