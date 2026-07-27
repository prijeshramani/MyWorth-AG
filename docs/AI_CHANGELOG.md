# AI Changelog

All changes executed by AI Coding Assistant are logged in reverse chronological order.

---

## [Phase 5B-2] - Atomic Component Library Implementation (2026-07-27)

### Summary
Implemented the reusable **Atomic Component Library** (`MetricCard`, `PortfolioCard`, `AssetTile`, `HoldingTable`, `InsightCard`, `RiskGauge`, `Timeline`, `ComponentDemo`) under `frontend/src/components/ui/`. Built 3-state data handling (Loading, Empty, Error, Data) and mobile card view fallback for `HoldingTable`. Created `WIDGET_LIFECYCLE_SPECIFICATION.md`, `GLOBAL_NOTIFICATION_CENTER.md`, `FRONTEND_PERFORMANCE_BUDGET.md`, `THEME_EXPANSION_STRATEGY.md`, `Sprint_5B_2_Retrospective.md`, and `Phase 5B-2 - Implementation Summary.md`. Verified production bundle build via Vite (`dist/` built in 6.98s with 0 errors) and confirmed 138 backend unit tests passing cleanly.

### Added
- `frontend/src/components/ui/MetricCard.tsx`: KPI display card component.
- `frontend/src/components/ui/PortfolioCard.tsx`: Family entity summary card component.
- `frontend/src/components/ui/AssetTile.tsx`: Individual asset tile component.
- `frontend/src/components/ui/HoldingTable.tsx`: Filterable, sortable 3-state holdings data table.
- `frontend/src/components/ui/InsightCard.tsx`: Portfolio health alert card component.
- `frontend/src/components/ui/RiskGauge.tsx`: Radial gauge meter component.
- `frontend/src/components/ui/Timeline.tsx`: Activity feed component.
- `frontend/src/components/ui/ComponentDemo.tsx`: Story/demo page demonstrating all atomic components.
- `docs/WIDGET_LIFECYCLE_SPECIFICATION.md`: Widget lifecycle specification.
- `docs/GLOBAL_NOTIFICATION_CENTER.md`: Global notification center architecture.
- `docs/FRONTEND_PERFORMANCE_BUDGET.md`: Performance budget specification.
- `docs/THEME_EXPANSION_STRATEGY.md`: Theme expansion strategy.
- `docs/Sprint_5B_2_Retrospective.md`: Phase 5B-2 retrospective report.
- `prompts/summary/Phase 5B-2 - Implementation Summary.md`: Comprehensive Phase 5B-2 summary report.

---

## [Phase 5B-1] - Frontend Foundation Implementation (2026-07-27)

### Summary
Implemented the **Frontend Foundation & Infrastructure Shell** (`AppLayout`, `TopNavbar`, `NavigationDrawer`, `MobileNavigation`, `ResponsiveGrid`, `ThemeProvider`, `useUiStore`, `apiClient`, `ErrorBoundary`, `PageSkeleton`, `index.css`).
