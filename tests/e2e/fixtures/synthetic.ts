import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const TMP = path.join(os.tmpdir(), "pae_e2e_synthetic");
fs.mkdirSync(TMP, { recursive: true });

export function makeMalformedPdf(sourcePdf: string): string {
  const buf = fs.readFileSync(sourcePdf);
  const truncated = buf.subarray(0, 1024);
  const out = path.join(TMP, `malformed_${Date.now()}.pdf`);
  fs.writeFileSync(out, truncated);
  return out;
}

export function makeOversizedPdf(sourcePdf: string): string {
  const buf = fs.readFileSync(sourcePdf);
  const padding = Buffer.alloc(21 * 1024 * 1024 - buf.length, 0);
  const out = path.join(TMP, `oversized_${Date.now()}.pdf`);
  fs.writeFileSync(out, Buffer.concat([buf, padding]));
  return out;
}

export function makeWrongAreaCopy(sourcePath: string): string {
  const buf = fs.readFileSync(sourcePath);
  const out = path.join(TMP, `wrongarea_${Date.now()}_${path.basename(sourcePath)}`);
  fs.writeFileSync(out, buf);
  return out;
}
