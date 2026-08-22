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



---

# ChatGPT Review Comments – Second Review

## Overall Verdict

**Status: 🟢 APPROVED WITH MINOR REQUIRED CLARIFICATIONS**

The revised plan successfully addresses the major concerns from the first review:

- Artificial HLV fallback removed.
- Synthetic family-name fallback removed.
- Strict family authorization is now explicitly stated.
- DashboardApplicationService coupling removed.
- AIMemoryService coupling removed.
- Point-in-time metadata and deterministic `stateHash` introduced.
- Fiduciary audit payload sanitized.

These are the correct architectural corrections.

However, I recommend **one final revision before implementation** because a few important details are still ambiguous.

---

## 1. CRITICAL – API Family Scope Is Still Contradictory

The plan says:

> "Family scope is derived from authenticated context/session. Client query parameters cannot establish scope."

But the controller section still says:

> "Validates runtime `familyId` against authenticated session boundaries."

This wording leaves open the possibility that the client supplies `familyId` and the server validates it.

### Required model

Prefer:

```text
Authenticated Request
        ↓
Authorized Active Family Context
        ↓
DigitalTwinService
        ↓
DigitalTwinState
```

The client should NOT be able to select an arbitrary family ID.

If a query parameter is retained for administrative/internal use, explicitly state that it is ignored for normal user requests and can only be used through a separately authorized administrative path.

### Acceptance criterion

A normal authenticated request without a client-supplied family ID resolves the active family automatically.

A request attempting to supply another family ID must not change the resolved scope.

---

# 2. CRITICAL – `stateHash` Determinism Needs a Canonicalization Rule

The plan correctly introduces a deterministic `stateHash`, but deterministic hashing requires an explicit canonical representation.

Define:

- Stable property ordering
- Stable array ordering
- Normalized numeric representation
- Normalized date/time representation
- Excluded volatile fields

For example:

```text
stateHash input MUST exclude:

generatedAt
correlationId
requestId
executionTime
audit metadata
```

Otherwise two identical financial states could produce different hashes.

### Required test

```text
Same authoritative state
+
Different request
+
Different correlationId
+
Different generatedAt

=> identical stateHash
```

---

# 3. IMPORTANT – Define `asOf` Precisely

The plan introduces:

- `generatedAt`
- `asOf`
- source freshness dates

Good, but these represent different concepts.

Define:

### `generatedAt`
When the Digital Twin was constructed.

### `asOf`
The effective financial state timestamp/date represented by the projection.

### `sourceFreshness`
When each underlying source was last updated.

Example:

```text
generatedAt:
2026-08-22T17:00:00

asOf:
2026-08-22T16:59:58

marketPriceAsOf:
2026-08-22T16:00:00

insuranceDataAsOf:
2026-08-20
```

This distinction will be essential for the Financial Time Machine later.

---

# 4. IMPORTANT – Do Not Allow `null` to Become Ambiguous

The revised plan correctly uses `null` for missing HLV.

However, every nullable field should have explicit semantics.

For example:

```text
0
=
Known zero

null + UNKNOWN
=
Not enough information

null + NOT_AVAILABLE
=
Concept does not apply

null + STALE
=
Information exists but is too old
```

Do not make downstream AI infer the meaning of `null`.

Prefer a structured status where the distinction matters.

---

# 5. IMPORTANT – Completeness Score Needs Explicit Missing-Data Treatment

The revised plan retains the five-pillar completeness score, but the shortened implementation plan no longer shows the detailed scoring rules.

Please retain the original scoring matrix in the final implementation plan.

It should explicitly define:

- Pillars
- Weights
- Component checks
- Maximum points
- Missing-data behaviour
- `INSUFFICIENT_DATA` threshold
- `PARTIAL` threshold
- `COMPLETE` threshold

Also ensure:

> Completeness measures data availability, NOT financial health.

A family with poor finances but complete data can have high completeness.

A wealthy family with incomplete data can have low completeness.

These must never be conflated.

---

# 6. IMPORTANT – Empty Family Score Should Not Be Arbitrary

The test currently specifies:

> completeness < 30%

That is acceptable as a test expectation only if the scoring matrix mathematically guarantees it.

Do not create a special "empty family <30%" rule.

The test should calculate the score from the same production completeness algorithm.

---

# 7. IMPORTANT – Preserve the Source-of-Truth Matrix

The revised plan removed the detailed source-of-truth/hydration matrix that was present in the original implementation plan.

I strongly recommend restoring it.

For every Digital Twin field document:

```text
Digital Twin Field
↓
Authoritative Source
↓
Existing Service / Engine
↓
Freshness
↓
Missing Data Semantics
```

This matrix is one of the most valuable safeguards against accidentally introducing business logic into `DigitalTwinService`.

---

# 8. IMPORTANT – `DigitalTwinService` Must Not Recalculate Domain Metrics

The architecture now correctly says it consumes existing engines.

Make the implementation rule explicit:

```text
DigitalTwinService
    = orchestration + mapping + completeness

NOT

DigitalTwinService
    = financial calculation
```

Examples:

❌ Calculate net worth inside DigitalTwinService.

❌ Calculate HLV inside DigitalTwinService.

❌ Calculate XIRR inside DigitalTwinService.

❌ Calculate estate readiness inside DigitalTwinService.

Instead:

