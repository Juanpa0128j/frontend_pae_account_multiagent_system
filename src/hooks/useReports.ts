'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBalance, getProfitAndLoss, getCashFlow, getStatements, getStatement } from '@/lib/api';
import type { FinancialStatementType, FinancialStatementSourceMode } from '@/lib/api';
import { useCompany } from '@/context/CompanyContext';

export function useBalance(enabled = true) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['reports', 'balance', activeNit],
        queryFn: () => getBalance(activeNit!),
        staleTime: 5 * 60 * 1000,
        enabled: enabled && !!activeNit,
    });
}

export function useProfitAndLoss(enabled = true) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['reports', 'pnl', activeNit],
        queryFn: () => getProfitAndLoss(activeNit!),
        staleTime: 5 * 60 * 1000,
        enabled: enabled && !!activeNit,
    });
}

export function useCashFlow(enabled = true) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['reports', 'cashflow', activeNit],
        queryFn: () => getCashFlow(activeNit!),
        staleTime: 5 * 60 * 1000,
        enabled: enabled && !!activeNit,
    });
}

export interface StatementsFilter {
    company_nit?: string;
    statement_type?: FinancialStatementType;
    source_mode?: FinancialStatementSourceMode;
    start_date?: string;
    end_date?: string;
}

const DERIVED_TYPES = new Set(['flujo_de_caja', 'cambios_patrimonio', 'notas_estados_financieros']);

/**
 * Fetches the list of financial statements from Via B pipeline.
 * When pollUntilDerived is true, polls every 2s until all 3 second-level
 * documents appear — mirrors the polling in simulate_frontend_full_pipeline.py.
 */
export function useStatements(
    filter?: StatementsFilter,
    options?: { pollUntilDerived?: boolean }
) {
    const { activeNit } = useCompany();
    const effectiveFilter = { company_nit: activeNit ?? '800999888-10', ...filter };
    return useQuery({
        queryKey: ['statements', effectiveFilter],
        queryFn: () => getStatements(effectiveFilter),
        staleTime: 30 * 1000,
        enabled: !!activeNit,
        refetchInterval: (query) => {
            if (!options?.pollUntilDerived) return false;
            const data = query.state.data ?? [];
            const derivedCount = data.filter(s => DERIVED_TYPES.has(s.statement_type)).length;
            return derivedCount >= 3 ? false : 2000;
        },
    });
}

export function useStatement(id: string | null) {
    return useQuery({
        queryKey: ['statement', id],
        queryFn: () => getStatement(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

export function useInvalidateStatements() {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: ['statements'] });
}
