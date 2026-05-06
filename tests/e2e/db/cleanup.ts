import { Pool, PoolClient } from "pg";
import * as fs from "fs";
import * as path from "path";

const TABLES_IN_ORDER: string[] = [
  "journal_entry_line",
  "transaction_posted",
  "transaction_pending",
  "financial_statement_lineage",
  "financial_statements",
  "ingest_jobs",
];

export async function cleanupSandbox(pool: Pool): Promise<void> {
  const nit = process.env.SANDBOX_NIT;
  if (!nit) throw new Error("SANDBOX_NIT not set; refusing to clean up");

  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const table of TABLES_IN_ORDER) {
      await client.query(`DELETE FROM ${table} WHERE company_nit = $1`, [nit]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const uploadsDir = "/tmp/pae_uploads";
  if (fs.existsSync(uploadsDir)) {
    for (const f of fs.readdirSync(uploadsDir)) {
      const p = path.join(uploadsDir, f);
      try {
        if (fs.statSync(p).mtimeMs > Date.now() - 24 * 3600 * 1000) {
          fs.unlinkSync(p);
        }
      } catch {
        /* ignore */
      }
    }
  }
}
