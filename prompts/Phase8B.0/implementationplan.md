# Sprint 8B.0: Contracts, Correlation, Idempotency, Audit Hooks & Test Harness

This implementation plan establishes the architectural foundation and shared infrastructure for Phase 8B (**Family Office Intelligence**). It defines the strictly typed data contracts, request correlation, idempotency guarantees, fiduciary audit hooks, and a deterministic test harness before building the Digital Twin, Life Events, and Proactive AI engines.

---

## User Review Required

> [!IMPORTANT]
> **Zero Production Disruption**: Sprint 8B.0 introduces pure additive contracts, shared infrastructure, and test suites. It does **not** alter existing database tables or calculation engines (`NetWorthCalculationEngine.ts`, `TaxCalculationEngine.ts`, `ProtectionEngineService.ts`).

> [!NOTE]
> **Strict Dynamic Family Scoping**: All contracts and correlation middlewares require `familyId` at runtime (via authenticated session or `x-family-id`/`activeFamilyId`), strictly eliminating hardcoded family IDs.

---

## Proposed Changes

### Component 1: Data Contracts & Event Schemas (`backend/src/contracts/`)

Create strongly-typed Zod schemas and derived TypeScript interfaces for all Phase 8 domain models.

#### [NEW] [familyOfficeContracts.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/contracts/familyOfficeContracts.ts)
- **Envelope Contracts**:
  - `EventEnvelopeSchema`: Standard event wrapper containing `eventId`, `eventType`, `aggregateType`, `aggregateId`, `familyId`, `correlationId`, `causationId`, `timestamp`, `version`, and `payload`.
  - `ApiResponseEnvelopeSchema`: Standard API envelope matching existing frontend conventions.
- **Digital Twin Contracts**:
  - `LineageSchema`: Family members, legal entities, relationships.
  - `BalanceSheetSchema`: Gross assets, liabilities, net worth, emergency liquidity months, asset allocation breakdown.
  - `ProtectionShieldSchema`: Active term cover, HLV target, HLV gap, health floater adequacy, uninsured members list.
  - `TrajectorySchema`: Goal probabilities, retirement target corpus, projected retirement age, savings rate.
  - `GovernanceSchema`: 80C headroom, tax liability estimate, Will registration status, unassigned nominee count.
  - `DigitalTwinStateSchema`: Aggregated snapshot model with data completeness score ($0.0 - 1.0$).
- **Life Event Contracts**:
  - `LifeEventTypeEnum`: `CHILD_BIRTH`, `MARRIAGE`, `SALARY_INCREASE`, `JOB_CHANGE`, `HOME_PURCHASE`, `HOME_LOAN_CLOSURE`, `INSURANCE_MATURITY`, `RETIREMENT`, `DEATH_OF_MEMBER`, `MAJOR_INHERITANCE`.
  - `LifeEventDeclarationInputSchema`: Input contract for user-declared milestones.
  - `LifeEventCandidateSchema`: Contract for automated transaction/statement-detected milestones.
  - `LifeEventConsequenceSchema`: Multi-domain impact payload (Tax delta, HLV delta, Cashflow delta, Goal delta).
- **Proactive AI & Observer Contracts**:
  - `ObserverRuleCodeEnum`: `DRIFT_EQUITY_OVERWEIGHT`, `INSURANCE_RENEWAL_DUE`, `TAX_80C_OPPORTUNITY`, `EMERGENCY_FUND_DEFICIT`, `NOMINEE_REGISTRATION_GAP`, `EXCESS_IDLE_CASH`, `GOAL_OFF_TRACK_DRIFT`, `CONCENTRATION_SINGLE_STOCK`, `ESTATE_WILL_LAPSED`.
  - `ProactiveTriggerSchema`: Observer payload with trigger rule, evidence items, confidence score, urgency, and suggested action.
  - `CooldownRecordSchema`: Cooldown tracking contract preventing alert fatigue.
- **Explainability & Lineage Contracts**:
  - `ExplainabilityLineageSchema`: 5-Point Fiduciary Lineage payload (*Headline, Detailed Why, Authoritative Evidence, Calculation Engine/Formula, Freshness & Confidence*).

---

### Component 2: Request Correlation & Async Context (`backend/src/infrastructure/correlation/`)

Establish request-scoped correlation and causation tracking across async operations.

#### [NEW] [CorrelationContext.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/infrastructure/correlation/CorrelationContext.ts)
- Implements Node.js `AsyncLocalStorage<CorrelationStore>` to store:
  - `correlationId`: Unique request tracing ID (`req_...` or client-supplied `X-Correlation-ID`).
  - `causationId`: The parent event ID that caused this action.
  - `familyId`: Active runtime family ID.
  - `userId`: Authenticated user ID.
  - `timestamp`: Request start time.
