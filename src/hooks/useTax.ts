'use client';

import { useQuery } from '@tanstack/react-query';
import { getIVA, getWithholdings, getICA, getRentaProvision } from '@/lib/api';
import { useCompany } from '@/context/CompanyContext';

export function useIVA(enabled = true) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['tax', 'iva', activeNit],
        queryFn: () => getIVA(activeNit ?? undefined),
        staleTime: 5 * 60 * 1000,
        enabled,
    });
}

export function useWithholdings(enabled = true) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['tax', 'withholdings', activeNit],
        queryFn: () => getWithholdings(activeNit ?? undefined),
        staleTime: 5 * 60 * 1000,
        enabled,
    });
}

export function useICA(companyNitFallback: string) {
    const { activeNit } = useCompany();
    const nit = activeNit ?? companyNitFallback;
    return useQuery({
        queryKey: ['tax', 'ica', nit],
        queryFn: () => getICA(nit),
        enabled: !!nit,
        staleTime: 5 * 60 * 1000,
    });
}

export function useRentaProvision(companyNitFallback: string) {
    const { activeNit } = useCompany();
    const nit = activeNit ?? companyNitFallback;
    return useQuery({
        queryKey: ['tax', 'renta-provision', nit],
        queryFn: () => getRentaProvision(nit),
        enabled: !!nit,
        staleTime: 5 * 60 * 1000,
    });
}
