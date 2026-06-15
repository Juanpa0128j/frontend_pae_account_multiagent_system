'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportApiClient } from '@/lib/api/clients';
import type { FinancialStatementType, FinancialStatementSourceMode, ViaAPeriodType } from '@/types';
import { useCompany } from '@/context/CompanyContext';

export function useBalance(enabled = true, periodEnd?: string) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['reports', 'balance', activeNit, periodEnd],
        queryFn: () => reportApiClient.getBalance(activeNit!, periodEnd),
        staleTime: 5 * 60 * 1000,
        enabled: enabled && !!activeNit,
    });
}

export function useProfitAndLoss(enabled = true, periodEnd?: string) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['reports', 'pnl', activeNit, periodEnd],
        queryFn: () => reportApiClient.getProfitAndLoss(activeNit!, periodEnd),
        staleTime: 5 * 60 * 1000,
        enabled: enabled && !!activeNit,
    });
}

export function useCashFlow(enabled = true, periodEnd?: string) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['reports', 'cashflow', activeNit, periodEnd],
        queryFn: () => reportApiClient.getCashFlow(activeNit!, periodEnd),
        staleTime: 5 * 60 * 1000,
        enabled: enabled && !!activeNit,
    });
}

export function useAvailablePeriods(enabled = true) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['reports', 'available-periods', activeNit],
        queryFn: () => reportApiClient.getAvailablePeriods(activeNit ?? undefined),
        staleTime: 60 * 1000,
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
export function useStatements(filter?: StatementsFilter, options?: { pollUntilDerived?: boolean }) {
    const { activeNit } = useCompany();
    const effectiveFilter = activeNit ? { company_nit: activeNit, ...filter } : null;
    return useQuery({
        queryKey: ['statements', effectiveFilter ?? {}],
        queryFn: () => reportApiClient.getStatements(effectiveFilter!),
        staleTime: 30 * 1000,
        enabled: !!activeNit && !!effectiveFilter,
        refetchInterval: (query) => {
            if (!options?.pollUntilDerived) return false;
            const data = query.state.data ?? [];
            const derivedCount = data.filter((s) => DERIVED_TYPES.has(s.statement_type)).length;
            return derivedCount >= 3 ? false : 2000;
        },
    });
}

export function useStatement(id: string | null) {
    return useQuery({
        queryKey: ['statement', id],
        queryFn: () => reportApiClient.getStatement(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

export function useInvalidateStatements() {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: ['statements'] });
}

// ---------------------------------------------------------------------------
// Vía A manual derivation (two-step: build first-level → derive secondary)
// ---------------------------------------------------------------------------

export function useDerivationStatusViaA(nit?: string | null) {
    return useQuery({
        queryKey: ['derivationStatusViaA', nit],
        queryFn: () => reportApiClient.getDerivationStatusViaA(nit!),
        enabled: !!nit,
        staleTime: 0,
    });
}

/** Invalidate everything that a Vía A derivation step can affect. */
function useInvalidateDerivationViaA() {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: ['derivationStatusViaA'] });
        queryClient.invalidateQueries({ queryKey: ['statements'] });
        queryClient.invalidateQueries({ queryKey: ['reports'] });
    };
}

export function useBuildFirstLevelViaA() {
    const invalidate = useInvalidateDerivationViaA();
    return useMutation({
        mutationFn: (args: {
            company_nit: string;
            period_start: string;
            period_end: string;
            period_type: ViaAPeriodType;
        }) =>
            reportApiClient.buildFirstLevelViaA(
                args.company_nit,
                args.period_start,
                args.period_end,
                args.period_type
            ),
        onSuccess: invalidate,
    });
}

export function useDeriveSecondaryViaA() {
    const invalidate = useInvalidateDerivationViaA();
    return useMutation({
        mutationFn: (args: { company_nit: string; period_start: string; period_end: string }) =>
            reportApiClient.deriveSecondaryViaA(
                args.company_nit,
                args.period_start,
                args.period_end
            ),
        onSuccess: invalidate,
    });
}
