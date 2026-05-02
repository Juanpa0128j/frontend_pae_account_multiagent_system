'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCompanies } from '@/lib/api';
import type { CompanySettingsApiResponse } from '@/lib/api';

const STORAGE_KEY = 'pae_active_nit';

function normalizeNit(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const DEFAULT_COMPANY_NIT = normalizeNit(process.env.NEXT_PUBLIC_COMPANY_NIT);

interface CompanyContextValue {
  companies: CompanySettingsApiResponse[];
  activeNit: string | null;
  activeCompany: CompanySettingsApiResponse | null;
  setActiveNit: (nit: string) => void;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextValue>({
  companies: [],
  activeNit: null,
  activeCompany: null,
  setActiveNit: () => {},
  isLoading: false,
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  // Read localStorage eagerly so activeNit is populated before companies load,
  // preventing a flash of the company gate on page load.
  const [activeNit, setActiveNitState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return DEFAULT_COMPANY_NIT;
    const stored = normalizeNit(localStorage.getItem(STORAGE_KEY));
    return stored ?? DEFAULT_COMPANY_NIT;
  });

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
    staleTime: 5 * 60 * 1000,
  });

  // Sync activeNit with the companies list on load and after refetches.
  // If the current activeNit is already valid, keep it — prevents a race where
  // a new company is selected just before the companies list refetches.
  useEffect(() => {
    if (companies.length === 0) return;

    if (activeNit && companies.some((c) => c.nit === activeNit)) return;

    const stored = normalizeNit(
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    );

    let nextActiveNit: string | null;
    if (stored && companies.some((c) => c.nit === stored)) {
      nextActiveNit = stored;
    } else if (
      DEFAULT_COMPANY_NIT &&
      companies.some((c) => c.nit === DEFAULT_COMPANY_NIT)
    ) {
      nextActiveNit = DEFAULT_COMPANY_NIT;
    } else {
      nextActiveNit = null;
    }

    setActiveNitState(nextActiveNit);

    if (typeof window !== 'undefined') {
      if (nextActiveNit) {
        localStorage.setItem(STORAGE_KEY, nextActiveNit);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  // activeNit intentionally excluded: we only want this to re-run when companies
  // change, and we read activeNit as a guard inside to avoid stale overrides.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies]);

  const setActiveNit = useCallback((nit: string) => {
    setActiveNitState(nit);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, nit);
    }
  }, []);

  const activeCompany = companies.find((c) => c.nit === activeNit) ?? null;

  return (
    <CompanyContext.Provider
      value={{ companies, activeNit, activeCompany, setActiveNit, isLoading }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
