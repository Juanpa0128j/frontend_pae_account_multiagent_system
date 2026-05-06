import { Pool, PoolClient } from "pg";
import * as fs from "fs";
import * as path from "path";

export async function cleanupSandbox(pool: Pool): Promise<void> {
  const nit = process.env.SANDBOX_NIT;
  if (!nit) throw new Error("SANDBOX_NIT not set; refusing to clean up");

  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. journal_entry_lines (tagged with company_nit directly)
    await client.query("DELETE FROM journal_entry_lines WHERE company_nit = $1", [nit]);

    // 2. transactions_posted
    await client.query("DELETE FROM transactions_posted WHERE company_nit = $1", [nit]);

    // 3. transactions_pending
    await client.query("DELETE FROM transactions_pending WHERE company_nit = $1", [nit]);

    // 4. financial_statement_lineage — delete rows whose target/source belongs to entity
    await client.query(
      `DELETE FROM financial_statement_lineage WHERE target_statement_id IN (
         SELECT id FROM financial_statements WHERE entity_nit = $1
       ) OR source_statement_id IN (
         SELECT id FROM financial_statements WHERE entity_nit = $1
       )`,
      [nit],
    );

    // 5. financial_statements (uses entity_nit)
    await client.query("DELETE FROM financial_statements WHERE entity_nit = $1", [nit]);

    // 6. ingest_jobs (must be after children that link via ingest_id)
    await client.query("DELETE FROM ingest_jobs WHERE company_nit = $1", [nit]);

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
