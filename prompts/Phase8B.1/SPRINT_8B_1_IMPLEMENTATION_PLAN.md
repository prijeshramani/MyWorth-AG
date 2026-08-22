# Sprint 8B.1 Final Implementation Plan: Digital Twin Foundation & State Hydration

> **Status:** 🟢 **FINAL APPROVED FOR EXECUTION** (Incorporates all Second-Round Architectural Review Clarifications)

---

## 1. Objective & Scope

### Objective
Implement the **Family Digital Twin Foundation (`DigitalTwinService`)** to orchestrate and hydrate a unified, computable, point-in-time semantic projection of a family's multi-domain financial reality from authoritative SQLite tables, deterministic calculation engines, and the Knowledge Graph, conforming strictly to the Sprint 8B.0 data contracts.

### Architectural Core
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
|    - Authenticated Family Scope Resolution (Zero client override)                                  |
|    - 5-Pillar Semantic State Hydration with Domain Failure Isolation                               |
|    - Deterministic Multi-Domain Completeness Model ($S_{comp} \in [0, 100]$)                       |
|    - Canonical State Hash ($H_{\text{state}}$ excluding volatile metadata)                        |
|    - Point-in-Time Freshness (`asOf`, `generatedAt`, `sourceFreshness`)                            |
|    - Deduplicated, Sanitized Fiduciary Audit Dispatch (`AuditHookService`)                         |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+--------------------------------------------------+
|                           CONSUMERS & DOWNSTREAM AGENTS                                            |
|  +---------------------+  +--------------------+  +---------------------+  +--------------------+  |
|  | Life Events Engine  |  | Proactive Observer |  | Fiduciary AI Advisor|  | REST API / UI      |  |
|  | (Sprint 8B.2)       |  | (Sprint 8B.3)      |  | (Phase 8C)          |  | (/api/v1/...)      |  |
|  +---------------------+  +--------------------+  +---------------------+  +--------------------+  |
+-------------------------------------------------+--------------------------------------------------+
```

### Strict Non-Goals & Boundaries
1. **NO Second Financial Database**: The Digital Twin is a derived, in-memory semantic projection. It does NOT persist duplicate balance sheets or transaction ledgers.
2. **NO Modification to Existing Calculation Engines**: Portfolio valuation, XIRR, Indian Tax rules, HLV formulas, Monte Carlo models, and estate readiness algorithms are consumed strictly as-is.
3. **NO Synthetic / Artificial Fallback Values**: Missing data results in explicit `null`, `UNKNOWN`, or `INSUFFICIENT_DATA`. Absolutely no arbitrary ₹2.5 Cr HLV defaults or synthetic placeholder names.
4. **NO Coupling to UI Application Aggregators**: `DigitalTwinService` depends on domain repositories and core engines, NOT `DashboardApplicationService`.
5. **NO Coupling to Conversational AI Memory**: `AIMemoryService` is decoupled; Digital Twin represents deterministic financial facts only.

---

## 2. Dynamic Family Scope & Security Model

```text
[Authenticated HTTP Request / Context]
         ↓
[Authorization / Active Family Resolver]
         ↓
[Authorized activeFamilyId]
         ↓
