// One-time auth step: log in through the real Supabase login form, then save
// Playwright storageState (cookies + localStorage) for reuse across iterations.
//
// Supabase @supabase/ssr stores the session in COOKIES (sb-<ref>-auth-token),
// which storageState captures. We also seed the active-company NIT into
// localStorage so CompanyGate lets protected pages render data.
//
// Run:  node scripts/perf/login.mjs
// Env:  BASE_URL, PERF_EMAIL, PERF_PASSWORD, ACTIVE_NIT (optional but recommended)
//
// NEVER hardcode credentials. They are read from ENV only.

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import {
    BASE_URL,
    STORAGE_STATE_PATH,
    ACTIVE_NIT,
    COMPANY_STORAGE_KEYS,
    NAV_TIMEOUT,
} from './config.mjs';

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        console.error(`Missing required env var: ${name}`);
        console.error('Set PERF_EMAIL and PERF_PASSWORD (and ideally ACTIVE_NIT).');
        process.exit(1);
    }
    return value;
}

async function main() {
    const email = requireEnv('PERF_EMAIL');
    const password = requireEnv('PERF_PASSWORD');

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`Navigating to ${BASE_URL}/login ...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT });

    // auth-ui-react renders standard inputs. Match by type, fall back to name.
    const emailInput = page
        .locator('input[type="email"], input[name="email"], input[autocomplete="email"]')
        .first();
    const passwordInput = page
        .locator('input[type="password"], input[name="password"]')
        .first();

    await emailInput.waitFor({ state: 'visible', timeout: NAV_TIMEOUT });
    await emailInput.fill(email);
    await passwordInput.fill(password);

    // Submit. Prefer the sign-in submit button; Enter is a reliable fallback.
    const submit = page.locator('button[type="submit"]').first();
    if (await submit.count()) {
        await submit.click();
    } else {
        await passwordInput.press('Enter');
    }

    // Middleware redirects an authenticated user off /login (to /companies).
    // Wait for the URL to leave /login as the signal the session is set.
    try {
        await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
            timeout: NAV_TIMEOUT,
        });
    } catch {
        console.error('Still on /login after submit — check credentials / Supabase env.');
        const bodyText = await page.locator('body').innerText().catch(() => '');
        if (bodyText) console.error('Page text snippet:', bodyText.slice(0, 300));
        await browser.close();
        process.exit(1);
    }

    // Seed the active company so CompanyGate does not block pages.
    if (ACTIVE_NIT) {
        await page.evaluate(
            ({ keys, nit }) => {
                for (const k of keys) localStorage.setItem(k, nit);
            },
            { keys: COMPANY_STORAGE_KEYS, nit: ACTIVE_NIT }
        );
        console.log(`Seeded active company NIT into localStorage: ${ACTIVE_NIT}`);
    } else {
        console.warn(
            'ACTIVE_NIT not set — protected pages may show the empty company gate. ' +
                'Set ACTIVE_NIT to a NIT your user belongs to.'
        );
    }

    fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
    await context.storageState({ path: STORAGE_STATE_PATH });
    console.log(`Saved storageState -> ${STORAGE_STATE_PATH}`);

    await browser.close();
}

main().catch((err) => {
    console.error('Login failed:', err);
    process.exit(1);
});
