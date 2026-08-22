# Sprint 8B.3 Implementation Plan: Proactive Fiduciary AI Observer & Cooldown Registry

Transition FamilyWealthOS from reactive querying to an autonomous, proactive fiduciary observer evaluating deterministic rule conditions against the Family Digital Twin.

## User Review Required

> [!IMPORTANT]
> The Proactive Observer operates under a strict **Zero Financial Invention** and **Zero Autonomous Mutation** boundary. It evaluates deterministic rules via existing domain engines (`TaxCalculationEngine`, `NetWorthEngine`, `EstateHealthService`, `GoalPlanningService`, `DigitalTwinService`) and produces actionable recommendations with full 5-Point Explainability Lineage. It strictly never executes trades or modifies financial records.

## Open Questions

1. **Notification Center Synchronization**: Should high/critical urgency proactive triggers automatically mirror as notification records in `NotificationService` in addition to being queryable via `/family-office/proactive/triggers`?
2. **Debounce Strategy**: Should proactive evaluations fire immediately upon relevant domain mutations (`SYNC_COMPLETED`, `LIFE_EVENT_PROCESSED`, `ASSET_SAVED`), or throttle evaluations with a 5-second debounce window?

---

## Proposed Changes

### 1. Data Contracts & Database Migration

#### [MODIFY] [backend/src/contracts/familyOfficeContracts.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/contracts/familyOfficeContracts.ts)
- Extend `ProactiveTriggerSchema` and `ObserverRuleCodeEnum` to include `stateHash`, `dataCompletenessScore`, and `explainabilityLineage`.
- Define `CooldownRecordSchema` and `ProactiveTriggerActionInputSchema`.

#### [NEW] [backend/src/db/migrations/018_proactive_triggers_and_cooldowns.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db/migrations/018_proactive_triggers_and_cooldowns.ts)
- Create `proactive_cooldown_registry` table indexed on `(family_id, rule_code, entity_id)`.
- Create `proactive_triggers` table indexed on `(family_id, status)` and `(trigger_id)`.
- Register in [backend/src/db.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db.ts).

---

### 2. Repositories & Services

#### [NEW] [backend/src/repositories/SQLiteProactiveTriggerRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteProactiveTriggerRepository.ts)
- CRUD repository for proactive triggers and cooldown registry management.

#### [NEW] [backend/src/services/familyOffice/CooldownRegistryService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/familyOffice/CooldownRegistryService.ts)
- Enforces rule-level cooldown timers, duplicate key hashing, and material state change overrides.

#### [NEW] [backend/src/services/familyOffice/ProactiveObserverService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/familyOffice/ProactiveObserverService.ts)
- Orchestrates targeted rule execution for 9 core rules:
  1. `DRIFT_EQUITY_OVERWEIGHT`
  2. `CONCENTRATION_SINGLE_STOCK`
  3. `INSURANCE_RENEWAL_DUE`
  4. `PROTECTION_HLV_GAP`
  5. `EMERGENCY_FUND_DEFICIT`
  6. `EXCESS_IDLE_CASH`
  7. `GOAL_OFF_TRACK_DRIFT`
  8. `TAX_80C_OPPORTUNITY`
  9. `ESTATE_NOMINEE_GAP`
- Evaluates data completeness ($S_{\text{completeness}} \ge 75\%$) and confidence ($\ge 85\%$).
- Invalidates stale triggers when condition clears.
- Dispatches `PROACTIVE_TRIGGER_EMITTED`, `PROACTIVE_TRIGGER_DISMISSED`, `PROACTIVE_TRIGGER_RESOLVED` via `AuditHookService`.

---

### 3. REST API Controllers & Routing

#### [NEW] [backend/src/controllers/ProactiveObserverController.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/controllers/ProactiveObserverController.ts)
- Endpoints for listing triggers, evaluating rules, acknowledging, snoozing, dismissing, and resolving.

#### [NEW] [backend/src/routes/proactiveObserverRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/proactiveObserverRoutes.ts)
- Mounted at `/api/v1/family-office/proactive` in [backend/src/routes/index.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/index.ts).

---

## Verification Plan

