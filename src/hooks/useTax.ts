'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxApiClient, reportApiClient } from '@/lib/api/clients';
import type {
    TaxFormType,
    UpdateFieldRequest,
    UvtValue,
    BaseMinima,
    CreatePerdidaRequest,
    CreateTarifaRequest,
    ReteicaTarifaUpsertRequest,
    TaxConceptUpsertRequest,
    GenerateDraftRequest,
    NationalRate,
    NationalRateUpdateRequest,
    EffectiveRate,
    CompanyRateOverrideRequest,
    AjusteFiscal,
    AjusteFiscalUpsertRequest,
    AjusteSeccion,
} from '@/types';
import { useCompany } from '@/context/CompanyContext';

// ============================================================================
// Existing Hooks
// ============================================================================

interface UsePeriodParams {
    periodStart?: string;
    periodEnd?: string;
}

interface UseIVAParams extends UsePeriodParams {
    enabled?: boolean;
}

export function useIVA({ enabled = true, periodStart, periodEnd }: UseIVAParams = {}) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['tax', 'iva', activeNit, periodStart, periodEnd],
        queryFn: () => reportApiClient.getIVA(activeNit!, periodStart, periodEnd),
        staleTime: 5 * 60 * 1000,
        enabled: enabled && !!activeNit,
    });
}

interface UseWithholdingsParams extends UsePeriodParams {
    enabled?: boolean;
}

export function useWithholdings({
    enabled = true,
    periodStart,
    periodEnd,
}: UseWithholdingsParams = {}) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['tax', 'withholdings', activeNit, periodStart, periodEnd],
        queryFn: () => reportApiClient.getWithholdings(activeNit!, periodStart, periodEnd),
        staleTime: 5 * 60 * 1000,
        enabled: enabled && !!activeNit,
    });
}

interface UseICAParams extends UsePeriodParams {
    companyNitFallback: string;
}

export function useICA({ companyNitFallback, periodStart, periodEnd }: UseICAParams) {
    const { activeNit } = useCompany();
    const nit = activeNit ?? companyNitFallback;
    return useQuery({
        queryKey: ['tax', 'ica', nit, periodStart, periodEnd],
        queryFn: () => reportApiClient.getICA(nit, periodStart, periodEnd),
        enabled: !!nit,
        staleTime: 5 * 60 * 1000,
    });
}

interface UseRentaProvisionParams extends UsePeriodParams {
    companyNitFallback: string;
}

export function useRentaProvision({
    companyNitFallback,
    periodStart,
    periodEnd,
}: UseRentaProvisionParams) {
    const { activeNit } = useCompany();
    const nit = activeNit ?? companyNitFallback;
    return useQuery({
        queryKey: ['tax', 'renta-provision', nit, periodStart, periodEnd],
        queryFn: () => reportApiClient.getRentaProvision(nit, periodStart, periodEnd),
        enabled: !!nit,
        staleTime: 5 * 60 * 1000,
    });
}

// ============================================================================
// Declaration Preflight
// ============================================================================

interface UseDeclarationPreflightParams {
    companyNit?: string;
    formType?: TaxFormType;
    periodStart?: string;
    periodEnd?: string;
}

export function useDeclarationPreflight({
    companyNit,
    formType,
    periodStart,
    periodEnd,
}: UseDeclarationPreflightParams) {
    const enabled = !!companyNit && !!formType && !!periodStart && !!periodEnd;
    return useQuery({
        queryKey: ['tax', 'preflight', companyNit, formType, periodStart, periodEnd],
        queryFn: () =>
            taxApiClient.getDeclarationPreflight({
                companyNit: companyNit!,
                formType: formType!,
                periodStart: periodStart!,
                periodEnd: periodEnd!,
            }),
        enabled,
        staleTime: 30 * 1000,
    });
}

// ============================================================================
// New Hooks - Declaration Drafts
// ============================================================================

export function useGenerateDeclarationDraft() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: GenerateDraftRequest) =>
            taxApiClient.generateDeclarationDraft(payload),
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
        mutationFn: (data: UpdateFieldRequest) => taxApiClient.updateDraftField(draftId!, data),
        onSuccess: (updatedDraft) => {
            // Update the draft cache with new data
            queryClient.setQueryData(['tax', 'draft', draftId], updatedDraft);
        },
    });
}

