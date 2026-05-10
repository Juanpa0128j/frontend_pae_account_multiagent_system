'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxApiClient } from '@/lib/api/clients';
import type { UpdateFieldRequest, GenerateDraftRequest } from '@/types/api';
import { useCompany } from '@/context/CompanyContext';

// ============================================================================
// Existing Hooks
// ============================================================================

export function useIVA(enabled = true) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['tax', 'iva', activeNit],
        queryFn: () => taxApiClient.getIVA(activeNit!),
        staleTime: 5 * 60 * 1000,
        enabled: enabled && !!activeNit,
    });
}

export function useWithholdings(enabled = true) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['tax', 'withholdings', activeNit],
        queryFn: () => taxApiClient.getWithholdings(activeNit!),
        staleTime: 5 * 60 * 1000,
        enabled: enabled && !!activeNit,
    });
}

export function useICA(companyNitFallback: string) {
    const { activeNit } = useCompany();
    const nit = activeNit ?? companyNitFallback;
    return useQuery({
        queryKey: ['tax', 'ica', nit],
        queryFn: () => taxApiClient.getICA(nit),
        enabled: !!nit,
        staleTime: 5 * 60 * 1000,
    });
}

export function useRentaProvision(companyNitFallback: string) {
    const { activeNit } = useCompany();
    const nit = activeNit ?? companyNitFallback;
    return useQuery({
        queryKey: ['tax', 'renta-provision', nit],
        queryFn: () => taxApiClient.getRentaProvision(nit),
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
        mutationFn: (data: GenerateDraftRequest) => taxApiClient.generateDeclarationDraft(data),
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
        queryFn: () => taxApiClient.getDeclarationDraft(draftId!),
        enabled: !!draftId,
        staleTime: 1 * 60 * 1000, // 1 minute - drafts can change frequently
    });
}

export function useUpdateDraftField(draftId: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateFieldRequest) =>
            taxApiClient.updateDraftField(draftId!, data.renglon, data.value),
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
        queryFn: () => taxApiClient.getTaxCalendar(activeNit!, year, ivaRegime),
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
        queryFn: () => taxApiClient.getF220Certificates(activeNit!, year),
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
        queryFn: () => taxApiClient.getExogenaFormat(formato, activeNit!, year),
        enabled: !!activeNit && year > 0,
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}
