# Sprint 8B.2 Implementation Plan: Life Events Engine & Multi-Domain Consequence Propagation

## 1. Objective & Scope

### Objective
Implement the **Life Events Engine (`LifeEventEngineService`)** to ingest, detect, and evaluate major family milestones (Childbirth, Marriage, Salary shifts, Home purchases, Loan closures, Retirement, Demise, Inheritance), compute deterministic multi-domain consequence propagation across Tax, Protection Shield, Cashflow, and Goals based on the `DigitalTwinState`, and enforce an explicit human fiduciary approval workflow.

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
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                               MULTI-DOMAIN CONSEQUENCE PROPAGATOR                                  |
|  +---------------------+  +--------------------+  +---------------------+  +--------------------+  |
|  | Tax Impact          |  | Protection Shield  |  | Cashflow Impact     |  | Goal Impact        |  |
|  | (Sec 80C, 24b, TDS) |  | (HLV Gap, Floater) |  | (Surplus/Deficit)   |  | (Milestone Shift)  |  |
|  +---------------------+  +--------------------+  +---------------------+  +--------------------+  |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                             HUMAN FIDUCIARY APPROVAL & AUDIT GATE                                  |
|            - Explicit User Decision (`PROCESS` / `DISMISS`)                                        |
|            - Dispatches `LIFE_EVENT_PROCESSED` audit event via `AuditHookService`                  |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Event Catalog & Deterministic Consequence Matrix

| Event Type (`LifeEventTypeEnum`) | Trigger Evidence | Tax Consequence | Protection Shield Consequence | Cashflow Consequence | Goal & Trajectory Consequence | Action Summary |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`CHILD_BIRTH`** | New member added (`CHILD`) | Surcharge check / child allowances | $+₹50\text{L}$ Term cover; add to Family Floater health | $-\text{Monthly childcare expense}$ | Recommend new "Higher Education" goal (18-yr horizon) | Upgrade life & health shields; seed education compounding. |
| **`MARRIAGE`** | New member added (`SPOUSE`) | Evaluate joint deductions & HUF formation | Add spouse to Family Floater health; spouse life cover check | Recalculate joint household surplus | Update retirement timeline to joint retirement age | Consolidate health policies; update Will beneficiaries. |
| **`SALARY_INCREASE`** | Monthly income spike | Calculate tax bracket shift; recommend 80C / NPS 80CCD(1B) | Recalculate HLV requirement for higher income | $+50\%$ of increment to investable surplus | Step up active goal SIPs proportionally | Accelerate goal timelines and maximize tax exemptions. |
| **`JOB_CHANGE`** | Employer shift | Transition TDS adjustment | Verify employer group cover gap; ensure personal term shield | Recalculate emergency fund target (3 $\to$ 6 months) | Maintain active SIP continuity | Consolidate EPF (UAN transfer); verify independent health buffer. |
| **`HOME_PURCHASE`** | Real estate asset + loan | Factor Section 24(b) interest deduction (up to ₹2L) & 80C | Check term cover $\ge \text{HLV} + \text{Loan Outstanding}$ | $-\text{Monthly EMI load}$ | Rebalance goal SIPs to accommodate EMI | Deduct home loan interest; insure outstanding debt liability. |
| **`HOME_LOAN_CLOSURE`**| Loan liability closed | Remove Sec 24(b) deduction | Term insurance liability reduced | $+\text{Freed EMI cashflow}$ | Redirect freed EMI cashflow to accelerated retirement | Re-allocate freed cashflow to long-term wealth compounding. |
| **`INSURANCE_MATURITY`**| Policy maturity date | Section 10(10D) tax exemption check | Remove matured policy from active cover shield | $+\text{Lump sum payout}$ | Allocate lump sum across existing goal deficits | Re-deploy maturity proceeds according to asset allocation. |
| **`RETIREMENT`** | Target age reached | Shift to post-retirement tax bracket | Transition to senior health floater | Shift from SIP accumulation to SWP drawdown | Goal status marked `ACHIEVED`; activate annuity | Transition portfolio from accumulation to systematic drawdown. |
| **`DEATH_OF_MEMBER`** | Demise declaration | Final return filing guidance | Expedite term insurance claim settlement | Release emergency survival liquidity | Reassign goal ownership to surviving head | Activate Emergency Survival Mode & claim settlement dossier. |
| **`MAJOR_INHERITANCE`**| Asset transfer deed | Capital gains base adjustment | Evaluate estate asset protection | $+\text{Lump sum asset value}$ | Advance timeline on long-term family goals | Stage tax-efficient deployment into diversified portfolio. |

