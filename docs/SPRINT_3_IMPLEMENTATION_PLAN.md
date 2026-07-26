# 📋 SPRINT_3_IMPLEMENTATION_PLAN.md — Sprint 3 Implementation Plan

**System Name**: Family Wealth OS  
**Phase**: Sprint 3 (Net Worth Engine Implementation)  
**Date**: July 26, 2026  
**Status**: APPROVED IMPLEMENTATION PLAN (ARB ENHANCED)  

---

## 1. Goal & Scope

Implement `NetWorthEngine.ts` under `backend/src/engines/` and register it in `EngineRegistry`. The engine will perform multi-currency aggregation, portfolio summaries, asset allocations, daily change evaluations, gain/loss tracking, calculation manifest generation, and 4-level hierarchical tree building (**Family -> Member -> Entity -> Account**).

> [!IMPORTANT]
> - **Architecture Version 1.0 Frozen**: Core database tables (`families`, `family_members`, `entities`, `accounts`, `holdings`, `assets_master`, `asset_prices`) remain 100% UNTOUCHED.
> - **Engine Isolation**: `NetWorthEngine` communicates with zero repositories or market APIs directly.
> - **Scope Preservation**: Sprint 3 scope remains strictly focused on Net Worth calculation (no Performance Engine or Analytics code).
> - **100% Backward Compatibility**: All 47 existing unit tests must pass cleanly.

---

## 2. Proposed Implementation Components

### Component 1 — Shared Engine Infrastructure (`backend/src/engines/common/`)
- `CalculationManifest.ts`: Shared calculation manifest model and checksum generator (`engine`, `engineVersion`, `businessRuleVersion`, `algorithmVersion`, `executionTimeMs`, `checksum`).

### Component 2 — Net Worth Engine (`backend/src/engines/`)
- `INetWorthEngine.ts`: Contract interface extending `IFinancialEngine`.
- `NetWorthTypes.ts`: Domain models (`SnapshotLineage`, `TimeModel`, `PortfolioSummary`, `AssetAllocation`, `DailyChange`, `UnrealizedGainLoss`, `CurrencyAggregation`, `NetWorthSnapshot`).
- `NetWorthEngine.ts`: Concrete stateless calculation engine implementation.

### Component 3 — Tests & Verification (`backend/src/__tests__/runTests.ts`)
- Add section 13 testing:
  - Multi-currency portfolio consolidation (INR + USD)
  - `CalculationManifest` checksum generation and timing metrics
  - Asset allocation percentage calculations
  - Daily change evaluation (Current vs Previous snapshot)
  - Hierarchical tree rollup across Family, Member, Entity, and Account
  - Determinism quality gate (identical input yields identical output)

---

## 3. Verification Plan

### Automated Tests
1. `npm test` in `backend` (47 existing + new Net Worth Engine tests).
2. `npm run build` in `backend` (`tsc`).
3. `npm run build` in `frontend` (`vite build`).
