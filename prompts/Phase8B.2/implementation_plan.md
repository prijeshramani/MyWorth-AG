# Sprint 8B.2 Implementation Plan: Life Events Engine & Multi-Domain Consequence Propagation

## User Review Required

> [!IMPORTANT]
> **Fiduciary Human-in-the-Loop Guarantee**:
> In Sprint 8B.2, life event consequence propagation operates in **read-only simulation mode** by default. Rebalancing recommendations, goal modifications, and insurance adjustments require **explicit user confirmation (`POST /process`)** before altering any long-term family plans.

---

## 1. Objective & Architectural Scope

1. **Life Events Engine (`LifeEventEngineService`)**:
   - Ingests user declarations and detects prospective life event candidates.
   - Evaluates deterministic consequence propagation across **Tax**, **Protection Shield**, **Cashflow**, and **Goals & Trajectory**.
   - Consumes point-in-time state from `DigitalTwinService.getDigitalTwin(authorizedFamilyId)`.
2. **Deterministic Consequence Matrix**:
   - Covers all 10 catalog event types (`CHILD_BIRTH`, `MARRIAGE`, `SALARY_INCREASE`, `JOB_CHANGE`, `HOME_PURCHASE`, `HOME_LOAN_CLOSURE`, `INSURANCE_MATURITY`, `RETIREMENT`, `DEATH_OF_MEMBER`, `MAJOR_INHERITANCE`).
3. **Auditability & Correlation**:
   - Dispatches `LIFE_EVENT_DECLARED`, `LIFE_EVENT_PROCESSED`, and `LIFE_EVENT_DISMISSED` audit events via `AuditHookService`.

---

## 2. Proposed Changes

### [Database & Repositories]
#### [NEW] [017_life_events.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db/migrations/017_life_events.ts)
- Creates `life_events` table with index on `(family_id, status)` and `(family_id, event_type)`.

#### [NEW] [SQLiteLifeEventRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteLifeEventRepository.ts)
- Implements CRUD operations, status filtering, and impact summary persistence.

---

### [Services & Core Engine]
#### [NEW] [LifeEventEngineService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/familyOffice/LifeEventEngineService.ts)
- `declareLifeEvent(input)`: Validates and persists life event declarations.
- `evaluateConsequences(eventId)`: Evaluates multi-domain impacts conforming to `LifeEventConsequenceSchema`.
- `detectCandidates(familyId)`: Discovers unconfirmed milestone candidates from transaction and account patterns.
- `processLifeEvent(eventId, decision)`: Executes user-confirmed consequences and dispatches fiduciary audit events.

---

### [API & Controllers]
#### [NEW] [LifeEventController.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/controllers/LifeEventController.ts)
- `POST /api/v1/family-office/life-events/declare`
- `GET /api/v1/family-office/life-events`
- `GET /api/v1/family-office/life-events/:id/consequences`
- `POST /api/v1/family-office/life-events/:id/process`
- `POST /api/v1/family-office/life-events/:id/dismiss`

#### [NEW] [lifeEventRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/lifeEventRoutes.ts)
- Express router for `/api/v1/family-office/life-events`.

#### [MODIFY] [routes/index.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/index.ts)
- Mounts `lifeEventRouter`.

---

## 3. Verification Plan

### Automated Unit & Regression Tests
- Create `backend/src/__tests__/sprint8b2/lifeEvents.test.ts`:
  1. **Event Declaration Validation**: Validates Zod schema parsing and database persistence.
  2. **10-Event Consequence Propagation**: Validates deterministic consequence output for Childbirth, Marriage, Salary Increase, Home Purchase, Loan Closure, Retirement, Demise, Inheritance.
  3. **Candidate Detection & Confidence**: Validates detection heuristics and confidence metrics.
  4. **Human Approval Workflow**: Validates status transitions (`DETECTED` $\to$ `VERIFIED` $\to$ `PROCESSED` / `DISMISSED`).
  5. **Sanitized Fiduciary Audit Logging**: Validates event dispatching to `ai_audit_trail`.
  6. **Security & Family Scope Isolation**: Validates 403 rejection on unauthorized family requests.
  7. **Master Regression Test Pass**: Full test suite passes with $\ge 295$ assertions (0 regressions from 269 baseline).

### Static Type Safety
- `backend`: `npx tsc --noEmit` $\rightarrow$ 0 errors.
- `frontend`: `npx tsc --noEmit` $\rightarrow$ 0 errors.
