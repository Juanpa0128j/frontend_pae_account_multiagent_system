const CURRENCY_TOLERANCE = 0.01;

export function validateColombianNit(nit: string): boolean {
  return /^\d{9,10}(-\d)?$/.test(nit.trim());
}

export function totalsEqualLineItems(declaredTotal: number, lineAmounts: number[]): boolean {
  const sum = lineAmounts.reduce((a, b) => a + b, 0);
  return Math.abs(sum - declaredTotal) <= CURRENCY_TOLERANCE;
}

export function taxMatchesBaseRate(base: number, rate: number, declaredTax: number): boolean {
  return Math.abs(base * rate - declaredTax) <= CURRENCY_TOLERANCE;
}

export function debitsEqualCredits(
  lines: Array<{ debit: string | number; credit: string | number }>,
): boolean {
  const d = lines.reduce((a, l) => a + Number(l.debit), 0);
  const c = lines.reduce((a, l) => a + Number(l.credit), 0);
  return Math.abs(d - c) <= CURRENCY_TOLERANCE;
}

export function balanceGeneralBalances(bg: {
  assets: number;
  liabilities: number;
  equity: number;
}): boolean {
  return Math.abs(bg.assets - (bg.liabilities + bg.equity)) <= CURRENCY_TOLERANCE;
}

export function estadoResultadosNetIncome(er: {
  revenue: number;
  expenses: number;
  net_income: number;
}): boolean {
  return Math.abs(er.revenue - er.expenses - er.net_income) <= CURRENCY_TOLERANCE;
}

export interface GoldenResult {
  ok: boolean;
  diffs: string[];
}

export function goldenEquals(
  golden: Record<string, unknown>,
  actual: Record<string, unknown>,
): GoldenResult {
  const diffs: string[] = [];
  for (const key of Object.keys(golden)) {
    const g = golden[key];
    const a = actual[key];
    if (typeof g === "number" && typeof a === "number") {
      if (Math.abs(g - a) > CURRENCY_TOLERANCE) diffs.push(`${key}: golden=${g} actual=${a}`);
    } else if (g !== a) {
      diffs.push(`${key}: golden=${JSON.stringify(g)} actual=${JSON.stringify(a)}`);
    }
  }
  return { ok: diffs.length === 0, diffs };
}
