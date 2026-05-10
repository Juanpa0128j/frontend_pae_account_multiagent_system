'use client';

import { useQuery } from '@tanstack/react-query';
import { reportApiClient } from '@/lib/api/clients';
import type { BookFilter, BookEntry } from '@/types';
import { useCompany } from '@/context/CompanyContext';

function toNumber(value: unknown): number {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

function normalizeBookRow(row: Record<string, any>, filter: BookFilter): BookEntry {
    const debito = toNumber(row.debito ?? row.debit ?? row.total_debitos ?? row.total_debit ?? 0);
    const credito = toNumber(
        row.credito ?? row.credit ?? row.total_creditos ?? row.total_credit ?? 0
    );
    const saldo =
        row.saldo !== undefined
            ? toNumber(row.saldo)
            : row.balance !== undefined
              ? toNumber(row.balance)
              : row.net_balance !== undefined
                ? toNumber(row.net_balance)
                : row.saldo_final !== undefined
                  ? toNumber(row.saldo_final)
                  : debito - credito;

    const cuenta = String(row.cuenta_puc ?? row.cuenta ?? row.account ?? filter.cuenta_puc ?? '');
    const nombreCuenta = String(row.cuenta_nombre ?? row.nombre_cuenta ?? row.name ?? '');
    const descripcion = String(row.descripcion ?? row.cuenta_nombre ?? row.name ?? '');

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
    if (
        data &&
        typeof data === 'object' &&
        !Array.isArray(data) &&
        typeof data.error === 'string'
    ) {
        throw new Error(data.error);
    }

    if (!Array.isArray(data)) {
        return [];
    }

    return data.map((row) => normalizeBookRow((row || {}) as Record<string, any>, filter));
}

// ---------------------------------------------------------------------------
// useBooks — Fetch accounting book entries with optional filters
// Only enabled when a company is selected
// ---------------------------------------------------------------------------
export function useBooks(filter: BookFilter) {
    const { activeNit } = useCompany();
    return useQuery<BookEntry[]>({
        queryKey: ['books', filter, activeNit],
        queryFn: async ({ signal }) => {
            try {
                const data = await reportApiClient.getBooks({
                    tipo: filter.tipo,
                    fecha_inicio: filter.fecha_inicio,
                    fecha_fin: filter.fecha_fin,
                    cuenta_puc: filter.cuenta_puc,
                    tercero_nit: filter.tercero_nit,
                    company_nit: activeNit!,
                    signal,
                });
                return normalizeBooksResponse(data, filter);
            } catch {
                // Backend unavailable — return empty array
                return [];
            }
        },
        staleTime: 120 * 1000,
        enabled: !!activeNit,
    });
}
