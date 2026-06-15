// In-browser metric collection. Injected before navigation so the
// PerformanceObservers (LCP, long-tasks) are registered early enough.

// Installs observers on the page. Call via page.addInitScript so it runs in
// every fresh document before app code executes.
export function installPerfObservers() {
    // This function body is serialized and run in the browser context.
    window.__perf = { lcp: 0, longTasks: [] };

    try {
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const last = entries[entries.length - 1];
            if (last) window.__perf.lcp = last.startTime;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
        /* LCP unsupported */
    }

    try {
        const ltObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                window.__perf.longTasks.push({ start: entry.startTime, dur: entry.duration });
            }
        });
        ltObserver.observe({ type: 'longtask', buffered: true });
    } catch {
        /* longtask unsupported */
    }
}

// Reads all metrics out of the page after it has settled. Returns a flat object
// of numbers (ms / bytes). Runs in the browser context.
export function readPerfMetrics() {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const paints = performance.getEntriesByType('paint');
    const fcpEntry = paints.find((p) => p.name === 'first-contentful-paint');

    const ttfb = nav.responseStart != null && nav.requestStart != null
        ? Math.max(0, nav.responseStart - nav.requestStart)
        : 0;
    const domContentLoaded = nav.domContentLoadedEventEnd || 0;
    const loadEventEnd = nav.loadEventEnd || 0;
    const fcp = fcpEntry ? fcpEntry.startTime : 0;

    const perf = window.__perf || { lcp: 0, longTasks: [] };
    const lcp = perf.lcp || 0;

    // TBT proxy: sum of (longtask duration - 50ms) for tasks before TTI-ish.
    // We cap the window at the later of loadEventEnd and LCP so we capture the
    // main-thread blocking that matters for perceived load.
    const tbtWindowEnd = Math.max(loadEventEnd, lcp) || Number.POSITIVE_INFINITY;
    let tbt = 0;
    let longTaskTotal = 0;
    for (const t of perf.longTasks) {
        longTaskTotal += t.dur;
        if (t.start <= tbtWindowEnd) tbt += Math.max(0, t.dur - 50);
    }

    // Transfer sizes from Resource Timing + the navigation document itself.
    const resources = performance.getEntriesByType('resource');
    let totalBytes = nav.transferSize || 0;
    let jsBytes = 0;
    for (const r of resources) {
        const size = r.transferSize || 0;
        totalBytes += size;
        if (r.initiatorType === 'script' || /\.m?js(\?|$)/.test(r.name)) jsBytes += size;
    }

    return {
        ttfb,
        fcp,
        lcp,
        domContentLoaded,
        loadEventEnd,
        tbt,
        longTaskTotal,
        totalBytes,
        jsBytes,
    };
}

// Metric metadata: unit + whether lower is better (all true here, but explicit).
export const METRICS = [
    { key: 'ttfb', label: 'TTFB', unit: 'ms' },
    { key: 'fcp', label: 'FCP', unit: 'ms' },
    { key: 'lcp', label: 'LCP', unit: 'ms' },
    { key: 'domContentLoaded', label: 'DCL', unit: 'ms' },
    { key: 'loadEventEnd', label: 'Load', unit: 'ms' },
    { key: 'tti', label: 'TTI~(idle)', unit: 'ms' },
    { key: 'tbt', label: 'TBT~', unit: 'ms' },
    { key: 'longTaskTotal', label: 'LongTasks', unit: 'ms' },
    { key: 'totalBytes', label: 'Total', unit: 'KB' },
    { key: 'jsBytes', label: 'JS', unit: 'KB' },
];
