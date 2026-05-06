import { Pool } from "pg";

export async function assertSandboxNit(pool: Pool): Promise<void> {
  const nit = process.env.SANDBOX_NIT;
  if (!nit) throw new Error("SANDBOX_NIT not set in env");
  const expectedName = process.env.E2E_TEST_TENANT;
  if (!expectedName) throw new Error("E2E_TEST_TENANT not set in env");

  const res = await pool.query<{ nombre: string }>(
    "SELECT nombre FROM company_settings WHERE nit = $1 LIMIT 1",
    [nit],
  );
  if (res.rowCount === 0) {
    throw new Error(`Sandbox NIT ${nit} not found in company_settings`);
  }
  if (res.rows[0].nombre !== expectedName) {
    throw new Error(
      `Sandbox NIT ${nit} tenant mismatch: expected "${expectedName}", got "${res.rows[0].nombre}"`,
    );
  }
}