[DigitalTwinService.getDigitalTwin(authorizedFamilyId)]
```

- **Scope Authority**: `authorizedFamilyId` is resolved strictly from authenticated user context / session (`CorrelationContext` or `req.user.activeFamilyId`).
- **Zero Client Override**: Normal user requests cannot pass arbitrary `?familyId=X` to access unauthorized family data. Any attempt to access unauthorized families is rejected with `403 Forbidden`.
- **Zero Cross-Family Leaks**: All queries in downstream repositories are strictly parameterized by `family_id = ?`.

---

## 3. Data Source-of-Truth & State Hydration Matrix

| Digital Twin Dimension & Field | Authoritative Source Table / Service | Calculation Engine Reused | Freshness Indicator | Nullable / Missing Data Behaviour |
| :--- | :--- | :--- | :--- | :--- |
| **Lineage.familyId** | `families.id` via `SQLiteFamilyRepository` | Direct DB lookup | Real-time | Throws `NotFoundError` if family does not exist |
| **Lineage.familyName** | `families.name` via `SQLiteFamilyRepository` | Direct DB lookup | Real-time | Returns `null` if empty; status `INSUFFICIENT_DATA` |
| **Lineage.members** | `family_members` JOIN `entities` | `SQLiteFamilyMemberRepository` | Real-time | Returns empty array `[]` (Completeness penalty) |
| **BalanceSheet.totalAssetsINR** | `assets` + `asset_prices` + `holdings` | `NetWorthEngine` | `latestPriceDate` | Returns `0.00` with status `'CONFIRMED'` if 0 assets; `null` if pricing missing |
| **BalanceSheet.totalLiabilitiesINR** | `liabilities` repository (or `0.00` if verified) | Deterministic summation | Real-time | Returns `0.00` if verified no debt; `null` if unconfigured |
| **BalanceSheet.netWorthINR** | $\text{totalAssets} - \text{totalLiabilities}$ | `NetWorthEngine` | Real-time | Derived from asset & liability values |
| **BalanceSheet.assetAllocation** | `assets` grouped by `type` | `PortfolioAnalyticsEngine` | Real-time | Returns `[]` |
| **BalanceSheet.liquidCashINR** | `assets.type IN ('BANK', 'SAVINGS', 'CASH')` | `NetWorthEngine` | Real-time | Sum of liquid accounts or `0.00` |
| **ProtectionShield.totalLifeCoverINR** | `insurance_policies` WHERE `status = 'ACTIVE'` | `InsuranceService` / Policy Repo | Real-time | Returns `0.00` if no active policies |
| **ProtectionShield.hlvRequirementINR** | Member annual income $\times 10-15$ | `ProtectionEngine` / HLV Standard | Dynamic | **`null` with status `'UNKNOWN'` if income is missing** (Zero fallback) |
| **ProtectionShield.termInsuranceGapINR** | $\max(0, \text{HLV} - \text{Cover})$ | `ProtectionEngine` | Real-time | **`null` with status `'UNKNOWN'` if HLV is unknown** |
| **ProtectionShield.isAdequatelyInsured** | $\text{totalLifeCover} \ge \text{HLV}$ | `ProtectionEngine` | Real-time | **`null` with status `'INSUFFICIENT_DATA'` if HLV unknown** |
| **ProtectionShield.nomineeCoveragePct** | Valid nominee verification on active policies | `InsuranceService` / Family Member Repo | Real-time | $0-100\%$ based on validated member linkages |
| **Trajectory.activeGoalsCount** | `financial_goals` WHERE `status = 'ACTIVE'` | `SQLiteGoalRepository` | Real-time | Returns `0` |
| **Trajectory.retirementReadinessPct** | `financial_goals.goal_type = 'RETIREMENT'` | `RetirementPlanningService` | Real-time | **`null` with status `'INSUFFICIENT_DATA'` if no retirement goal** |
| **Trajectory.emergencyFundMonths** | $\text{liquidCash} / (\text{monthlyExpenses})$ | `GoalPlanningService` | Real-time | **`null` with status `'INSUFFICIENT_DATA'` if expenses unknown** |
| **Governance.hasRegisteredWill** | `wills` WHERE `status = 'REGISTERED'` | `SQLiteEstateRepository` | Real-time | `false` if none, or status `'UNREGISTERED'` / `'DRAFT'` |
| **Governance.activeTrustsCount** | `trusts` WHERE `status = 'ACTIVE'` | `SQLiteEstateRepository` | Real-time | Returns integer count $\ge 0$ |
| **Governance.estateReadinessScore** | Will + Trust + Valid Nominee metrics | `EstateHealthService` | Real-time | Score $0-100$ |
| **GraphTopology.nodes & edges** | `graph_nodes` & `graph_edges` | `SQLiteKnowledgeGraphRepository` | Real-time sync | Returns active graph nodes and relationships |

---

## 4. Deterministic Data Completeness Model

### Conceptual Distinction
- **Data Completeness ($S_{\text{completeness}}$)**: Measures the **structural availability of essential profile information** across the 5 domains ($0-100\%$).
- **Financial Health**: Measures balance sheet strength, debt ratios, and diversification.
- **Evidence Confidence**: Measures the cryptographic/source proof of transactions (e.g. CAS statement vs manual entry).
- **AI Inference Confidence**: Measures LLM certainty during semantic reasoning.

### 5-Pillar Mathematical Formulation

$$S_{\text{completeness}} = 0.15 \times S_{\text{Lineage}} + 0.25 \times S_{\text{BalanceSheet}} + 0.25 \times S_{\text{Protection}} + 0.20 \times S_{\text{Trajectory}} + 0.15 \times S_{\text{Governance}}$$

#### Pillar Breakdown
1. **Lineage & KYC (15 pts)**:
   - At least 1 Family Member present: 5 pts
   - Head of Family declared with known DOB/Age: 5 pts
   - Valid PAN or Tax ID on record: 5 pts
2. **Balance Sheet & Assets (25 pts)**:
   - At least 1 Asset holding recorded: 10 pts
   - At least 1 Bank/Liquid account mapped: 5 pts
   - Recent asset valuation / price history available: 10 pts
3. **Protection Shield (25 pts)**:
   - Active, in-force Term/Life policy present (`status = 'ACTIVE'`): 10 pts
   - Active Health insurance policy present: 10 pts
   - Validated nominee mapped for all active policies: 5 pts
4. **Trajectory & Goals (20 pts)**:
   - At least 1 active Financial Goal configured: 10 pts
   - Retirement goal or target age configured: 5 pts
   - Monthly expenses or savings rate defined: 5 pts
5. **Governance & Estate (15 pts)**:
   - Will status declared (`REGISTERED`, `DRAFT`, `NONE`): 8 pts
   - Estate succession profile / Trust status initialized: 7 pts

#### Status Categorization
- **$S_{\text{completeness}} \ge 80\%$**: `COMPLETE`
- **$50\% \le S_{\text{completeness}} < 80\%$**: `PARTIAL`
- **$S_{\text{completeness}} < 50\%$**: `INSUFFICIENT_DATA`

---

## 5. Canonical State Hash & Point-in-Time Semantics

### Canonical State Hash Formulation
The state hash $H_{\text{state}}$ guarantees determinism across identical underlying financial realities:
1. **Excluded Volatile Metadata**: Excludes `generatedAt`, `correlationId`, `requestId`, `executionTimeMs`, `snapshotId`.
2. **Deterministic Canonicalization**:
   - Keys sorted lexicographically.
   - Array elements sorted by entity ID (e.g. member IDs, asset IDs, policy IDs).
   - Numerical values formatted to standard precision.
3. **Hash Function**: Standard SHA-256 over the canonical JSON string.

### Point-in-Time & Freshness Semantics
- **`generatedAt`**: The exact ISO timestamp when the `DigitalTwinService` hydrated the state.
- **`asOf`**: The effective financial state date (defaults to current date for real-time reads).
- **`sourceFreshness`**: Explicit object tracking timestamps per source:
  - `latestPriceDate`: Timestamp of newest asset price in database.
  - `latestTransactionDate`: Timestamp of newest imported transaction.
  - `latestPolicySyncDate`: Timestamp of newest insurance policy update.
  - `latestGraphSyncDate`: Timestamp of newest Knowledge Graph node/edge mutation.

---

## 6. Optional-Domain Failure Isolation

If any optional domain engine encounters a localized error or partial data failure (e.g. Goal projection service times out or has invalid parameters):
- `DigitalTwinService` will NOT crash the entire request.
- The affected dimension is gracefully hydrated with `status: 'UNAVAILABLE'` or `status: 'INSUFFICIENT_DATA'` and an explicit `errorReason`.
- Remaining pillars (e.g. BalanceSheet, Lineage, Protection) hydrate normally.

---

## 7. Fiduciary Audit & Deduplication Strategy

1. **Correlation Context**: Attached automatically from `CorrelationContext.getCorrelationId()`.
2. **Sanitized Payload**: Audit events record structural metadata only, omitting raw balances/PII:
   - `familyId`, `stateHash`, `completenessScore`, `completenessStatus`, `asOf`, `schemaVersion`.
3. **Deduplication Key**:
   $$\text{auditDeduplicationKey} = \text{familyId} + \text{":"} + \text{eventType} + \text{":"} + \text{stateHash} + \text{":"} + \text{asOf}$$
   Repeated hydrations with identical deduplication key suppress duplicate audit log writes.

---

## 8. Performance Budget

- **Hydration Latency Budget**: p95 $\le 500$ms on development machine for the real Family 6 dataset (38 assets, 8,005 transactions, graph nodes/edges).

---

## 9. Implementation File Structure

### Files to Create
1. `backend/src/services/familyOffice/DigitalTwinService.ts`: Core orchestration service.
2. `backend/src/controllers/DigitalTwinController.ts`: Express controller with authorized family resolution.
3. `backend/src/routes/digitalTwinRoutes.ts`: Express router for `/api/v1/family-office/digital-twin`.
4. `backend/src/__tests__/sprint8b1/digitalTwin.test.ts`: Comprehensive test suite.

### Files to Modify
1. `backend/src/routes/index.ts`: Register `digitalTwinRoutes`.
2. `backend/src/__tests__/runTests.ts`: Integrate `runDigitalTwinTests()`.
3. `SESSION_CONTEXT.md`, `AI_CHANGELOG.md`, `docs/PHASE_8_ROADMAP.md`: Documentation updates.
