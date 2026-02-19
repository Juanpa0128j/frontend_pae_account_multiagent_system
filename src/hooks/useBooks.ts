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
    { fecha: '2026-02-14', documento: 'F-1041', concepto: 'Servicio de consultoría', cuenta_puc: '5110', nombre_cuenta: 'Honorarios', debito: 2689075, credito: 0, saldo: 2689075 },
    { fecha: '2026-02-14', documento: 'F-1041', concepto: 'IVA Consultoría', cuenta_puc: '2408', nombre_cuenta: 'IVA por pagar', debito: 0, credito: 510925, saldo: -510925 },
    { fecha: '2026-02-13', documento: 'F-1040', concepto: 'Compra insumos', cuenta_puc: '1430', nombre_cuenta: 'Materiales e insumos', debito: 630252, credito: 0, saldo: 630252 },
];

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
                return data as BookEntry[];
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
