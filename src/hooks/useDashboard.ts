'use client';

import { useQuery } from '@tanstack/react-query';
import { reportApiClient } from '@/lib/api/clients';
import { useCompany } from '@/context/CompanyContext';

export function useDashboardStats(enabled = true) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['dashboard', 'stats', activeNit],
        queryFn: () => reportApiClient.getDashboardStats(activeNit!),
        staleTime: 60 * 1000,
        enabled: enabled && !!activeNit,
    });
}

export function useMonthlyTrend(enabled = true) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['dashboard', 'monthly-trend', activeNit],
        queryFn: () => reportApiClient.getMonthlyTrend(activeNit ?? undefined),
        staleTime: 60 * 1000,
        enabled: enabled && !!activeNit,
    });
}