---

## 3. Implementation Breakdown

### Phase 1: Database Migration & Repository Layer
1. `backend/src/db/migrations/017_life_events.ts`:
   - Creates `life_events` table with index on `(family_id, status)` and `(family_id, event_type)`.
2. `backend/src/repositories/SQLiteLifeEventRepository.ts`:
   - Type-safe SQLite repository supporting CRUD and status queries.

### Phase 2: Core Life Events Service
1. `backend/src/services/familyOffice/LifeEventEngineService.ts`:
   - Consumes `DigitalTwinService.getDigitalTwin(familyId)` for point-in-time baseline.
   - Computes deterministic `LifeEventConsequence` adhering strictly to `LifeEventConsequenceSchema`.
   - Pattern-matches prospective candidate events.
   - Executes human approval transitions with audit trail recording.

### Phase 3: REST API & Controller
1. `backend/src/controllers/LifeEventController.ts` & `backend/src/routes/lifeEventRoutes.ts`:
   - `POST /api/v1/family-office/life-events/declare` (Idempotent)
   - `GET /api/v1/family-office/life-events`
   - `GET /api/v1/family-office/life-events/:id/consequences`
   - `POST /api/v1/family-office/life-events/:id/process`
   - `POST /api/v1/family-office/life-events/:id/dismiss`
   - Mounted under `/api/v1/family-office/life-events` in `routes/index.ts`.

### Phase 4: Test Suite & Master Regression
1. `backend/src/__tests__/sprint8b2/lifeEvents.test.ts`:
   - Dedicated unit tests for all 10 life events, consequence formulas, approval flows, correlation propagation, and security boundaries.
2. `backend/src/__tests__/runTests.ts`:
   - Integrated into master test harness advancing from 269 baseline to $\ge 295$ tests.

---

## 4. Review Checklist & Approval Gate

- [x] Grounded strictly in Phase 8A specifications (`docs/LIFE_EVENTS_ENGINE.md`).
- [x] Zero mutations to existing financial engines (`NetWorthEngine`, `TaxCalculationEngine`).
- [x] Full reuse of Sprint 8B.0 contracts (`LifeEventConsequenceSchema`, `LifeEventTypeEnum`).
- [x] Strict human fiduciary approval gate before updating family plans.
- [x] Correlation context and sanitized audit logs preserved.
- [x] Full test strategy with 0 regressions against the 269-test baseline.



# ChatGPT Review & Implementation Handoff
# Sprint 8B.2 – Life Events Engine & Multi-Domain Consequence Propagation

## Review Status

**🟢 APPROVED WITH REQUIRED IMPLEMENTATION GUARDRAILS**

The revised Sprint 8B.2 plan has the correct overall architecture:

```text
User Declaration / Candidate
          ↓
Authorized Family Scope
          ↓
Digital Twin Baseline
          ↓
Deterministic Consequence Evaluation
          ↓
Read-Only Impact / Recommendation
          ↓
Explicit Human Decision
          ↓
Optional Approved Mutation
          ↓
Audit
```

The human-in-the-loop boundary is the most important architectural principle and must remain intact.

The following requirements are mandatory additions/clarifications before implementation.

---

# 1. CRITICAL – `PROCESS` MUST NOT Mean “Apply Everything”

The plan states that `POST /process` executes confirmed consequences.

This needs stronger semantics.

A user approving a life event should NOT automatically authorize every possible downstream action.

Separate:

```text
Life Event Confirmation
        ≠
Approval of Every Consequence
        ≠
Approval of Financial Mutation
```

Recommended lifecycle:

```text
DETECTED
   ↓
VERIFIED
   ↓
EVALUATED
   ↓
APPROVED
   ↓
PROCESSED
```

Each consequence should carry an action type/status such as:

```text
INFORMATIONAL
RECOMMENDATION
REQUIRES_APPROVAL
MUTATION_PROPOSED
MUTATION_APPLIED
```

For Sprint 8B.2, prefer that even after `APPROVED`, the engine only records/returns approved consequences unless an explicit, separately authorized mutation action exists.

**Do not silently mutate goals, policies, assets, beneficiaries, SIPs, tax records, or insurance records.**

---

# 2. CRITICAL – CONSEQUENCE ENGINE MUST NOT INVENT FINANCIAL VALUES

The consequence matrix currently contains prescriptive values such as:

- `+₹50L` term cover
- `50% of salary increment`
- `3 → 6 months` emergency fund
- `₹2L` Section 24(b)
- specific education horizons

These may be useful as *illustrative rules*, but they must not become hardcoded universal financial truth.

