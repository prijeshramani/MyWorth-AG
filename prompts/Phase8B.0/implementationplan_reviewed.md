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


---

# ChatGPT Architecture Review Comments

## Overall Verdict

**Status: 🟢 APPROVED WITH REQUIRED CHANGES BEFORE IMPLEMENTATION**

The Sprint 8B.0 plan is correctly positioned as the smallest reliable foundation before Digital Twin, Life Events, and Proactive AI.

The sequencing is right:

```text
Contracts
   ↓
Correlation
   ↓
Idempotency
   ↓
Audit
   ↓
Test Harness
```

However, I recommend addressing the following points before coding. These are mostly **contract and infrastructure hardening items**, not a redesign.

---

## 1. CRITICAL — Family Scope Resolution Must Be Unambiguous

The plan currently resolves `familyId` from:

1. `req.query.familyId`
2. `req.body.familyId`
3. `X-Family-ID`
4. `req.user.family_id`

This creates a potential security problem: a caller could supply a different family ID than the authenticated user's active family.

### Required rule

For authenticated requests:

```text
Authenticated Family Scope
        ↓
Authoritative
```

Client-supplied `familyId` must NEVER override the authenticated/authorized family scope.

If explicit family switching is supported, it must go through an existing authorization-controlled `activeFamilyId` mechanism.

Recommended resolution:

```text
Authenticated / authorized activeFamilyId
        ↓
CorrelationContext.familyId
```

Then validate any supplied family ID against that scope.

### Acceptance criterion

No API can access another family's data merely by changing:

```text
?familyId=
X-Family-ID
body.familyId
```

---

## 2. CRITICAL — Correlation IDs and Causation IDs Need Strict Semantics

The plan correctly introduces both IDs, but define their semantics explicitly.

### Correlation ID

Represents the complete business/request trace.

Example:

```text
User Request
   ↓
Life Event
   ↓
Recommendation
   ↓
Approval
```

All belong to the same `correlationId`.

### Causation ID

Represents the immediate event/action that caused the current event.

Example:

```text
TransactionImported
        ↓ causationId
SalaryIncreaseCandidate
        ↓ causationId
LifeEventConfirmed
        ↓ causationId
RecommendationCreated
```

Do not generate a new arbitrary `causationId` when there is no parent event.

Use `null` for root operations.

---

## 3. CRITICAL — Event Envelope Needs Idempotency Metadata

The proposed `EventEnvelopeSchema` should explicitly include:

```text
eventId
eventType
aggregateType
aggregateId
familyId
correlationId
causationId
idempotencyKey
occurredAt
recordedAt
schemaVersion
payload
```

Distinguish:

- `occurredAt` = when the domain event happened
- `recordedAt` = when FamilyWealthOS persisted/observed it

This will become essential for the Financial Time Machine and event replay.

---

## 4. CRITICAL — Event Versioning

The current `version` field is ambiguous.

Use explicit:

```text
schemaVersion
```

for the event contract.

Do not use one generic `version` field for both:

- event schema version
- business/entity version

Future migrations depend on this distinction.

---

## 5. IMPORTANT — API Envelope Must Not Be Forced Onto Existing APIs

The plan proposes `ApiResponseEnvelopeSchema`.

Be careful.

Sprint 8B.0 must remain non-disruptive.

Do NOT rewrite all existing API responses to the new envelope merely to standardize them.

Instead:

- Define the contract.
- Use it for new Phase 8 APIs.
- Migrate existing endpoints only through an explicit future compatibility plan.

This preserves the zero-production-disruption objective.

---

## 6. IMPORTANT — Idempotency Must Be Transactionally Safe

The plan says `reserveKey()` is atomic.

Please explicitly implement:

```text
BEGIN IMMEDIATE
    ↓
Check key
    ↓
Reserve key
    ↓
COMMIT
```

or the equivalent safe SQLite transaction.

Two concurrent requests must never both successfully reserve the same key.

Add a test that launches concurrent requests with the same key.

---

## 7. IMPORTANT — Idempotency Key Must Include Scope

The primary key is currently:

```text
idempotency_key TEXT PRIMARY KEY
```

I recommend either:

```text
PRIMARY KEY (family_id, idempotency_key)
```

or a unique index on both.

Why?

Because the same client-generated idempotency key should not collide across different family scopes.

This also reinforces the multi-family architecture.

---

## 8. IMPORTANT — Request Hash Must Be Canonical

