'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { listMyCompanies, getCompanies } from '@/lib/api';
import type { CompanySettingsApiResponse } from '@/lib/api';

const STORAGE_KEY = 'pae_active_nit';

function persistNit(nit: string | null): void {
    if (typeof window === 'undefined') return;
    if (nit) {
        localStorage.setItem(STORAGE_KEY, nit);
    } else {
        localStorage.removeItem(STORAGE_KEY);
    }
}

function normalizeNit(value: string | null | undefined): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

interface CompanyContextValue {
    companies: CompanySettingsApiResponse[];
    activeNit: string | null;
    activeCompany: CompanySettingsApiResponse | null;
    setActiveNit: (nit: string) => void;
    isLoading: boolean;
    reloadCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextValue>({
    companies: [],
    activeNit: null,
    activeCompany: null,
    setActiveNit: () => {},
    isLoading: false,
    reloadCompanies: async () => {},
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [companies, setCompanies] = useState<CompanySettingsApiResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeNit, setActiveNitState] = useState<string | null>(null);
    const [sessionChecked, setSessionChecked] = useState(false);
    // Tracks whether the companies fetch resolved successfully. We use this
    // (instead of `companies.length`) to gate the activeNit sync effect so a
    // genuinely empty result (user with no memberships) still clears stale NIT,
    // while loading/error states preserve the persisted NIT.
    const [fetchSucceeded, setFetchSucceeded] = useState(false);

    // Restore persisted NIT after mount (client-only)
    useEffect(() => {
        const stored = normalizeNit(localStorage.getItem(STORAGE_KEY));
        if (stored) setActiveNitState(stored);
    }, []);

    const loadCompanies = useCallback(async () => {
        const supabase = createClient();
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            setCompanies([]);
            setIsLoading(false);
            setSessionChecked(true);
            // No session is not a successful fetch — keep persisted NIT
            // intact so the user lands back on their tenant after login.
            setFetchSucceeded(false);
            return;
        }

        setIsLoading(true);
        try {
            // listMyCompanies provides the authoritative NIT membership list.
            // getCompanies fetches full settings data needed by consumers (TopBar, dialogs).
            const [memberships, fullData] = await Promise.all([listMyCompanies(), getCompanies()]);
            const memberNits = new Set(memberships.map((m) => m.company_nit));
            setCompanies(fullData.filter((c) => memberNits.has(c.nit)));
            setFetchSucceeded(true);
        } catch {
            // Preserve persisted NIT on transient failures.
            setFetchSucceeded(false);
        } finally {
            setIsLoading(false);
            setSessionChecked(true);
        }
    }, []);

    // On mount: check session, fetch companies if authenticated.
    // Also re-load whenever auth state transitions (login from another tab,
    // token refresh, manual logout) so cached companies stay in sync.
    useEffect(() => {
        loadCompanies();

        const supabase = createClient();
        const { data } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                setCompanies([]);
                setActiveNitState(null);
                persistNit(null);
                setFetchSucceeded(false);
                return;
            }
            if (event === 'SIGNED_IN') {
                loadCompanies();
            }
        });
        return () => data.subscription.unsubscribe();
    }, [loadCompanies]);

    // Validate activeNit against companies list once both are ready.
    // Guard with `fetchSucceeded` (not `companies.length`) so a genuinely empty
    // result (e.g., user deleted their last company) still clears the stale
    // activeNit. Loading and error states preserve the persisted NIT — avoids
    // logging the user out of their tenant on transient network failures.
    useEffect(() => {
        if (!sessionChecked || isLoading || !fetchSucceeded) return;
        if (!activeNit) return;

        const valid = companies.some((c) => c.nit === activeNit);
        if (valid) return;

        // activeNit not in the user's companies — clear and redirect.
        setActiveNitState(null);
        persistNit(null);
        router.push('/companies');
    }, [companies, activeNit, sessionChecked, isLoading, fetchSucceeded, router]);

    const setActiveNit = useCallback((nit: string) => {
        setActiveNitState(nit);
        persistNit(nit);
    }, []);

    const activeCompany = companies.find((c) => c.nit === activeNit) ?? null;

    return (
        <CompanyContext.Provider
            value={{
                companies,
                activeNit,
                activeCompany,
                setActiveNit,
                isLoading,
                reloadCompanies: loadCompanies,
            }}
        >
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompany() {
    return useContext(CompanyContext);
}
