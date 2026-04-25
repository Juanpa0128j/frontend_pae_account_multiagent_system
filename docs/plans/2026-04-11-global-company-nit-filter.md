# Global Company NIT Filter — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a global company selector to the TopBar that filters all data across every page by the active company NIT.

**Architecture:** A new `CompanyContext` holds the active NIT and company list (loaded from a new backend endpoint). All data hooks read the NIT from context and pass it as `company_nit` to the API. The selected NIT persists in `localStorage`.

**Tech Stack:** Next.js 14 (App Router), React Context, TanStack React Query v5, MUI v5, FastAPI (backend), SQLAlchemy

---

## Task 1: Backend — `GET /api/v1/settings/companies`

**Files:**
- Modify: `d:/Code/Github/backend_pae_account_multiagent_system/app/api/v1/settings.py:1-10`

**Step 1: Add the endpoint**

Add after the existing `GET /company/{nit}` route (after line 46 in settings.py):

```python
@router.get("/companies", response_model=list[CompanySettingsResponse])
def list_companies(db: Session = Depends(get_db)):
    """Return all registered companies (used for the frontend company selector)."""
    return db_service.list_companies(db)
```

**Step 2: Add the db_service function**

In `d:/Code/Github/backend_pae_account_multiagent_system/app/services/db_service.py`, add after `get_company_settings`:

```python
def list_companies(db: Session) -> list[CompanySettings]:
    """Return all CompanySettings rows ordered by NIT."""
    return db.query(CompanySettings).order_by(CompanySettings.nit).all()
```

**Step 3: Verify manually**

With the backend running (`make server`), hit:
```
curl http://localhost:8000/api/v1/settings/companies
```
Expected: JSON array (empty `[]` if no companies, or list of objects with `nit`, `nombre`, `ciudad`, etc.)

**Step 4: Commit**

```bash
cd d:/Code/Github/backend_pae_account_multiagent_system
git add app/api/v1/settings.py app/services/db_service.py
git commit -m "feat: add GET /api/v1/settings/companies endpoint"
```

---

## Task 2: Backend — Add `company_nit` to dashboard endpoints

**Files:**
- Modify: `d:/Code/Github/backend_pae_account_multiagent_system/app/api/v1/dashboard.py`

**Step 1: Update `/stats`**

Replace the function signature (line 56):
```python
# Before:
async def get_dashboard_stats(db: Session = Depends(get_db)):

# After:
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    company_nit: Optional[str] = Query(None, description="Filter by company NIT"),
):
```

Add import at the top of the file if not present:
```python
from typing import Optional
from fastapi import APIRouter, Depends, Query
```

Then pass `company_nit` to the db_service calls that accept it:
```python
# Change:
balance = db_service.get_balance_sheet(db)
ledger = db_service.get_general_ledger(db)
txn_counts = db_service.get_transaction_counts_by_status(db)

# To:
balance = db_service.get_balance_sheet(db, company_nit=company_nit)
ledger = db_service.get_general_ledger(db, company_nit=company_nit)
txn_counts = db_service.get_transaction_counts_by_status(db)
```

**Step 2: Update `/financial-summary`**

Same pattern — add `company_nit: Optional[str] = Query(None)` to `get_financial_summary` and pass it to `get_balance_sheet` and `get_general_ledger`.

**Step 3 Verify manually**

```
curl "http://localhost:8000/api/v1/dashboard/stats?company_nit=800999888-2"
```
Expected: Same shape as before, values filtered to that company.

**Step 4: Commit**

```bash
git add app/api/v1/dashboard.py
git commit -m "feat: add company_nit filter to dashboard stats endpoints"
```

---

## Task 3: Frontend — `getCompanies()` + update API functions to accept `company_nit`

**Files:**
- Modify: `src/lib/api.ts`

**Step 1: Add `CompanySettingsResponse` interface** (before the `ApiError` interface)

```typescript
export interface CompanySettingsApiResponse {
  nit: string;
  nombre: string | null;
  ciudad: string | null;
  codigo_ciiu: string | null;
  iva_responsable: boolean;
  tasa_retefuente_servicios: number;
  tasa_retefuente_bienes: number;
  tasa_retefuente_arrendamiento: number;
  tasa_reteica: number;
  tasa_iva_general: number;
  tasa_ica: number;
  tasa_renta: number;
  created_at: string | null;
  updated_at: string | null;
}
```

