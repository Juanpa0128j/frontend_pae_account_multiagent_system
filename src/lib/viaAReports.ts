/**
 * Vía A reports — period-scoped mappers.
 *
 * For Vía A companies the /reports page must reflect the GENERATED statements of
 * a chosen period (the same `derived_from_journal` rows listed below), not the
 * live cumulative-to-today figures. These pure helpers map a list of
 * FinancialStatementResponse into the BalanceSheet / ProfitAndLoss / CashFlow
 * shapes the page already renders, scoped to one period_end.
 */
import type {
    BalanceSheet,
    CashFlow,
    FinancialStatementResponse,
    ProfitAndLoss,
    ReportLineItem,
} from '@/types';

const FIRST_LEVEL_MODE = 'derived_from_journal';
const DERIVED_MODE = 'derived';

function num(v: unknown): number {
    const n = typeof v === 'string' ? Number(v) : (v as number);
    return Number.isFinite(n) ? n : 0;
}

function dayKey(iso: string | null | undefined): string {
    return (iso ?? '').slice(0, 10);
}

/** Distinct first-level periods (annual or otherwise), most recent first. */
export interface ViaAPeriodOption {
    period_start: string | null;
    period_end: string;
    frequency?: 'annual' | 'monthly' | null;
}

export function viaAPeriodOptions(
    statements: FinancialStatementResponse[] | undefined
): ViaAPeriodOption[] {
    if (!statements) return [];
    const byEnd = new Map<string, ViaAPeriodOption>();
    for (const s of statements) {
        if (s.source_mode !== FIRST_LEVEL_MODE) continue;
        if (s.statement_type !== 'balance_general') continue;
        const key = dayKey(s.period_end);
        if (!key) continue;
        if (!byEnd.has(key)) {
            byEnd.set(key, {
                period_start: s.period_start,
                period_end: s.period_end,
                frequency: s.frequency ?? null,
            });
        }
    }
    return Array.from(byEnd.values()).sort((a, b) =>
        dayKey(b.period_end).localeCompare(dayKey(a.period_end))
    );
}

function lineItems(raw: unknown): ReportLineItem[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((it) => {
        const o = (it ?? {}) as Record<string, unknown>;
        return {
            codigo: String(o.cuenta_puc ?? o.codigo ?? ''),
            nombre: String(o.nombre ?? o.cuenta_nombre ?? ''),
            saldo: num(o.valor ?? o.saldo),
        };
    });
}

function sum(items: ReportLineItem[]): number {
    return items.reduce((acc, it) => acc + it.saldo, 0);
}

function findStmt(
    statements: FinancialStatementResponse[],
    type: string,
    periodEnd: string,
    sourceMode: string
): FinancialStatementResponse | undefined {
    return statements.find(
        (s) =>
            s.statement_type === type &&
            s.source_mode === sourceMode &&
            dayKey(s.period_end) === dayKey(periodEnd)
    );
}

export interface ViaAPeriodReports {
    balData: BalanceSheet | null;
    pnlData: ProfitAndLoss | null;
    cfData: CashFlow | null;
    /** Flujo de caja (NIC 7) derived for the period. */
    cfHasData: boolean;
}

/**
 * Map the generated statements of one period into the report shapes the page
 * renders. Missing statements yield null (card shows "// SIN DATOS").
 */
export function mapViaAPeriodReports(
    statements: FinancialStatementResponse[] | undefined,
    periodEnd: string | null
): ViaAPeriodReports {
    const empty: ViaAPeriodReports = {
        balData: null,
        pnlData: null,
        cfData: null,
        cfHasData: false,
    };
    if (!statements || !periodEnd) return empty;

    const bg = findStmt(statements, 'balance_general', periodEnd, FIRST_LEVEL_MODE);
    const er = findStmt(statements, 'estado_resultados', periodEnd, FIRST_LEVEL_MODE);
    const flujo = findStmt(statements, 'flujo_de_caja', periodEnd, DERIVED_MODE);

    let balData: BalanceSheet | null = null;
    if (bg) {
        const d = bg.data as Record<string, unknown>;
        const patrimonio = num(d.total_patrimonio);
        balData = {
            period_start: bg.period_start,
            period_end: bg.period_end,
            company_nit: bg.entity_nit,
            activos: num(d.total_activos),
            pasivos: num(d.total_pasivos),
            patrimonio,
            utilidad_neta: num(d.utilidad_neta),
            patrimonio_total: patrimonio,
            cuadre: Boolean(d.cuadre ?? true),
        };
    }

    let pnlData: ProfitAndLoss | null = null;
    if (er) {
        const d = er.data as Record<string, unknown>;
        const ingresos = lineItems(d.ingresos);
        const costo = lineItems(d.costo_ventas);
        const gastos = lineItems(d.gastos);
        const totalIng = sum(ingresos);
        const totalCosto = sum(costo);
        pnlData = {
            period_start: er.period_start,
            period_end: er.period_end,
            company_nit: er.entity_nit,
            ingresos,
            costo_ventas: costo,
            gastos,
            total_ingresos: totalIng,
            total_costo_ventas: totalCosto,
            total_gastos: sum(gastos),
            utilidad_bruta: num(d.utilidad_bruta ?? totalIng - totalCosto),
            utilidad_neta: num(d.utilidad_neta),
        };
    }

    let cfData: CashFlow | null = null;
    if (flujo) {
        const d = flujo.data as Record<string, unknown>;
        // The NIC 7 statement exposes net flows by activity rather than cash
        // accounts; surface those as the chart line items so the card mirrors
        // the derived flujo statement shown below.
        const cuentas: ReportLineItem[] = [
            { codigo: 'OP', nombre: 'Operación', saldo: num(d.flujo_neto_operacion) },
            { codigo: 'INV', nombre: 'Inversión', saldo: num(d.flujo_neto_inversion) },
            {
                codigo: 'FIN',
                nombre: 'Financiación',
                saldo: num(d.flujo_neto_financiacion),
            },
        ];
        cfData = {
            period_start: flujo.period_start,
            period_end: flujo.period_end,
            company_nit: flujo.entity_nit,
            cuentas_efectivo: cuentas,
            total_efectivo: num(d.efectivo_fin_periodo),
        };
    }

    return { balData, pnlData, cfData, cfHasData: Boolean(flujo) };
}
