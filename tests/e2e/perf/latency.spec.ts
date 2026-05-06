import { test, expect, request as pwRequest } from "@playwright/test";
import { fixturesByDocType, Fixture } from "../fixtures/catalog";
import { uploadIngest, pollIngest } from "../lib/api";
import { recordSample, readSamples, p95, Sample } from "../lib/perf";

const THRESHOLDS_MS = {
  via_a_pdf_ingest: 90_000,
  via_a_xlsx_xml_ingest: 30_000,
  via_a_image_ingest: 90_000,
  via_b_pdf_ingest: 120_000,
} as const;

type Group = keyof typeof THRESHOLDS_MS;

function classify(fx: Fixture): Group {
  if (fx.via === "B") return "via_b_pdf_ingest";
  if ([".xlsx", ".xls", ".xml"].includes(fx.ext)) return "via_a_xlsx_xml_ingest";
  if ([".jpg", ".jpeg", ".png"].includes(fx.ext)) return "via_a_image_ingest";
  return "via_a_pdf_ingest";
}

const groups = fixturesByDocType();
const RUNS = 1;

test.describe("@perf latency", () => {
  for (const [docType, fixtures] of Object.entries(groups)) {
    if (docType === "unknown") continue;
    const fx = fixtures[0];
    const group = classify(fx);

    test(`@perf latency — ${docType} (${group})`, async () => {
      test.setTimeout(THRESHOLDS_MS[group] * 2);
      const ctx = await pwRequest.newContext({ baseURL: process.env.BACKEND_URL });
      for (let i = 0; i < RUNS; i++) {
        const start = Date.now();
        const { ingest_id } = await uploadIngest(
          ctx,
          fx.path,
          process.env.SANDBOX_NIT!,
          ["balance_general", "estado_resultados", "libro_auxiliar"].includes(docType)
            ? docType
            : undefined,
        );
        await pollIngest(ctx, ingest_id, THRESHOLDS_MS[group]);
        const ms = Date.now() - start;
        recordSample({ group, fixture: fx.filename, ms });
      }
      await ctx.dispose();
    });
  }

  test("@perf p95 thresholds", () => {
    const samples = readSamples();
    for (const group of Object.keys(THRESHOLDS_MS) as Group[]) {
      const groupSamples = samples
        .filter((s: Sample) => s.group === group)
        .map((s) => s.ms);
      if (groupSamples.length === 0) continue;
      const value = p95(groupSamples);
      expect(
        value,
        `p95 for ${group} = ${value}ms exceeds ${THRESHOLDS_MS[group]}ms`,
      ).toBeLessThanOrEqual(THRESHOLDS_MS[group]);
    }
  });
});
