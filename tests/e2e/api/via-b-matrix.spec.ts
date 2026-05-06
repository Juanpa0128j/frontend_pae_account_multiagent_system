import { test, expect, request as pwRequest } from "@playwright/test";
import { fixturesByDocType } from "../fixtures/catalog";
import { getPool, closePool } from "../db/client";
import { getFinancialStatements, getStatementLineage } from "../db/queries";
import { uploadIngest, pollIngest, getStatements } from "../lib/api";

const INPUTS = ["balance_general", "estado_resultados", "libro_auxiliar"] as const;
const DERIVED = ["flujo_de_caja", "cambios_patrimonio", "notas_estados_financieros"];

test.afterAll(async () => closePool());

test("@matrix Vía B API — three inputs trigger derivation", async () => {
  test.setTimeout(900_000);
  const groups = fixturesByDocType();
  const ctx = await pwRequest.newContext({ baseURL: process.env.BACKEND_URL });

  const uploaded: Array<{ type: string; ingest_id: string }> = [];
  for (const t of INPUTS) {
    const fx = groups[t]?.[0];
    if (!fx) {
      console.log(`skip ${t}: no fixture`);
      continue;
    }
    const { ingest_id } = await uploadIngest(ctx, fx.path, process.env.SANDBOX_NIT!, t);
    const detail = await pollIngest(ctx, ingest_id, 240_000);
    expect(["completed", "pending_review"]).toContain(detail.status);
    uploaded.push({ type: t, ingest_id });
  }
  expect(uploaded.length).toBeGreaterThan(0);

  const pool = getPool();
  const stmts = await getFinancialStatements(pool, process.env.SANDBOX_NIT!);
  for (const u of uploaded) {
    const matched = stmts.find(
      (s) => s.statement_type === u.type && s.source_mode === "direct",
    );
    expect(matched, `missing direct ${u.type} in financial_statements`).toBeTruthy();
  }

  // Auto-derivation only triggers when all 3 inputs exist
  if (uploaded.length === 3) {
    const start = Date.now();
    let derivedFound = 0;
    while (Date.now() - start < 240_000 && derivedFound < DERIVED.length) {
      const r = await getStatements(ctx, process.env.SANDBOX_NIT!);
      derivedFound = DERIVED.filter((d) =>
        r.statements.some((s) => s.type === d),
      ).length;
      if (derivedFound === DERIVED.length) break;
      await new Promise((res) => setTimeout(res, 3000));
    }
    expect(derivedFound).toBe(DERIVED.length);

    const lineage = await getStatementLineage(pool, process.env.SANDBOX_NIT!);
    expect(lineage.length).toBeGreaterThan(0);
  }

  await ctx.dispose();
});