Use:

```text
Existing authoritative data
+
Existing calculation engines
+
Explicit rule parameters
+
Event facts
=
Derived impact
```

If a value cannot be calculated from authoritative data, return:

```text
UNKNOWN
INSUFFICIENT_DATA
REQUIRES_REVIEW
```

rather than inventing a number.

---

# 3. CRITICAL – Tax Rules Must Be Versioned and Treated as Rules, Not Constants

The plan includes tax consequences such as:

- Section 24(b)
- Section 80C
- Section 10(10D)
- TDS
- HUF formation

These are jurisdiction/rule-sensitive and can change.

Do NOT embed these as scattered constants inside `LifeEventEngineService`.

Create/use a versioned rule layer:

```text
Tax Rule Code
Rule Version
Effective From
Effective To
Source / Basis
Calculation Engine
```

The Life Events engine should orchestrate existing tax calculation capabilities rather than reimplement tax law.

For example:

```text
LifeEventEngine
      ↓
Tax Impact Rule
      ↓
Existing Tax Engine
      ↓
Impact Result
```

---

# 4. IMPORTANT – Event Facts Must Be Explicitly Structured

A generic life-event declaration is insufficient for deterministic consequences.

Define structured event-specific facts.

Examples:

### CHILD_BIRTH

```text
memberId
eventDate
childDateOfBirth
```

### SALARY_INCREASE

```text
memberId
effectiveDate
previousIncome
newIncome
incomeFrequency
```

### HOME_PURCHASE

```text
memberId
propertyValue
loanAmount
interestRate
tenure
purchaseDate
```

### INSURANCE_MATURITY

```text
policyId
maturityDate
expectedMaturityValue
```

### INHERITANCE

```text
beneficiaryMemberId
assetId / assetClass
transferDate
declaredValue
costBasisIfKnown
```

Do not attempt to infer critical numeric inputs when the user has not provided them.

---

# 5. IMPORTANT – Candidate Detection Must Be Evidence-Backed

`detectCandidates()` must never convert a weak heuristic directly into a life event.

Use:

```text
Candidate
  ├── eventType
  ├── confidence
  ├── evidence[]
  ├── detectedAt
  ├── source
  └── status = DETECTED
```

Candidate detection should produce a **candidate only**.

It must NOT:

- modify financial records
- modify goals
- create policies
- create beneficiaries
- trigger financial actions

Recommended evidence sources:

```text
Transaction pattern
Account change
Family member change
Asset acquisition
Policy maturity
User declaration
```

---

# 6. IMPORTANT – Candidate Confidence ≠ Evidence Completeness

Keep these separate:

```text
Detection Confidence
Evidence Completeness
Financial Calculation Confidence
AI Interpretation Confidence
```

Example:

```text
Candidate Confidence: 92%
Evidence Completeness: 55%
```

This means:

> The system is fairly confident that an event may have occurred, but insufficient evidence exists to safely calculate all consequences.

Do not collapse these into one score.

---

# 7. IMPORTANT – Persist the Baseline Used for Consequence Evaluation

A consequence result must be reproducible.

When evaluating an event, record metadata identifying the baseline:

```text
eventId
stateHash
asOf
generatedAt
ruleVersion
calculationVersion
```

Do not persist the entire Digital Twin as a second financial database.

A lightweight provenance reference is sufficient.

This will become critical when the Financial Time Machine is introduced later.

---

# 8. IMPORTANT – Consequence Results Need Deterministic Identity

Every consequence should have a stable identity.

For example:

```text
consequenceId
eventId
domain
ruleCode
stateHash
```

This allows:

- duplicate suppression
- audit correlation
- re-evaluation
- comparison after data changes

Repeated evaluation against the same event + same baseline should produce the same consequence IDs/results.

---

# 9. IMPORTANT – Event Versioning / Re-Evaluation

If the user changes an event declaration:

```text
Salary increase:
₹1L → ₹1.2L
```

do not silently overwrite historical evaluation.

Use:

```text
eventVersion
evaluatedAt
stateHash
ruleVersion
```

A revised declaration should create a new evaluation version.

This protects fiduciary lineage.

---

# 10. CRITICAL – Death of Member Requires a Separate Safety Boundary

`DEATH_OF_MEMBER` is materially different from normal planning events.

It may affect:

- insurance claims
- estate
- beneficiaries
- accounts
- tax
- emergency mode

Do NOT allow automated mutation or claim processing.

For Sprint 8B.2:

```text
DEATH_OF_MEMBER
        ↓
Impact assessment
        ↓
Emergency / estate checklist
        ↓
Human review
```

