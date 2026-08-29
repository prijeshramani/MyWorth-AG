# Implementation Plan: Sprint 8C.0 – Contracts, Zod Schemas & Database Migration 019

---

## 1. Executive Summary & Objective

**Sprint 8C.0** establishes the foundational data contracts, Zod validation schemas, SQLite database migration, and type-safe persistence repositories for **Phase 8C (Family Financial Health, Timeline Ledger, Financial Time Machine & Command Center)**.

### 🛡️ Scope & Architectural Boundaries (Foundation Only)
- **Included in Sprint 8C.0**:
  1. Authoritative Zod contracts & TypeScript types in `familyOfficeContracts.ts` for FFH Index, Timeline Events, Qualified Time Machine Reconstruction, and What-If Simulation.
  2. Database Migration `019_family_health_and_timeline.ts` defining `family_health_history` and `family_timeline_events` with composite performance indexes.
  3. Type-safe SQLite repositories: `SQLiteFamilyHealthRepository.ts` and `SQLiteFamilyTimelineRepository.ts`.
  4. Comprehensive Invariant Test Harness (`contractsAndMigrations.test.ts`) wired into `runTests.ts`.
- **Strict Non-Goals for Sprint 8C.0**:
  - ❌ No FFH calculation engine logic (deferred to Sprint 8C.1).
  - ❌ No Timeline multi-domain synchronization engine (deferred to Sprint 8C.2).
  - ❌ No Time Machine reconstruction or simulation engine (deferred to Sprint 8C.3).
  - ❌ No Frontend UI components (deferred to Sprint 8C.4).

---

## 2. Proposed Changes & Component Breakdown

### 📦 Component 1: Domain Contracts & Zod Schemas
#### [MODIFY] [familyOfficeContracts.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/contracts/familyOfficeContracts.ts)
Extend `familyOfficeContracts.ts` with comprehensive Phase 8C schemas:

1. **Family Financial Health (FFH) Contracts**:
   - `LifeStageEnum`: `'EARLY_CAREER' | 'FAMILY_EXPANSION' | 'WEALTH_PRESERVATION' | 'RETIREMENT'`.
   - `PillarStatusEnum`: `'COMPLETE' | 'PARTIAL' | 'KNOWN_ZERO' | 'UNKNOWN' | 'INSUFFICIENT_DATA' | 'NOT_APPLICABLE' | 'STALE'`.
   - `FFHPillarScoreSchema`: Sub-score (0–100), weighted contribution, weight percent, calculation version, pillar status, authoritative engine, and metrics breakdown.
   - `FamilyFinancialHealthSchema`: Overall score (0–100), life stage, weights configuration, 5-pillar scores (Protection, Liquidity, Goals, Estate, Tax/Data), state hash, delta vs previous snapshot (`absoluteDelta`, `percentDelta`, `pillarAttribution`), calculation version (`2026.1`), and as-of date.
   - `FamilyHealthSnapshotRowSchema`: Relational database model for `family_health_history`.

2. **Family Timeline Contracts**:
   - `TimelineDomainEnum`: `'PORTFOLIO' | 'PROTECTION' | 'TAX' | 'ESTATE' | 'GOAL' | 'LIFE_EVENT' | 'AI_DECISION'`.
   - `TimelineImportanceEnum`: `'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO'`.
   - `TimelineEventSchema`: `eventId`, `familyId`, `domain`, `eventType`, `sourceType`, `sourceId`, `title`, `description`, `amount`, `familyMemberId`, `eventDate`, `importanceTier`, `metadata`, `stateHash`, `createdAt`.
   - `TimelineQueryFilterSchema`: Zod schema for query parameters (`domain`, `familyMemberId`, `startDate`, `endDate`, `importanceTier`, `minAmount`, `limit`, `offset`).

