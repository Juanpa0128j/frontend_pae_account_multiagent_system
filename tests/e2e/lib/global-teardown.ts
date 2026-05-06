import { getPool, closePool } from "../db/client";
import { cleanupSandbox } from "../db/cleanup";

export default async function globalTeardown(): Promise<void> {
  if (process.env.E2E_SKIP_GLOBAL_SETUP === "1") return;
  const pool = getPool();
  try {
    await cleanupSandbox(pool);
  } finally {
    await closePool();
  }
}
