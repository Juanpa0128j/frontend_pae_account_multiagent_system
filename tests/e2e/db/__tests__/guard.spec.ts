import { test, expect } from "@playwright/test";
import { assertSandboxNit } from "../guard";
import { getPool, closePool } from "../client";

test.describe("sandbox NIT guard", () => {
  test.afterAll(async () => closePool());

  test("throws when SANDBOX_NIT not set", async () => {
    const orig = process.env.SANDBOX_NIT;
    delete process.env.SANDBOX_NIT;
    await expect(assertSandboxNit(getPool())).rejects.toThrow(/SANDBOX_NIT/);
    process.env.SANDBOX_NIT = orig;
  });

  test("throws when company name does not match E2E_TEST_TENANT", async () => {
    const orig = process.env.E2E_TEST_TENANT;
    process.env.E2E_TEST_TENANT = "WRONG_TENANT_NAME_FOR_TEST_ONLY";
    await expect(assertSandboxNit(getPool())).rejects.toThrow(/tenant mismatch/i);
    process.env.E2E_TEST_TENANT = orig;
  });

  test("passes when SANDBOX_NIT row exists with matching name", async () => {
    await expect(assertSandboxNit(getPool())).resolves.toBeUndefined();
  });
});
