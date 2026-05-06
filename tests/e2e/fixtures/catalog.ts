import * as fs from "fs";
import * as path from "path";

export const FIXTURES_DIR =
  "/home/juan/backend_pae_account_multiagent_system/ejemplos_docs_ingesta";

const VIA_B_TYPES = new Set([
  "balance_general",
  "estado_resultados",
  "libro_auxiliar",
  "libro_diario",
  "flujo_de_caja",
  "cambios_patrimonio",
  "notas_estados_financieros",
]);

export interface Fixture {
  path: string;
  filename: string;
  docType: string;
  via: "A" | "B";
  sizeBytes: number;
  ext: string;
}

export function catalogFixtures(): Fixture[] {
  const out: Fixture[] = [];
  walk(FIXTURES_DIR, (p) => {
    const stat = fs.statSync(p);
    if (!stat.isFile()) return;
    if (stat.size > 20 * 1024 * 1024) return;
    const ext = path.extname(p).toLowerCase();
    if (![".pdf", ".xls", ".xlsx", ".xml", ".jpg", ".jpeg", ".png"].includes(ext)) return;
    const docType = inferDocType(p);
    const via: "A" | "B" = VIA_B_TYPES.has(docType) ? "B" : "A";
    out.push({
      path: p,
      filename: path.basename(p),
      docType,
      via,
      sizeBytes: stat.size,
      ext,
    });
  });
  return out;
}

export function fixturesByDocType(): Record<string, Fixture[]> {
  const groups: Record<string, Fixture[]> = {};
  for (const f of catalogFixtures()) {
    (groups[f.docType] ||= []).push(f);
  }
  return groups;
}

function walk(dir: string, fn: (p: string) => void): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, fn);
    else fn(p);
  }
}

function inferDocType(filePath: string): string {
  const name = path.basename(filePath).toLowerCase();
  const dir = path.basename(path.dirname(filePath)).toLowerCase();
  for (const candidate of [dir, name]) {
    for (const t of [
      "balance_general",
      "estado_resultados",
      "libro_auxiliar",
      "libro_diario",
      "flujo_de_caja",
      "cambios_patrimonio",
      "notas_estados_financieros",
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
    ]) {
      if (candidate.includes(t)) return t;
    }
  }
  return "unknown";
}
