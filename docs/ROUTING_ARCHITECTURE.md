# 🗺 ROUTING_ARCHITECTURE.md — Routing Architecture & Code-Splitting

**System Name**: Family Wealth OS  
**Phase**: Phase 5A  
**Date**: July 27, 2026  
**Status**: APPROVED ROUTING ARCHITECTURE  

---

## 1. Route Hierarchy

Family Wealth OS utilizes **React Router v6** nested routing wrapped inside an overarching `AppLayout` shell containing the persistent Top Navigation bar and Navigation Drawer.

```
/                             ➔ Redirect to /dashboard
/dashboard                    ➔ DashboardPage (Executive Wealth Overview)
/portfolio                    ➔ PortfolioPage (4-Level Domain Hierarchy Tree)
/holdings                     ➔ HoldingsPage (Active Asset Holdings Table)
/asset/:assetId               ➔ AssetDetailsPage (Historical Prices & Transactions)
/performance                  ➔ PerformancePage (XIRR, CAGR, TWR Analysis)
/analytics                    ➔ AnalyticsPage (5D Allocations & Portfolio Health)
/risk                         ➔ RiskPage (Quantitative Risk & Benchmark Comparison)
/reports                      ➔ ReportsPage (PDF / CSV Wealth Statements Generator)
/settings                     ➔ SettingsPage (Family Setup & Provider Credentials)
*                             ➔ NotFoundPage (HTTP 404 Route Fallback)
```

---

## 2. Dynamic Code-Splitting & Suspense Skeletons

To optimize initial page load performance, all 9 page views are dynamically code-split using `React.lazy()` and `React.Suspense`:

```typescript
// frontend/src/routes/AppRoutes.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageSkeleton } from '../components/common/PageSkeleton';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const PortfolioPage = lazy(() => import('../pages/PortfolioPage'));
const HoldingsPage = lazy(() => import('../pages/HoldingsPage'));
const AssetDetailsPage = lazy(() => import('../pages/AssetDetailsPage'));
const PerformancePage = lazy(() => import('../pages/PerformancePage'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const RiskPage = lazy(() => import('../pages/RiskPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/holdings" element={<HoldingsPage />} />
        <Route path="/asset/:assetId" element={<AssetDetailsPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/risk" element={<RiskPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
}
```
