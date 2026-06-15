// Pure statistics helpers (median, percentile). No I/O, easy to reason about.

export function median(values) {
    return percentile(values, 50);
}

// Linear-interpolation percentile. p in [0,100].
export function percentile(values, p) {
    const arr = values
        .filter((v) => typeof v === 'number' && Number.isFinite(v))
        .slice()
        .sort((a, b) => a - b);
    if (arr.length === 0) return 0;
    if (arr.length === 1) return arr[0];
    const rank = (p / 100) * (arr.length - 1);
    const lo = Math.floor(rank);
    const hi = Math.ceil(rank);
    if (lo === hi) return arr[lo];
    const frac = rank - lo;
    return arr[lo] + (arr[hi] - arr[lo]) * frac;
}

export function round(n) {
    return Math.round(n * 10) / 10;
}