- Provides helper functions:
  - `getCorrelationId()`: Returns active correlation ID or generates a fallback `corr_uuid()`.
  - `getFamilyId()`: Returns active runtime family ID.
  - `runWithContext(store, fn)`: Executes an async function within the correlation context.

#### [NEW] [correlationMiddleware.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/infrastructure/correlation/correlationMiddleware.ts)
- Express middleware:
  - Extracts or generates `X-Correlation-ID`.
  - Sets response header `X-Correlation-ID`.
  - Resolves `familyId` from `req.query.familyId`, `req.body.familyId`, `X-Family-ID` header, or `req.user.family_id`.
  - Wraps the request lifecycle in `CorrelationContext.runWithContext()`.

---

### Component 3: SQLite Idempotency Framework (`backend/src/infrastructure/idempotency/`)

Prevent duplicate side-effects (duplicate event declarations, duplicate recommendations, repeated actions) on mutating endpoints.

#### [NEW] [016_idempotency_keys.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/migrations/016_idempotency_keys.ts)
- Versioned SQLite migration creating `idempotency_keys` table:
  ```sql
  CREATE TABLE IF NOT EXISTS idempotency_keys (
    idempotency_key TEXT PRIMARY KEY,
    family_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    FOREIGN KEY (family_id) REFERENCES families(id)
  );
  CREATE INDEX IF NOT EXISTS idx_idempotency_family ON idempotency_keys(family_id);
  ```

#### [NEW] [SQLiteIdempotencyRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteIdempotencyRepository.ts)
- `findKey(key: string)`: Retrieves cached response if valid and not expired.
- `reserveKey(key: string, familyId: number, endpoint: string, requestHash: string, ttlSeconds: number)`: Atomically reserves key.
- `saveResponse(key: string, status: number, body: any)`: Stores completed response.
- `purgeExpiredKeys()`: Periodic garbage collection of expired keys.

#### [NEW] [idempotencyMiddleware.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/infrastructure/idempotency/idempotencyMiddleware.ts)
- Checks `Idempotency-Key` header on `POST`/`PUT` requests.
- Returns cached response immediately if already completed (`HTTP 200/201` with `X-Cache: IDEMPOTENT_HIT`).
- Rejects concurrent duplicate in-flight requests with `HTTP 409 Conflict`.

---

### Component 4: Fiduciary Audit Hooks & Event Bus (`backend/src/infrastructure/audit/`)

Create an in-process audit and event dispatching mechanism.

#### [NEW] [AuditHookService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/infrastructure/audit/AuditHookService.ts)
- Subscribes to life events, recommendation status changes, and simulation runs.
- Automatically writes structured audit records to `ai_audit_trail` with `correlation_id`, `family_id`, and `evidence_snapshot`.
- Dispatches domain events asynchronously without blocking HTTP response cycles.

---

### Component 5: Test Harness & Contract Validation (`backend/tests/sprint8b0/`)

Comprehensive test harness validating data contracts, async context propagation, idempotency replay, and audit hooks.

#### [NEW] [contracts.test.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/tests/sprint8b0/contracts.test.ts)
- Tests all Zod schemas against valid and invalid fixtures.
- Validates that missing required fields throw descriptive Zod validation errors.

#### [NEW] [correlation.test.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/tests/sprint8b0/correlation.test.ts)
- Tests `CorrelationContext` propagation across asynchronous promise chains and simulated nested service calls.

#### [NEW] [idempotency.test.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/tests/sprint8b0/idempotency.test.ts)
- Tests idempotent replay: second call with identical `Idempotency-Key` returns cached response without invoking handler.
- Tests mismatched request hash detection (`HTTP 422 Unprocessable Entity`).
- Tests TTL expiration.

#### [NEW] [auditHooks.test.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/tests/sprint8b0/auditHooks.test.ts)
- Tests that mutating events write valid audit records with matching correlation IDs.

---

## Verification Plan

### Automated Tests
1. Run backend unit tests:
   ```bash
   cd backend && npm test -- tests/sprint8b0/
   ```
2. Run full backend test suite to ensure zero regressions across existing 58 test files:
   ```bash
   cd backend && npm test
   ```
3. Run TypeScript typecheck:
   ```bash
   cd backend && npx tsc --noEmit
   ```

### Manual Verification
- Verify migration `016_idempotency_keys.ts` applies cleanly against SQLite `myworth.db`.
- Verify correlation IDs are attached to Express responses in development.