The plan correctly detects mismatched request hashes.

But define how the hash is generated.

Do NOT hash raw JSON using naïve `JSON.stringify()` if property ordering can differ.

Use canonical serialization.

Hash should include at minimum:

```text
HTTP method
normalized endpoint
authorized family scope
canonical request body
relevant query parameters
```

Do NOT include:

- timestamps
- correlation IDs
- random request IDs

otherwise legitimate retries may incorrectly become hash mismatches.

---

## 9. IMPORTANT — Idempotency Lifecycle Needs Explicit States

The table currently infers state from `response_status`.

I recommend an explicit state:

```text
IN_FLIGHT
COMPLETED
FAILED
EXPIRED
```

This makes concurrent request handling and recovery much clearer.

Example:

```text
IN_FLIGHT
   ↓
COMPLETED

or

IN_FLIGHT
   ↓
FAILED
   ↓
Retry allowed
```

Do not permanently block a request because an earlier attempt crashed halfway through.

---

## 10. IMPORTANT — Cached Response Must Be Content-Type Safe

The cached response should preserve:

- status code
- response body
- content type
- relevant response headers

At minimum define whether only JSON APIs are supported.

For Sprint 8B.0, I recommend:

> Idempotency middleware supports JSON API responses only.

This keeps the infrastructure deterministic.

---

## 11. Audit Hook Must Not Silently Lose Audit Events

The plan says:

> "Dispatches domain events asynchronously without blocking HTTP response cycles."

This is good for latency, but dangerous for fiduciary auditability.

A financial audit record must not disappear because an in-process async callback failed.

### Required distinction

**Audit persistence = durable**

**Secondary event dispatch = asynchronous**

Recommended flow:

```text
Mutation
   ↓
Audit record persisted
   ↓
Transaction commits
   ↓
Async domain event dispatch
```

If the audit write fails, the mutation should fail where auditability is mandatory.

---

## 12. Audit Records Need Before/After State Where Appropriate

`evidence_snapshot` is good, but for state-changing operations add:

```text
beforeState
afterState
action
actor
reason
approvalId
```

where applicable.

Example:

```text
SIP
₹35,000
   ↓
₹50,000

Reason:
Salary Increase Life Event

Approved By:
User

Correlation:
corr_123
```

This becomes extremely valuable later for AI explainability.

---

## 13. Audit Schema Compatibility Must Be Verified Before Coding

The plan assumes `ai_audit_trail` supports:

```text
correlation_id
family_id
evidence_snapshot
```

Before implementation, inspect the existing schema.

If columns do not exist:

- document the required additive migration
- avoid silently changing the existing audit model
- preserve all current audit consumers

Do not assume the current schema from documentation.

---

## 14. Audit Hook Must Be Domain-Agnostic

Do not hardcode:

```text
life events
recommendations
simulations
```

into the core audit infrastructure.

Prefer a generic interface:

```text
AuditEvent {
    action
    entityType
    entityId
    familyId
    actor
    correlationId
    causationId
    beforeState
    afterState
    evidence
}
```

Domain services can then use the same mechanism.

---

## 15. Event Bus Should Have Explicit Failure Semantics

The plan introduces an in-process event bus.

Define:

- synchronous vs asynchronous handlers
- handler timeout
- retry count
- retry backoff
- failure isolation
- duplicate delivery behaviour
- dead-letter/error handling

For Sprint 8B.0, a simple in-process implementation is fine.

But it must be **at-least-once aware** because 8B.2/8B.3 will depend on it.

---

## 16. Do Not Build a Distributed Event Bus

Keep Sprint 8B.0 local.

No:

- Kafka
- RabbitMQ
- Azure Service Bus
- Redis Streams

unless a future architecture decision explicitly requires it.

FamilyWealthOS is local-first and the current use case does not justify distributed infrastructure.

---

## 17. Data Contract Validation Must Test More Than Shape

The contract tests should include:

### Valid cases

### Invalid types

### Missing fields

### Boundary values

### Enum rejection

### Unknown fields

### Serialization/deserialization

### Backward compatibility

### Version compatibility

Especially test:

```text
schemaVersion = 1
```

against future-compatible parsing rules.

---

## 18. Add Contract Round-Trip Tests

For each important contract:

```text
Object
 ↓
JSON
 ↓
Parse
 ↓
Object
```

The resulting object should preserve the required semantics.

