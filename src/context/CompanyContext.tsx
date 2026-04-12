'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCompanies } from '@/lib/api';
import type { CompanySettingsApiResponse } from '@/lib/api';

const STORAGE_KEY = 'pae_active_nit';

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
  const [activeNit, setActiveNitState] = useState<string | null>(null);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
    staleTime: 5 * 60 * 1000,
  });

  // On first load: restore from localStorage, fallback to first company
  useEffect(() => {
    if (companies.length === 0) return;
    const stored =
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored && companies.some((c) => c.nit === stored)) {
      setActiveNitState(stored);
    } else {
      setActiveNitState(companies[0].nit);
    }
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