export function useReviewDraft() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (draftId: string) => taxApiClient.reviewDraft(draftId),
        onSuccess: (updatedDraft) => {
            queryClient.setQueryData(['tax', 'draft', updatedDraft.draft_id], updatedDraft);
            queryClient.invalidateQueries({ queryKey: ['tax', 'draft', updatedDraft.draft_id] });
        },
    });
}

export function useFileDraft() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            draftId,
            dian_acknowledgment,
        }: {
            draftId: string;
            dian_acknowledgment?: string;
        }) => taxApiClient.fileDraft(draftId, dian_acknowledgment),
        onSuccess: (updatedDraft) => {
            queryClient.setQueryData(['tax', 'draft', updatedDraft.draft_id], updatedDraft);
            queryClient.invalidateQueries({ queryKey: ['tax', 'draft', updatedDraft.draft_id] });
        },
    });
}

export function useReopenDraft() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ draftId, reason }: { draftId: string; reason: string }) =>
            taxApiClient.reopenDraft(draftId, reason),
        onSuccess: (updatedDraft) => {
            queryClient.setQueryData(['tax', 'draft', updatedDraft.draft_id], updatedDraft);
            queryClient.invalidateQueries({ queryKey: ['tax', 'draft', updatedDraft.draft_id] });
        },
    });
}

// ============================================================================
// New Hooks - Tax Calendar
// ============================================================================

export function useTaxCalendar(
    year?: number,
    ivaRegime?: 'bimestral' | 'cuatrimestral',
    icaPeriodicidad?: 'anual' | 'bimestral'
) {
    const { activeNit } = useCompany();

    return useQuery({
        queryKey: ['tax', 'calendar', activeNit, year, ivaRegime, icaPeriodicidad],
        queryFn: () => taxApiClient.getTaxCalendar(activeNit!, year, ivaRegime, icaPeriodicidad),
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
        queryFn: () => taxApiClient.generateF220Certificates(activeNit!, year),
        enabled: !!activeNit && year > 0,
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}

// ============================================================================
// New Hooks - Exogena
// ============================================================================

export function useExogenaFormat(
    formato: '1001' | '1007' | '1008' | '1009' | '2276',
    year: number
) {
    const { activeNit } = useCompany();

    return useQuery({
        queryKey: ['tax', 'exogena', formato, activeNit, year],
        queryFn: () => taxApiClient.getExogenaFormat(formato, activeNit!, year),
        enabled: !!activeNit && year > 0,
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}

// ============================================================================
// Tax Constants — UVT + Base Mínima
// ============================================================================

export function useTaxConstants(year: number) {
    return useQuery({
        queryKey: ['tax', 'constants', year],
        queryFn: () => taxApiClient.getTaxConstants(year),
        staleTime: 60 * 60 * 1000, // 1 hour
        enabled: year >= 2000,
        retry: false,
    });
}

export function useUpsertUvt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UvtValue) => taxApiClient.upsertUvt(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tax', 'constants', variables.year] });
        },
    });
}

export function useUpsertBaseMinima() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: BaseMinima) => taxApiClient.upsertBaseMinima(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tax', 'constants', variables.year] });
        },
    });
}

// ============================================================================
// Pérdidas Fiscales Acumuladas (Art. 147 ET)
// ============================================================================

export function usePerdidasAcumuladas(year?: number) {
    const { activeNit } = useCompany();

    return useQuery({
        queryKey: ['tax', 'perdidas', activeNit, year],
        queryFn: () => reportApiClient.getPerdidasAcumuladas(activeNit!, year),
        staleTime: 5 * 60 * 1000,
        enabled: !!activeNit,
    });
}

export function useUpsertPerdida() {
    const queryClient = useQueryClient();
    const { activeNit } = useCompany();

    return useMutation({
        mutationFn: (payload: CreatePerdidaRequest) =>
            reportApiClient.createOrUpdatePerdida(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tax', 'perdidas', activeNit] });
        },
    });
}

export function useDeletePerdida() {
    const queryClient = useQueryClient();
    const { activeNit } = useCompany();

    return useMutation({
        mutationFn: (id: number) => reportApiClient.deletePerdida(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tax', 'perdidas', activeNit] });
        },
    });
}

// ============================================================================
// Tarifas de Renta (Regulatorias)
// ============================================================================

