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
#### [MODIFY] `backend/src/contracts/familyOfficeContracts.ts`
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
#### [NEW] `backend/src/db/migrations/019_family_health_and_timeline.ts`

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
#### [NEW] `backend/src/repositories/SQLiteFamilyHealthRepository.ts`
- `saveSnapshot(snapshot: FamilyHealthSnapshotInput): FamilyHealthSnapshotRow`
- `getLatestSnapshot(familyId: number): FamilyHealthSnapshotRow | null`
- `getSnapshotHistory(familyId: number, limit?: number): FamilyHealthSnapshotRow[]`
- `findSnapshotByMonth(familyId: number, yearMonth: string): FamilyHealthSnapshotRow | null`

#### [NEW] `backend/src/repositories/SQLiteFamilyTimelineRepository.ts`
- `upsertEvent(event: TimelineEventInput): TimelineEventRow`
- `batchUpsertEvents(events: TimelineEventInput[]): void` (Atomic SQLite transaction)
- `getTimeline(familyId: number, filter?: TimelineQueryFilter): { events: TimelineEventRow[]; total: number }`
- `deleteBySource(sourceType: string, sourceId: string): void`
- `purgeFamilyTimeline(familyId: number): void`

---

## 3. Invariant Test Plan (Sprint 8C.0)

#### [NEW] `backend/src/__tests__/sprint8c0/contractsAndMigrations.test.ts`
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

- **Master Test Harness Integration**: Wire `runSprint8c0Tests` into `runTests.ts`.
- **Test Metric Standard**: Baseline **316** + Sprint 8C.0 tests = **316 + X tests**, 0 failures.
- **TypeScript Verification**: `backend` `npx tsc --noEmit` = 0 errors; `frontend` `npx tsc --noEmit` = 0 errors.