3. **Financial Time Machine & What-If Contracts**:
   - `ValuationTypeEnum`: `'MARKET_PRICE' | 'NAV' | 'ACCRUED_VALUE' | 'BOOK_VALUE' | 'NOTIONAL' | 'UNKNOWN'`.
   - `ProvenanceTypeEnum`: `'EXACT_HISTORICAL' | 'PRIOR_DATE_PROXY' | 'CALCULATED' | 'KNOWN_ACQUISITION_COST' | 'HISTORICAL_SOURCE_UNAVAILABLE' | 'UNKNOWN'`.
   - `ReconstructedAssetHoldingSchema`: Asset ID, name, class, units, unit price, price date, valuation type, provenance, total market value, currency.
   - `TimeMachineReconstructionSchema`: Family ID, target date, net worth, assets breakdown, liabilities, completeness score, overall status (`COMPLETE` | `PARTIAL` | `INSUFFICIENT_DATA`), provenance summary, calculation version.
   - `WhatIfScenarioInputSchema`: Strict parameter validation (positive SIP amounts $\le ₹50\text{L}$, step-up $\% \in [0, 100]$, retirement age $\in [35, 80]$, loan prepayment $\ge 0$, authorized asset/goal IDs).
   - `WhatIfSimulationResultSchema`: Scenario ID, baseline state hash, baseline as of, applied parameters, comparative metrics (corpus at retirement, readiness %, gap delta, monthly benefit), scenario provenance.

---

### 🗄️ Component 2: Database Migration
#### [NEW] [019_family_health_and_timeline.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db/migrations/019_family_health_and_timeline.ts)

```sql
-- Migration 019: Family Health History & Timeline Events

-- 1. Family Financial Health History (Snapshots)
CREATE TABLE IF NOT EXISTS family_health_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  overall_score REAL NOT NULL,
  pillar_scores_json TEXT NOT NULL,
  life_stage TEXT NOT NULL,
  weights_json TEXT NOT NULL,
  completeness_score REAL NOT NULL,
  state_hash TEXT NOT NULL,
  calculation_version TEXT NOT NULL,
  as_of_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_health_hist_fam_date ON family_health_history(family_id, as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_hist_fam_hash ON family_health_history(family_id, state_hash);

-- 2. Family Timeline Events (Derived Read Model Index)
CREATE TABLE IF NOT EXISTS family_timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  event_id TEXT UNIQUE NOT NULL,
  domain TEXT CHECK(domain IN ('PORTFOLIO', 'PROTECTION', 'TAX', 'ESTATE', 'GOAL', 'LIFE_EVENT', 'AI_DECISION')) NOT NULL,
  event_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount REAL,
  family_member_id INTEGER,
  event_date TEXT NOT NULL,
  importance_tier TEXT CHECK(importance_tier IN ('CRITICAL', 'HIGH', 'MEDIUM', 'INFO')) DEFAULT 'MEDIUM',
  metadata_json TEXT,
  state_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timeline_fam_date ON family_timeline_events(family_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_fam_domain ON family_timeline_events(family_id, domain);
CREATE INDEX IF NOT EXISTS idx_timeline_source ON family_timeline_events(source_type, source_id);
```

---

### 🏛️ Component 3: Type-Safe Repositories
#### [NEW] [SQLiteFamilyHealthRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteFamilyHealthRepository.ts)
- `saveSnapshot(snapshot: FamilyHealthSnapshotInput): FamilyHealthSnapshotRow`
- `getLatestSnapshot(familyId: number): FamilyHealthSnapshotRow | null`
- `getSnapshotHistory(familyId: number, limit?: number): FamilyHealthSnapshotRow[]`
- `findSnapshotByMonth(familyId: number, yearMonth: string): FamilyHealthSnapshotRow | null`

#### [NEW] [SQLiteFamilyTimelineRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteFamilyTimelineRepository.ts)
- `upsertEvent(event: TimelineEventInput): TimelineEventRow`
- `batchUpsertEvents(events: TimelineEventInput[]): void` (Atomic SQLite transaction)
- `getTimeline(familyId: number, filter?: TimelineQueryFilter): { events: TimelineEventRow[]; total: number }`
- `deleteBySource(sourceType: string, sourceId: string): void`
- `purgeFamilyTimeline(familyId: number): void`

---

## 3. Invariant Test Plan (Sprint 8C.0)

#### [NEW] [contractsAndMigrations.test.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/sprint8c0/contractsAndMigrations.test.ts)
Dedicated test suite verifying:
1. **FFH Zod Schemas**: Correct validation of complete, partial, and missing data scores; rejection of out-of-bound weights or scores ($< 0$ or $> 100$).
2. **Timeline Zod Schemas**: Validation of event domains, date formats, and optional amounts.
3. **What-If Input Schemas**: Rejection of negative SIPs, extreme step-up $\% > 100\%$, and invalid ages.
4. **Migration 019 Execution**: Up migration executes cleanly; tables and composite indexes created.
5. **Health Repository CRUD**: Snapshot insertion, retrieval of latest, history pagination, and monthly deduplication query.
6. **Timeline Repository CRUD & Atomic Transactions**: Upsert, batch upsert inside transaction, filtering by domain, date range, member, and source deletion.
7. **Cross-Family Isolation**: Queries for family A strictly never return rows belonging to family B.

