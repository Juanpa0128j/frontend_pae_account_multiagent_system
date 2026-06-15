// Frontend page-load benchmark.
//
// For each configured page, runs N iterations (default 5). Each iteration uses a
// FRESH browser context loaded from the saved storageState (cookies + seeded
// company), so caches don't leak between samples. Captures real-browser metrics
// (Navigation Timing, FCP, LCP, long-task TBT proxy, transfer sizes, network-idle
// TTI). Reports median + p75 per page, marks the cold (first) iteration separately,
// writes results/<label>.json, and prints a readable table.
//
// Run:  LABEL=after node scripts/perf/loadbench.mjs --label after
// Env:  BASE_URL, ITERATIONS, PERF_PAGES, ACTIVE_NIT, LABEL, NAV_TIMEOUT, SETTLE_MS
// Auth: requires scripts/perf/.auth/storageState.json (run login.mjs first).

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import {
    BASE_URL,
    PAGES,
    ITERATIONS,
    DISCARD_COLD,
    LABEL,
    RESULTS_DIR,
    STORAGE_STATE_PATH,
    NAV_TIMEOUT,
    SETTLE_MS,
    ACTIVE_NIT,
    COMPANY_STORAGE_KEYS,
} from './config.mjs';
import { installPerfObservers, readPerfMetrics, METRICS } from './collect.mjs';
import { median, percentile, round } from './stats.mjs';

function parseArgLabel() {
    const idx = process.argv.indexOf('--label');
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
    return LABEL;
}

function ensureStorageState() {
    if (!fs.existsSync(STORAGE_STATE_PATH)) {
        console.error(`No storageState at ${STORAGE_STATE_PATH}.`);
        console.error('Run the one-time login first:  node scripts/perf/login.mjs');
        process.exit(1);
    }
}

async function measurePage(browser, pagePath) {
    const url = `${BASE_URL}${pagePath}`;
    const samples = [];

    for (let i = 0; i < ITERATIONS; i++) {
        // Fresh context per iteration => cold cache, isolated, but authed via state.
        const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });

        // Re-seed company NIT (storageState already has it, but be defensive in
        // case the saved state predates ACTIVE_NIT being set).
        if (ACTIVE_NIT) {
            await context.addInitScript(
                ({ keys, nit }) => {
                    try {
                        for (const k of keys) localStorage.setItem(k, nit);
                    } catch {
                        /* ignore */
                    }
                },
                { keys: COMPANY_STORAGE_KEYS, nit: ACTIVE_NIT }
            );
        }
        await context.addInitScript(installPerfObservers);

        const page = await context.newPage();
        let metrics = null;
        let networkIdleTs = 0;
        const t0 = Date.now();
        try {
            await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT });
            try {
                await page.waitForLoadState('networkidle', { timeout: NAV_TIMEOUT });
            } catch {
                /* networkidle may never fire on polling pages; continue */
            }
            networkIdleTs = Date.now() - t0;
            // Let LCP / late long-tasks flush.
            await page.waitForTimeout(SETTLE_MS);
            metrics = await page.evaluate(readPerfMetrics);
        } catch (err) {
            console.error(`  iter ${i}: navigation error: ${err.message}`);
        } finally {
            await context.close();
        }

        if (metrics) {
            samples.push({
                iteration: i,
                cold: i === 0,
                ...metrics,
                tti: networkIdleTs,
            });
        }
    }

    return { path: pagePath, url, samples };
}

function summarize(samples) {
    // Optionally exclude the cold (first) iteration from aggregates.
    const warm = DISCARD_COLD ? samples.filter((s) => !s.cold) : samples;
    const used = warm.length > 0 ? warm : samples;
    const cold = samples.find((s) => s.cold) || null;

    const summary = {};
    for (const m of METRICS) {
        const values = used.map((s) => s[m.key]);
        summary[m.key] = {
            median: round(median(values)),
            p75: round(percentile(values, 75)),
            unit: m.unit,
        };
    }
    return {
        sampleCount: samples.length,
        usedCount: used.length,
        coldDiscarded: DISCARD_COLD,
        cold: cold ? Object.fromEntries(METRICS.map((m) => [m.key, round(cold[m.key])])) : null,
        summary,
    };
}

function fmt(value, unit) {
    if (unit === 'KB') return (value / 1024).toFixed(1);
    return String(Math.round(value));
}

function printTable(results) {
    const header = ['PAGE', ...METRICS.map((m) => `${m.label}(${m.unit})`)];
    console.log('\n=== MEDIAN per page (cold iteration excluded) ===\n');
    console.log(header.join(' | '));
    console.log(header.map((h) => '-'.repeat(h.length)).join('-|-'));
    for (const r of results) {
        const row = [
            r.path,
            ...METRICS.map((m) => fmt(r.stats.summary[m.key].median, m.unit)),
        ];
        console.log(row.join(' | '));
    }
    console.log('\n(p75 values and per-iteration samples are in the JSON output.)');
}

async function main() {
    ensureStorageState();
    const label = parseArgLabel();
    console.log(`Benchmark "${label}" against ${BASE_URL}`);
    console.log(`Pages: ${PAGES.join(', ')}`);
    console.log(`Iterations: ${ITERATIONS} (cold discarded: ${DISCARD_COLD})\n`);

    const browser = await chromium.launch();
    const results = [];
    try {
        for (const pagePath of PAGES) {
            console.log(`Measuring ${pagePath} ...`);
            const { url, samples } = await measurePage(browser, pagePath);
            if (samples.length === 0) {
                console.error(`  no successful samples for ${pagePath}`);
            }
            results.push({ path: pagePath, url, samples, stats: summarize(samples) });
        }
    } finally {
        await browser.close();
    }

    const output = {
        label,
        baseUrl: BASE_URL,
        timestamp: new Date().toISOString(),
        iterations: ITERATIONS,
        coldDiscarded: DISCARD_COLD,
        pages: results,
    };

    fs.mkdirSync(RESULTS_DIR, { recursive: true });
    const outPath = path.join(RESULTS_DIR, `${label}.json`);
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.log(`\nWrote ${outPath}`);

    printTable(results);
}

main().catch((err) => {
    console.error('Benchmark failed:', err);
    process.exit(1);
});
