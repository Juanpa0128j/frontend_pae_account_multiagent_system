# Design: Global Company NIT Filter

**Date:** 2026-04-11  
**Status:** Approved

## Problem

The frontend hardcodes a single `NEXT_PUBLIC_COMPANY_NIT` env var. All data (reports, books, tax, statements) is shown without any company context. Multiple companies can exist in the backend but there is no way to switch between them.

## Goal

Add a global company selector in the TopBar that filters all data across every page by the active company NIT.

## Approach

React Context + new backend `GET /api/v1/settings/companies` endpoint. The selected NIT is stored in `localStorage` for persistence across page reloads.

---

## Section 1 — Backend Changes

### 1a. `GET /api/v1/settings/companies`
- File: `app/api/v1/settings.py`
- Returns all rows from `company_settings` table
- Response: `List[CompanySettingsResponse]` (nit, razon_social, ciudad, régimen, etc.)
- Single query: `db.query(CompanySettings).all()`

### 1b. `company_nit` param on dashboard endpoints
- File: `app/api/v1/dashboard.py`
- Add `company_nit: Optional[str] = Query(None)` to both `/stats` and `/financial-summary`
- Pass it through to `get_balance_sheet(db, company_nit=nit)`, `get_general_ledger(db, company_nit=nit)`, `get_transaction_counts_by_status(db, company_nit=nit)`

---

## Section 2 — CompanyContext

**File:** `src/context/CompanyContext.tsx`

```
CompanyContext
  companies: CompanySettingsResponse[]   ← loaded from /api/v1/settings/companies
  activeNit: string | null               ← selected NIT
  activeCompany: CompanySettingsResponse | null
  setActiveNit(nit: string): void        ← persists to localStorage
  isLoading: boolean
```

- On mount: fetch companies list, then read `localStorage.getItem('activeNit')`
- If stored NIT exists in the list → use it; otherwise → default to first company
- `CompanyProvider` wraps `src/app/layout.tsx` (inside `QueryClientProvider`)

**Frontend API addition:** `getCompanies(): Promise<CompanySettingsResponse[]>` in `src/lib/api.ts`

---

## Section 3 — TopBar Selector

**File:** `src/components/layout/TopBar.tsx`

- Add a compact MUI `<Select>` (or `<Autocomplete>` if many companies) to the right side of the TopBar
- Each option: `razon_social` as primary text, NIT as secondary caption
- On change: calls `setActiveNit(nit)`
- Loading state: skeleton placeholder
- Empty state: "Sin empresa configurada"
- Reads `companies` and `activeNit` from `useCompany()` hook

---

## Section 4 — Hook Updates

All hooks read `activeNit` from `useCompany()` context and pass it as `company_nit` query param. No hook signature changes — the NIT comes implicitly from context.

| Hook | File | Change |
|------|------|--------|
| `useBalance`, `useProfitAndLoss`, `useCashFlow` | `useReports.ts` | Add `company_nit` from context to query params |
| `useStatements` | `useReports.ts` | Default `filter.company_nit` to context NIT if not provided |
| `useIVA`, `useWithholdings` | `useTax.ts` | Add `company_nit` from context |
| `useICA`, `useRentaProvision` | `useTax.ts` | Replace hardcoded NIT with context NIT |
| `useBooks` | `useBooks.ts` | Add `company_nit` from context to BookFilter |
| `useDashboardStats` | `useDashboard.ts` | Add `company_nit` from context |
| `useUpload` / `useViaBUpload` | `useUpload.ts` | Read NIT from context instead of prop/env |

Query keys must include `activeNit` so React Query re-fetches when the company changes.

---

## Data Flow

```
localStorage / backend
        ↓
  CompanyContext (activeNit)
        ↓
  useCompany() hook (consumed in)
    ├── TopBar → <Select> (write)
    ├── useBalance / useProfitAndLoss / useCashFlow (read)
    ├── useStatements (read)
    ├── useIVA / useWithholdings / useICA / useRentaProvision (read)
    ├── useBooks (read)
    ├── useDashboardStats (read)
    └── useUpload / useViaBUpload (read)
```

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `app/api/v1/settings.py` | Add `GET /companies` endpoint |
| `app/api/v1/dashboard.py` | Add `company_nit` param to both endpoints |
| `src/lib/api.ts` | Add `getCompanies()` function |
| `src/context/CompanyContext.tsx` | Create — global company state |
| `src/app/layout.tsx` | Wrap with `CompanyProvider` |
| `src/components/layout/TopBar.tsx` | Add company selector |
| `src/hooks/useReports.ts` | Read NIT from context |
| `src/hooks/useTax.ts` | Read NIT from context |
| `src/hooks/useBooks.ts` | Read NIT from context |
| `src/hooks/useDashboard.ts` | Read NIT from context |
| `src/hooks/useUpload.ts` | Read NIT from context |

---

## Verification

1. Backend: `GET /api/v1/settings/companies` returns list of companies
2. TopBar shows company selector with real company names
3. Switching company re-fetches all pages (reports, tax, books, dashboard)
4. Selected NIT persists across page reload (localStorage)
5. `npx tsc --noEmit` passes
