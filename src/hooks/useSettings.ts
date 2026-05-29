'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companyApiClient } from '@/lib/api/clients';
import type { CompanySettingsRequest, CompanyProfileSetupRequest } from '@/types';

export function useCompanySettings(nit: string | null | undefined, enabled = true) {
    return useQuery({
        queryKey: ['settings', 'company', nit],
        queryFn: () => companyApiClient.getCompanySettings(nit!),
        enabled: enabled && !!nit,
        retry: false,
    });
}

export function useUpsertCompanySettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ nit, payload }: { nit: string; payload: CompanySettingsRequest }) =>
            companyApiClient.upsertCompanySettings(nit, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'company', variables.nit] });
        },
    });
}

export function useSetupCompanySettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ nit, payload }: { nit: string; payload: CompanyProfileSetupRequest }) =>
            companyApiClient.setupCompanySettings(nit, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'company', variables.nit] });
        },
    });
}

export function useMunicipios() {
    return useQuery({
        queryKey: ['municipios'],
        queryFn: () => companyApiClient.getMunicipios(),
        staleTime: Infinity,
    });
}

export function useDeleteCompany() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (nit: string) => companyApiClient.deleteCompany(nit),
        onSuccess: (_, nit) => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            queryClient.removeQueries({ queryKey: ['settings', 'company', nit] });
        },
    });
}
