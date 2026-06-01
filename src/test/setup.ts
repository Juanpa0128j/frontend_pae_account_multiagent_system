import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill localStorage / sessionStorage for jsdom 29 + vitest 4 — that
// combination ships without web storage by default, which breaks any test
// that relies on it (CompanyContext persistence, etc.).
function createStorage(): Storage {
    let store: Record<string, string> = {};
    return {
        get length() {
            return Object.keys(store).length;
        },
        key(index: number) {
            return Object.keys(store)[index] ?? null;
        },
        getItem(key: string) {
            return store[key] ?? null;
        },
        setItem(key: string, value: string) {
            store[key] = String(value);
        },
        removeItem(key: string) {
            delete store[key];
        },
        clear() {
            store = {};
        },
    };
}

// jsdom 29 exposes `localStorage` as a partial object without method
// implementations, so checking `!window.localStorage` returns false and
// callers crash on `localStorage.clear()`. Force-override with a complete
// in-memory Storage shim.
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
        value: createStorage(),
        writable: true,
        configurable: true,
    });
    Object.defineProperty(window, 'sessionStorage', {
        value: createStorage(),
        writable: true,
        configurable: true,
    });
    (globalThis as { localStorage: Storage }).localStorage = window.localStorage;
    (globalThis as { sessionStorage: Storage }).sessionStorage = window.sessionStorage;
}

// Stateful mock for UploadSessionContext to preserve state across setState calls
vi.stubGlobal('createStatefulMock', (initialState: any) => {
    let state = initialState;
    return {
        getState: () => state,
        setState: vi.fn((fn: (prev: any) => any) => {
            state = typeof fn === 'function' ? fn(state) : fn;
        }),
    };
});
