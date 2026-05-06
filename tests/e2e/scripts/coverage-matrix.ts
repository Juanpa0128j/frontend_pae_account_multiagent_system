import * as fs from "fs";
import * as path from "path";
import { fixturesByDocType } from "../fixtures/catalog";

interface PlaywrightJsonReport {
  suites: Array<{
    title: string;
    specs: Array<{
      title: string;
      tests: Array<{ status: string }>;
    }>;
    suites?: PlaywrightJsonReport["suites"];
  }>;
}

const reportPath = path.join(__dirname, "..", "..", "..", "test-results", "results.json");
const outPath = path.join(__dirname, "..", "..", "..", "coverage-matrix.md");

function flatSpecs(report: PlaywrightJsonReport): Array<{ title: string; status: string }> {
  const out: Array<{ title: string; status: string }> = [];
  function walk(suites: PlaywrightJsonReport["suites"]): void {
    for (const s of suites) {
      for (const spec of s.specs) {
        const status = spec.tests.every((t) => t.status === "passed")
          ? "passed"
          : spec.tests.some((t) => t.status === "failed")
            ? "failed"
            : "skipped";
        out.push({ title: spec.title, status });
      }
      if (s.suites) walk(s.suites);
    }
  }
  walk(report.suites);
  return out;
}

function main(): void {
  const groups = fixturesByDocType();
  const report: PlaywrightJsonReport = fs.existsSync(reportPath)
    ? JSON.parse(fs.readFileSync(reportPath, "utf8"))
    : { suites: [] };
  const specs = flatSpecs(report);

  const lines: string[] = [
    "# E2E Coverage Matrix",
    "",
    "| doc_type | via | fixture present | matrix test status |",
    "|---|---|---|---|",
  ];
  const ALL = [
    "factura_venta",
    "factura_compra",
    "extracto_bancario",
    "declaracion_iva",
    "declaracion_reteica",
    "declaracion_ica",
    "nota_credito",
    "nota_debito",
    "nomina",
    "comprobante_egreso",
    "comprobante_ingreso",
    "recibo_caja",
    "balance_general",
    "estado_resultados",
    "libro_auxiliar",
    "libro_diario",
    "flujo_de_caja",
    "cambios_patrimonio",
    "notas_estados_financieros",
  ];
  for (const t of ALL) {
    const has = !!groups[t]?.length;
    const via = ["balance_general", "estado_resultados", "libro_auxiliar", "libro_diario", "flujo_de_caja", "cambios_patrimonio", "notas_estados_financieros"].includes(t)
      ? "B"
      : "A";
    const matched = specs.find((s) => s.title.includes(t));
    lines.push(
      `| ${t} | ${via} | ${has ? "✓" : "—"} | ${matched ? matched.status : "no test"} |`,
    );
  }
  fs.writeFileSync(outPath, lines.join("\n") + "\n");
  console.log(`wrote ${outPath}`);
}

main();