export function useTarifasRenta(optionsOrYear?: number | { company_nit?: string; year?: number }) {
    const { activeNit } = useCompany();

    // Backward compat: support year as number or options object
    const options =
        typeof optionsOrYear === 'number' ? { year: optionsOrYear } : optionsOrYear || {};
    const finalOptions = {
        ...options,
        company_nit: options.company_nit || (activeNit ?? undefined),
    };

    return useQuery({
        queryKey: ['tax', 'tarifas-renta', finalOptions],
        queryFn: () => taxApiClient.getTarifasRenta(finalOptions),
        staleTime: 60 * 60 * 1000, // 1 hour — regulatory data changes rarely
        enabled:
            !!finalOptions.company_nit &&
            (finalOptions.year === undefined || finalOptions.year > 0),
    });
}

export function useUpsertTarifa() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateTarifaRequest) => taxApiClient.createOrUpdateTarifa(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tax', 'tarifas-renta'] });
        },
    });
}

export function useDeleteTarifa() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => taxApiClient.deleteTarifa(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tax', 'tarifas-renta'] });
        },
    });
}

// ── ReteicaTarifa hooks ────────────────────────────────────────────────────

export function useReteicaTarifas(municipio?: string) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['reteicaTarifas', activeNit, municipio ?? 'all'],
        queryFn: () => taxApiClient.listReteicaTarifas(activeNit!, municipio),
        enabled: !!activeNit,
        retry: false,
    });
}

export function useUpsertReteicaTarifa() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: ReteicaTarifaUpsertRequest) =>
            taxApiClient.upsertReteicaTarifa(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['reteicaTarifas'] }),
    });
}

export function useDeleteReteicaTarifa() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => taxApiClient.deleteReteicaTarifa(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['reteicaTarifas'] }),
    });
}

// ── TaxConcept hooks ───────────────────────────────────────────────────────

export function useTaxConcepts(activo?: boolean) {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['taxConcepts', activeNit, activo],
        queryFn: () => taxApiClient.listTaxConcepts(activeNit!, activo),
        enabled: !!activeNit,
        retry: false,
    });
}

export function useUpsertTaxConcept() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: TaxConceptUpsertRequest) => taxApiClient.upsertTaxConcept(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['taxConcepts'] }),
    });
}

export function useSoftDeleteTaxConcept() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (code: string) => taxApiClient.softDeleteTaxConcept(code),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['taxConcepts'] }),
    });
}

// ── NationalRate hooks ─────────────────────────────────────────────────────

export function useNationalRates() {
    return useQuery({
        queryKey: ['nationalRates'],
        queryFn: () => taxApiClient.getNationalRates(),
        retry: false,
    });
}

export function useUpsertNationalRate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ code, payload }: { code: string; payload: NationalRateUpdateRequest }) =>
            taxApiClient.upsertNationalRate(code, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['nationalRates'] }),
    });
}

// ── Per-Company Effective Rates ────────────────────────────────────────────

export function useEffectiveRates() {
    const { activeNit } = useCompany();
    return useQuery({
        queryKey: ['effectiveRates', activeNit],
        queryFn: () => taxApiClient.getEffectiveRates(activeNit!),
        enabled: !!activeNit,
        retry: false,
    });
}

export function useUpsertCompanyRateOverride() {
    const { activeNit } = useCompany();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ code, payload }: { code: string; payload: CompanyRateOverrideRequest }) =>
            taxApiClient.upsertCompanyRateOverride(activeNit!, code, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['effectiveRates', activeNit] }),
    });
}

// ── AjustesFiscales hooks ──────────────────────────────────────────────────

export function useAjustesFiscales(
    companyNit: string | null,
    year: number,
    seccion?: AjusteSeccion
) {
    return useQuery<AjusteFiscal[], Error>({
        queryKey: ['ajustes_fiscales', companyNit, year, seccion],
        queryFn: () => taxApiClient.listAjustesFiscales(companyNit!, year, seccion),
        enabled: !!companyNit,
    });
}

export function useUpsertAjusteFiscal() {
    const queryClient = useQueryClient();
    return useMutation<AjusteFiscal, Error, AjusteFiscalUpsertRequest>({
        mutationFn: (req) => taxApiClient.upsertAjusteFiscal(req),
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['ajustes_fiscales', data.company_nit, data.year],
            });
        },
    });
}

export function useDeleteAjusteFiscal() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, { id: string; company_nit: string; year: number }>({
        mutationFn: ({ id }) => taxApiClient.deleteAjusteFiscal(id),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['ajustes_fiscales', variables.company_nit, variables.year],
            });
        },
    });
}