```text
Existing Engine
      ↓
DigitalTwinService
      ↓
Map result
      ↓
DigitalTwinState
```

---

# 9. IMPORTANT – Audit Deduplication Needs a Deterministic Key

The plan says:

> "Sanitized, Deduplicated Fiduciary Audit Dispatch"

Good, but define how deduplication works.

Recommended:

```text
auditDeduplicationKey =
familyId
+
eventType
+
stateHash
+
asOf
```

If the same Digital Twin state is hydrated repeatedly:

```text
Same family
Same stateHash
Same asOf
Same event type
```

do not create unnecessary audit noise.

But if stateHash changes, a new event should be allowed.

---

# 10. IMPORTANT – Audit Event Should Not Become a Financial Snapshot

It is good that raw net worth is removed.

Keep the audit payload limited to metadata such as:

```text
familyId
eventType
stateHash
snapshotId (if applicable)
completenessScore
asOf
correlationId
actor
timestamp
```

Do not gradually add:

- portfolio balances
- account balances
- individual policy amounts
- transaction data

to the audit record.

---

# 11. IMPORTANT – Snapshot Contract Needs Explicit Position

The architecture describes:

> "In-Memory Snapshot Contract"

That is appropriate for 8B.1.

Explicitly state:

> No persistent Digital Twin snapshot table is introduced in 8B.1.

If a future persistent snapshot is required for the Financial Time Machine, that will be designed separately in Phase 8C.

This prevents premature historical persistence.

---

# 12. API Design Should Use Existing Response Conventions

The revised plan no longer shows the response envelope.

Before implementation, verify the existing API response/error conventions.

Do not introduce:

```text
ApiResponseEnvelope<DigitalTwinState>
```

if the application already has a standard response contract.

Reuse existing:

- Success envelope
- Error envelope
- HTTP status conventions
- Validation middleware
- Authentication middleware
- Correlation middleware

---

# 13. Testing – Add Three Important Cases

The current test list is good. Add:

### A. State Hash Stability

Same state with different:

- correlationId
- generatedAt
- request ID

must produce the same hash.

### B. Stale Source

Example:

```text
Portfolio price:
current

Insurance:
updated 30 days ago
```

Digital Twin must expose source freshness rather than pretending all data is equally current.

### C. Engine Failure Isolation

If one optional domain engine fails:

```text
Portfolio ✅
Insurance ✅
Goals ❌
Estate ✅
```

the Digital Twin should return a controlled partial state with explicit domain status rather than crash the entire request.

This is important for a Family Office command center.

---

# 14. Performance – Add a Hydration Budget

The current plan does not specify a performance target.

Given the current dataset:

- 38 assets
- 8,005 transactions
- Knowledge Graph
- Multiple domain engines

define an initial target such as:

> Digital Twin hydration p95 ≤ 500ms for the current Family 6 dataset on the development machine.

The target can be revised after measurement.

Do not optimize prematurely; measure first.

---

# 15. Real Family 6 Testing – Good, But Keep It as a Fixture

The plan correctly uses Family 6 for real multi-member testing.

However:

> Family 6 must never be hardcoded into production DigitalTwinService logic.

Use it only as:

- integration-test fixture
- local development validation
- regression dataset

Production code must remain family-agnostic.

---

# 16. Documentation Deliverables

After implementation, update:

- `SESSION_CONTEXT.md`
- `AI_CHANGELOG.md`
- `PHASE_8_ROADMAP.md`

Also add/update:

- `DIGITAL_TWIN_ARCHITECTURE.md`
- `DIGITAL_TWIN_DATA_SOURCE_MATRIX.md`

These will be useful when implementing Life Events and Proactive AI.

---

# 17. Acceptance Criteria – Strengthen It

The final acceptance criteria should include:

- [ ] No artificial financial fallback values
- [ ] No hardcoded family IDs
- [ ] No cross-family data leakage
- [ ] No changes to financial calculation engines
- [ ] No duplicate financial persistence
- [ ] Deterministic `stateHash`
- [ ] Explicit `generatedAt` / `asOf` semantics
- [ ] Source freshness exposed
- [ ] Completeness independent from financial health
- [ ] Audit events sanitized and deduplicated
- [ ] Existing API conventions reused
- [ ] 238-test baseline preserved
- [ ] New 8B.1 tests pass
- [ ] Performance benchmark recorded

---

# FINAL DECISION

## 🟢 Sprint 8B.1 Plan – APPROVED AFTER THESE MINOR REVISIONS

The Agent has correctly addressed the major architectural concerns from the first review.

I do NOT recommend another major redesign.

Please make the focused clarifications above, especially:

1. **Authenticated family scope instead of client-selected family ID**
2. **Canonical stateHash**
3. **Precise `asOf` semantics**
4. **Restore the source-of-truth matrix**
5. **Explicit completeness scoring**
6. **Audit deduplication key**
7. **Optional-domain failure isolation**
8. **Hydration performance target**

Then the Agent can proceed to implementation.

### Implementation principle

```text
SQLite
  ↓
Existing Deterministic Engines
  ↓
DigitalTwinService
  ├── Mapping
  ├── Completeness
  ├── Freshness
  ├── Provenance
  └── State Hash
  ↓
DigitalTwinState
  ↓
Future:
Life Events
Proactive AI
AI Context
```

**Do not let DigitalTwinService become a new calculation engine or a second financial database.**
