'use client';

import { useQuery } from '@tanstack/react-query';
import { getIVA, getWithholdings } from '@/lib/api';

export function useIVA(enabled = true) {
    return useQuery({
        queryKey: ['tax', 'iva'],
        queryFn: getIVA,
        staleTime: 5 * 60 * 1000,
        enabled,
    });
}

export function useWithholdings(enabled = true) {
    return useQuery({
        queryKey: ['tax', 'withholdings'],
        queryFn: getWithholdings,
        staleTime: 5 * 60 * 1000,
        enabled,
    });
}
