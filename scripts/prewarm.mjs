/**
 * Pre-warm the Next.js dev server by hitting every route once.
 * Run after `next dev` is up so all routes are compiled in the background
 * before the user clicks anything.
 *
 * Usage: `npm run prewarm` (in a second terminal once dev is running)
 */

const BASE = process.env.PREWARM_BASE_URL ?? 'http://localhost:3000';
const ROUTES = [
    '/',
    '/upload',
    '/transactions',
    '/books',
    '/reports',
    '/tax',
    '/evaluation',
    '/settings',
    '/help',
];

const RETRIES = 30;
const RETRY_DELAY_MS = 1000;

async function waitForServer() {
    for (let i = 0; i < RETRIES; i++) {
        try {
            const res = await fetch(`${BASE}/`, { method: 'HEAD' });
            if (res.ok || res.status === 404) return true;
        } catch {
            /* not up yet */
        }
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
    return false;
}

async function compile(route) {
    const url = `${BASE}${route}`;
    const t0 = Date.now();
    try {
        const res = await fetch(url, { method: 'GET' });
        const ms = Date.now() - t0;
        const status = res.ok ? '✓' : '✗';
        console.log(`  ${status} ${route.padEnd(20)} ${ms}ms · ${res.status}`);
    } catch (err) {
        console.log(`  ✗ ${route.padEnd(20)} ERROR · ${err.message}`);
    }
}

(async () => {
    console.log(`\n🔥  Pre-warming Next.js dev server at ${BASE}`);
    console.log('    Waiting for server…');

    const ready = await waitForServer();
    if (!ready) {
        console.error('    Server did not respond after 30s. Aborting.');
        process.exit(1);
    }

    console.log(`    Ready. Hitting ${ROUTES.length} routes:\n`);

    for (const route of ROUTES) {
        // Sequential so we don't crush the dev server with parallel compiles
        // (which would actually be slower because compilation is single-threaded)
        // eslint-disable-next-line no-await-in-loop
        await compile(route);
    }

    console.log(`\n✓  All routes compiled.\n`);
})();
