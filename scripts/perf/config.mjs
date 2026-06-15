// Shared config for the page-load benchmark.
// All tunables come from ENV so the tool stays reusable and secret-free.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PERF_DIR = __dirname;
export const RESULTS_DIR = path.join(__dirname, 'results');
export const STORAGE_STATE_PATH = path.join(__dirname, '.auth', 'storageState.json');

// Base URL of the running frontend (the user starts the server themselves).
export const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// Iterations per page. First iteration is treated as a cold warm-up and reported
// separately (not folded into the median) unless DISCARD_COLD=false.
export const ITERATIONS = Number(process.env.ITERATIONS ?? 5);
export const DISCARD_COLD = process.env.DISCARD_COLD !== 'false';

// Run label, e.g. "before" / "after". Names the output file results/<label>.json.
export const LABEL = process.env.LABEL ?? process.env.PERF_LABEL ?? 'run';

// Per-navigation network-idle / settle timeout (ms).
export const NAV_TIMEOUT = Number(process.env.NAV_TIMEOUT ?? 60000);
// Extra settle time after networkidle to let LCP/long-tasks flush (ms).
export const SETTLE_MS = Number(process.env.SETTLE_MS ?? 1500);

// Pages to benchmark. Override with PERF_PAGES="/,/transactions,/reports".
// Defaults are the heavy authenticated pages confirmed in the app.
const DEFAULT_PAGES = ['/', '/transactions', '/reports', '/chat', '/upload'];
export const PAGES = (process.env.PERF_PAGES
    ? process.env.PERF_PAGES.split(',')
    : DEFAULT_PAGES
)
    .map((p) => p.trim())
    .filter(Boolean);

// Company NIT to seed into localStorage so CompanyGate lets pages render data.
// Without this, protected pages render an empty "Selecciona una empresa" gate.
export const ACTIVE_NIT = process.env.ACTIVE_NIT ?? '';

// localStorage keys the app reads for the active company. CompanyContext reads
// `pae_active_nit` on mount; companies/page also writes `activeNit`. Seed both.
export const COMPANY_STORAGE_KEYS = ['pae_active_nit', 'activeNit'];
