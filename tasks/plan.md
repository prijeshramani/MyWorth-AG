# Implementation Plan: Sprint 8B.2 – Life Events Engine & Multi-Domain Consequence Propagation

## 1. Overview
Implement the **Life Events Engine (`LifeEventEngineService`)** for the Personal Family Office OS. In real family offices, major financial adjustments are triggered by Life Events (e.g., Childbirth, Marriage, Salary shifts, Home purchases, Loan closures, Retirement, Demise, Inheritance). This engine ingests/detects life milestones, evaluates deterministic multi-domain consequence propagation across Tax, Protection Shield, Cashflow, and Goals, and enforces an explicit human approval workflow before updating family plans.

---

## 2. Architecture Decisions & Boundaries

1. **State Baseline from Digital Twin**: Consequence evaluation consumes the authoritative point-in-time state from `DigitalTwinService.getDigitalTwin(familyId)`.
2. **Deterministic Mathematical Propagation**:
   - **Tax**: Computes deduction headroom delta ($\Delta \text{80C}$, $\Delta \text{24b}$, etc.) and regime recommendations (`OLD`, `NEW`, `UNCHANGED`).
   - **Protection Shield**: Computes Human Life Value (HLV) adjustments and term/health floater upgrades.
   - **Cashflow**: Computes monthly surplus/deficit shifts and SIP rebalancing recommendations.
   - **Goals & Trajectory**: Generates recommended milestone goals (e.g. Higher Education, Home Down Payment) and timeline shifts.
3. **Strict Human Fiduciary Gate**: Consequence recommendations are proposed with confidence metrics and require explicit user decision (`PROCESS` or `DISMISS`) before mutating downstream state.
4. **Auditability & Correlation**: Every life event transition dispatches structured audit events (`LIFE_EVENT_DECLARED`, `LIFE_EVENT_PROCESSED`, `LIFE_EVENT_DISMISSED`) with full `CorrelationContext` propagation.
5. **Dynamic Family Authorization**: Endpoints resolve family scope strictly from authenticated context with 403 enforcement against unauthorized client parameters.

---

## 3. Detailed Task List

### Phase 1: Database Migration & Repository Foundation
- [ ] **Task 1: SQLite Migration `017_life_events.ts`**
  - **Description:** Create `life_events` table with schema: `(id, family_id, event_type, event_title, event_date, status, confidence_pct, evidence_json, impact_summary_json, declared_by_member_id, created_at, updated_at)` and indexes on `(family_id, status)` and `(family_id, event_type)`.
  - **Files:** `backend/src/db/migrations/017_life_events.ts`
  - **Scope:** Small (1 file)
- [ ] **Task 2: Repository Layer `SQLiteLifeEventRepository.ts`**
  - **Description:** Implement repository with methods: `create`, `findById`, `findByFamilyId`, `updateStatus`, `updateImpactSummary`, `delete`.
  - **Files:** `backend/src/repositories/SQLiteLifeEventRepository.ts`
  - **Scope:** Small (1 file)

### Checkpoint: Database Foundation
- [ ] Migration runs cleanly on `npm run db:reset`
- [ ] Repository unit operations verified

---

### Phase 2: Core Life Events Engine & Multi-Domain Consequence Propagator
- [ ] **Task 3: Core Service `LifeEventEngineService.ts`**
  - **Description:** Implement `LifeEventEngineService` with:
    1. `declareLifeEvent(input)`: Validates input against `LifeEventDeclarationInputSchema`, persists to repository, evaluates initial consequences, and dispatches `LIFE_EVENT_DECLARED` event.
    2. `evaluateConsequences(eventId)`: Consumes `DigitalTwinService`, runs multi-domain consequence formulas (Tax, Protection, Cashflow, Goals) for the 10 catalog event types, and returns `LifeEventConsequence`.
    3. `detectCandidates(familyId)`: Pattern matching on recent transactions, member additions, and policy changes to detect prospective events with confidence score ($0-100\%$).
    4. `processLifeEvent(eventId, decision)`: Human fiduciary sign-off transition (`VERIFIED` $\to$ `PROCESSED` or `DISMISSED`) emitting `LIFE_EVENT_PROCESSED` audit event.
  - **Files:** `backend/src/services/familyOffice/LifeEventEngineService.ts`
  - **Scope:** Medium (2-3 files)

### Checkpoint: Core Propagation Engine
- [ ] Consequence formulas produce deterministic results for all 10 life event types.
- [ ] Audit event logging and correlation context propagation verified.

---

### Phase 3: REST API & Controller Layer
- [ ] **Task 4: Controller & Routes (`LifeEventController.ts` & `lifeEventRoutes.ts`)**
  - **Description:** Expose endpoints:
    - `POST /api/v1/family-office/life-events/declare` (With idempotency middleware)
    - `GET /api/v1/family-office/life-events` (List family events)
    - `GET /api/v1/family-office/life-events/:id/consequences` (Evaluate multi-domain impact)
    - `POST /api/v1/family-office/life-events/:id/process` (Human approval / execution)
    - `POST /api/v1/family-office/life-events/:id/dismiss` (Dismiss candidate)
  - **Files:** `backend/src/controllers/LifeEventController.ts`, `backend/src/routes/lifeEventRoutes.ts`, `backend/src/routes/index.ts`
  - **Scope:** Medium (3 files)

---

### Phase 4: Test Suite & Master Regression Harness
- [ ] **Task 5: Test Suite `backend/src/__tests__/sprint8b2/lifeEvents.test.ts`**
  - **Description:** Comprehensive unit and integration test suite:
    1. Event declaration & Zod validation.
    2. Multi-domain consequence calculations across Childbirth, Marriage, Salary Increase, Home Purchase, Loan Closure, Retirement, Demise, Inheritance.
    3. Candidate detection logic and confidence scoring.
    4. Human approval and state transition lifecycle (`DETECTED` $\to$ `VERIFIED` $\to$ `PROCESSED` / `DISMISSED`).
    5. Correlation context propagation & sanitized audit trail logging.
    6. Security scope isolation across families.
  - **Files:** `backend/src/__tests__/sprint8b2/lifeEvents.test.ts`, `backend/src/__tests__/runTests.ts`
  - **Scope:** Medium (2 files)

### Checkpoint: Master Test & Build Verification
- [ ] Master test runner passes with 0 regressions ($\ge 295$ total tests).
- [ ] Both frontend and backend pass `npx tsc --noEmit`.

---

## 4. Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :---: | :--- |
| **Arbitrary synthetic formulas** | High | Ground all consequence calculations strictly in existing tax laws (Sec 80C, 24b) and HLV protection standards. |
| **Unintended state mutations without consent** | Critical | Enforce strict read-only consequence simulation; mutations require explicit `POST /process` user sign-off. |
| **Cross-family data leaks** | Critical | Enforce authenticated active family resolution in controller; parameterize all SQL queries by `family_id = ?`. |

---

## 5. Verification Plan

- **Automated Tests**: `npm test` targeting $\ge 295$ passing assertions (Baseline: 269).
- **Type Checking**: `npx tsc --noEmit` on backend and frontend.
- **Documentation**: Update `SESSION_CONTEXT.md`, `AI_CHANGELOG.md`, and `docs/PHASE_8_ROADMAP.md`.
