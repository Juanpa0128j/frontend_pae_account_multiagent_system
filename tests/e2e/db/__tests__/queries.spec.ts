import { test, expect } from "@playwright/test";
import { getPool, closePool } from "../client";
import {
  getIngestJob,
  getTransactionsPending,
  getJournalEntryLines,
  getJournalEntryLinesByNit,
  getTransactionsPostedByNit,
  getFinancialStatements,
  getStatementLineage,
} from "../queries";

test.describe("DB read queries", () => {
  test.afterAll(async () => closePool());

  test("getIngestJob returns null for unknown id", async () => {
    const job = await getIngestJob(getPool(), "00000000-0000-0000-0000-000000000000");
    expect(job).toBeNull();
  });

  test("getTransactionsPending returns array", async () => {
    const rows = await getTransactionsPending(getPool(), "00000000-0000-0000-0000-000000000000");
    expect(Array.isArray(rows)).toBe(true);
  });

  test("getFinancialStatements filters by NIT", async () => {
    const rows = await getFinancialStatements(getPool(), process.env.SANDBOX_NIT!);
    expect(Array.isArray(rows)).toBe(true);
  });

  test("getStatementLineage returns array", async () => {
    const rows = await getStatementLineage(getPool(), process.env.SANDBOX_NIT!);
    expect(Array.isArray(rows)).toBe(true);
  });

  test("getJournalEntryLines returns array", async () => {
    const rows = await getJournalEntryLines(getPool(), "00000000-0000-0000-0000-000000000000");
    expect(Array.isArray(rows)).toBe(true);
  });

  test("getJournalEntryLinesByNit returns array", async () => {
    const rows = await getJournalEntryLinesByNit(getPool(), process.env.SANDBOX_NIT!);
    expect(Array.isArray(rows)).toBe(true);
  });

  test("getTransactionsPostedByNit returns array", async () => {
    const rows = await getTransactionsPostedByNit(getPool(), process.env.SANDBOX_NIT!);
    expect(Array.isArray(rows)).toBe(true);
  });
});
