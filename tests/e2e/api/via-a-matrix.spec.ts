import { test, expect, request as pwRequest } from "@playwright/test";
import { fixturesByDocType } from "../fixtures/catalog";
import { getPool, closePool } from "../db/client";
import { getIngestJob, getTransactionsPending } from "../db/queries";
import { uploadIngest, pollIngest } from "../lib/api";
import { validateColombianNit } from "../lib/assertions";

test.afterAll(async () => closePool());

const groups = fixturesByDocType();
const VIA_B_TYPES = new Set([
  "balance_general",
  "estado_resultados",
  "libro_auxiliar",
  "libro_diario",
  "flujo_de_caja",
  "cambios_patrimonio",
  "notas_estados_financieros",
]);
const VIA_A_TYPES = Object.keys(groups).filter(
  (t) => !VIA_B_TYPES.has(t) && t !== "unknown",
);

for (const docType of VIA_A_TYPES) {
  test(`@matrix Vía A API — ${docType}`, async () => {
    test.setTimeout(300_000);
    const fixture = groups[docType][0];
    const ctx = await pwRequest.newContext({ baseURL: process.env.BACKEND_URL });
    const { ingest_id } = await uploadIngest(
      ctx,
      fixture.path,
      process.env.SANDBOX_NIT!,
    );
    expect(ingest_id).toMatch(/^ing_\d+_[0-9a-f]+$/);

    const detail = await pollIngest(ctx, ingest_id, 240_000);
    expect(["completed", "pending_review", "failed"]).toContain(detail.status);

    const pool = getPool();
    const job = await getIngestJob(pool, ingest_id);
    expect(job).not.toBeNull();
    expect(job!.company_nit).toBe(process.env.SANDBOX_NIT);

    if (detail.status === "completed") {
      const txs = await getTransactionsPending(pool, ingest_id);
      expect(txs.length).toBeGreaterThan(0);
      // Soft business-rule check: NIT format if present
      const first = txs[0];
      if (first.nit_emisor) {
        expect(validateColombianNit(first.nit_emisor)).toBe(true);
      }
    }

    await ctx.dispose();
  });
}
