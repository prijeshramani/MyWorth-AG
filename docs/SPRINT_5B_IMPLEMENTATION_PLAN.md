# 📋 SPRINT_5B_IMPLEMENTATION_PLAN.md — Sprint 5B Execution Plan

**System Name**: Family Wealth OS  
**Phase**: Sprint 5B (Risk Intelligence Engine Implementation Plan)  
**Date**: July 26, 2026  
**Status**: APPROVED IMPLEMENTATION PLAN  

---

## 1. Goal & Scope

Implement `RiskEngine.ts` under `backend/src/engines/` and register it in `EngineRegistry`. The engine will compute quantitative risk metrics (`RISK-001` Sharpe, `RISK-002` Sortino, `RISK-003` Volatility, `RISK-004` Max Drawdown, `RISK-005` Beta, `RISK-006` Correlation, `RISK-007` Tracking Error) and benchmark comparison against `Nifty 50`, `Sensex`, `Nifty 500`, `Nasdaq 100`, and `S&P 500`.

> [!IMPORTANT]
> - **Architecture Version 1.0 Frozen**: Core database tables (`families`, `family_members`, `entities`, `accounts`, `holdings`, `assets_master`) remain 100% UNTOUCHED.
> - **Engine Isolation**: Communicates with zero SQLite repositories or external HTTP APIs directly.
> - **100% Backward Compatibility**: All 73 existing unit tests must pass cleanly.

---

## 2. Proposed Implementation Components

### Component 1 — Risk Engine (`backend/src/engines/`)
- `IRiskEngine.ts`: Contract interface extending `IFinancialEngine`.
- `RiskTypes.ts`: Domain models (`RiskSummary`, `BenchmarkComparison`, `RiskRecommendation`, `RiskSnapshot`).
- `RiskEngine.ts`: Concrete stateless calculation engine.

### Component 2 — Tests & Verification (`backend/src/__tests__/runTests.ts`)
- Add section 16 testing:
  - Volatility, downside deviation, and Max Drawdown calculation
  - Sharpe Ratio (`RISK-001`) and Sortino Ratio (`RISK-002`) solvers
  - Benchmark comparison (Beta, Correlation, Tracking Error against Nifty 50 & S&P 500)
  - Determinism quality gate (identical payload produces identical SHA-256 calculation checksum)

---

## 3. Verification Plan

### Automated Tests
1. `npm test` in `backend` (73 existing + new Risk Engine tests).
2. `npm run build` in `backend` (`tsc`).
3. `npm run build` in `frontend` (`vite build`).
