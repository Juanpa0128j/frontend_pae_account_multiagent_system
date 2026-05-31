'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApiClient } from '@/lib/api/clients';
import { useCompany } from '@/context/CompanyContext';
import type {
    CuentaPUC,
    CuentaPUCRequest,
    CompanyPucEntry,
    CompanyPucToggleRequest,
} from '@/types';

export const usePucList = (params?: {
    company_nit?: string;
    search?: string;
    include_inactive?: boolean;
    limit?: number;
}) => {
    const { activeNit } = useCompany();
    const finalParams = { ...params, company_nit: params?.company_nit || (activeNit ?? undefined) };

    return useQuery({
        queryKey: ['puc', finalParams],
        queryFn: () => companyApiClient.getPucList(finalParams),
        enabled: !!finalParams.company_nit,
    });
};

export const usePuc = (codigo: string) => {
    const { activeNit } = useCompany();

    return useQuery({
        queryKey: ['puc', codigo, activeNit],
        queryFn: () => companyApiClient.getPuc(codigo),
        enabled: !!activeNit,
    });
};

export const useCreatePuc = () => {
    const queryClient = useQueryClient();
    const { activeNit } = useCompany();

    return useMutation({
        mutationFn: (payload: CuentaPUCRequest & { company_nit?: string }) =>
            companyApiClient.createPuc({
                ...payload,
                company_nit: payload.company_nit || (activeNit ?? undefined),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['puc'] });
        },
    });
};

export const useUpdatePuc = () => {
    const queryClient = useQueryClient();
    const { activeNit } = useCompany();

    return useMutation({
        mutationFn: ({
            codigo,
            payload,
        }: {
            codigo: string;
            payload: CuentaPUCRequest & { company_nit?: string };
        }) =>
            companyApiClient.updatePuc(codigo, {
                ...payload,
                company_nit: payload.company_nit || (activeNit ?? undefined),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['puc'] });
        },
    });
};

export const useDeletePuc = () => {
    const queryClient = useQueryClient();
    const { activeNit } = useCompany();

    return useMutation({
        mutationFn: (codigo: string) => companyApiClient.deletePuc(codigo, activeNit ?? undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['puc'] });
        },
    });
};

// ── Per-Company PUC Overlay ────────────────────────────────────────────────

export const useCompanyPuc = (includeInactive?: boolean) => {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['company-puc', activeNit, includeInactive],
        queryFn: () => companyApiClient.getCompanyPuc(activeNit!, includeInactive),
        enabled: !!activeNit,
        retry: false,
    });
};

export const useToggleCompanyPuc = () => {
    const { activeNit } = useCompany();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ codigo, payload }: { codigo: string; payload: CompanyPucToggleRequest }) =>
            companyApiClient.toggleCompanyPuc(activeNit!, codigo, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-puc', activeNit] });
        },
    });
};
