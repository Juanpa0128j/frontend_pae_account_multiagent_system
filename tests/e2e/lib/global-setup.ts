import { FullConfig } from "@playwright/test";
import { getPool, closePool } from "../db/client";
import { assertSandboxNit } from "../db/guard";
import { cleanupSandbox } from "../db/cleanup";

export default async function globalSetup(_config: FullConfig): Promise<void> {
  if (process.env.E2E_SKIP_GLOBAL_SETUP === "1") return;
  const pool = getPool();
  await assertSandboxNit(pool);
  await cleanupSandbox(pool);
  await closePool();
}
