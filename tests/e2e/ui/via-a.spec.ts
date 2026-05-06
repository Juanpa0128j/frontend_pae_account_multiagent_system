import { test, expect } from "@playwright/test";
import { fixturesByDocType } from "../fixtures/catalog";
import { getPool, closePool } from "../db/client";
import { getIngestJob, getTransactionsPending } from "../db/queries";

test.afterAll(async () => closePool());

test("Vía A UI happy path — factura_venta upload via DropZone", async ({ page }) => {
  test.setTimeout(300_000);
  const fx = fixturesByDocType()["factura_venta"]?.[0];
  test.skip(!fx, "no factura_venta fixture");

  await page.goto("/upload");
  // Default mode is via-a. Drop file into DropZone.
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(fx!.path);

  // Wait for ingest-id testid to appear with non-empty value
  const ingestIdLocator = page.locator('[data-testid="ingest-id"]').first();
  await expect(ingestIdLocator).toBeAttached({ timeout: 180_000 });
  const ingestId = (await ingestIdLocator.textContent({ timeout: 10_000 }))?.trim();
  expect(ingestId).toMatch(/^ing_\d+_[0-9a-f]+$/);

  // Verify DB row
  const pool = getPool();
  const job = await getIngestJob(pool, ingestId!);
  expect(job).not.toBeNull();
  expect(job!.company_nit).toBe(process.env.SANDBOX_NIT);

  // If completed, transactions_pending row should exist
  if (job!.status === "completed" || job!.status === "COMPLETED") {
    const txs = await getTransactionsPending(pool, ingestId!);
    expect(txs.length).toBeGreaterThan(0);
  }
});
