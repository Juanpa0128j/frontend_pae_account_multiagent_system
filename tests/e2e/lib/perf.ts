import * as fs from "fs";
import * as path from "path";

const OUT = path.join(__dirname, "..", "..", "..", "perf-results.json");

export interface Sample {
  group: string;
  fixture: string;
  ms: number;
}

export function recordSample(s: Sample): void {
  const existing: Sample[] = fs.existsSync(OUT)
    ? JSON.parse(fs.readFileSync(OUT, "utf8"))
    : [];
  existing.push(s);
  fs.writeFileSync(OUT, JSON.stringify(existing, null, 2));
}

export function p95(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, idx)];
}

export function readSamples(): Sample[] {
  return fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : [];
}
