# Sprint 8C.3: Financial Time Machine, Point-in-Time Reconstruction & What-If Simulation Sandbox (Complete Production Specification)

## 1. Executive Summary & Core Time Semantics

The **Financial Time Machine** introduces point-in-time financial state reconstruction and what-if simulation into FamilyWealthOS, answering two core fiduciary questions:
1. **Historical Economic Reconstruction**: *"What was the family's verifiable financial and legal position as of a specific historical date (`asOfDate`), based on authoritative economic records effective on or before that date?"*
2. **What-If Simulation Sandbox**: *"What would the family's financial trajectory, retirement readiness, and tax efficiency look like under explicit hypothetical planning adjustments?"*

### 1.1 Core Time Semantics & Reconstruction Mode (R1)
Sprint 8C.3 implements **`HISTORICAL_ECONOMIC_STATE`** reconstruction. It reconstructs historical facts using authoritative records whose **business/economic effective dates** occurred on or before `asOfDate`.
- **`reconstructionMode`**: `'HISTORICAL_ECONOMIC_STATE'`
- **`knowledgeTimeStatus`**: `'NOT_FULLY_RECONSTRUCTABLE'`

---

## 2. Key Architecture & Fiduciary Invariants

### 2.1 Family-Scoped Repository Layer (R3, R18)
All price and transaction lookups strictly require `familyId` in SQL predicates to guarantee cross-family isolation at the query level:
- `SQLitePriceRepository.findPriceAsOf(familyId, assetId, asOfDate, assetClass, maxAgeDays)`
- `SQLiteTransactionRepository.findByAssetIdAsOf(familyId, assetId, asOfDate)`

### 2.2 Holdings & WAC Cost Basis Algorithm (R4, R5)
- Processes actual supported transaction types (`BUY`, `SELL`, `REINVEST`, `DIVIDEND`, `INTEREST`, `BONUS`, `CREDIT`, `DEBIT`) sorted by `date ASC, id ASC`.
- Reconstructs units and Weighted Average Cost Basis (WAC) with proportional reduction on partial disposals.
- Unrealized Gain/Loss = $\text{MarketValue} - \text{CostBasis}$ (only calculated when valid market price exists; `null` when valued at acquisition cost).

### 2.3 Versioned Proxy Freshness Policy (`TIME_MACHINE_RULE_REGISTRY`) (R6, R7)
- Equities/MFs/US Stocks: `MAX_PROXY_AGE_DAYS = 30`
- Debt/Gold: `MAX_PROXY_AGE_DAYS = 60`
- Real Estate: `MAX_PROXY_AGE_DAYS = 365`
- Cash Snapshots: `MAX_PROXY_AGE_DAYS = 90`
- Expired proxies fall back to `KNOWN_ACQUISITION_COST` (`valuationType = 'ACQUISITION_COST'`, never masquerading as market value).

### 2.4 Fixed Deposit & Insurance Invariants (R8, R9)
- **FD Lifecycle**: Pre-start $\to$ omitted (`NOT_YET_IN_EXISTENCE`); active $\to$ compound accrual (`CALCULATED`); post-maturity $\to$ maturity value with warning.
- **Insurance**: `SUM_ASSURED` is reported under `protectionShield` as coverage and is **NEVER added to net worth or gross assets**. Surrender values are `null` with `HISTORICAL_SOURCE_UNAVAILABLE`.

### 2.5 What-If Simulation Sandbox (R12, R13, R14, R15)
- **Closed Scenario Catalogue**:
  1. `RECURRING_SIP_STEP_UP` (delegates to `ProjectionEngineService`)
  2. `ONE_TIME_LUMP_SUM_INVESTMENT` (future value compounding)
  3. `RETIREMENT_AGE_ADJUSTMENT` (delegates to `RetirementPlanningService`)
  4. `GOAL_CONTRIBUTION_REALLOCATION` (delegates to `GoalPlanningService`)
  5. `TAX_REGIME_OPTIMIZATION_SCENARIO` (delegates to `TaxCalculationEngine`; returns `INSUFFICIENT_DATA` if income missing).
- **Zero-Write Invariant**: Executes in-memory on deep-cloned state with **0 database writes**.

---

## 3. Complete 35-Point Invariant Test Matrix (R23)

- **Previous Verified Baseline**: **348 PASSED, 0 FAILED**.
- Enforces all 35 explicit test cases across Historical Boundaries (1–8), Holdings & Valuation (9–13), FD & Insurance (14–18), Historical Limitations (19–22), Integrity & Security (23–30), and What-If Simulation (31–35).

---

## 4. Implementation File-by-File Plan

1. **Contracts**: `backend/src/contracts/familyOfficeContracts.ts`
2. **Repositories**: `backend/src/repositories/SQLitePriceRepository.ts`, `backend/src/repositories/SQLiteTransactionRepository.ts`
3. **Core Services**:
   - `backend/src/services/familyOffice/FinancialTimeMachineService.ts`
   - `backend/src/services/familyOffice/WhatIfSimulationEngine.ts`
4. **Controllers & Routes**:
   - `backend/src/controllers/TimeMachineController.ts`
   - `backend/src/routes/timeMachineRoutes.ts`
   - `backend/src/routes/index.ts`
5. **Test Suite**: `backend/src/__tests__/sprint8c3/financialTimeMachine.test.ts`
6. **Documentation**: `docs/FINANCIAL_TIME_MACHINE.md`, `prompts/Phase8C/SPRINT_8C_3_OUTPUT_REVIEW.md`, `SESSION_CONTEXT.md`, `AI_CHANGELOG.md`

---

## 5. Verification Plan

- **Automated Tests**: Run `npm test` verifying that the 348 existing tests continue to pass + all new Sprint 8C.3 invariant tests pass (0 failures).
- **TypeScript**: Run `npx tsc --noEmit` in both backend and frontend.
