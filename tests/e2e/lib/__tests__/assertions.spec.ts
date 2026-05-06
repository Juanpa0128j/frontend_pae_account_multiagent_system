import { test, expect } from "@playwright/test";
import {
  validateColombianNit,
  totalsEqualLineItems,
  taxMatchesBaseRate,
  debitsEqualCredits,
  balanceGeneralBalances,
  estadoResultadosNetIncome,
  goldenEquals,
} from "../assertions";

test.describe("assertions", () => {
  test("Colombian NIT regex accepts 9-10 digit", () => {
    expect(validateColombianNit("900123456")).toBe(true);
    expect(validateColombianNit("900123456-7")).toBe(true);
    expect(validateColombianNit("abc")).toBe(false);
  });

  test("totalsEqualLineItems within tolerance", () => {
    expect(totalsEqualLineItems(100.0, [40.0, 60.0])).toBe(true);
    expect(totalsEqualLineItems(100.005, [40.0, 60.0])).toBe(true);
    expect(totalsEqualLineItems(110, [40, 60])).toBe(false);
  });

  test("taxMatchesBaseRate within tolerance", () => {
    expect(taxMatchesBaseRate(100, 0.19, 19)).toBe(true);
    expect(taxMatchesBaseRate(100, 0.19, 19.001)).toBe(true);
    expect(taxMatchesBaseRate(100, 0.19, 25)).toBe(false);
  });

  test("debitsEqualCredits", () => {
    expect(debitsEqualCredits([{ debit: "100", credit: "0" }, { debit: "0", credit: "100" }])).toBe(true);
    expect(debitsEqualCredits([{ debit: "100", credit: "0" }, { debit: "0", credit: "50" }])).toBe(false);
  });

  test("balanceGeneralBalances", () => {
    expect(balanceGeneralBalances({ assets: 1000, liabilities: 600, equity: 400 })).toBe(true);
    expect(balanceGeneralBalances({ assets: 1000, liabilities: 600, equity: 300 })).toBe(false);
  });

  test("estadoResultadosNetIncome", () => {
    expect(estadoResultadosNetIncome({ revenue: 1000, expenses: 700, net_income: 300 })).toBe(true);
    expect(estadoResultadosNetIncome({ revenue: 1000, expenses: 700, net_income: 200 })).toBe(false);
  });

  test("goldenEquals strict on NIT/totals/dates with currency tolerance", () => {
    const golden = { nit: "900123456", total: 100.0, date: "2026-01-15", lines: 3, line_sum: 100.0 };
    const actual = { nit: "900123456", total: 100.005, date: "2026-01-15", lines: 3, line_sum: 100.0 };
    expect(goldenEquals(golden, actual).ok).toBe(true);
    const wrongDate = { ...actual, date: "2026-02-01" };
    expect(goldenEquals(golden, wrongDate).ok).toBe(false);
  });
});
