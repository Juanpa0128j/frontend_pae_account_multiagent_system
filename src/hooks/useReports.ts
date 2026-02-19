'use client';

import { useQuery } from '@tanstack/react-query';
import { getBalance, getProfitAndLoss, getCashFlow } from '@/lib/api';

export function useBalance(enabled = true) {
    return useQuery({
        queryKey: ['reports', 'balance'],
        queryFn: getBalance,
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled,
    });
}

export function useProfitAndLoss(enabled = true) {
    return useQuery({
        queryKey: ['reports', 'pnl'],
        queryFn: getProfitAndLoss,
        staleTime: 5 * 60 * 1000,
        enabled,
    });
}

export function useCashFlow(enabled = true) {
    return useQuery({
        queryKey: ['reports', 'cashflow'],
        queryFn: getCashFlow,
        staleTime: 5 * 60 * 1000,
        enabled,
    });
}
