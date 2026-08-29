# Sprint 8C.3: Financial Time Machine & Point-in-Time Reconstruction

## 1. Executive Summary

The **Financial Time Machine** introduces point-in-time financial state reconstruction into FamilyWealthOS, answering the core fiduciary question:
> *"What did FamilyWealthOS know about the family's financial position at a particular point in time (`asOfDate`)?"*

This plan outlines the architecture for deterministic, provenance-aware reconstruction across all family assets, liabilities, protection shield, goals, estate, and tax data without ever fabricating historical values, applying current market data retroactively, or violating the central fiduciary invariants of FamilyWealthOS.

---

## 2. Historical Data Availability & Fiduciary Invariants

### 2.1 Available vs Unavailable Historical Evidence
- **Available**: Exact transaction history (`transactions` table where `date <= asOfDate`), historical daily price time-series (`asset_prices` table), mathematical Fixed Deposit accrual (`calculateFixedDepositValuation`), active insurance policies (`insurance_policies` where `start_date <= asOfDate`), estate registrations (`wills`, `trusts`, `graph_edges`), and tax profiles per financial year.
- **Unavailable / Limitations**: Historical goal target changes (single-row schema), historical insurance surrender values, continuous real estate appraisals.
- **Core Fiduciary Invariants**:
  1. `SUM_ASSURED ≠ NET_WORTH`: Insurance coverage is protection, never added to reconstructed net worth.
  2. **No Future Leakage**: Data with `date > asOfDate` strictly excluded from reconstruction.
  3. **No Value Fabrication**: Unpriced assets explicitly tagged with provenance (`PRIOR_DATE_PROXY`, `KNOWN_ACQUISITION_COST`, `CALCULATED`, or `HISTORICAL_SOURCE_UNAVAILABLE`).

---

## 3. Provenance Hierarchy & Domain Reconstruction Matrix

```text
EVIDENCE HIERARCHY FOR ASSET VALUATION:
1. EXACT_HISTORICAL (Exact price in asset_prices on asOfDate)
   ↓
2. PRIOR_DATE_PROXY (Nearest prior price in asset_prices with date < asOfDate)
   ↓
3. KNOWN_ACQUISITION_COST (Weighted average purchase price from transactions)
   ↓
4. CALCULATED (Deterministic mathematical accrual e.g. Fixed Deposits)
   ↓
5. HISTORICAL_SOURCE_UNAVAILABLE / UNKNOWN (Zero units or no verifiable basis)
```

| Domain / Asset Type | Level 1: Exact Historical | Level 2: Prior Date Proxy | Level 3: Calculated | Level 4: Acquisition Cost | Unavailable / Unknown |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Stocks / MFs / US Stocks** | Exact closing price on `asOfDate` | Nearest prior price (`date < asOfDate`) within lookback window | N/A | Weighted avg buy price of un-sold units | `HISTORICAL_SOURCE_UNAVAILABLE` (0 units or no price/cost) |
| **Fixed Deposits** | Snapshot row in `asset_prices` | N/A | `calculateFixedDepositValuation` up to `asOfDate` | Cost basis if date before start | `KNOWN_ZERO` (if `asOfDate < startDate`) |
| **Bank Accounts / Cash** | Balance row in `asset_prices` on `asOfDate` | Nearest prior snapshot $\le$ `asOfDate` | Cumulative net transaction sum $\le$ `asOfDate` | N/A | `UNKNOWN` (if no transactions or snapshots) |
| **PPF / EPF / SSY / NPS** | Balance row in `asset_prices` on `asOfDate` | Nearest prior snapshot $\le$ `asOfDate` | Net cumulative contributions + recorded interest | Initial deposit cost basis | `HISTORICAL_SOURCE_UNAVAILABLE` |
| **Property / Real Estate** | Valuation row on `asOfDate` | Nearest prior appraisal in `asset_prices` | N/A | Acquisition transaction amount | `KNOWN_ACQUISITION_COST` / `UNKNOWN` |
| **Insurance Policies** | Active policy cover (`start_date <= asOfDate`) | N/A | N/A | N/A | `HISTORICAL_SOURCE_UNAVAILABLE` (Surrender Value) |
| **Liabilities** | Balance entry $\le$ `asOfDate` | Nearest prior balance | N/A | Initial principal loan amount | `KNOWN_ZERO` / `UNKNOWN` |

---

## 4. Architectural Decision: Dedicated Service (Option B)

We select **Option B: Dedicated `FinancialTimeMachineService`** in `backend/src/services/familyOffice/FinancialTimeMachineService.ts`.
- **Clean Separation of Concerns**: Isolates historical temporal reconstruction from real-time live digital twin operations.
- **Zero Risk of Regression**: Guarantees zero side-effects to existing callers of `DigitalTwinService` and preserves the 348 passing test baseline.
- **No Database Migration Required**: All required time attributes (`date`, `start_date`, `registered_at`, `created_at`) already exist in the SQLite database schema.

---

## 5. Proposed Changes

### 5.1 Contracts
- [familyOfficeContracts.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/contracts/familyOfficeContracts.ts): Refine `TimeMachineReconstructionSchema` and `ReconstructedAssetHoldingSchema` with `daysOfProxyLag`, `costBasis`, `unrealizedGainLoss`, and domain status breakdowns.

### 5.2 Repositories
- [SQLitePriceRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLitePriceRepository.ts): Add `findPriceOnDate(assetId, date)` and `findPriceAsOf(assetId, asOfDate)`.
- [SQLiteTransactionRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteTransactionRepository.ts): Add `findByAssetIdAsOf(assetId, asOfDate)`.

### 5.3 Core Service
- **[NEW]** `backend/src/services/familyOffice/FinancialTimeMachineService.ts`: Core point-in-time reconstruction engine, valuation hierarchy resolver, FD accrual, protection shield, and deterministic canonical state hashing.

### 5.4 Controller & Routes
- **[NEW]** `backend/src/controllers/TimeMachineController.ts`: REST handler for `GET /api/v1/family-office/time-machine`.
- **[NEW]** `backend/src/routes/timeMachineRoutes.ts`: Express route definitions.
- [index.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/index.ts): Mount `/family-office/time-machine`.

### 5.5 Test Suite
- **[NEW]** `backend/src/__tests__/sprint8c3/financialTimeMachine.test.ts`: 12 invariant test suites verifying exact pricing, proxy lag, cost fallback, FD calculation, zero future leakage, insurance valuation separation, pre-inception dates, deterministic hash, cross-family isolation, and sub-100ms benchmark.

---

## 6. Verification Plan

### Automated Tests
- Run `npm test` in `backend/` verifying **348 + 12 = 360 PASSED (0 FAILURES)**.
- Run `npx tsc --noEmit` in `backend/` and `frontend/` (0 errors).