---

## 4. Verification & Baseline Integration

- **Master Test Harness Integration**: Wire `runSprint8c0Tests` into [runTests.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/runTests.ts).
- **Test Metric Standard**: Baseline **316** + Sprint 8C.0 tests (estimated ~15 tests) = **~331 tests**, 0 failures.
- **TypeScript Verification**: `backend` `npx tsc --noEmit` = 0 errors; `frontend` `npx tsc --noEmit` = 0 errors.


---

# ChatGPT Review Comments – Sprint 8C.0

## Review Status

**🟢 APPROVED WITH REQUIRED CORRECTIONS BEFORE CODING**

The Sprint 8C.0 plan is correctly scoped as a **foundation-only sprint**. It does not attempt to implement FFH calculations, timeline synchronization, Time Machine reconstruction, or UI.

The architecture is sound, but the following contract and persistence details should be corrected before implementation.

---

# 1. CRITICAL – Do Not Introduce Inconsistent Status Vocabulary

The plan proposes:

```text
PillarStatusEnum:
COMPLETE
PARTIAL
KNOWN_ZERO
UNKNOWN
INSUFFICIENT_DATA
NOT_APPLICABLE
STALE
```

and separately:

```text
ProvenanceTypeEnum:
EXACT_HISTORICAL
PRIOR_DATE_PROXY
CALCULATED
KNOWN_ACQUISITION_COST
HISTORICAL_SOURCE_UNAVAILABLE
UNKNOWN
```

This mixes **status**, **provenance**, and **data availability** concepts.

Keep these dimensions separate.

Recommended:

```text
Status:
COMPLETE
PARTIAL
KNOWN_ZERO
UNKNOWN
INSUFFICIENT_DATA
NOT_APPLICABLE
STALE

Provenance:
AUTHORITATIVE_SOURCE
CALCULATED
EXACT_HISTORICAL
PRIOR_DATE_PROXY
KNOWN_ACQUISITION_COST
HISTORICAL_SOURCE_UNAVAILABLE
```

Do not use provenance values as status values.

---

# 2. CRITICAL – `HISTORICAL_SOURCE_UNAVAILABLE` Should Not Be a Status

The Phase 8 architecture already uses:

```text
UNKNOWN
INSUFFICIENT_DATA
```

Keep that vocabulary consistent.

If historical data does not exist:

```text
status = INSUFFICIENT_DATA
provenance = HISTORICAL_SOURCE_UNAVAILABLE
```

or:

```text
status = UNKNOWN
provenance = HISTORICAL_SOURCE_UNAVAILABLE
```

Do not create a third competing semantic.

---

# 3. CRITICAL – Valuation Type Is Incomplete

The proposed:

```text
MARKET_PRICE
NAV
ACCRUED_VALUE
BOOK_VALUE
NOTIONAL
UNKNOWN
```

is useful, but it does not fully capture the Phase 8C asset-class requirements.

At minimum consider explicit distinction for:

```text
MARKET_VALUE
ACQUISITION_COST
LEDGER_BALANCE
SUM_ASSURED
SURRENDER_VALUE
NAV
ACCRUED_VALUE
BOOK_VALUE
UNKNOWN
```

Important:

**SUM_ASSURED must never automatically be interpreted as net-worth value.**

The contract should make valuation semantics explicit.

---

# 4. CRITICAL – Time Machine Contract Must Support Overall Completeness

`TimeMachineReconstructionSchema` should explicitly support:

```text
completenessScore
overallStatus
```

which the plan already includes.

Add a structured provenance/completeness summary so future UI can explain:

```text
Historical reconstruction: PARTIAL
Portfolio: COMPLETE
Property: UNKNOWN
Insurance cash value: INSUFFICIENT_DATA
```

Do not let a partial reconstruction appear to be a complete historical balance sheet.

---

# 5. IMPORTANT – FFH Contract Needs Explicit Pillar Status

`FFHPillarScoreSchema` should ensure each pillar carries:

```text
status
score
weight
weightedContribution
calculationVersion
authoritativeEngine
```

The overall FFH should also carry:

```text
overallStatus
completenessScore
```

This avoids interpreting `overallScore = 0` as either a genuine poor score or missing data.

---

