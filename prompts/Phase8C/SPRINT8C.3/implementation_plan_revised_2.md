# Sprint 8C.3: Financial Time Machine, Point-in-Time Reconstruction & What-If Simulation Sandbox (Final Revised Plan)

## 1. Executive Summary & Core Time Semantics

The **Financial Time Machine** introduces point-in-time financial state reconstruction and what-if simulation into FamilyWealthOS, answering two core fiduciary questions:
1. **Historical Economic Reconstruction**: *"What was the family's verifiable financial and legal position as of a specific historical date (`asOfDate`), based on authoritative economic records effective on or before that date?"*
2. **What-If Simulation Sandbox**: *"What would the family's financial trajectory, retirement readiness, and tax efficiency look like under explicit hypothetical planning adjustments?"*

### 1.1 Core Time Semantics & Reconstruction Mode (R1)
Sprint 8C.3 implements **`HISTORICAL_ECONOMIC_STATE`** reconstruction. It reconstructs historical facts using authoritative records whose **business/economic effective dates** occurred on or before `asOfDate`. 

It explicitly does **not** claim full system-time/audit reconstruction of "what the database application knew on that calendar day", as system audit history is not available across all legacy tables.
- **`reconstructionMode`**: `'HISTORICAL_ECONOMIC_STATE'`
- **`knowledgeTimeStatus`**: `'NOT_FULLY_RECONSTRUCTABLE'`

---

## 2. Key Architecture & Fiduciary Invariants

### 2.1 Family-Scoped Repository Layer (R3, R18)
All price and transaction lookups strictly require `familyId` in SQL predicates to guarantee cross-family isolation at the query level:
- `SQLitePriceRepository.findPriceAsOf(familyId, assetId, asOfDate, assetClass, maxAgeDays)`
- `SQLiteTransactionRepository.findByAssetIdAsOf(familyId, assetId, asOfDate)`

### 2.2 Holdings & WAC Cost Basis Algorithm (R4, R5)
- Processes transactions `date <= asOfDate` in deterministic order (`ORDER BY date ASC, id ASC`).
- Reconstructs units: $\sum (\text{BUY} + \text{REINVEST} + \text{BONUS} - \text{SELL})$.
- Reconstructs Weighted Average Cost Basis (WAC) with proportional reduction on partial disposals.
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
- **Closed Scenario Catalogue**: `RECURRING_SIP_STEP_UP`, `ONE_TIME_LUMP_SUM_INVESTMENT`, `RETIREMENT_AGE_ADJUSTMENT`, `GOAL_CONTRIBUTION_REALLOCATION`, `TAX_REGIME_OPTIMIZATION_SCENARIO`.
- **Zero-Write Invariant**: Executes in-memory on deep-cloned state with **0 database writes**.
- **Tax Integration**: Calls authoritative `TaxCalculationEngine`. Missing tax data yields `INSUFFICIENT_DATA`, never fabricated ₹0 savings.

---

## 3. Proposed Changes

### 3.1 Contracts & Repositories
- [familyOfficeContracts.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/contracts/familyOfficeContracts.ts): Refine `TimeMachineReconstructionSchema`, `ReconstructedAssetHoldingSchema`, `DomainReconstructionStatusSchema`.
- [SQLitePriceRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLitePriceRepository.ts): Add family-scoped `findPriceAsOf`, `findPriceOnDate`, `findBatchPricesAsOf`.
- [SQLiteTransactionRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteTransactionRepository.ts): Add `findByAssetIdAsOf`, `findAllByFamilyAsOf`.

### 3.2 Core Services
- **[NEW]** `backend/src/services/familyOffice/FinancialTimeMachineService.ts`: Historical reconstruction engine, valuation hierarchy resolver, FD accrual, protection shield, and canonical state hashing.
- **[NEW]** `backend/src/services/familyOffice/WhatIfSimulationEngine.ts`: In-memory scenario sandbox.

### 3.3 Controller & Routes
- **[NEW]** `backend/src/controllers/TimeMachineController.ts`: REST controller for `GET /time-machine` and `POST /what-if`.
- **[NEW]** `backend/src/routes/timeMachineRoutes.ts`: Route definitions.
- [index.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/index.ts): Mount routes at `/family-office/time-machine`.

### 3.4 Invariant Test Suite
- **[NEW]** `backend/src/__tests__/sprint8c3/financialTimeMachine.test.ts`: 25 invariant test suites verifying all historical boundaries, valuation tiers, FD lifecycle, insurance net worth exclusion, What-If 0-write sandbox, cross-family SQL isolation, deterministic state hashing, and sub-1000ms performance benchmark.

---

## 4. Verification Plan

- **Automated Tests**: Run `npm test` verifying that the 348 existing tests continue to pass + all new Sprint 8C.3 invariant tests pass (0 failures).
- **TypeScript**: Run `npx tsc --noEmit` in both backend and frontend.
