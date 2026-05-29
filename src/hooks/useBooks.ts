'use client';

import { useQuery } from '@tanstack/react-query';
import { reportApiClient } from '@/lib/api/clients';
import type { BookFilter, BookEntry, FinancialStatementResponse } from '@/types';
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

function normalizeBalanceStatements(statements: FinancialStatementResponse[]): BookEntry[] {
    return statements.flatMap((stmt) => {
        const data = stmt.data as Record<string, any>;
        const periodLabel = `${stmt.period_start?.split('T')[0] ?? '—'} → ${stmt.period_end?.split('T')[0] ?? '—'}`;
        const fecha = stmt.period_end?.split('T')[0] ?? '';
        const totalActivos = toNumber(data.total_activos ?? data.activos ?? 0);
        const totalPasivos = toNumber(data.total_pasivos ?? data.pasivos ?? 0);
        const totalPatrimonio = toNumber(
            data.total_patrimonio ?? data.patrimonio_total ?? data.patrimonio ?? 0
        );

        return [
            {
                fecha,
                documento: 'BALANCE GENERAL',
                concepto: `Activos - ${periodLabel}`,
                cuenta_puc: '1',
                nombre_cuenta: 'Activos',
                debito: 0,
                credito: 0,
                saldo: totalActivos,
            },
            {
                fecha,
                documento: 'BALANCE GENERAL',
                concepto: `Pasivos - ${periodLabel}`,
                cuenta_puc: '2',
                nombre_cuenta: 'Pasivos',
                debito: 0,
                credito: 0,
                saldo: totalPasivos,
            },
            {
                fecha,
                documento: 'BALANCE GENERAL',
                concepto: `Patrimonio - ${periodLabel}`,
                cuenta_puc: '3',
                nombre_cuenta: 'Patrimonio',
                debito: 0,
                credito: 0,
                saldo: totalPatrimonio,
            },
        ];
    });
}

function normalizeAuxiliaryStatements(
    statements: FinancialStatementResponse[],
    filter: BookFilter
): BookEntry[] {
    return statements.flatMap((stmt) => {
        const data = stmt.data as Record<string, any>;
        const periodLabel = `${stmt.period_start?.split('T')[0] ?? '—'} → ${stmt.period_end?.split('T')[0] ?? '—'}`;
        const fecha = stmt.period_end?.split('T')[0] ?? '';
        const accounts = Array.isArray(data.accounts)
            ? data.accounts
            : Array.isArray(data.lines)
              ? data.lines
              : [];

        return accounts
            .map((account: Record<string, any>) => {
                const cuentaPuc = String(
                    account.cuenta_puc ??
                        account.codigo ??
                        account.account ??
                        filter.cuenta_puc ??
                        ''
                );
                const nombreCuenta = String(
                    account.cuenta_nombre ?? account.nombre_cuenta ?? account.name ?? ''
                );
                const debito = toNumber(
                    account.total_debit ?? account.debito ?? account.debit ?? 0
                );
                const credito = toNumber(
                    account.total_credit ?? account.credito ?? account.credit ?? 0
                );
                const saldo = toNumber(
                    account.net_balance ??
                        account.saldo ??
                        account.balance ??
                        account.saldo_final ??
                        debito - credito
                );

                return {
                    fecha,
                    documento: 'LIBRO AUXILIAR',
                    concepto: `${nombreCuenta || cuentaPuc} - ${periodLabel}`,
                    cuenta_puc: cuentaPuc,
                    nombre_cuenta: nombreCuenta || cuentaPuc,
                    debito,
                    credito,
                    saldo,
                    tercero_nit: stmt.entity_nit ?? undefined,
                } satisfies BookEntry;
            })
            .filter((row) => {
                if (!filter.cuenta_puc) return true;
                return row.cuenta_puc.startsWith(filter.cuenta_puc);
            });
    });
}

// ---------------------------------------------------------------------------
// useBooks — Fetch accounting book entries with optional filters
// Only enabled when a company is selected
// ---------------------------------------------------------------------------
export function useBooks(filter: BookFilter, options?: { enabled?: boolean }) {
    const { activeNit } = useCompany();
    const enabled = !!activeNit && options?.enabled !== false;
    return useQuery<BookEntry[]>({
        queryKey: ['books', filter, activeNit],
        queryFn: async ({ signal }) => {
            try {
                if (filter.tipo === 'balance') {
                    try {
                        const statements = await reportApiClient.getStatements(
                            {
                                company_nit: activeNit!,
                                statement_type: 'balance_general',
                                start_date: filter.fecha_inicio,
                                end_date: filter.fecha_fin,
                            },
                            { signal }
                        );
                        const storedRows = normalizeBalanceStatements(statements);
                        if (storedRows.length > 0) {
                            return storedRows;
                        }
                        // Empty stored statements — fall through to getBooks for derived rows
                    } catch {
                        // Statements endpoint unavailable — fall through to getBooks
                    }
                }

                if (filter.tipo === 'auxiliar') {
                    try {
                        const statements = await reportApiClient.getStatements(
                            {
                                company_nit: activeNit!,
                                statement_type: 'libro_auxiliar',
                                start_date: filter.fecha_inicio,
                                end_date: filter.fecha_fin,
                            },
                            { signal }
                        );
                        const storedRows = normalizeAuxiliaryStatements(statements, filter);
                        if (storedRows.length > 0) {
                            return storedRows;
                        }
                    } catch {
                        // Statements endpoint unavailable — fall through to getBooks
                    }
                }

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
        enabled,
    });
}