**Step 2: Add `getCompanies` function** (in the Settings section, after `setupCompanySettings`):

```typescript
/**
 * GET /api/v1/settings/companies
 * Returns all registered companies for the company selector.
 */
export const getCompanies = async (): Promise<CompanySettingsApiResponse[]> => {
  const response = await apiClient.get<CompanySettingsApiResponse[]>(
    '/api/v1/settings/companies'
  );
  return response.data;
};
```

**Step 3: Update `getBalance`, `getProfitAndLoss`, `getCashFlow`** to accept optional `company_nit`:

```typescript
// getBalance:
export const getBalance = async (company_nit?: string): Promise<BalanceSheet> => {
  const response = await apiClient.get<BalanceSheet | GenericReportResponse>(
    '/api/v1/reports/balance',
    { params: company_nit ? { company_nit } : undefined }
  );
  // ... rest unchanged

// getProfitAndLoss:
export const getProfitAndLoss = async (company_nit?: string): Promise<ProfitAndLoss> => {
  const response = await apiClient.get<ProfitAndLoss | GenericReportResponse>(
    '/api/v1/reports/pnl',
    { params: company_nit ? { company_nit } : undefined }
  );
  // ... rest unchanged

// getCashFlow:
export const getCashFlow = async (company_nit?: string): Promise<CashFlow> => {
  const response = await apiClient.get<CashFlow | GenericReportResponse>(
    '/api/v1/reports/cashflow',
    { params: company_nit ? { company_nit } : undefined }
  );
  // ... rest unchanged
```

**Step 4: Update `getIVA`, `getWithholdings`** to accept optional `company_nit`:

```typescript
export const getIVA = async (company_nit?: string): Promise<IVAReport> => {
  const response = await apiClient.get<IVAReport | GenericReportResponse>(
    '/api/v1/tax/iva',
    { params: company_nit ? { company_nit } : undefined }
  );
  // ... rest unchanged

export const getWithholdings = async (company_nit?: string): Promise<WithholdingsReport> => {
  const response = await apiClient.get<WithholdingsReport | GenericReportResponse>(
    '/api/v1/tax/withholdings',
    { params: company_nit ? { company_nit } : undefined }
  );
  // ... rest unchanged
```

**Step 5: Update `getBooks`** — add `company_nit` to `BookQueryParams`:

```typescript
// Find the BookQueryParams interface and add:
export interface BookQueryParams {
  tipo: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  cuenta_puc?: string;
  tercero_nit?: string;
  company_nit?: string;   // ← add this
}
```

**Step 6: Update `getDashboardStats`** to accept optional `company_nit`:

```typescript
export const getDashboardStats = async (company_nit?: string): Promise<DashboardStatsResponse> => {
  const response = await apiClient.get<DashboardStatsResponse>(
    '/api/v1/dashboard/stats',
    { params: company_nit ? { company_nit } : undefined }
  );
  return response.data;
};
```

**Step 7: TypeScript check**

```bash
cd d:/Code/Github/frontend_pae_account_multiagent_system
npx tsc --noEmit
```
Expected: 0 errors (some hooks may briefly show errors — will be fixed in Task 5).

