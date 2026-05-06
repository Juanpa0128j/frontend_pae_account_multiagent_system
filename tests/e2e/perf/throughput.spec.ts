import { test, expect, request as pwRequest } from "@playwright/test";
import { fixturesByDocType } from "../fixtures/catalog";
import { uploadIngest, pollIngest } from "../lib/api";
import { recordSample, readSamples, p95 } from "../lib/perf";

const SINGLE_BASELINE_MS = 90_000;
const THROUGHPUT_P95_BUDGET_MS = SINGLE_BASELINE_MS * 1.5;
const CONCURRENCY = 3;

test("@perf throughput — concurrent Vía A uploads", async () => {
  test.setTimeout(900_000);
  const all = Object.values(fixturesByDocType())
    .flat()
    .filter((f) => f.via === "A")
    .slice(0, CONCURRENCY);
  expect(all.length).toBe(CONCURRENCY);

  const ctx = await pwRequest.newContext({ baseURL: process.env.BACKEND_URL });
  const runs = await Promise.all(
    all.map(async (fx) => {
      const start = Date.now();
      const { ingest_id } = await uploadIngest(ctx, fx.path, process.env.SANDBOX_NIT!);
      const detail = await pollIngest(ctx, ingest_id, THROUGHPUT_P95_BUDGET_MS);
      const ms = Date.now() - start;
      recordSample({ group: `throughput_concurrent${CONCURRENCY}`, fixture: fx.filename, ms });
      return { fx, detail, ms };
    }),
  );

  for (const r of runs) {
    expect(["completed", "pending_review"]).toContain(r.detail.status);
  }
  const value = p95(runs.map((r) => r.ms));
  expect(
    value,
    `concurrent p95 = ${value}ms exceeds ${THROUGHPUT_P95_BUDGET_MS}ms`,
  ).toBeLessThanOrEqual(THROUGHPUT_P95_BUDGET_MS);

  expect(
    readSamples().some((s) => s.group === `throughput_concurrent${CONCURRENCY}`),
  ).toBe(true);

  await ctx.dispose();
});
