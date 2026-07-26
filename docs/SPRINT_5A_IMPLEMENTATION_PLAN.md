# 📋 SPRINT_5A_IMPLEMENTATION_PLAN.md — Sprint 5A Execution Plan

**System Name**: Family Wealth OS  
**Phase**: Sprint 5A (Portfolio Analytics Engine Implementation Plan)  
**Date**: July 26, 2026  
**Status**: APPROVED IMPLEMENTATION PLAN  

---

## 1. Goal & Scope

Implement `PortfolioAnalyticsEngine.ts` under `backend/src/engines/` and register it in `EngineRegistry`. The engine will compute multi-dimensional allocations (Asset, Sector, Market, Currency, Geography), Herfindahl-Hirschman Index (HHI), `DiversificationScore`, `ConcentrationScore`, `CashAllocation`, and `PortfolioHealth`.

> [!IMPORTANT]
> - **Architecture Version 1.0 Frozen**: Core database tables (`families`, `family_members`, `entities`, `accounts`, `holdings`, `assets_master`) remain 100% UNTOUCHED.
> - **Engine Isolation**: Communicates with zero SQLite repositories or external HTTP APIs directly.
> - **100% Backward Compatibility**: All 60 existing unit tests must pass cleanly.

---

## 2. Proposed Implementation Components

### Component 1 — Analytics Engine (`backend/src/engines/`)
- `IAnalyticsEngine.ts`: Contract interface extending `IFinancialEngine`.
- `PortfolioAnalyticsTypes.ts`: Domain interfaces (`AllocationItem`, `MultiDimensionalAllocations`, `DiversificationScore`, `ConcentrationScore`, `CashAllocation`, `PortfolioHealth`, `PortfolioAnalyticsSnapshot`).
- `PortfolioAnalyticsEngine.ts`: Concrete stateless calculation engine.

### Component 2 — Tests & Verification (`backend/src/__tests__/runTests.ts`)
- Add section 15 testing:
  - 5-dimensional allocation decomposition (Asset, Sector, Market, Currency, Geography)
  - HHI index calculation and DiversificationScore (0 to 100)
  - Concentration warning triggers (Top 1, Top 3, Top 5)
  - Cash liquidity status evaluation (`OPTIMAL`, `LOW_LIQUIDITY`, `EXCESS_CASH`)
  - Determinism quality gate (identical payload produces identical SHA-256 calculation checksum)

---

## 3. Verification Plan

### Automated Tests
1. `npm test` in `backend` (60 existing + new Portfolio Analytics Engine tests).
2. `npm run build` in `backend` (`tsc`).
3. `npm run build` in `frontend` (`vite build`).