No automatic asset transfer, beneficiary reassignment, account closure, or insurance claim submission.

---

# 11. IMPORTANT – Do Not Hardcode Legal/Financial Outcomes in the Matrix

Examples such as:

> “Update retirement timeline to joint retirement age”

or

> “Activate annuity”

are recommendations, not deterministic consequences.

The engine should distinguish:

```text
FACT
CALCULATED IMPACT
RECOMMENDATION
ACTION
```

The consequence matrix should return structured impacts.

Example:

```text
domain: GOALS
impactType: TIMELINE_CHANGE
before: 2045
after: 2047
confidence: ...
reason: ...
```

A recommendation layer can later translate that into a user-facing action.

---

# 12. IMPORTANT – Keep Life Events Separate From Proactive AI

Do not implement Sprint 8B.3 behaviour inside 8B.2.

8B.2 should provide:

```text
Life Event
→ Evidence
→ Deterministic Impact
→ Consequence
→ Audit
```

8B.3 will later decide:

```text
Should the system proactively notify/recommend this?
```

Avoid introducing:

- notification generation
- autonomous recommendations
- proactive observer rules
- AI memory writes

into the Life Events engine unless already explicitly required by the existing contracts.

---

# 13. IMPORTANT – Idempotency Must Be Used For Mutating Endpoints

The plan correctly marks `POST /declare` as idempotent.

Apply the existing Sprint 8B.0 idempotency framework to all state-changing endpoints where appropriate:

```text
POST /declare
POST /process
POST /dismiss
```

Repeated requests must not:

- duplicate life events
- duplicate consequences
- duplicate audit events
- repeat mutations

Use the existing SQLite idempotency infrastructure rather than creating a second mechanism.

---

# 14. IMPORTANT – State Transition Must Be Atomic

For:

```text
VERIFIED → PROCESSED
```

the following must be handled safely:

```text
validate current status
↓
validate authorized family
↓
validate approval
↓
persist transition
↓
persist consequence state
↓
audit
```

Concurrent requests must not process the same event twice.

Use a transaction where database mutation is involved.

---

# 15. IMPORTANT – Dismissal Should Preserve Evidence

`DISMISSED` should not delete the candidate.

Retain:

```text
event
evidence
confidence
dismissedAt
dismissedBy
reason
```

This is important for fiduciary history and future duplicate suppression.

A future detection should be able to determine whether the same event was already dismissed.

---

# 16. Database Schema – Add Explicit Governance Fields

The `life_events` table should support at minimum:

```text
id
family_id
event_type
status
event_version
declared_at
effective_date
declared_by
event_payload
evidence_payload
baseline_state_hash
baseline_as_of
rule_version
calculation_version
created_at
updated_at
processed_at
dismissed_at
dismiss_reason
```

Do not store the full Digital Twin JSON as authoritative financial state.

If consequence results are persisted, keep them as derived artifacts with explicit version/provenance.

---

# 17. Event Type Coverage – Test All 10 Explicitly

The plan says all 10 event types are covered.

The test suite must explicitly enumerate all ten:

```text
CHILD_BIRTH
MARRIAGE
SALARY_INCREASE
JOB_CHANGE
HOME_PURCHASE
HOME_LOAN_CLOSURE
INSURANCE_MATURITY
RETIREMENT
DEATH_OF_MEMBER
MAJOR_INHERITANCE
```

Do not rely on one generic parametrized test alone.

Each event should verify:

- event facts
- expected domains
- deterministic consequence
- missing-data behaviour
- no unauthorized mutation

---

# 18. IMPORTANT – Empty / Partial Data Must Be First-Class

The Digital Twin already has completeness semantics.

Life Events must respect them.

Example:

```text
HOME_PURCHASE
+
missing loan rate
+
missing loan tenure
```

should produce:

```text
Cashflow:
INSUFFICIENT_DATA

Tax:
PARTIAL

Protection:
PARTIAL

Goals:
CALCULABLE
```

Do not fabricate the missing inputs.

---

# 19. API Authorization

Every endpoint must resolve:

```text
authenticated user
        ↓
authorized active family
        ↓
event family
```

A request-provided `familyId` must never establish or override scope.

Test:

```text
Family A token
+
Family B eventId
=
403 / not found
```

Avoid leaking whether another family's event exists.

---

# 20. API Error Semantics

Define explicit responses for:

```text
400 invalid event
401 unauthenticated
403 unauthorized family
404 event not found / inaccessible
409 invalid state transition
422 insufficient data / unprocessable consequence
```

