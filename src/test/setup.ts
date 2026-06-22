import '@testing-library/jest-dom';
import { vi } from 'vitest';

// @testing-library/dom's waitFor checks `typeof jest` to detect fake timers
// and calls `jest.advanceTimersByTime(interval)`. In Vitest there is no `jest`
// global, so waitFor falls back to real setInterval which hangs with fake
// timers.  Expose a minimal shim so the detection and advance works.
const g = globalThis as unknown as Record<string, unknown>;
if (typeof g['jest'] === 'undefined') {
    g['jest'] = {
        advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
    };
    // Mark setTimeout as a mock when vi fake timers are active.
    // The library checks setTimeout._isMockFunction === true.
    const originalUseFakeTimers = vi.useFakeTimers.bind(vi);
    vi.useFakeTimers = ((...args: Parameters<typeof vi.useFakeTimers>) => {
        const result = originalUseFakeTimers(...args);
        (setTimeout as unknown as Record<string, unknown>)._isMockFunction = true;
        return result;
    }) as typeof vi.useFakeTimers;
    const originalUseRealTimers = vi.useRealTimers.bind(vi);
    vi.useRealTimers = ((...args: Parameters<typeof vi.useRealTimers>) => {
        const result = originalUseRealTimers(...args);
        delete (setTimeout as unknown as Record<string, unknown>)._isMockFunction;
        return result;
    }) as typeof vi.useRealTimers;
}

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

// Global Clerk mock — prevents "@clerk/nextjs used outside ClerkProvider" errors
// in tests that render components importing Clerk hooks.
vi.mock('@clerk/nextjs', () => ({
    useUser: () => ({
        user: { primaryEmailAddress: { emailAddress: 'test@example.com' } },
        isLoaded: true,
    }),
    useAuth: () => ({
        isSignedIn: true,
        isLoaded: true,
        getToken: vi.fn().mockResolvedValue('test-token'),
    }),
    useClerk: () => ({ signOut: vi.fn() }),
    ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
    SignIn: () => null,
    SignUp: () => null,
    UserButton: () => null,
    UserProfile: () => null,
}));

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