# 6. CRITICAL – Migration 019 Needs Stronger Family Isolation

The SQL defines:

```sql
family_id INTEGER NOT NULL
```

which is good.

However, repository-level filtering alone should not be the only protection.

Every repository method must require family scope.

For example:

```text
getLatestSnapshot(familyId)
getSnapshotHistory(familyId)
findSnapshotByMonth(familyId)
getTimeline(familyId)
deleteBySource(familyId, sourceType, sourceId)
purgeFamilyTimeline(familyId)
```

### Important correction

`deleteBySource(sourceType, sourceId)` is unsafe because it does not include `familyId`.

It must become:

```text
deleteBySource(familyId, sourceType, sourceId)
```

This prevents a source identifier collision from affecting another family.

---

# 7. CRITICAL – `purgeFamilyTimeline()` Needs Explicit Authorization Boundary

The repository method is useful for tests/maintenance but dangerous as a generic application operation.

Document that:

```text
purgeFamilyTimeline()
```

is an internal maintenance/test operation and is never exposed directly through an API.

If it is required by production synchronization, define the authorization and transactional semantics explicitly.

---

# 8. IMPORTANT – Timeline Uniqueness Needs a Better Database Constraint

The current schema uses:

```sql
event_id TEXT UNIQUE
```

That is acceptable only if `event_id` is guaranteed globally deterministic.

Given the family-scoped architecture, prefer an explicit composite uniqueness model such as:

```text
UNIQUE(family_id, event_id)
```

or document why global uniqueness is guaranteed.

I recommend:

```sql
UNIQUE(family_id, event_id)
```

because it makes family isolation explicit at the database level.

---

# 9. IMPORTANT – Timeline Source Identity Needs a Database Index

The plan has:

```sql
idx_timeline_source(source_type, source_id)
```

Since all timeline operations are family-scoped, prefer:

```text
(family_id, source_type, source_id)
```

This improves both performance and isolation-oriented query design.

---

# 10. IMPORTANT – Health Snapshot Deduplication Needs a Database Constraint

The architecture specifies:

```text
same family
+
same stateHash
+
same calendar month
→ no duplicate snapshot
```

The repository currently proposes a query:

```text
findSnapshotByMonth()
```

That is not sufficient against concurrent writes.

### Required

Encode the invariant in SQLite where practical.

For example, introduce a persisted period field:

```text
snapshot_period = YYYY-MM
```

and a unique constraint such as:

```text
UNIQUE(family_id, snapshot_period, state_hash)
```

Then repository insertion becomes concurrency-safe.

---

# 11. IMPORTANT – Snapshot Materiality Threshold Does NOT Belong in 8C.0

The Phase 8C architecture defines a materiality threshold such as:

```text
|Δ Score| >= 2.5
```

That calculation belongs to Sprint 8C.1.

8C.0 should only preserve the contract required to store the result.

Do not implement scoring/materiality logic in the migration or repository layer.

---

# 12. IMPORTANT – Calculation Version Must Be Generic

The plan uses:

```text
calculationVersion = 2026.1
```

in the FFH contract.

That is acceptable as an initial version, but the foundation should not hardcode business-rule versions into persistence infrastructure.

Use a string/version field.

The actual version value should be owned by Sprint 8C.1.

---

# 13. IMPORTANT – Timeline `amount` Needs Semantic Definition

The contract has:

```text
amount
```

This is too generic.

Different timeline events can represent:

- transaction amount
- policy premium
- goal target
- tax deduction
- asset value

Do not let consumers assume all `amount` values have identical meaning.

At minimum document:

```text
amountType
currency
```

or make `amount` explicitly optional presentation metadata rather than a universal financial value.

---

# 14. IMPORTANT – Timeline Metadata Must Be Sanitized

`metadata` is flexible, but it creates a risk of accidentally putting sensitive financial data into the derived timeline.

Define a sanitized metadata contract.

Do not permit arbitrary:

```text
account number
PAN
full transaction payload
policy sensitive fields
```

inside timeline metadata.

---

# 15. IMPORTANT – Date Contract Must Be Standardized

The contracts should explicitly standardize date/time representation.

Prefer:

```text
ISO-8601 UTC timestamp
```

for timestamps and clearly distinguish:

```text
eventDate
createdAt
updatedAt
asOfDate
targetDate
```

Do not mix local date strings and UTC timestamps without documented semantics.

---

# 16. IMPORTANT – What-If Schema Must Not Authorize Cross-Family IDs

