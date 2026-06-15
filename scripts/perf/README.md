# Frontend Page-Load Benchmark

Measures **real browser** page-load metrics on the key authenticated pages, tags
each run with a label, and diffs two runs (before vs after) so you get end-to-end
proof that perf work actually reduced frontend load time.

Uses Playwright + headless Chromium. It drives the app exactly like a user:
log in once, save the session, then load each page in a fresh (cold-cache) context.

> You run the dev/prod server yourself. These scripts only point a browser at a
> URL you provide via `BASE_URL`. Nothing here starts a server.

## What it measures (per page)

| Metric        | Source                                                          |
| ------------- | -------------------------------------------------------------- |
| TTFB          | Navigation Timing `responseStart - requestStart`              |
| FCP           | Paint Timing `first-contentful-paint`                          |
| LCP           | `PerformanceObserver('largest-contentful-paint')`, settled    |
| DCL           | `domContentLoadedEventEnd`                                     |
| Load          | `loadEventEnd`                                                 |
| TTI~ (idle)   | wall-clock time to Playwright `networkidle`                    |
| TBT~          | sum of `longtask` durations over 50ms (TBT proxy)             |
| LongTasks     | total long-task time on main thread                           |
| Total bytes   | sum of resource `transferSize` + document                     |
| JS bytes      | sum of `transferSize` for script resources                    |

Reported as **median** and **p75** across iterations. The first (cold) iteration
is captured separately and excluded from the aggregates by default
(`DISCARD_COLD=false` to include it).

## Files

- `login.mjs` — one-time login, saves Playwright `storageState` (cookies + seeded company).
- `loadbench.mjs` — runs the benchmark, writes `results/<label>.json`, prints a table.
- `compare.mjs` — diffs two result JSONs.
- `config.mjs` / `collect.mjs` / `stats.mjs` — shared config, in-browser collectors, math.
- `results/` — output JSON (git-ignored).
- `.auth/storageState.json` — saved session (git-ignored — contains auth cookies).

## One-time setup

```bash
# Already added as a devDependency. If your install is stale:
pnpm install

# Download the Chromium binary (requires network — run this yourself):
pnpm exec playwright install chromium
```

## Required / optional env vars

| Var               | Required | Example                          | Purpose                                            |
| ----------------- | -------- | -------------------------------- | -------------------------------------------------- |
| `BASE_URL`        | yes      | `http://localhost:3000`          | URL of the running frontend                         |
| `PERF_EMAIL`      | yes\*    | `you@example.com`                | Login email (\*needed only by `login.mjs`)         |
| `PERF_PASSWORD`   | yes\*    | `••••••`                         | Login password (\*needed only by `login.mjs`)      |
| `ACTIVE_NIT`      | strongly recommended | `800999888-10`       | Company NIT seeded into localStorage so pages render data instead of the empty company gate |
| `ITERATIONS`      | no       | `5`                              | Samples per page (default 5)                        |
| `DISCARD_COLD`    | no       | `true`                           | Exclude first iteration from aggregates (default true) |
| `PERF_PAGES`      | no       | `/,/transactions,/reports`       | Comma list of paths (default heavy authed pages)   |
| `LABEL`           | no       | `after`                          | Output file name `results/<label>.json`            |
| `NAV_TIMEOUT`     | no       | `60000`                          | Per-navigation timeout (ms)                         |
| `SETTLE_MS`       | no       | `1500`                           | Extra wait after networkidle to flush LCP (ms)     |

**Never commit secrets.** Credentials are read from ENV only; the saved session
and results are git-ignored. Put creds in your shell env or an untracked
`.env.perf` you `source` — do not hardcode them.

The Supabase auth env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
is consumed by the **running app**, not by these scripts — make sure `.env.local`
is set wherever you start the server.

## How auth works here

The app uses Supabase auth via `@supabase/ssr`, which stores the session in
**cookies** (`sb-<ref>-auth-token`). `middleware.ts` redirects any unauthenticated
request to `/login`. So the benchmark cannot just hit `/transactions` — it would
land on the login page.

`login.mjs` performs a real login through the `/login` form (auth-ui-react), waits
for the middleware to redirect off `/login` (the signal the session is set), seeds
the active-company NIT into `localStorage`, then saves Playwright `storageState`
(both the auth cookies and localStorage). `loadbench.mjs` reuses that state in a
fresh context per iteration, so every page loads fully authenticated with a
company selected — real data, not a gate.

`CompanyContext` reads the active company from `localStorage['pae_active_nit']` on
mount; without it `CompanyGate` blocks every page except `/settings` and
`/companies`. That's why `ACTIVE_NIT` matters — set it to a NIT your user belongs to.

## Run it

```bash
# 1. Start your frontend yourself (e.g. pnpm dev), confirm it's reachable at BASE_URL.

# 2. One-time login -> saves the session.
BASE_URL=http://localhost:3000 \
PERF_EMAIL=you@example.com PERF_PASSWORD='secret' \
ACTIVE_NIT=800999888-10 \
node scripts/perf/login.mjs

# 3. Benchmark. Label the run.
BASE_URL=http://localhost:3000 ACTIVE_NIT=800999888-10 \
node scripts/perf/loadbench.mjs --label before
```

## Before / after workflow

The point is to prove a perf change helped. Two ways to get a "before":

**Option A — two deploys/branches (recommended).** Point `BASE_URL` at the OLD
build, capture `before`; point at the NEW build, capture `after`.

```bash
# pre-perf build running at :3000
BASE_URL=http://localhost:3000 ACTIVE_NIT=800999888-10 node scripts/perf/loadbench.mjs --label before

# post-perf build running at :3001 (or after you redeploy on :3000)
BASE_URL=http://localhost:3001 ACTIVE_NIT=800999888-10 node scripts/perf/loadbench.mjs --label after
```

**Option B — same URL, git checkout between runs.** Capture `before`, check out
the pre-perf commit, rebuild/restart the server, re-run. Then return to the perf
branch, rebuild, and capture `after`. (Re-run `login.mjs` if the server restart
invalidated the session.)

> Always benchmark a production build (`pnpm build && pnpm start`) for both runs —
> `next dev` numbers are dominated by on-demand compilation and aren't comparable.

Then diff:

```bash
node scripts/perf/compare.mjs before after
```

`compare.mjs` prints a per-page, per-metric table with absolute and % delta and
flags each as `better` / `WORSE` / `flat` (>=2% threshold). Every metric is
lower-is-better, so a negative delta is an improvement.
