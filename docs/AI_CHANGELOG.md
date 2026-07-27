# AI Changelog

All changes executed by AI Coding Assistant are logged in reverse chronological order.

---

## [Phase 5B-3A] - Frontend Data Layer Implementation (2026-07-27)

### Summary
Implemented the **Frontend Data Layer** (`portfolioService`, `dashboardService`, `reportingService`, `healthService`, `queryKeys`, `usePortfolioSummary`, `useDashboardOverview`, `useReportGeneration`, `useHealthCheck`, `config`) under `frontend/src/services/` and `frontend/src/hooks/`. Configured Axios response envelope parsing, correlation ID header propagation, and 5-minute stale-time caching via TanStack Query v5. Created `CHART_DESIGN_SYSTEM.md`, `ICON_REGISTRY.md`, `MICRO_INTERACTION_GUIDE.md`, `RESPONSIVE_BREAKPOINTS.md`, `COMPONENT_VERSIONING.md`, `Sprint_5B_3A_Retrospective.md`, and `Phase 5B-3A - Implementation Summary.md`. Verified production bundle build via Vite (`dist/` built in 13.59s with 0 errors) and confirmed 138 backend unit tests passing cleanly.

### Added
- `frontend/src/services/config.ts`: Environment configuration and mock data switch.
- `frontend/src/services/portfolioService.ts`: Typed API client for `API-001`.
- `frontend/src/services/dashboardService.ts`: Typed API client for `API-002`.
- `frontend/src/services/reportingService.ts`: Typed API client for `API-003`.
- `frontend/src/services/healthService.ts`: Typed API client for `/health` probes.
- `frontend/src/hooks/queryKeys.ts`: Centralized TanStack Query key factory.
- `frontend/src/hooks/usePortfolioSummary.ts`: Query hook for portfolio summary.
- `frontend/src/hooks/useDashboardOverview.ts`: Query hook for dashboard overview.
- `frontend/src/hooks/useReportGeneration.ts`: Mutation hook for report generation.
- `frontend/src/hooks/useHealthCheck.ts`: Query hook for observability health checks.
- `docs/CHART_DESIGN_SYSTEM.md`: Financial chart visual design guidelines.
- `docs/ICON_REGISTRY.md`: Lucide React icon taxonomy mapping.
- `docs/MICRO_INTERACTION_GUIDE.md`: Micro-interaction & animation guide.
- `docs/RESPONSIVE_BREAKPOINTS.md`: Responsive breakpoint specification.
- `docs/COMPONENT_VERSIONING.md`: Component library versioning strategy.
- `docs/Sprint_5B_3A_Retrospective.md`: Phase 5B-3A retrospective report.
- `prompts/summary/Phase 5B-3A - Implementation Summary.md`: Comprehensive Phase 5B-3A summary report.

---

## [Phase 5B-2] - Atomic Component Library Implementation (2026-07-27)

### Summary
Implemented the reusable **Atomic Component Library** (`MetricCard`, `PortfolioCard`, `AssetTile`, `HoldingTable`, `InsightCard`, `RiskGauge`, `Timeline`, `ComponentDemo`).
