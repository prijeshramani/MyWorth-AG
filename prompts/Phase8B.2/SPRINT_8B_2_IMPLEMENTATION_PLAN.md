# Sprint 8B.2 Revised Implementation Plan: Life Events Engine & Multi-Domain Consequence Propagation

> **Status:** 🟢 **FINAL APPROVED FOR EXECUTION** (Incorporates all 26 Architectural Review Guardrails)

---

## 1. Objective & Scope

### Objective
Implement the **Life Events Engine (`LifeEventEngineService`)** to ingest user declarations, detect prospective life event candidates from transaction/family changes, evaluate deterministic multi-domain consequence propagation across Tax, Protection Shield, Cashflow, and Goals against the `DigitalTwinState` baseline, and enforce an explicit human fiduciary approval workflow.

### Architectural Core
```
+----------------------------------------------------------------------------------------------------+
|                                      LIFE EVENT INPUT                                              |
|            (User Declaration / Ingestion Candidate Detection / Evidence Payload)                  |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                    DIGITAL TWIN BASELINE                                           |
|       (Point-in-Time State via `DigitalTwinService.getDigitalTwin(authorizedFamilyId)`)            |
|       - Provenance Captured: `baseline_state_hash`, `baseline_as_of`, `rule_version`               |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                               MULTI-DOMAIN CONSEQUENCE PROPAGATOR                                  |
|  +---------------------+  +--------------------+  +---------------------+  +--------------------+  |
|  | Tax Impact          |  | Protection Shield  |  | Cashflow Impact     |  | Goal Impact        |  |
|  | (Sec 80C, 24b, TDS) |  | (HLV Gap, Floater) |  | (Surplus/Deficit)   |  | (Milestone Shift)  |  |
|  +---------------------+  +--------------------+  +---------------------+  +--------------------+  |
|  - Deterministic Calculation: Zero invented values; missing facts yield UNKNOWN / INSUFFICIENT_DATA|
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                             HUMAN FIDUCIARY APPROVAL & AUDIT GATE                                  |
|            - Explicit User Decision (`PROCESS` / `DISMISS`)                                        |
|            - Process confirms evaluation; does NOT execute unconfirmed financial mutations        |
|            - Dispatches `LIFE_EVENT_PROCESSED` audit event via `AuditHookService`                  |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Invariant Rules & Architectural Guardrails

1. **Human-in-the-Loop Gate**: Consequence evaluation is read-only. `POST /process` confirms consequence evaluation, but does NOT silently execute mutations on real financial holdings, bank accounts, or tax accounts.
2. **Zero Invented Financial Values**: If event facts (e.g. loan tenure, salary bump amount) or baseline data are missing, return `null` with explicit `status: 'UNKNOWN'` or `'INSUFFICIENT_DATA'`, never synthetic placeholders.
3. **Versioned Tax Rule Integration**: Tax consequences call existing `TaxCalculationEngine` / `TaxApplicationService` logic with rule versions (`ruleVersion: '2026.1'`), rather than scattered hardcoded constants.
4. **Candidate Detection Evidence**: Candidate detection scans transaction and member patterns, producing candidates in `status: 'DETECTED'` with detection confidence decoupled from evidence completeness. Candidates never mutate financial state.
5. **Death of Member Safety Boundary**: `DEATH_OF_MEMBER` triggers emergency estate checklist generation only; strictly prohibits automated asset transfer or claim filing.
6. **Idempotency & Atomic State Transitions**: State transitions (`DETECTED` $\to$ `VERIFIED` $\to$ `PROCESSED` / `DISMISSED`) use SQLite transactions and the `SQLiteIdempotencyRepository`.
7. **Sanitized Fiduciary Audit**: Audit logs record metadata, event ID, state hash, rule version, and timestamp, omitting sensitive PII.

---

## 3. Database Schema Migration (`017_life_events.ts`)

```sql
CREATE TABLE IF NOT EXISTS life_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  status TEXT CHECK(status IN ('DETECTED', 'VERIFIED', 'PROCESSED', 'DISMISSED')) DEFAULT 'DETECTED',
  event_version INTEGER NOT NULL DEFAULT 1,
  declared_at TEXT NOT NULL,
  effective_date TEXT NOT NULL,
  declared_by_member_id INTEGER,
  confidence_pct REAL NOT NULL DEFAULT 100.0,
  evidence_completeness_pct REAL NOT NULL DEFAULT 100.0,
  event_payload_json TEXT NOT NULL DEFAULT '{}',
  evidence_payload_json TEXT NOT NULL DEFAULT '{}',
  impact_summary_json TEXT NOT NULL DEFAULT '{}',
  baseline_state_hash TEXT,
  baseline_as_of TEXT,
  rule_version TEXT DEFAULT '2026.1',
  calculation_version TEXT DEFAULT '1.0.0',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT,
  dismissed_at TEXT,
  dismiss_reason TEXT,
  FOREIGN KEY (family_id) REFERENCES families(id)
);

CREATE INDEX IF NOT EXISTS idx_life_events_family_status ON life_events(family_id, status);
CREATE INDEX IF NOT EXISTS idx_life_events_family_type ON life_events(family_id, event_type);
```

---

## 4. Implementation Structure & File Map

### Files to Create
1. `backend/src/db/migrations/017_life_events.ts`: Migration script creating `life_events` table and indexes.
2. `backend/src/repositories/SQLiteLifeEventRepository.ts`: SQLite repository for life event CRUD, status updates, and provenance retrieval.
3. `backend/src/services/familyOffice/LifeEventEngineService.ts`: Core service for declaration, candidate detection, 10-event consequence propagation, and approval transitions.
4. `backend/src/controllers/LifeEventController.ts`: REST API controller with authorized family resolution and error mappings.
5. `backend/src/routes/lifeEventRoutes.ts`: Express routes for `/api/v1/family-office/life-events`.
6. `backend/src/__tests__/sprint8b2/lifeEvents.test.ts`: Comprehensive test suite testing all 10 event types, consequence formulas, human approval, and security isolation.
7. `docs/LIFE_EVENTS_ARCHITECTURE.md`: Technical architecture specification.
8. `docs/LIFE_EVENTS_CONSEQUENCE_MATRIX.md`: Complete consequence formula reference.
9. `docs/LIFE_EVENTS_DATA_MODEL.md`: Complete entity and DTO specifications.

### Files to Modify
1. `backend/src/routes/index.ts`: Register `lifeEventRouter`.
2. `backend/src/__tests__/runTests.ts`: Wire `runLifeEventsTests()`.
3. `SESSION_CONTEXT.md`, `AI_CHANGELOG.md`, `docs/PHASE_8_ROADMAP.md`: Status documentation updates.