### Automated Tests
- Unit and integration tests in `backend/src/__tests__/sprint8b3/proactiveObserver.test.ts`:
  - 9 rule evaluation assertions
  - Confidence and completeness gating
  - Duplicate suppression and cooldown timers
  - Material state change override
  - Stale trigger auto-resolution
  - Idempotent state transitions (`snooze`, `dismiss`, `resolve`)
  - Cross-family security isolation (403 Forbidden)
  - Audit trail logging
  - Performance benchmark ($\le 250$ms)
- Run master test suite via `npm test` to advance passing test count beyond 289 with 0 failures.


---


# ChatGPT Review – Sprint 8B.3 Implementation Plan

## Overall Verdict

**🟡 GOOD FOUNDATION — REVISE BEFORE IMPLEMENTATION**

The plan has the correct architecture and respects the key Phase 8 boundaries, but I recommend a focused revision before coding.

The strongest parts are:

- deterministic domain engines remain authoritative
- zero financial invention
- zero autonomous financial mutation
- event-driven targeted evaluation
- duplicate suppression
- rule-specific cooldowns
- stale trigger handling
- family scoping
- idempotent user actions
- audit integration
- failure isolation intent

However, several important details need tightening because this is the first sprint that can proactively surface financial recommendations without the user explicitly asking.

---

# 1. CRITICAL – Do Not Call This "Autonomous" Without Qualification

The plan repeatedly calls the Observer "autonomous".

That terminology is risky.

The Observer may autonomously **detect and evaluate**, but it must NOT autonomously **decide or act financially**.

Use this terminology consistently:

> **Proactive, event-driven fiduciary observer with human-controlled actions**

The invariant is:

```text
Detect
  ↓
Evaluate
  ↓
Explain
  ↓
Recommend
  ↓
Human decision
  ↓
Separate authorized action
```

---

# 2. CRITICAL – Resolve the Notification Question Before Coding

The plan leaves NotificationService integration as an open question.

Do not allow two competing sources of truth:

```text
proactive_triggers
        +
NotificationService
```

The recommendation/trigger should have **one authoritative persistence record**.

Recommended architecture:

```text
ProactiveTrigger
      ↓
NotificationService adapter/integration
      ↓
Notification Center
```

The notification should be a presentation/delivery representation of the trigger, not a second recommendation record.

If NotificationService is already the application's notification source, reuse it rather than creating parallel notification state.

---

# 3. CRITICAL – Do Not Leave `POST /evaluate` Open-Ended

The proposed:

```text
POST /api/v1/family-office/proactive/evaluate
```

is potentially dangerous because it can become an unrestricted "run every rule now" endpoint.

Define exactly what it does.

Recommended:

```text
POST /evaluate
```

means:

> Run the eligible targeted rules for the authenticated family's current state.

It must NOT:

- bypass cooldowns
- bypass duplicate suppression
- bypass confidence gates
- bypass completeness gates
- bypass stale-state validation
- trigger financial mutations

If an event-triggered evaluation already exists internally, the public endpoint may not even be necessary. Prefer an internal service entry point and expose a manual evaluation endpoint only if there is a real UI/admin use case.

---

# 4. CRITICAL – Family Scope Must Be Server-Resolved

The plan states authorized family scope, which is correct.

Make the implementation rule explicit:

```text
Authenticated User
      ↓
CorrelationContext.getFamilyId()
      ↓
ProactiveObserverService
```

No client-supplied family ID may establish or override scope.

Add tests for:

- missing family context
- cross-family trigger ID
- cross-family evaluation
- cross-family mutation
- forged family ID in query/body/header

Return the existing authorization semantics without revealing whether another family's trigger exists.

---

# 5. CRITICAL – Confidence Model Is Currently Ambiguous

The plan says:

> data completeness >= 75% and confidence >= 85%

But the rule catalog contains different confidence thresholds:

- 90%
- 95%
- 100%
- 88%

Define these as **rule-specific thresholds**, and explicitly separate:

```text
Data Completeness
Evidence Confidence
Calculation Determinism
AI Interpretation Confidence
```

AI Interpretation Confidence must NEVER be used to make a deterministic financial rule pass.

A deterministic rule should be eligible even if no AI is used.

---

# 6. CRITICAL – Completeness Must Be Domain-Specific