**Step 8: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add company_nit param to all API functions + getCompanies"
```

---

## Task 4: Frontend — Create `CompanyContext`

**Files:**
- Create: `src/context/CompanyContext.tsx`

**Step 1: Create the file**

```typescript
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

  // On first load: restore from localStorage, then fall back to first company
  useEffect(() => {
    if (companies.length === 0) return;
    const stored = typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY)
      : null;
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
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/context/CompanyContext.tsx
git commit -m "feat: add CompanyContext for global NIT state"
```

---

## Task 5: Frontend — Wire `CompanyProvider` into the layout

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/ThemeRegistry.tsx` (check if QueryClientProvider lives here or in layout)

**Step 1: Check where `QueryClientProvider` lives**

Read `src/components/ThemeRegistry.tsx`. The `CompanyProvider` must be *inside* `QueryClientProvider` since it uses `useQuery`.

**Step 2: Update layout**

If `QueryClientProvider` is in `ThemeRegistry`, add `CompanyProvider` inside `ThemeRegistry.tsx`:

```typescript
// In ThemeRegistry.tsx, wrap AppShell/children with CompanyProvider:
import { CompanyProvider } from '@/context/CompanyContext';

// Inside the return, after QueryClientProvider but before children:
<QueryClientProvider client={queryClient}>
  <CompanyProvider>
    {children}
  </CompanyProvider>
</QueryClientProvider>
```

If `QueryClientProvider` is in `layout.tsx`, add it there instead.

**Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/app/layout.tsx src/components/ThemeRegistry.tsx
git commit -m "feat: wrap app with CompanyProvider"
```

---

## Task 6: Frontend — Company selector in TopBar

**Files:**
- Modify: `src/components/layout/TopBar.tsx`

**Step 1: Add the selector**

```typescript
// Add imports:
import { Select, MenuItem, FormControl, Skeleton } from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';
import { useCompany } from '@/context/CompanyContext';

// Inside TopBar(), before the return:
const { companies, activeNit, setActiveNit, isLoading: companyLoading } = useCompany();

// In the JSX, replace <Box sx={{ flex: 1 }} /> with:
<Box sx={{ flex: 1 }} />

// Then add before the backend status Chip:
{companyLoading ? (
  <Skeleton variant="rounded" width={180} height={28} sx={{ mr: 2 }} />
) : companies.length > 0 ? (
  <FormControl size="small" sx={{ mr: 2, minWidth: 180, display: { xs: 'none', md: 'flex' } }}>
    <Select
      value={activeNit ?? ''}
      onChange={(e) => setActiveNit(e.target.value)}
      displayEmpty
      sx={{
        fontSize: '0.78rem',
        height: 30,
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
        '& .MuiSelect-select': { py: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 },
      }}
      renderValue={(val) => {
        const co = companies.find((c) => c.nit === val);
        return co ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <BusinessIcon sx={{ fontSize: 14, color: 'primary.main' }} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1, display: 'block', color: 'text.primary' }}>
                {co.nombre ?? co.nit}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled', lineHeight: 1 }}>
                {co.nit}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography variant="caption" color="text.disabled">Sin empresa</Typography>
        );
      }}
    >
      {companies.map((co) => (
        <MenuItem key={co.nit} value={co.nit} sx={{ fontSize: '0.82rem' }}>
          <Box>
            <Typography variant="caption" fontWeight={600} display="block">
              {co.nombre ?? co.nit}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
              NIT {co.nit}
            </Typography>
          </Box>
        </MenuItem>
      ))}
    </Select>
  </FormControl>
) : null}
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/layout/TopBar.tsx
git commit -m "feat: add company selector to TopBar"
```

---

## Task 7: Frontend — Update hooks to use `activeNit` from context

For each hook below, the pattern is the same:
1. Import `useCompany`
2. Read `activeNit` from context
3. Pass it to the API function
4. Include `activeNit` in the query key so React Query re-fetches on company change

**Files:**
- Modify: `src/hooks/useReports.ts`
- Modify: `src/hooks/useTax.ts`
- Modify: `src/hooks/useBooks.ts`
- Modify: `src/hooks/useDashboard.ts`
- Modify: `src/hooks/useUpload.ts`

### 7a. `useReports.ts`

```typescript
import { useCompany } from '@/context/CompanyContext';

