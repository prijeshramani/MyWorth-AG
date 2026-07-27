# ⚡ STATE_MANAGEMENT.md — State Management Architecture

**System Name**: Family Wealth OS  
**Phase**: Phase 5A  
**Date**: July 27, 2026  
**Status**: APPROVED STATE ARCHITECTURE  

---

## 1. Architectural State Separation

Family Wealth OS enforces strict architectural separation between **Server State** (remote REST API data) and **Client State** (local user UI preferences):

```
+-----------------------------------------------------------------------------------+
|                              FRONTEND STATE DUALITY                               |
|                                                                                   |
|  [SERVER STATE CACHE]  ➔ Powered by TanStack Query v5                             |
|  • Automatic background revalidation, stale-time caching (5 min default)          |
|  • Fetches API-001 (/portfolio/summary), API-002 (/dashboard/overview), /health   |
|                                                                                   |
|  [CLIENT UI STORE]     ➔ Powered by Zustand v4                                    |
|  • Active Family Selection (`activeFamilyId: number`)                             |
|  • Reporting Currency Toggle (`currency: 'INR' | 'USD'`)                         |
|  • Active Date Horizon (`asOfDate: string`)                                       |
|  • UI Theme & Drawer Open/Closed Toggle                                           |
+-----------------------------------------------------------------------------------+
```

---

## 2. Server State Architecture (TanStack Query)

```typescript
// frontend/src/hooks/usePortfolioSummary.ts
import { useQuery } from '@tanstack/react-query';
import { portfolioService } from '../services/portfolioService';

export function usePortfolioSummary(familyId: number, asOfDate?: string, currency?: string) {
  return useQuery({
    queryKey: ['portfolioSummary', familyId, asOfDate, currency],
    queryFn: () => portfolioService.getPortfolioSummary(familyId, asOfDate, currency),
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    refetchOnWindowFocus: false
  });
}
```

---

## 3. Client UI Store Architecture (Zustand)

```typescript
// frontend/src/store/useUiStore.ts
import { create } from 'zustand';

interface UiState {
  activeFamilyId: number;
  reportingCurrency: 'INR' | 'USD';
  isDrawerOpen: boolean;
  setActiveFamilyId: (id: number) => void;
  setReportingCurrency: (currency: 'INR' | 'USD') => void;
  toggleDrawer: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeFamilyId: 1,
  reportingCurrency: 'INR',
  isDrawerOpen: true,
  setActiveFamilyId: (id) => set({ activeFamilyId: id }),
  setReportingCurrency: (currency) => set({ reportingCurrency: currency }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen }))
}));
```
