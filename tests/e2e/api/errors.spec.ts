import { test, expect, request as pwRequest } from "@playwright/test";
import * as fs from "fs";
import { fixturesByDocType } from "../fixtures/catalog";
import { makeMalformedPdf } from "../fixtures/synthetic";
import { getPool, closePool } from "../db/client";
import { getTransactionsPending } from "../db/queries";
import { uploadIngest, pollIngest } from "../lib/api";

test.afterAll(async () => closePool());

test("error: wrong area B→A — API rejects Vía A doc_type with 422", async () => {
  test.setTimeout(60_000);
  const ctx = await pwRequest.newContext({ baseURL: process.env.BACKEND_URL });
  const groups = fixturesByDocType();
  const bg = groups["balance_general"]?.[0];
  test.skip(!bg, "no BG fixture");
  let threw = false;
  try {
    await uploadIngest(ctx, bg!.path, process.env.SANDBOX_NIT!, "factura_venta");
  } catch (e) {
    threw = true;
    expect(String(e)).toMatch(/422.*Vía A.*Vía B|doc_type.*Vía B/i);
  }
  expect(threw).toBe(true);
  await ctx.dispose();
});

test("error: wrong area A→B — Vía A image forced as balance_general", async () => {
  test.setTimeout(180_000);
  const ctx = await pwRequest.newContext({ baseURL: process.env.BACKEND_URL });
  const groups = fixturesByDocType();
  const viaA = groups["factura_venta"]?.[0];
  test.skip(!viaA, "no factura_venta fixture");
  const { ingest_id } = await uploadIngest(
    ctx,
    viaA!.path,
    process.env.SANDBOX_NIT!,
    "balance_general",
  );
  const detail = await pollIngest(ctx, ingest_id, 120_000);
  // Backend may: fail/pending_review (caught mismatch) OR complete (extraction tolerant).
  // If completed, no transactions_pending rows should be created (Vía B path doesn't use that table).
  expect(["failed", "pending_review", "completed"]).toContain(detail.status);
  if (detail.status === "completed") {
    const pool = getPool();
    const txs = await getTransactionsPending(pool, ingest_id);
    // Vía B pathway writes to financial_statements, not transactions_pending
    expect(txs.length).toBe(0);
  }
  await ctx.dispose();
});

test("error: malformed PDF", async () => {
  test.setTimeout(180_000);
  const ctx = await pwRequest.newContext({ baseURL: process.env.BACKEND_URL });
  const groups = fixturesByDocType();
  // Find any actual PDF (not jpg) to truncate
  const validPdf = Object.values(groups).flat().find((f) => f.ext === ".pdf");
  test.skip(!validPdf, "no PDF fixture available");
  const malformed = makeMalformedPdf(validPdf!.path);
  try {
    let uploadFailedAtBoundary = false;
    let detail;
    try {
      const { ingest_id } = await uploadIngest(ctx, malformed, process.env.SANDBOX_NIT!);
      detail = await pollIngest(ctx, ingest_id, 120_000);
    } catch (e) {
      uploadFailedAtBoundary = true;
    }
    // Either rejected at upload or pipeline completes with failed status / extraction_error
    if (!uploadFailedAtBoundary && detail) {
      expect(["failed", "pending_review"]).toContain(detail.status);
      // error_category may be null if pipeline failed before extraction stage
    } else {
      expect(uploadFailedAtBoundary).toBe(true);
    }
  } finally {
    fs.unlinkSync(malformed);
    await ctx.dispose();
  }
});

test("error: invalid file type (txt)", async () => {
  test.setTimeout(60_000);
  const ctx = await pwRequest.newContext({ baseURL: process.env.BACKEND_URL });
  const tmp = `/tmp/e2e_invalid_${Date.now()}.txt`;
  fs.writeFileSync(tmp, "not a real document");
  try {
    let threw = false;
    try {
      await uploadIngest(ctx, tmp, process.env.SANDBOX_NIT!);
    } catch (e) {
      threw = true;
      expect(String(e)).toMatch(/422|Unsupported|INVALID_FILE_TYPE/i);
    }
    expect(threw).toBe(true);
  } finally {
    fs.unlinkSync(tmp);
    await ctx.dispose();
  }
});

test("error: LLM failure via E2E_FORCE_LLM_FAIL", async () => {
  test.setTimeout(180_000);
  test.skip(
    process.env.E2E_FORCE_LLM_FAIL !== "1",
    "requires backend started with E2E_FORCE_LLM_FAIL=1",
  );
  const ctx = await pwRequest.newContext({ baseURL: process.env.BACKEND_URL });
  const groups = fixturesByDocType();
  const fx = Object.values(groups).flat().find((f) => f.via === "A")!;
  const { ingest_id } = await uploadIngest(ctx, fx.path, process.env.SANDBOX_NIT!);
  const detail = await pollIngest(ctx, ingest_id, 120_000);
  expect(detail.status).toBe("failed");
  expect(detail.error_category).toBeTruthy();
  await ctx.dispose();
});
