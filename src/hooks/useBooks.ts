'use client';

import { useQuery } from '@tanstack/react-query';
import { getBooks } from '@/lib/api';
import type { BookFilter, BookEntry } from '@/types';

// ---------------------------------------------------------------------------
// Fallback mock entries used when backend is unreachable
// ---------------------------------------------------------------------------
const MOCK_ENTRIES: BookEntry[] = [
    { fecha: '2026-02-15', documento: 'F-1042', concepto: 'Factura Proveedor XYZ', cuenta_puc: '5195', nombre_cuenta: 'Gastos diversos', debito: 1260504, credito: 0, saldo: 1260504 },
    { fecha: '2026-02-15', documento: 'F-1042', concepto: 'IVA Proveedor XYZ', cuenta_puc: '2408', nombre_cuenta: 'IVA por pagar', debito: 0, credito: 239496, saldo: -239496 },
    { fecha: '2026-02-14', documento: 'F-1041', concepto: 'Servicio de consultoria', cuenta_puc: '5110', nombre_cuenta: 'Honorarios', debito: 2689075, credito: 0, saldo: 2689075 },
    { fecha: '2026-02-14', documento: 'F-1041', concepto: 'IVA Consultoria', cuenta_puc: '2408', nombre_cuenta: 'IVA por pagar', debito: 0, credito: 510925, saldo: -510925 },
    { fecha: '2026-02-13', documento: 'F-1040', concepto: 'Compra insumos', cuenta_puc: '1430', nombre_cuenta: 'Materiales e insumos', debito: 630252, credito: 0, saldo: 630252 },
];

function toNumber(value: unknown): number {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

function normalizeBookRow(row: Record<string, any>, filter: BookFilter): BookEntry {
    const debito = toNumber(row.debito ?? row.total_debitos ?? 0);
    const credito = toNumber(row.credito ?? row.total_creditos ?? 0);
    const saldo =
        row.saldo !== undefined
            ? toNumber(row.saldo)
            : row.saldo_final !== undefined
                ? toNumber(row.saldo_final)
                : debito - credito;

    const cuenta = String(row.cuenta_puc ?? row.cuenta ?? filter.cuenta_puc ?? '');
    const nombreCuenta = String(row.cuenta_nombre ?? '');
    const descripcion = String(row.descripcion ?? row.cuenta_nombre ?? '');

    if (filter.tipo === 'mayor') {
        return {
            fecha: '',
            documento: 'MAYOR',
            concepto: descripcion || 'Movimiento acumulado por cuenta',
            cuenta_puc: cuenta,
            nombre_cuenta: nombreCuenta,
            debito,
            credito,
            saldo,
        };
    }

    if (filter.tipo === 'balance') {
        return {
            fecha: '',
            documento: 'BALANCE',
            concepto: descripcion || 'Balance por cuenta',
            cuenta_puc: cuenta,
            nombre_cuenta: nombreCuenta,
            debito,
            credito,
            saldo,
        };
    }

    return {
        fecha: String(row.fecha ?? ''),
        documento: String(row.comprobante ?? row.documento ?? ''),
        concepto: descripcion,
        cuenta_puc: cuenta,
        nombre_cuenta: nombreCuenta,
        debito,
        credito,
        saldo,
        tercero_nit: row.tercero_nit ? String(row.tercero_nit) : undefined,
    };
}

function normalizeBooksResponse(data: any, filter: BookFilter): BookEntry[] {
    if (data && typeof data === 'object' && !Array.isArray(data) && typeof data.error === 'string') {
        throw new Error(data.error);
    }

    if (!Array.isArray(data)) {
        return [];
    }

    return data.map((row) => normalizeBookRow((row || {}) as Record<string, any>, filter));
}

// ---------------------------------------------------------------------------
// useBooks — Fetch accounting book entries with optional filters
// ---------------------------------------------------------------------------
export function useBooks(filter: BookFilter) {
    return useQuery<BookEntry[]>({
        queryKey: ['books', filter],
        queryFn: async () => {
            try {
                const data = await getBooks({
                    tipo: filter.tipo,
                    fecha_inicio: filter.fecha_inicio,
                    fecha_fin: filter.fecha_fin,
                    cuenta_puc: filter.cuenta_puc,
                    tercero_nit: filter.tercero_nit,
                });
                return normalizeBooksResponse(data, filter);
            } catch {
                // Backend unavailable — return mock data filtered client-side
                let entries = MOCK_ENTRIES;
                if (filter.cuenta_puc) {
                    entries = entries.filter((e) => e.cuenta_puc.startsWith(filter.cuenta_puc!));
                }
                if (filter.tercero_nit) {
                    entries = entries.filter((e) => e.tercero_nit?.includes(filter.tercero_nit!));
                }
                return entries;
            }
        },
        staleTime: 60 * 1000,
    });
}