Reuse existing API response/error conventions from Sprint 8B.0.

Do not introduce a new error envelope.

---

# 21. Audit Requirements

Use existing `AuditHookService`.

At minimum:

```text
LIFE_EVENT_DECLARED
LIFE_EVENT_PROCESSED
LIFE_EVENT_DISMISSED
```

Optionally:

```text
LIFE_EVENT_CANDIDATE_DETECTED
LIFE_EVENT_CONSEQUENCE_EVALUATED
```

Audit payload must remain sanitized.

Do not store:

- raw account numbers
- PAN
- full transaction data
- unnecessary policy details
- full Digital Twin payload

Include provenance:

```text
eventId
eventVersion
familyId
stateHash
ruleVersion
correlationId
actor
timestamp
```

---

# 22. Test Baseline – Correct the Test Target

The current plan says:

> `>=295 assertions`

This is acceptable as a minimum only if the actual number of new assertions is justified.

Use the same baseline convention established in 8B.1:

```text
Previous baseline: 269
New Sprint 8B.2 assertions: X
Current total: 269 + X
Failures: 0
```

Do not artificially target a number simply to increase test count.

Quality and coverage matter more than assertion count.

---

# 23. Performance

Add an initial benchmark for consequence evaluation.

Recommended target:

```text
Single event evaluation p95 ≤ 500ms
```

against the current real dataset.

Measure:

- Digital Twin retrieval
- consequence evaluation
- persistence
- audit dispatch

Do not optimize prematurely.

---

# 24. Business Logic Protection

Sprint 8B.2 must NOT modify existing:

- portfolio valuation
- tax calculation engines
- insurance calculation engines
- retirement calculations
- goal calculations
- estate calculations
- recommendation engines

LifeEventEngineService is an orchestration layer.

Where an existing deterministic engine already provides a calculation, call it.

Do not duplicate its formula inside LifeEventEngineService.

---

# 25. Required Implementation Deliverables

Before declaring 8B.2 complete, provide:

```text
LifeEventEngineService.ts
SQLiteLifeEventRepository.ts
017_life_events.ts
LifeEventController.ts
lifeEventRoutes.ts
lifeEvents.test.ts

docs/LIFE_EVENTS_ARCHITECTURE.md
docs/LIFE_EVENTS_CONSEQUENCE_MATRIX.md
docs/LIFE_EVENTS_DATA_MODEL.md
```

Also update:

```text
SESSION_CONTEXT.md
AI_CHANGELOG.md
PHASE_8_ROADMAP.md
```

---

# 26. Final Acceptance Criteria

Sprint 8B.2 is accepted only when:

- [ ] All 10 event types supported.
- [ ] Event declarations are family-scoped.
- [ ] Candidate detection is evidence-backed.
- [ ] Detection confidence is separate from data completeness.
- [ ] Digital Twin is used as the baseline.
- [ ] Baseline `stateHash` / `asOf` is captured.
- [ ] Consequences are deterministic.
- [ ] Tax rules are versioned/reused through existing engines.
- [ ] No artificial financial values are introduced.
- [ ] Partial/unknown data is explicit.
- [ ] No automatic financial mutation occurs from consequence evaluation.
- [ ] Explicit human approval is required.
- [ ] Process/dismiss operations are idempotent.
- [ ] State transitions are concurrency-safe.
- [ ] Death-of-member has additional safety boundaries.
- [ ] Audit events are sanitized and correlated.
- [ ] Cross-family access is impossible.
- [ ] Existing business engines remain unchanged.
- [ ] Existing API conventions are reused.
- [ ] 269-test baseline is preserved.
- [ ] New Sprint 8B.2 tests pass.
- [ ] Backend TypeScript passes.
- [ ] Frontend TypeScript passes.
- [ ] Performance benchmark is recorded.
- [ ] Documentation is updated.

---

# FINAL HANDOFF TO AGENT

**Proceed with Sprint 8B.2 implementation only after incorporating the above guardrails into the implementation plan.**

Do not redesign the architecture.

Do not introduce cloud infrastructure.

Do not introduce an AI model dependency.

Do not modify existing financial calculation engines.

Do not automatically mutate financial plans.

The central invariant is:

```text
Life Event
    ↓
Evidence
    ↓
Digital Twin Baseline
    ↓
Deterministic Consequence
    ↓
Human Review
    ↓
Explicit Approval
    ↓
Only then: separately authorized mutation
```

This sprint is the foundation for Sprint 8B.3 Proactive AI, so preserve strict boundaries between **facts, calculations, recommendations, and actions**.
