'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getCompanySettings,
    upsertCompanySettings,
    setupCompanySettings,
    deleteCompany,
    getMunicipios,
    CompanySettingsRequest,
    CompanyProfileSetupRequest,
} from '@/lib/api';

export function useCompanySettings(nit: string | null | undefined, enabled = true) {
    return useQuery({
        queryKey: ['settings', 'company', nit],
        queryFn: () => getCompanySettings(nit!),
        enabled: enabled && !!nit,
        retry: false,
    });
}

export function useUpsertCompanySettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ nit, payload }: { nit: string; payload: CompanySettingsRequest }) =>
            upsertCompanySettings(nit, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'company', variables.nit] });
        },
    });
}

export function useSetupCompanySettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ nit, payload }: { nit: string; payload: CompanyProfileSetupRequest }) =>
            setupCompanySettings(nit, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'company', variables.nit] });
        },
    });
}

export function useMunicipios() {
    return useQuery({
        queryKey: ['municipios'],
        queryFn: getMunicipios,
        staleTime: Infinity,
    });
}

export function useDeleteCompany() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (nit: string) => deleteCompany(nit),
        onSuccess: (_, nit) => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            queryClient.removeQueries({ queryKey: ['settings', 'company', nit] });
        },
    });
}