This will protect persisted event payloads and future replay.

---

## 19. Correlation Tests Need Real Express Integration

The current test plan focuses on async Promise propagation.

Add an integration test:

```text
HTTP Request
 ↓
Middleware
 ↓
Service
 ↓
Repository
 ↓
Audit Hook
```

Verify the same `correlationId` and `familyId` survive the complete path.

Also test nested asynchronous work.

---

## 20. Idempotency Tests Need Crash / Retry Scenarios

In addition to normal replay, test:

1. First request succeeds.
2. Same key retries → cached response.

And:

1. First request reserves key.
2. Handler fails.
3. Retry occurs.
4. Retry is allowed according to lifecycle rules.

And:

1. Two concurrent requests.
2. Same key.
3. Exactly one executes.

These are more important than simple sequential replay tests.

---

## 21. Add Security Tests

Sprint 8B.0 must include tests for:

- Cross-family access
- Spoofed `X-Family-ID`
- Spoofed user ID
- Missing family scope
- Invalid correlation ID
- Oversized headers
- Invalid idempotency key
- Replay across family scopes

---

## 22. Add a Test for "No Business Logic Regression"

Run the existing **58/58** suite before implementation and after implementation.

Capture the baseline.

Success criterion:

```text
Before 8B.0
58/58

After 8B.0
58/58 + Sprint 8B.0 tests
```

No existing test may be weakened, deleted, skipped, or modified merely to accommodate Sprint 8B.0.

---

## 23. Migration 016 Needs Rollback / Reset Validation

The plan adds:

`016_idempotency_keys.ts`

Verify:

- Fresh DB migration
- Existing DB migration
- `npm run db:reset`
- Restart application
- Duplicate migration execution
- Expired-key cleanup

The migration must be completely additive.

---

## 24. Add Explicit Deliverables

Please produce the following after implementation:

```text
SPRINT_8B0_IMPLEMENTATION_SUMMARY.md
SPRINT_8B0_TEST_REPORT.md
SPRINT_8B0_ARCHITECTURE_DECISIONS.md
SPRINT_8B0_API_CONTRACTS.md
SPRINT_8B0_EVENT_CATALOG.md
```

These become the foundation for Sprint 8B.1.

---

# Recommended Implementation Sequence

I recommend this exact order:

```text
1. Inspect existing schemas / middleware / audit infrastructure
                 ↓
2. Define Zod contracts
                 ↓
3. Define event envelope + event catalog
                 ↓
4. Implement CorrelationContext
                 ↓
5. Implement family-scope authorization
                 ↓
6. Implement idempotency repository + migration
                 ↓
7. Implement idempotency middleware
                 ↓
8. Implement durable AuditHookService
                 ↓
9. Implement local EventBus
                 ↓
10. Implement Sprint 8B.0 tests
                 ↓
11. Run regression suite
                 ↓
12. Produce implementation report
```

---

# Final Acceptance Criteria

Sprint 8B.0 is complete only when:

- [ ] No hardcoded family ID
- [ ] Authorized family scope cannot be overridden by request input
- [ ] Event envelope has explicit schema version
- [ ] Correlation and causation semantics are documented
- [ ] Idempotency reservation is transactionally safe
- [ ] Idempotency is family-scoped
- [ ] Request hashing is canonical
- [ ] Idempotency lifecycle handles failures safely
- [ ] Audit persistence is durable
- [ ] Audit records preserve correlation/family scope
- [ ] Before/after state is captured where applicable
- [ ] Event bus failure semantics are defined
- [ ] No distributed infrastructure introduced
- [ ] Contract tests pass
- [ ] Async context tests pass
- [ ] Concurrent idempotency tests pass
- [ ] Security tests pass
- [ ] Migration tests pass
- [ ] Existing 58/58 tests remain green
- [ ] Full TypeScript build remains green
- [ ] No calculation engine was modified
- [ ] No existing API contract was unnecessarily changed

---

# Final Recommendation

**Proceed with Sprint 8B.0 after incorporating the above changes into the implementation plan.**

The current plan is fundamentally sound. The requested changes are primarily about making the infrastructure safe for the much more sensitive workloads coming in 8B.1–8B.3.

The most important principle for this sprint is:

> **Build infrastructure that is boring, deterministic, auditable and impossible to accidentally cross family boundaries with.**

Once that foundation is solid, the Digital Twin and Proactive AI layers can safely become much more ambitious.