A family-level Digital Twin completeness score of 80% does not necessarily mean insurance data is 80% complete.

A rule should evaluate the completeness of the **data it actually depends on**.

Example:

```text
Overall family completeness = 90%

Insurance completeness = 45%

PROTECTION_HLV_GAP
→ insufficient data
→ do not generate recommendation
```

Add a domain/input completeness model or explicit required-input checks.

---

# 7. CRITICAL – Numeric Thresholds Need Configuration + Provenance

The rule catalog contains many hardcoded values:

- Equity drift +5%
- Single stock >20%
- Renewal ≤30 days
- Emergency fund <4 months
- Idle cash >12 months
- Goal probability <60%
- Tax headroom >₹25,000
- October tax trigger
- etc.

These may be reasonable defaults, but they should NOT be embedded as scattered constants.

Each rule should have:

```text
ruleCode
ruleVersion
threshold
thresholdUnit
effectiveFrom
source/basis
```

Where a threshold is a family/user configuration, make that explicit.

The observer should consume rule configuration rather than hardcode financial policy inside the service.

---

# 8. CRITICAL – HLV Rule Needs Special Review

`PROTECTION_HLV_GAP` is especially sensitive.

The plan correctly says it reuses an authoritative engine, but ensure:

```text
Required HLV Cover
```

comes from the existing HLV/protection calculation capability.

Do NOT reproduce HLV formulas inside ProactiveObserverService.

Also ensure missing income/coverage produces:

```text
INSUFFICIENT_DATA
```

rather than a fabricated protection gap.

---

# 9. IMPORTANT – "Zero Synthetic Formulas" Must Include Rule Calculations

The phrase "existing engines" is good, but some rule conditions themselves are calculations:

```text
months of emergency fund
allocation percentage
concentration percentage
goal delay
tax headroom
material change
```

The plan must specify which existing service/engine owns each calculation.

Create a Rule → Calculation Owner matrix:

```text
Rule
↓
Authoritative Data
↓
Calculation Service
↓
Output
↓
Threshold
```

This prevents ProactiveObserverService becoming a hidden calculation engine.

---

# 10. IMPORTANT – Duplicate Key Is Too State-Heavy

The proposed key is:

```text
familyId:ruleCode:entityId:stateHash:ruleVersion
```

This is acceptable for immutable trigger identity, but not sufficient as the sole cooldown identity.

Separate:

### Trigger Identity

```text
familyId + ruleCode + entityId + stateHash + ruleVersion
```

### Cooldown Identity

```text
familyId + ruleCode + entityId
```

The database schema already follows the second model.

Document this explicitly.

---

# 11. IMPORTANT – Material Change Must Be Rule-Specific

The plan says:

```text
H_state != H_prev AND Δ > θ
```

Good concept, but `Δ` cannot be generic.

Each rule needs a rule-specific materiality function.

Examples:

```text
Portfolio drift → allocation delta
Cash → reserve delta
Insurance → coverage/income change
Goal → probability/delay delta
Tax → headroom change
```

Do not compare raw state hashes and assume that any hash change is material.

---

# 12. IMPORTANT – Cooldown + Dismissal Semantics Need Care

The plan says dismissal doubles cooldown.

That is a reasonable starting point, but it should not be hardcoded globally.

Define dismissal policy per rule:

```text
cooldownDays
dismissalCooldownDays
maxSuppressionPeriod
retriggerOnMaterialChange
```

Also ensure repeated dismissal does not silently create an effectively permanent hidden suppression.

User preferences must remain visible and reversible.

---

# 13. IMPORTANT – Snooze Must Have a Maximum

`SNOOZE` currently accepts `snoozeDays`.

Define:

- allowed range
- maximum snooze duration
- validation
- what happens after snooze expires

For example:

```text
1–30 days
```

is preferable to unrestricted input.

Use an explicit rule/configuration rather than a magic number.

---

# 14. IMPORTANT – Trigger Lifecycle Is Missing `STALE`

The stale section says triggers become `RESOLVED`.

But there are two distinct concepts:

```text
RESOLVED
= the underlying condition was addressed/cleared

STALE
= the baseline changed and the recommendation must be re-evaluated
```

Do not conflate them.

Recommended lifecycle semantics:

```text
ACTIVE
ACKNOWLEDGED
SNOOZED
DISMISSED
RESOLVED
STALE
EXPIRED
```

If the existing application does not need all states, define the minimum set clearly.

---

# 15. IMPORTANT – `urgency` Should Not Be the Same as `priority`

The rule catalog discusses priority, but the database stores:

```text
urgency
```

Define whether these are the same concept.

If they are the same, use one term consistently.

If different:

```text
priority = ranking among recommendations
urgency = time sensitivity
```

and document how each is calculated.

---

# 16. IMPORTANT – Recommendation/Trigger Contract Needs `dataCompleteness`

The first section says the contract should include `dataCompletenessScore`, but the SQL table does not contain it.

Likewise, the table does not explicitly contain:

- ruleVersion
- asOf
- baseline completeness
- expiresAt
- correlationId

These are important for reproducibility.

Do not rely entirely on JSON payloads for core lineage fields.

At minimum persist explicit indexed/queryable fields for:

```text
familyId
ruleCode
ruleVersion
entityId
stateHash
asOf
dataCompletenessScore
correlationId
createdAt
expiresAt
status
```

---

# 17. IMPORTANT – Explainability Lineage Should Reuse Existing Contract

The plan mentions "5-Point Explainability Lineage".

Confirm exactly which existing contract is reused from 8B.1/8B.2.

Do not create a second explainability model.

The recommendation should be traceable:

```text
Evidence
↓
Rule
↓
Calculation
↓
Baseline
↓
Recommendation
```

---

# 18. IMPORTANT – Audit Event Names Must Be Consistent

The plan currently mentions:

```text
PROACTIVE_TRIGGER_EMITTED
PROACTIVE_TRIGGER_DISMISSED
PROACTIVE_TRIGGER_RESOLVED
```

The test plan mentions only emitted/dismissed.

Define the authoritative audit event catalog before implementation.

At minimum:

```text
PROACTIVE_TRIGGER_CREATED
PROACTIVE_TRIGGER_DISMISSED
PROACTIVE_TRIGGER_SNOOZED
PROACTIVE_TRIGGER_RESOLVED
PROACTIVE_TRIGGER_EXPIRED
```

Only implement events that are actually needed.

---

# 19. IMPORTANT – Event Trigger Mapping Is Not Detailed Enough

The architecture says event-driven, but the plan does not yet provide the complete mapping.

Add:

```text
Domain Event
↓
Affected Domain
↓
Applicable Rules
↓
Required Data
↓
Evaluation Scope
```

Example:

```text
ASSET_SAVED
→ Portfolio
→ DRIFT_EQUITY_OVERWEIGHT
→ CONCENTRATION_SINGLE_STOCK
→ targeted evaluation
```

This is important to prevent unnecessary full-rule execution.

---

# 20. IMPORTANT – Debounce Should Be an Implementation Detail, Not a Business Rule

The 5-second debounce question is currently open.

Recommendation:

**Do not make debounce part of the business rule semantics.**

First define:

```text
event
→ enqueue targeted evaluation
→ coalesce duplicate events
→ evaluate latest state
```

If implementation requires a small debounce/coalescing window, choose it based on observed event bursts.

Do not hardcode 5 seconds as a fiduciary rule.

---

# 21. IMPORTANT – Background Execution Needs Failure Semantics

The plan needs to define what happens if observer execution fails:

```text
Event received
↓
Rule evaluation fails
```

Specify:

- retry count
- backoff
- whether failed rules are isolated
- whether the event is retried
- observability
- whether a failed rule affects cooldown
- whether partial recommendations are persisted

A failed rule MUST NOT create a false recommendation.

---

# 22. IMPORTANT – Concurrency

Add explicit concurrency tests:

```text
Two identical domain events
        ↓
same family
same rule
same entity
        ↓
only one trigger
only one cooldown update
```

Use SQLite transactional/unique constraints to enforce this, not only application-level checks.

---

# 23. IMPORTANT – Manual `/evaluate` Must Be Idempotent

If `/evaluate` remains public, repeated calls against unchanged state must result in:

```text
No duplicate trigger
No cooldown reset
No audit spam
```

It should evaluate the latest state and reuse the same duplicate/cooldown machinery.

---

