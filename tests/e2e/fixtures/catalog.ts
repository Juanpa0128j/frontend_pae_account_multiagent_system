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
  const rawName = path.basename(filePath).toLowerCase();
  const rawDir = path.basename(path.dirname(filePath)).toLowerCase();
  // Normalize: replace whitespace and hyphens with underscores so "balance general" matches "balance_general"
  const norm = (s: string): string => s.replace(/[\s\-]+/g, "_");
  const candidates = [norm(rawDir), norm(rawName)];

  // Map common abbreviations / aliases to canonical doc types
  const aliasMap: Array<{ pattern: RegExp; type: string }> = [
    { pattern: /balance_general|^bg_|_bg_/, type: "balance_general" },
    { pattern: /estado_resultados|^er_|_er_|estado_de_resultados/, type: "estado_resultados" },
    { pattern: /libro_auxiliar|^la_|_la_/, type: "libro_auxiliar" },
    { pattern: /libro_diario|^ld_|_ld_/, type: "libro_diario" },
    { pattern: /flujo_de_caja|flujo_caja/, type: "flujo_de_caja" },
    { pattern: /cambios_patrimonio|cambios_en_el_patrimonio/, type: "cambios_patrimonio" },
    { pattern: /notas_estados_financieros|notas_a_los_estados_financieros|^nef_/, type: "notas_estados_financieros" },
    { pattern: /factura_venta|^fv_|_fv_|fact_venta/, type: "factura_venta" },
    { pattern: /factura_compra|^fra_|_fra_|fra_|fact_compra/, type: "factura_compra" },
    { pattern: /documento_soporte|^ds_|_ds_|ds_/, type: "documento_soporte" },
    { pattern: /cuenta_cobro|^cc_|_cc_|cc_/, type: "cuenta_cobro" },
    { pattern: /conciliacion_bancaria|conciliacion/, type: "conciliacion_bancaria" },
    { pattern: /pago_alianza_fidu|pago_alianza/, type: "comprobante_egreso" },
    { pattern: /recibo_de_pago_impuesto|recibo_pago_impuesto/, type: "recibo_pago_impuesto" },
    { pattern: /extracto_bancario|^eb_|_eb_|extracto/, type: "extracto_bancario" },
    { pattern: /declaracion_iva|decl_iva/, type: "declaracion_iva" },
    { pattern: /declaracion_reteica|decl_reteica/, type: "declaracion_reteica" },
    { pattern: /declaracion_ica|decl_ica/, type: "declaracion_ica" },
    { pattern: /nota_credito|nc_/, type: "nota_credito" },
    { pattern: /nota_debito|nd_/, type: "nota_debito" },
    { pattern: /planilla|pago_cesantias|cesantias|nomina/, type: "nomina" },
    { pattern: /comprobante_egreso|^ce_|_ce_/, type: "comprobante_egreso" },
    { pattern: /comprobante_ingreso|^ci_|_ci_/, type: "comprobante_ingreso" },
    { pattern: /recibo_caja|^rc_|_rc_/, type: "recibo_caja" },
  ];

  for (const candidate of candidates) {
    for (const { pattern, type } of aliasMap) {
      if (pattern.test(candidate)) return type;
    }
  }
  return "unknown";
}
