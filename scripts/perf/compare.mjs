// Diff two benchmark runs (before vs after). Prints a per-page, per-metric delta
// table with absolute + percentage change, flagging regressions vs improvements.
// All measured metrics are "lower is better", so a negative delta = improvement.
//
// Run:  node scripts/perf/compare.mjs before after
//   or: node scripts/perf/compare.mjs results/before.json results/after.json
//
// Defaults to results/before.json and results/after.json when no args given.

import fs from 'node:fs';
import path from 'node:path';
import { RESULTS_DIR } from './config.mjs';
import { METRICS } from './collect.mjs';

function resolveResultPath(arg) {
    if (!arg) return null;
    if (arg.endsWith('.json') && fs.existsSync(arg)) return arg;
    const byLabel = path.join(RESULTS_DIR, `${arg}.json`);
    if (fs.existsSync(byLabel)) return byLabel;
    if (fs.existsSync(arg)) return arg;
    return byLabel; // report this path in the error
}

function load(label, fallback) {
    const p = resolveResultPath(process.argv[label] || fallback);
    if (!p || !fs.existsSync(p)) {
        console.error(`Result file not found: ${p}`);
        console.error('Usage: node scripts/perf/compare.mjs <before> <after>');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function fmtVal(value, unit) {
    if (value == null) return '-';
    if (unit === 'KB') return `${(value / 1024).toFixed(1)}`;
    return String(Math.round(value));
}

// Returns { abs, pct, tag } for two medians (lower is better).
function delta(before, after) {
    if (before == null || after == null) return { abs: null, pct: null, tag: '' };
    const abs = after - before;
    const pct = before !== 0 ? (abs / before) * 100 : after === 0 ? 0 : 100;
    let tag = 'flat';
    if (pct <= -2) tag = 'better';
    else if (pct >= 2) tag = 'WORSE';
    return { abs, pct, tag };
}

function pageMap(run) {
    const map = new Map();
    for (const pg of run.pages || []) map.set(pg.path, pg);
    return map;
}

function main() {
    const before = load(2, 'before');
    const after = load(3, 'after');

    console.log(`\nBEFORE: ${before.label}  (${before.baseUrl}, ${before.timestamp})`);
    console.log(`AFTER:  ${after.label}  (${after.baseUrl}, ${after.timestamp})`);
    console.log('Lower is better for every metric. "better" = faster/smaller after.\n');

    const beforePages = pageMap(before);
    const afterPages = pageMap(after);
    const allPaths = [...new Set([...beforePages.keys(), ...afterPages.keys()])];

    let regressions = 0;
    let improvements = 0;

    for (const p of allPaths) {
        const b = beforePages.get(p);
        const a = afterPages.get(p);
        console.log(`\n### ${p}`);
        if (!b || !a) {
            console.log(`  (missing in ${!b ? 'before' : 'after'} run)`);
            continue;
        }
        const header = ['METRIC', 'before', 'after', 'Δ', 'Δ%', ''];
        console.log('  ' + header.join(' | '));
        for (const m of METRICS) {
            const bv = b.stats?.summary?.[m.key]?.median;
            const av = a.stats?.summary?.[m.key]?.median;
            const d = delta(bv, av);
            if (d.tag === 'WORSE') regressions++;
            if (d.tag === 'better') improvements++;
            const absStr =
                d.abs == null ? '-' : m.unit === 'KB' ? (d.abs / 1024).toFixed(1) : Math.round(d.abs);
            const pctStr = d.pct == null ? '-' : `${d.pct >= 0 ? '+' : ''}${d.pct.toFixed(1)}%`;
            console.log(
                '  ' +
                    [
                        `${m.label}(${m.unit})`,
                        fmtVal(bv, m.unit),
                        fmtVal(av, m.unit),
                        absStr,
                        pctStr,
                        d.tag,
                    ].join(' | ')
            );
        }
    }

    console.log(`\nSummary: ${improvements} improved, ${regressions} regressed (>=2% change).`);
}

main();