The plan correctly mentions:

> authorized asset/goal IDs

This authorization must not be encoded merely as:

```text
assetId: string
goalId: string
```

The service/repository layer must verify that referenced IDs belong to the authenticated family.

Zod validates structure; it does not establish authorization.

Document this explicitly.

---

# 17. IMPORTANT – What-If Contract Should Remain Strictly Input-Oriented

8C.0 should define the schema but not embed calculation assumptions.

For example:

```text monthlySipAmount <= ₹50L
retirementAge 35..80
```

These are useful safety bounds, but they are also business-policy assumptions.

Document them as validation limits/versioned configuration rather than silently treating them as financial truth.

---

# 18. IMPORTANT – Repository Transaction Boundaries

`batchUpsertEvents()` is correctly defined as atomic.

Also specify:

```text all events in one transaction
rollback entire batch on failure
no partial projection
```

For health snapshots, use atomic insert/deduplication semantics as well.

---

# 19. IMPORTANT – Repository Layer Must Remain Business-Logic Free

The repositories should only perform:

```text validation of persistence shape
CRUD
family filtering
transactions
mapping
deduplication constraints
```

They must NOT calculate:

- FFH scores
- life stage
- timeline importance
- Time Machine valuation
- What-If results

Those belong to later sprint services.

---

# 20. IMPORTANT – Test Plan Needs Explicit Cross-Family Mutation Tests

The current plan includes cross-family isolation.

Expand it to cover:

```text Family A read Family B
Family A update Family B
Family A delete Family B
Family A purge Family B
```

All must be impossible.

Also test source ID collisions:

```text Family A sourceId = 123
Family B sourceId = 123
```

Operations on A must never affect B.

---

# 21. IMPORTANT – Migration Safety Tests

Add tests for:

- migration from current schema
- migration executed twice
- rollback where supported
- existing data preserved
- indexes exist
- constraints exist
- empty database
- populated database

Do not only test that the migration creates tables.

---

# 22. IMPORTANT – Test Count

The plan says:

```text 316 + ~15 = ~331
```

Do not use `~331` as the target.

Use:

```text Previous baseline: 316
New Sprint 8C.0 tests: X
Current total: 316 + X
Failures: 0
```

The actual test count should be driven by invariant coverage.

---

# 23. IMPORTANT – Frontend TypeScript

Because Sprint 8C.0 contains no UI work, frontend TypeScript compilation should still be run as a regression check, but the sprint should not introduce frontend dependencies unnecessarily.

---

# 24. REQUIRED ACCEPTANCE CRITERIA

Sprint 8C.0 is accepted only when:

- [ ] Contracts are authoritative and Zod-backed.
- [ ] Status and provenance vocabularies are separated.
- [ ] Historical-source-unavailable semantics are consistent.
- [ ] Valuation types are explicit.
- [ ] Time Machine supports overall completeness/status.
- [ ] All repository methods require family scope.
- [ ] `deleteBySource` includes family scope.
- [ ] Timeline uniqueness is family-safe.
- [ ] Timeline source indexes are family-scoped.
- [ ] Health snapshot deduplication is concurrency-safe.
- [ ] No FFH business logic exists in 8C.0.
- [ ] No Timeline synchronization logic exists in 8C.0.
- [ ] No Time Machine calculation exists in 8C.0.
- [ ] No What-If calculation exists in 8C.0.
- [ ] Metadata is sanitized.
- [ ] Date/time semantics are standardized.
- [ ] What-If IDs are authorized by service layer.
- [ ] Repository operations are transactional where required.
- [ ] Cross-family read/write/delete isolation is tested.
- [ ] Migration safety is tested.
- [ ] Backend TypeScript = 0 errors.
- [ ] Frontend TypeScript = 0 errors.
- [ ] Master tests = 316 + X, 0 failures.

---

# FINAL DECISION

## 🟢 APPROVED WITH REQUIRED CORRECTIONS

The Sprint 8C.0 architecture is sound and appropriately bounded.

**Do not redesign it.**

Have the Agent incorporate the above corrections into the Sprint 8C.0 implementation plan, then it can proceed directly to implementation.

The most important protections are:

```text
Contracts
    ↓
Family-safe Persistence
    ↓
Invariant Tests
```

and NOT:

```text
Contracts
    ↓
Business Logic
    ↓
UI
```

Keep all FFH, Timeline, Time Machine and What-If business logic deferred to their respective sprints.
