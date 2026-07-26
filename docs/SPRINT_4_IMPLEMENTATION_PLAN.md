# 📋 SPRINT_4_IMPLEMENTATION_PLAN.md — Sprint 4 Performance Engine Execution Plan

**System Name**: Family Wealth OS  
**Phase**: Sprint 4 (Performance Engine Implementation Plan)  
**Date**: July 26, 2026  
**Status**: APPROVED IMPLEMENTATION PLAN  

---

## 1. Goal & Scope

Implement `PerformanceEngine.ts` under `backend/src/engines/` and register it in `EngineRegistry`. The engine will compute Absolute Return, Realized/Unrealized Gains, CAGR, Newton-Raphson XIRR, Time-Weighted Return (TWR), Money-Weighted Return (MWR), and 4-level hierarchical rollup (**Family -> Member -> Entity -> Account -> Holding**).

> [!IMPORTANT]
> - **Architecture Version 1.0 Frozen**: Core database tables (`families`, `family_members`, `entities`, `accounts`, `holdings`, `assets_master`) remain 100% UNTOUCHED.
> - **Engine Isolation**: `PerformanceEngine` communicates with zero repositories or market APIs directly.
> - **100% Backward Compatibility**: All 52 existing unit tests must pass cleanly.

---

## 2. Proposed Implementation Components

### Component 1 — Performance Engine (`backend/src/engines/`)
- `IPerformanceEngine.ts`: Contract interface extending `IFinancialEngine`.
- `PerformanceTypes.ts`: Domain models (`CashFlowEvent`, `PerformanceSummary`, `HierarchicalPerformanceNode`, `PerformanceSnapshot`).
- `PerformanceEngine.ts`: Concrete stateless engine with Newton-Raphson XIRR solver and TWR subperiod chaining.

### Component 2 — Tests & Verification (`backend/src/__tests__/runTests.ts`)
- Add section 14 testing:
  - XIRR Newton-Raphson mathematical solver accuracy (verifying standard IRR cash flows)
  - CAGR calculation for holdings > 365 days
  - TWR subperiod calculation across cash flow dates
  - Multi-currency performance rollup (INR + USD)
  - Determinism quality gate (identical input yields identical output)

---

## 3. Verification Plan

### Automated Tests
1. `npm test` in `backend` (52 existing + new Performance Engine tests).
2. `npm run build` in `backend` (`tsc`).
3. `npm run build` in `frontend` (`vite build`).