# 24. IMPORTANT – Notification Center Integration

My recommendation is:

**Yes, integrate with the existing NotificationService — but through an adapter/reference, not a second persistence model.**

Suggested:

```text
ProactiveTrigger
      ↓
NotificationService
      ↓
Notification Center
```

The trigger remains authoritative.

The notification contains:

```text
triggerId
priority
title
summary
deepLink
```

and not a duplicated financial recommendation payload.

---

# 25. IMPORTANT – Initial Rule Set Should Stay Small

Nine rules is reasonable.

Do NOT expand beyond these during implementation unless repository inspection demonstrates an existing reusable rule.

The purpose of 8B.3 should be to prove:

```text
Event → Rule → Evidence → Recommendation → Cooldown → Notification
```

reliably.

We can add more rules later.

---

# 26. IMPORTANT – `EXCESS_IDLE_CASH` Needs Care

This rule can be interpreted as investment advice.

It should not say:

> "Invest this cash."

Instead:

> "Cash reserves are materially above the configured liquidity target."

Then provide an informational/review recommendation.

No autonomous investment action.

---

# 27. IMPORTANT – `TAX_80C_OPPORTUNITY` Needs Current Tax Context

Do not assume October alone makes a tax recommendation valid.

The rule should consider:

- applicable tax regime
- current contribution/deduction data
- relevant assessment year
- existing tax engine outputs
- rule version

The observer should surface an opportunity, not prescribe an investment.

---

# 28. IMPORTANT – User Controls

The plan mentions dismissal and snooze but should explicitly consider:

- notification preferences
- per-rule mute
- global proactive notifications toggle, if consistent with existing settings
- ability to undo/re-enable

Do not create hidden suppression behavior.

---

# 29. TEST BASELINE

Current baseline is **289**.

Do not use:

> `>=315`

as an acceptance requirement merely because it increases the test count.

Use:

```text
Previous baseline: 289
New tests: X
Current total: 289 + X
Failures: 0
```

Coverage quality matters more than the number.

---

# 30. Performance Target

The plan proposes:

> ≤250ms targeted rule evaluation

That is a good stretch target.

However, define whether this includes:

- Digital Twin hydration
- rule calculation
- persistence
- cooldown check
- audit
- notification integration

Record the measured breakdown.

---

# 31. UI Boundary

Do not redesign the UI in 8B.3.

Reuse the existing Notification Center if possible.

Any visual changes should be a separate UI sprint after the Observer backend is proven.

---

# 32. Documentation

Add/update only the necessary Phase 8 documentation.

Recommended:

```text
docs/PROACTIVE_AI_ARCHITECTURE.md
docs/PROACTIVE_RULE_CATALOG.md
docs/PROACTIVE_COOLDOWN_MODEL.md
```

Avoid creating redundant documentation if equivalent architecture documents already exist.

Also update:

```text
SESSION_CONTEXT.md
AI_CHANGELOG.md
PHASE_8_ROADMAP.md
```

after implementation.

---

# FINAL DECISION

## 🟡 REVISE PLAN, THEN IMPLEMENT

The plan is architecturally sound enough to proceed, but I recommend the Agent first incorporates the above clarifications.

The most important changes are:

1. **One authoritative trigger/notification model**
2. **Server-resolved family scope**
3. **Rule-specific completeness/confidence**
4. **Rule-specific calculation ownership**
5. **Separate trigger identity vs cooldown identity**
6. **Explicit stale vs resolved semantics**
7. **Persist core provenance fields**
8. **Detailed event → rule mapping**
9. **Concurrency/idempotency guarantees**
10. **No autonomous financial action**
11. **Tax/HLV rules must remain engine-driven**
12. **Keep the initial nine rules small**

After these are incorporated, the Agent can implement 8B.3 without another architectural redesign.

## Non-Negotiable Boundary

```text
Authoritative Data
      ↓
Existing Calculation Engine
      ↓
Proactive Rule
      ↓
Evidence
      ↓
Recommendation
      ↓
Cooldown / Deduplication
      ↓
Notification
      ↓
Human Decision
      ↓
Future Explicit Action
```

**Never:**

```text
Event → AI → Financial Action
```

That boundary must remain intact throughout 8B.3 and all later AI work.
