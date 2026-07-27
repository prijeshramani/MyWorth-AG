# 📋 FRONTEND_IMPLEMENTATION_PLAN.md — Phase 5B Implementation Roadmap

**System Name**: Family Wealth OS  
**Phase**: Phase 5A (Frontend Platform Architecture & UX Design Plan)  
**Date**: July 27, 2026  
**Status**: APPROVED IMPLEMENTATION PLAN  

---

## 1. Goal & Execution Strategy

Phase 5B will implement the complete React + Vite frontend single-page application according to the approved Phase 5A architectural specifications.

> [!IMPORTANT]
> - **Preserve Backend Platform v1.0**: Zero changes to backend calculation engines, application services, or REST API endpoints.
> - **Design System Compliance**: Strict adherence to HSL dark mode tokens, Inter/Outfit typography, 8pt spacing grid, and WCAG AA contrast ratios.

---

## 2. Phase 5B Sprint Breakdown

### Sprint 5B-1 — Project Setup & Design System Infrastructure
- Initialize React + Vite + TypeScript project structure in `frontend/`.
- Configure CSS Variables, HSL color tokens, dark mode glassmorphic styles (`index.css`).
- Build core atomic components: `MetricCard`, `PortfolioCard`, `InsightCard`, `PageSkeleton`.

### Sprint 5B-2 — Data Layer & API Hooks
- Create `apiClient` with `X-Correlation-ID` header injection.
- Implement TanStack Query custom hooks: `usePortfolioSummary`, `useDashboardOverview`, `useReportGenerator`, `useHealthCheck`.
- Implement Zustand store: `useUiStore`.

### Sprint 5B-3 — Charts & Data Tables
- Implement Recharts visualizers: `NetWorthChart`, `AllocationChart`, `SectorTreemap`, `PerformanceChart`, `RiskGauge`.
- Implement `HoldingTable` with sorting, searching, and mobile card view fallback.

### Sprint 5B-4 — Page Integration & Routing
- Construct all 9 pages: Dashboard, Portfolio, Holdings, Asset Details, Performance, Analytics, Risk, Reports, Settings.
- Configure React Router v6 nested routes and suspense boundaries.

### Sprint 5B-5 — Polish, Verification & E2E Testing
- Verify WCAG AA accessibility, mobile responsiveness across 375px/768px/1440px breakpoints.
- Execute full build verification (`npm run build` in `frontend` and `backend`).
