import { test, expect } from "@playwright/test";
import { getPool, closePool } from "../client";
import { cleanupSandbox } from "../cleanup";

test.describe("scoped cleanup", () => {
  test.afterAll(async () => closePool());

  test("removes only rows tagged with SANDBOX_NIT", async () => {
    const pool = getPool();
    const nit = process.env.SANDBOX_NIT!;
    await pool.query(
      "INSERT INTO ingest_jobs (id, company_nit, status, created_at) VALUES (gen_random_uuid(), $1, 'COMPLETED', NOW())",
      [nit],
    );
    const before = await pool.query(
      "SELECT count(*)::int AS c FROM ingest_jobs WHERE company_nit = $1",
      [nit],
    );
    expect(before.rows[0].c).toBeGreaterThan(0);

    await cleanupSandbox(pool);

    const after = await pool.query(
      "SELECT count(*)::int AS c FROM ingest_jobs WHERE company_nit = $1",
      [nit],
    );
    expect(after.rows[0].c).toBe(0);
  });

  test("refuses to run without SANDBOX_NIT", async () => {
    const orig = process.env.SANDBOX_NIT;
    delete process.env.SANDBOX_NIT;
    await expect(cleanupSandbox(getPool())).rejects.toThrow(/SANDBOX_NIT/);
    process.env.SANDBOX_NIT = orig;
  });
});
