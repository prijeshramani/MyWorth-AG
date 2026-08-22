# Sprint 8B.1 Revised Implementation Plan: Digital Twin Foundation & State Hydration

## User Review Required

> [!IMPORTANT]
> **Key Architectural Revisions Incorporated**:
> 1. **Zero Artificial Fallbacks**: Removed ₹2.5 Cr HLV default and synthetic family names; missing data returns explicit `null` with status `'UNKNOWN'` or `'INSUFFICIENT_DATA'`.
> 2. **Strict Authorization Scope**: Family scope is derived from authenticated context/session. Client query parameters cannot establish scope.
> 3. **Decoupled Architecture**: `DigitalTwinService` depends directly on core domain engines (`NetWorthEngine`, `PortfolioAnalyticsEngine`, repositories), NOT on UI aggregators (`DashboardApplicationService`) or conversational memory (`AIMemoryService`).
> 4. **Point-in-Time Freshness & Provenance**: Added `generatedAt`, `asOf`, source freshness dates, and deterministic `stateHash`.
> 5. **Sanitized Fiduciary Audit**: Audit logs record metadata, snapshot IDs, and completeness scores, omitting raw net worth figures.

---

## 1. Digital Twin Architecture & Orchestration Flow

```
+----------------------------------------------------------------------------------------------------+
|                                    AUTHORITATIVE SOURCES OF TRUTH                                  |
|  +--------------------+  +----------------------+  +---------------------+  +--------------------+  |
|  | `family_members`   |  | `assets` / `holdings`|  | `insurance_policies`|  | `financial_goals`  |  |
|  | `entities` (HUFs)  |  | `asset_prices`       |  | `wills` / `trusts`  |  | `graph_nodes/edges`|  |
|  +--------------------+  +----------------------+  +---------------------+  +--------------------+  |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+--------------------------------------------------+
|                              DETERMINISTIC ENGINE ORCHESTRATION LAYER                              |
|  +---------------------+  +--------------------+  +---------------------+  +--------------------+  |
|  | `NetWorthEngine`    |  | `PortfolioAnalytics|  | `InsuranceService`  |  | `EstateHealth`     |  |
|  | (Valuation/Balances)|  | (Allocations/HHI)  |  | (Policy Analytics)  |  | (Readiness/Trusts) |  |
|  +---------------------+  +--------------------+  +---------------------+  +--------------------+  |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+--------------------------------------------------+
|                            DIGITAL TWIN SERVICE (`DigitalTwinService`)                              |
|    - Authorized Family Context Resolution (No client-driven authority)                             |
|    - 5-Pillar Semantic State Hydration (`DigitalTwinState`)                                        |
|    - Deterministic Multi-Domain Completeness Model ($S_{comp} \in [0, 100]$)                       |
|    - Point-in-Time Freshness & In-Memory Snapshot Contract (`stateHash`, `asOf`, `generatedAt`)    |
|    - Sanitized, Deduplicated Fiduciary Audit Dispatch (`AuditHookService`)                         |
+-------------------------------------------------+--------------------------------------------------+
```

---

## 2. Proposed Changes

### [Backend Services & Core Orchestration]

#### [NEW] [DigitalTwinService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/familyOffice/DigitalTwinService.ts)
- Hydrates the 5-pillar `DigitalTwinState` adhering to `familyOfficeContracts.ts`.
- Computes deterministic 5-pillar Data Completeness Score ($S_{\text{completeness}} \in [0, 100]$).
- Handles `null` / `UNKNOWN` semantics for missing data without synthetic fallbacks.
- Federates Knowledge Graph relationships (`OWNS`, `SPOUSE_OF`, `PARENT_OF`, `NOMINEE_FOR`).
- Injects active `correlationId` and dispatches sanitized `DIGITAL_TWIN_HYDRATED` audit event via `AuditHookService`.

#### [NEW] [DigitalTwinController.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/controllers/DigitalTwinController.ts)
- Handles `GET /api/v1/family-office/digital-twin` and `GET /api/v1/family-office/digital-twin/completeness`.
- Validates runtime `familyId` against authenticated session boundaries.

#### [NEW] [digitalTwinRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/digitalTwinRoutes.ts)
- Mounts `/api/v1/family-office/digital-twin` routes.

#### [MODIFY] [routes/index.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/index.ts)
- Mounts `digitalTwinRoutes`.

---

## 3. Verification Plan

### Automated Unit & Regression Tests
- Create `backend/src/__tests__/sprint8b1/digitalTwin.test.ts`:
  1. **Empty Family Isolation**: Hydration returns valid state with 0 balances, empty arrays, and completeness $< 30\%$ without throwing.
  2. **Missing Data Semantics**: Missing income returns `hlvRequirementINR: null`, `termInsuranceGapINR: null`, `adequacyStatus: 'UNKNOWN'`. No ₹2.5 Cr fallback.
  3. **Policy Status Filtering**: Only active policies counted in protection cover.
  4. **Real Multi-Member Hydration (Family 6)**: Generic logic consolidates assets, members, and allocations accurately.
  5. **Completeness Scoring**: Mathematical checks across all 5 sub-pillars.
  6. **Knowledge Graph Hydration**: Validates active nodes & directed edges federation.
  7. **Point-in-Time & Determinism**: Verifies identical `stateHash` for identical data.
  8. **Sanitized Fiduciary Audit Event**: Verifies `DIGITAL_TWIN_HYDRATED` event recorded in `ai_audit_trail` without logging raw net worth.
  9. **Security Scope Isolation**: Unauthorized family requests are rejected with `403 Forbidden`.
  10. **Master Regression Test Pass**: Full test suite passes with 0 regressions against the 238 baseline.
