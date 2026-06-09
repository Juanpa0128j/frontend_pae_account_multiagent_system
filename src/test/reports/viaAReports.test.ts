import { describe, it, expect } from 'vitest';
import { mapViaAPeriodReports, viaAPeriodOptions } from '@/lib/viaAReports';
import type { FinancialStatementResponse } from '@/types';

function stmt(
    overrides: Partial<FinancialStatementResponse> & {
        statement_type: FinancialStatementResponse['statement_type'];
    }
): FinancialStatementResponse {
    return {
        id: Math.random().toString(36).slice(2),
        ingest_id: 'ing',
        period_start: '2025-01-01T00:00:00+00:00',
        period_end: '2025-12-31T23:59:59+00:00',
        entity_nit: '35168',
        source_mode: 'derived_from_journal',
        frequency: 'annual',
        data: {},
        created_at: null,
        ...overrides,
    };
}

const FIXTURE: FinancialStatementResponse[] = [
    stmt({
        statement_type: 'balance_general',
        data: {
            total_activos: 1330000,
            total_pasivos: 1330000,
            total_patrimonio: 0,
            utilidad_neta: 0,
            cuadre: true,
        },
    }),
    stmt({
        statement_type: 'estado_resultados',
        data: {
            ingresos: [{ cuenta_puc: '4155', nombre: 'Arrendamientos', valor: 22624799 }],
            gastos: [{ cuenta_puc: '5105', nombre: 'Personal', valor: 2439282 }],
            costo_ventas: [],
            utilidad_neta: 20185517,
        },
    }),
    stmt({
        statement_type: 'flujo_de_caja',
        source_mode: 'derived',
        data: {
            efectivo_fin_periodo: 8330000,
            flujo_neto_operacion: 4165000,
            flujo_neto_inversion: 0,
            flujo_neto_financiacion: 0,
        },
    }),
    // A 2024 BG, to assert period options list both years.
    stmt({
        statement_type: 'balance_general',
        period_start: '2024-01-01T00:00:00+00:00',
        period_end: '2024-12-31T23:59:59+00:00',
        data: { total_activos: 665000, total_pasivos: 665000, total_patrimonio: 0 },
    }),
];

describe('viaAPeriodOptions', () => {
    it('lists distinct first-level BG periods, most recent first', () => {
        const opts = viaAPeriodOptions(FIXTURE);
        expect(opts.map((o) => o.period_end.slice(0, 10))).toEqual(['2025-12-31', '2024-12-31']);
    });

    it('ignores non-first-level / non-BG rows', () => {
        const opts = viaAPeriodOptions([
            stmt({ statement_type: 'flujo_de_caja', source_mode: 'derived' }),
        ]);
        expect(opts).toEqual([]);
    });
});

describe('mapViaAPeriodReports', () => {
    it('maps the BG totals into the balance sheet shape', () => {
        const { balData } = mapViaAPeriodReports(FIXTURE, '2025-12-31T23:59:59+00:00');
        expect(balData).not.toBeNull();
        expect(balData!.activos).toBe(1330000);
        expect(balData!.pasivos).toBe(1330000);
        expect(balData!.patrimonio_total).toBe(0);
        expect(balData!.utilidad_neta).toBe(0);
    });

    it('computes ER totals from the line arrays', () => {
        const { pnlData } = mapViaAPeriodReports(FIXTURE, '2025-12-31');
        expect(pnlData).not.toBeNull();
        expect(pnlData!.total_ingresos).toBe(22624799);
        expect(pnlData!.total_gastos).toBe(2439282);
        expect(pnlData!.utilidad_neta).toBe(20185517);
        expect(pnlData!.ingresos[0].nombre).toBe('Arrendamientos');
    });

    it('maps the derived flujo into activity-net line items', () => {
        const { cfData, cfHasData } = mapViaAPeriodReports(FIXTURE, '2025-12-31');
        expect(cfHasData).toBe(true);
        expect(cfData!.total_efectivo).toBe(8330000);
        const op = cfData!.cuentas_efectivo.find((c) => c.codigo === 'OP');
        expect(op!.saldo).toBe(4165000);
    });

    it('returns nulls when the period has no generated statements', () => {
        const res = mapViaAPeriodReports(FIXTURE, '2099-12-31');
        expect(res.balData).toBeNull();
        expect(res.pnlData).toBeNull();
        expect(res.cfData).toBeNull();
        expect(res.cfHasData).toBe(false);
    });

    it('returns empty result for null period', () => {
        const res = mapViaAPeriodReports(FIXTURE, null);
        expect(res.balData).toBeNull();
        expect(res.cfHasData).toBe(false);
    });
});