export function useBalance(enabled = true) {
  const { activeNit } = useCompany();
  return useQuery({
    queryKey: ['reports', 'balance', activeNit],
    queryFn: () => getBalance(activeNit ?? undefined),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useProfitAndLoss(enabled = true) {
  const { activeNit } = useCompany();
  return useQuery({
    queryKey: ['reports', 'pnl', activeNit],
    queryFn: () => getProfitAndLoss(activeNit ?? undefined),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useCashFlow(enabled = true) {
  const { activeNit } = useCompany();
  return useQuery({
    queryKey: ['reports', 'cashflow', activeNit],
    queryFn: () => getCashFlow(activeNit ?? undefined),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

// useStatements: use activeNit as default company_nit if filter doesn't provide one
export function useStatements(filter?: StatementsFilter, options?: { pollUntilDerived?: boolean }) {
  const { activeNit } = useCompany();
  const effectiveFilter = { company_nit: activeNit ?? undefined, ...filter };
  return useQuery({
    queryKey: ['statements', effectiveFilter],
    queryFn: () => getStatements(effectiveFilter),
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      if (!options?.pollUntilDerived) return false;
      const data = query.state.data ?? [];
      const derivedCount = data.filter(s => DERIVED_TYPES.has(s.statement_type)).length;
      return derivedCount >= 3 ? false : 2000;
    },
  });
}
```

### 7b. `useTax.ts`

```typescript
import { useCompany } from '@/context/CompanyContext';

export function useIVA(enabled = true) {
  const { activeNit } = useCompany();
  return useQuery({
    queryKey: ['tax', 'iva', activeNit],
    queryFn: () => getIVA(activeNit ?? undefined),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useWithholdings(enabled = true) {
  const { activeNit } = useCompany();
  return useQuery({
    queryKey: ['tax', 'withholdings', activeNit],
    queryFn: () => getWithholdings(activeNit ?? undefined),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useICA(companyNit: string) {
  // companyNit arg kept for backwards compat but context NIT takes precedence
  const { activeNit } = useCompany();
  const nit = activeNit ?? companyNit;
  return useQuery({
    queryKey: ['tax', 'ica', nit],
    queryFn: () => getICA(nit),
    enabled: !!nit,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRentaProvision(companyNit: string) {
  const { activeNit } = useCompany();
  const nit = activeNit ?? companyNit;
  return useQuery({
    queryKey: ['tax', 'renta-provision', nit],
    queryFn: () => getRentaProvision(nit),
    enabled: !!nit,
    staleTime: 5 * 60 * 1000,
  });
}
```

### 7c. `useBooks.ts`

```typescript
import { useCompany } from '@/context/CompanyContext';

export function useBooks(filter: BookFilter) {
  const { activeNit } = useCompany();
  return useQuery<BookEntry[]>({
    queryKey: ['books', filter, activeNit],
    queryFn: async () => {
      try {
        const data = await getBooks({
          tipo: filter.tipo,
          fecha_inicio: filter.fecha_inicio,
          fecha_fin: filter.fecha_fin,
          cuenta_puc: filter.cuenta_puc,
          tercero_nit: filter.tercero_nit,
          company_nit: activeNit ?? undefined,
        });
        return normalizeBooksResponse(data, filter);
      } catch {
        // ... existing fallback unchanged
      }
    },
    staleTime: 60 * 1000,
  });
}
```

### 7d. `useDashboard.ts`

```typescript
import { useCompany } from '@/context/CompanyContext';

export function useDashboardStats(enabled = true) {
  const { activeNit } = useCompany();
  return useQuery({
    queryKey: ['dashboard', 'stats', activeNit],
    queryFn: () => getDashboardStats(activeNit ?? undefined),
    staleTime: 60 * 1000,
    enabled,
  });
}
```

### 7e. `useUpload.ts` — `useViaBUpload`

The `useViaBUpload` hook currently takes `companyNit` as a prop. Change it to read from context as default:

```typescript
import { useCompany } from '@/context/CompanyContext';

// Change signature: companyNit param becomes optional fallback
export function useViaBUpload(companyNitOverride?: string) {
  const { activeNit } = useCompany();
  const companyNit = companyNitOverride ?? activeNit ?? '';
  // rest unchanged
}
```

Update the call site in `src/app/upload/page.tsx` — remove the `COMPANY_NIT` argument:

```typescript
// Before:
const { ... } = useViaBUpload(COMPANY_NIT);

// After:
const { ... } = useViaBUpload();
```

**Step after all edits: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors.

**Commit:**

```bash
git add src/hooks/useReports.ts src/hooks/useTax.ts src/hooks/useBooks.ts src/hooks/useDashboard.ts src/hooks/useUpload.ts src/app/upload/page.tsx
git commit -m "feat: wire activeNit from CompanyContext into all data hooks"
```

---

## Task 8: End-to-end verification

**Step 1:** Start backend
```bash
cd d:/Code/Github/backend_pae_account_multiagent_system
make server
```

**Step 2:** Start frontend
```bash
cd d:/Code/Github/frontend_pae_account_multiagent_system
npm run dev
```

**Step 3:** Verify company selector appears in TopBar with real company names

**Step 4:** Switch company → verify all pages re-fetch (reports, books, tax, dashboard KPIs)

**Step 5:** Reload page → verify selected company persists (localStorage)

**Step 6:** `GET /api/v1/settings/companies` returns correct list
```bash
curl http://localhost:8000/api/v1/settings/companies
```

**Step 7:** Final TypeScript check
```bash
npx tsc --noEmit
```
Expected: EXIT 0
