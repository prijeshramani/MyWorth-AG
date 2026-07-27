# 📋 SPRINT_6A_IMPLEMENTATION_PLAN.md — Sprint 6A Execution Plan

**System Name**: Family Wealth OS  
**Phase**: Sprint 6A (Application Service Layer Implementation Plan)  
**Date**: July 26, 2026  
**Status**: APPROVED IMPLEMENTATION PLAN  

---

## 1. Goal & Scope

Implement the **Application Service Layer** under `backend/src/services/application/` and `backend/src/mappers/`. Create `PortfolioApplicationService`, `DashboardApplicationService`, `SnapshotCoordinator`, `ImportApplicationService`, `ReportingApplicationService`, and DTO Mappers to orchestrate repositories and the 6 pure calculation engines without modifying engine core logic.

> [!IMPORTANT]
> - **Architecture Version 2 Compliant**: Preserves engine isolation & frozen schema v1.0.
> - **Zero REST Controller Coding**: Focus is strictly on application services and DTO mappers.
> - **100% Backward Compatibility**: All 84 existing unit tests must pass cleanly.

---

## 2. Proposed Implementation Components

### Component 1 — DTO Mappers & Models (`backend/src/mappers/` & `backend/src/dto/`)
- `PortfolioDTOs.ts`: Request/response DTO contracts.
- `DashboardDTOs.ts`: Dashboard overview DTO contracts.
- `DTOMapper.ts`: Converts internal engine snapshots into formatted user-facing DTOs.

### Component 2 — Application Services (`backend/src/services/application/`)
- `PortfolioApplicationService.ts`: Orchestrates repository fetching, engine pipeline execution, snapshot persistence, and DTO mapping.
- `DashboardApplicationService.ts`: Aggregates high-level wealth dashboard views.
- `SnapshotCoordinator.ts`: Manages snapshot persistence and cross-engine lineage pointers.
- `ImportApplicationService.ts`: Manages data ingestion pipelines.
- `ReportingApplicationService.ts`: Manages report generation workflows.

### Component 3 — Automated Tests (`backend/src/__tests__/runTests.ts`)
- Add section 17 testing:
  - End-to-end `PortfolioApplicationService` execution with SQLite repositories
  - End-to-end `DashboardApplicationService` aggregation
  - Snapshot lineage coordination and persistence in database
  - DTO Mapper currency and percentage formatting
  - Backward regression test suite (84 existing tests passing)

---

## 3. Verification Plan

### Automated Tests
1. `npm test` in `backend` (84 existing + new Application Service tests).
2. `npm run build` in `backend` (`tsc`).
3. `npm run build` in `frontend` (`vite build`).
