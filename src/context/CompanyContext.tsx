'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { companyApiClient } from '@/lib/api/clients';
import type { CompanySettingsApiResponse } from '@/types';

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
    const { isSignedIn, isLoaded } = useAuth();
    const [companies, setCompanies] = useState<CompanySettingsApiResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeNit, setActiveNitState] = useState<string | null>(null);
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
        setIsLoading(true);
        try {
            // listMyCompanies provides the authoritative NIT membership list.
            // getCompanies fetches full settings data needed by consumers (TopBar, dialogs).
            const [memberships, fullData] = await Promise.all([
                companyApiClient.listMyCompanies(),
                companyApiClient.getCompanies(),
            ]);
            const memberNits = new Set(memberships.map((m) => m.company_nit));
            setCompanies(fullData.filter((c) => memberNits.has(c.nit)));
            setFetchSucceeded(true);
        } catch {
            // Preserve persisted NIT on transient failures.
            setFetchSucceeded(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Re-run whenever Clerk auth state changes. Load companies when signed in;
    // clear them when signed out. Wait for Clerk to finish loading before acting.
    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            setCompanies([]);
            setActiveNitState(null);
            persistNit(null);
            setFetchSucceeded(false);
            return;
        }

        loadCompanies();
    }, [isSignedIn, isLoaded, loadCompanies]);

    // Validate activeNit against companies list once both are ready.
    // Guard with `fetchSucceeded` (not `companies.length`) so a genuinely empty
    // result (e.g., user deleted their last company) still clears the stale
    // activeNit. Loading and error states preserve the persisted NIT — avoids
    // logging the user out of their tenant on transient network failures.
    useEffect(() => {
        if (!isLoaded || isLoading || !fetchSucceeded) return;
        if (!activeNit) return;

        const valid = companies.some((c) => c.nit === activeNit);
        if (valid) return;

        // activeNit not in the user's companies — clear and redirect.
        setActiveNitState(null);
        persistNit(null);
        router.push('/companies');
    }, [companies, activeNit, isLoaded, isLoading, fetchSucceeded, router]);

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
