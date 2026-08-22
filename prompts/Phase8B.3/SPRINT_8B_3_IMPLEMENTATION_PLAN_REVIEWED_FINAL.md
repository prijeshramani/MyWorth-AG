# Sprint 8B.3 Implementation Plan: Proactive Fiduciary AI Observer & Cooldown Registry

Transition FamilyWealthOS intelligence from reactive query-response to a **proactive, event-driven fiduciary observer with human-controlled actions**.

## User Review Required

> [!IMPORTANT]
> **Strict Fiduciary Invariant**: The Observer operates under a non-negotiable **Zero Financial Invention** and **Zero Autonomous Mutation** boundary. It evaluates deterministic rules via existing domain calculation engines (`TaxCalculationEngine`, `NetWorthEngine`, `EstateHealthService`, `GoalPlanningService`, `DigitalTwinService`) and produces actionable recommendations with full 5-Point Explainability Lineage. It strictly never executes trades, modifies SIPs, reassigns nominees, or alters insurance policies without explicit human confirmation.

## Summary of Refinements from Architectural Review

1. **Terminology**: Clarified as *"Proactive, event-driven fiduciary observer with human-controlled actions"* (no autonomous financial action).
2. **Single Authoritative Record**: The `proactive_triggers` table is the sole authoritative persistence record. `NotificationService` acts as an adapter/presentation layer referencing `triggerId`.
3. **Server-Resolved Family Scope**: Family context is strictly derived from `CorrelationContext.getFamilyId()`.
4. **Rule $\to$ Calculation Owner Matrix**: Explicitly assigns each of the 9 rules to its existing authoritative calculation service.
5. **Separated Identity**:
   - $\text{TriggerId} = \text{familyId} : \text{ruleCode} : \text{entityId} : H_{\text{state}} : \text{ruleVersion}$
   - $\text{CooldownKey} = (\text{familyId}, \text{ruleCode}, \text{entityId})$
6. **Domain-Specific Completeness Gate**: Rules evaluate completeness of the specific domain they depend on ($S_{\text{domain}} \ge 0.75$), rather than relying purely on global scores.
7. **Rule-Specific Materiality Override**: Bypasses active cooldowns only when financial drift shifts beyond $\Delta_{\text{mat}}$ (e.g. $|\Delta\text{Drift}| \ge 2.5\%$).
8. **Explicit Lifecycle**: `ACTIVE` $\to$ `ACKNOWLEDGED` $\to$ `SNOOZED` (1–30 days max) $\to$ `DISMISSED` $\to$ `RESOLVED` (condition cleared) / `STALE` (state hash changed requiring re-evaluation) $\to$ `EXPIRED`.
9. **Persisted Lineage Fields**: Explicit database columns for `family_id`, `rule_code`, `rule_version`, `entity_id`, `state_hash`, `as_of_date`, `data_completeness_score`, `correlation_id`, `expires_at`, `status`.

---

## Proposed Changes

### 1. Data Contracts & Database Migration

#### [MODIFY] [backend/src/contracts/familyOfficeContracts.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/contracts/familyOfficeContracts.ts)
- Extend `ProactiveTriggerSchema` and `ObserverRuleCodeEnum` to include `stateHash`, `dataCompletenessScore`, and `explainabilityLineage`.
- Define `CooldownRecordSchema` and `ProactiveTriggerActionInputSchema` (with $[1, 30]$ days snooze validation).

#### [NEW] [backend/src/db/migrations/018_proactive_triggers_and_cooldowns.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db/migrations/018_proactive_triggers_and_cooldowns.ts)
- Create `proactive_cooldown_registry` table indexed on `(family_id, rule_code, entity_id)`.
- Create `proactive_triggers` table indexed on `(family_id, status)` and `(trigger_id)`.
- Register in [backend/src/db.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db.ts).

---

### 2. Repositories & Services

#### [NEW] [backend/src/repositories/SQLiteProactiveTriggerRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteProactiveTriggerRepository.ts)
- CRUD repository for proactive triggers and cooldown registry management.

#### [NEW] [backend/src/services/familyOffice/CooldownRegistryService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/familyOffice/CooldownRegistryService.ts)
- Enforces rule-level cooldown timers, duplicate key hashing, and rule-specific material shift overrides ($\Delta_{\text{mat}}$).

#### [NEW] [backend/src/services/familyOffice/ProactiveObserverService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/familyOffice/ProactiveObserverService.ts)
- Orchestrates targeted rule execution for the 9 core rules:
  1. `DRIFT_EQUITY_OVERWEIGHT`
  2. `CONCENTRATION_SINGLE_STOCK`
  3. `INSURANCE_RENEWAL_DUE`
  4. `PROTECTION_HLV_GAP`
  5. `EMERGENCY_FUND_DEFICIT`
  6. `EXCESS_IDLE_CASH`
  7. `GOAL_OFF_TRACK_DRIFT`
  8. `TAX_80C_OPPORTUNITY`
  9. `ESTATE_NOMINEE_GAP`
- Evaluates domain completeness ($S_{\text{domain}} \ge 75\%$) and evidence confidence ($\ge 85\%$).
- Invalidates stale triggers (`ACTIVE` $\to$ `STALE` or `RESOLVED`) when state shifts.
- Dispatches `PROACTIVE_TRIGGER_CREATED`, `PROACTIVE_TRIGGER_DISMISSED`, `PROACTIVE_TRIGGER_SNOOZED`, `PROACTIVE_TRIGGER_RESOLVED` via `AuditHookService`.

---

### 3. REST API Controllers & Routing

#### [NEW] [backend/src/controllers/ProactiveObserverController.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/controllers/ProactiveObserverController.ts)
- Endpoints for listing triggers, evaluating rules, acknowledging, snoozing, dismissing, and resolving with server-resolved family scope.

#### [NEW] [backend/src/routes/proactiveObserverRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/proactiveObserverRoutes.ts)
- Mounted at `/api/v1/family-office/proactive` in [backend/src/routes/index.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/index.ts).

---

## Verification Plan

### Automated Tests
- Unit and integration tests in `backend/src/__tests__/sprint8b3/proactiveObserver.test.ts`:
  1. **9 Core Rule Evaluations**: Verified against active family dataset.
  2. **Domain Completeness Gating**: Tests skipping rules when domain data completeness $< 75\%$.
  3. **Confidence Gating**: Tests skipping rules when evidence confidence $< 85\%$.
  4. **Cooldown Enforcement**: Tests suppression of duplicate triggers within the cooldown window.
  5. **Material Change Override**: Tests triggering when financial drift shifts beyond $\Delta_{\text{mat}}$.
  6. **Stale vs Resolved Semantics**: Tests transition to `RESOLVED` when cleared and `STALE` when baseline shifts without clearing.
  7. **Snooze Bounds Validation**: Tests rejection of snooze periods outside $1..30$ days.
  8. **Idempotency & Concurrency**: Tests `/snooze`, `/dismiss`, `/resolve` idempotency key handling.
  9. **Security & Scope Isolation**: Tests 403 rejection on cross-family trigger access.
  10. **Audit Trail Logging**: Tests sanitized audit records in `ai_audit_trail`.
  11. **Performance Benchmark**: Target $\le 250$ms for targeted rule evaluation across the active family dataset.
- Master test harness: `npm test` advances passing assertions from 289 with 0 failures.


---


# ChatGPT Second Review – Sprint 8B.3 Implementation Plan

## Verdict

**🟢 APPROVED WITH FINAL CLARIFICATIONS**

The Agent has correctly incorporated the major architectural feedback from the previous review. In particular:

- `proactive_triggers` is now explicitly the single authoritative persistence record.
- NotificationService is treated as an adapter/presentation layer.
- Family scope is server-resolved through `CorrelationContext`.
- Trigger identity and cooldown identity are separated.
- Domain-specific completeness gates are defined.
- Materiality overrides are rule-specific.
- Stale vs resolved semantics are explicitly introduced.
- Provenance fields are persisted.

These are the right corrections. fileciteturn18file0

I do **not** recommend another architecture redesign. Before implementation, however, make the following final clarifications.

---

# 1. CRITICAL – Do Not Describe the Observer as “AI” Where Deterministic Rules Are Responsible

The title can remain **Proactive Fiduciary AI Observer**, but the implementation boundary must remain explicit:

```text
Event
 ↓
Deterministic Rule
 ↓
Authoritative Calculation Engine
 ↓
Evidence
 ↓
Recommendation
 ↓
Optional AI explanation
```

AI/LLM must never determine whether a financial condition exists.

This should be reflected consistently in the service and contract naming/documentation.

---

# 2. CRITICAL – Event → Rule Mapping Is Still Missing

The plan says evaluation is targeted, but it does not provide the actual mapping.

Before implementation, add a matrix such as:

| Event | Rules |
|---|---|
| PRICE_SYNC_COMPLETED | DRIFT_EQUITY_OVERWEIGHT, CONCENTRATION_SINGLE_STOCK |
| ASSET_SAVED | DRIFT_EQUITY_OVERWEIGHT, CONCENTRATION_SINGLE_STOCK, ESTATE_NOMINEE_GAP |
| POLICY_UPDATED | INSURANCE_RENEWAL_DUE, PROTECTION_HLV_GAP |
| LIFE_EVENT_PROCESSED | PROTECTION_HLV_GAP, GOAL_OFF_TRACK_DRIFT, ESTATE_NOMINEE_GAP |
| TRANSACTION_IMPORTED | EMERGENCY_FUND_DEFICIT, EXCESS_IDLE_CASH, TAX_80C_OPPORTUNITY |
| GOAL_CHANGED | GOAL_OFF_TRACK_DRIFT |

Use only event types that actually exist in the current EventBus. If an event does not exist, explicitly mark it as a required extension.

This prevents every rule from running after every event.

---

# 3. CRITICAL – `triggerId` Should Be Hash-Based, Not Raw Concatenation

The plan currently defines:

```text
TriggerId = familyId : ruleCode : entityId : stateHash : ruleVersion
```

This is deterministic, but can become long and exposes implementation details.

Prefer:

```text
triggerId = SHA256(
  familyId +
  ruleCode +
  entityId +
  stateHash +
  ruleVersion
)
```

Keep the underlying components as separate database columns for querying/audit.

---

# 4. IMPORTANT – Cooldown and Trigger Creation Must Be Atomic

The plan correctly separates:

```text
TriggerId
CooldownKey
```

But the implementation must guarantee that two concurrent observer executions cannot both create the same trigger.

Require:

```text
BEGIN TRANSACTION
 ↓
Check cooldown / duplicate
 ↓
Insert trigger
 ↓
Update cooldown registry
 ↓
COMMIT
```

with SQLite uniqueness constraints.

Add a concurrency test with two simultaneous evaluations.

---

# 5. IMPORTANT – Materiality Override Needs a Rule-Specific Formula

The plan says:

> `Δmat`

Good, but every rule must define its own materiality calculation.

Examples:

```text
Portfolio drift:
absolute allocation change >= 2.5 percentage points

Emergency fund:
reserve change >= 15%

Concentration:
holding weight change >= 3 percentage points
```

Do not implement one generic numeric comparison for all rules.

---

# 6. IMPORTANT – Domain Completeness Is Good, But Preserve the Exact Domain Mapping

Each rule must declare:

```text
requiredDomains[]
minimumCompleteness
```

Example:

```text
PROTECTION_HLV_GAP
requiredDomains = [PROTECTION, INCOME]
minimumCompleteness = 0.85
```

The Observer must not use a family-wide score when the rule depends on a specific domain.

---

# 7. IMPORTANT – Evidence Confidence Must Be Deterministically Derived

The plan has a `≥85%` confidence gate.

Before implementation, define the source of that confidence.

Do not allow an LLM to assign:

```text
confidence = 92%
```

For deterministic rules, confidence should derive from measurable evidence quality, such as:

- source freshness
- input completeness
- calculation validity
- reconciliation status

If confidence cannot be established, use:

```text
UNKNOWN / INSUFFICIENT_DATA
```

and do not generate a fiduciary recommendation.

---

# 8. IMPORTANT – Recommendation Data Needs Explicit `asOf`

The database adds:

```text
as_of_date
```

Good.

Clarify:

```text
generatedAt = when recommendation was generated

asOf = financial state represented by the recommendation

sourceFreshness = freshness of underlying inputs
```

A recommendation should be reproducible from:

```text
stateHash
asOf
ruleVersion
calculationVersion
```

---

# 9. IMPORTANT – Stale vs Resolved Semantics Need One Precise Rule

The plan currently says:

- condition clears → `RESOLVED`
- state changes → `STALE`

This is directionally correct but needs one precise rule:

```text
New state
 ↓
Re-evaluate same rule
 ↓
Condition FALSE → RESOLVED
Condition TRUE + material baseline changed → STALE old trigger + create new trigger
Condition TRUE + immaterial state change → existing trigger may remain ACTIVE
```

Do not mark every stateHash change as STALE, otherwise normal unrelated data changes will generate notification churn.

---

# 10. IMPORTANT – `POST /evaluate` Must Never Bypass Safety Gates

Manual evaluation is useful for debugging and refresh.

But it must still enforce:

- family authorization
- domain completeness
- evidence confidence
- duplicate suppression
- cooldown
- materiality rules
- idempotency

It must not become a way to bypass the Observer's safety controls.

---

# 11. IMPORTANT – NotificationService Adapter Semantics

The plan correctly makes `proactive_triggers` authoritative.

Make the adapter relationship explicit:

```text
proactive_triggers
       ↓
NotificationService adapter
       ↓
Notification Center
```

NotificationService must not create a second authoritative copy of the recommendation.

If notification delivery fails:

```text
Trigger remains persisted
Notification delivery can retry
```

The financial recommendation must never be lost because presentation delivery failed.

---

# 12. IMPORTANT – Recommendation Lifecycle

The lifecycle currently contains:

```text
ACTIVE
ACKNOWLEDGED
SNOOZED
DISMISSED
RESOLVED
STALE
EXPIRED
```

This is acceptable, but define transitions explicitly.

For example:

```text
ACTIVE → ACKNOWLEDGED
ACTIVE → SNOOZED
ACTIVE → DISMISSED
ACTIVE → RESOLVED
ACTIVE → STALE
ACTIVE → EXPIRED

SNOOZED → ACTIVE
SNOOZED → DISMISSED
SNOOZED → RESOLVED
SNOOZED → STALE
```

Prevent invalid transitions such as:

```text
RESOLVED → ACTIVE
DISMISSED → ACKNOWLEDGED
```

unless explicitly represented as a new trigger.

---

# 13. IMPORTANT – Snooze Should Not Modify Financial Truth

Snooze is a presentation/user-preference operation.

It must not alter:

- cooldown rule state
- financial calculations
- Digital Twin
- Life Event state

Keep snooze metadata separate from the financial recommendation itself.

---

# 14. IMPORTANT – Dismissal Feedback Needs Controlled Semantics

The plan currently proposes extending cooldown after dismissal.

That's reasonable, but define the rule:

```text
DISMISS
 ↓
recommendation hidden
 ↓
cooldown extended
```

Do not permanently suppress a rule merely because the user dismissed it once.

A material financial change should still make the rule eligible again.

---

# 15. IMPORTANT – Initial Rule Catalogue Should Remain Exactly Nine

The nine-rule scope is appropriate.

Do not add:

- generic AI insights
- broad market predictions
- stock-picking recommendations
- speculative tax advice
- investment timing
- autonomous portfolio optimization

Those belong outside the scope of this sprint.

---

# 16. IMPORTANT – HLV Rule Requires Existing Calculation Ownership

`PROTECTION_HLV_GAP` must consume the existing HLV/protection calculation output.

Do not embed a new HLV formula in `ProactiveObserverService`.

The Rule → Calculation Owner Matrix should explicitly identify:

```text
Rule
Calculation Service
Required Inputs
Output Used
```

---

# 17. IMPORTANT – Tax Rule Requires Rule Version + Source

`TAX_80C_OPPORTUNITY` must use the existing tax engine.

The rule should persist:

```text
ruleCode
ruleVersion
jurisdiction
effectiveFrom
sourceReference
```

Do not hardcode tax law in the Observer.

---

# 18. IMPORTANT – Estate Nominee Gap Must Respect Data Limitations

The rule should only trigger when the authoritative graph/account data can establish a nominee gap.

If nominee information is unavailable:

```text
INSUFFICIENT_DATA
```

not:

```text
MISSING_NOMINEE
```

Avoid false fiduciary alerts.

---

# 19. IMPORTANT – Performance Target Is Fine, But Measure Before Optimizing

The `≤250ms` targeted evaluation target is reasonable.

Record:

```text
baseline dataset
rule(s) evaluated
p50
p95
p99
```

Do not optimize prematurely.

---

# 20. TEST BASELINE

Keep the established convention:

```text
Previous baseline: 289
New Sprint 8B.3 tests: X
Current total: 289 + X
Failures: 0
```

Do not artificially target `315`.

Test quality is more important than assertion count.

At minimum include:

- all 9 rules
- domain completeness
- confidence
- duplicate suppression
- cooldown
- material change
- stale/resolved
- lifecycle transitions
- concurrent creation
- manual evaluate safety
- cross-family isolation
- idempotency
- notification failure isolation
- audit provenance

---

# 21. OPEN QUESTIONS

The Agent currently asks:

1. Notification Center synchronization
2. Evaluation debounce

### Recommendation

These should be resolved in the implementation plan rather than left open.

#### Notification

Use:

```text
proactive_triggers = authoritative
NotificationService = adapter/presentation
```

High/critical triggers may be mirrored to NotificationService, but failure to mirror must not affect the authoritative trigger.

#### Debounce

Prefer **event-driven targeted evaluation with a small debounce/coalescing window** only if multiple events arrive in rapid succession.

Do not introduce an arbitrary 5-second delay if there is no demonstrated need.

The implementation should allow configuration rather than hardcoding 5 seconds.

---

# 22. DOCUMENTATION

After implementation, update:

- SESSION_CONTEXT.md
- AI_CHANGELOG.md
- PHASE_8_ROADMAP.md

Create/update only if needed:

- `docs/PROACTIVE_AI_ARCHITECTURE.md`
- `docs/PROACTIVE_RULE_CATALOG.md`
- `docs/PROACTIVE_COOLDOWN_MODEL.md`
- `docs/PROACTIVE_RECOMMENDATION_MODEL.md`

Avoid duplicate architecture documents.

---

# FINAL DECISION

## 🟢 PLAN APPROVED AFTER FINAL CLARIFICATIONS

The Agent has successfully incorporated the major review feedback.

**Do not redesign Sprint 8B.3.**

Add the focused clarifications above, especially:

1. Event → Rule mapping
2. Hash-based trigger identity
3. Atomic trigger/cooldown creation
4. Rule-specific materiality
5. Deterministic evidence confidence
6. Precise stale/resolved semantics
7. Manual evaluation safety gates
8. Notification adapter failure isolation
9. Explicit lifecycle transitions
10. Resolve the two open questions

Then proceed to implementation.

---

# IMPLEMENTATION GUARDRAIL

The most important invariant for Sprint 8B.3 remains:

```text
Authoritative Data
      ↓
Existing Calculation Engine
      ↓
Deterministic Observer Rule
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

Never:

```text
Event → AI → Financial Action
```

The Proactive Observer is an **early-warning and recommendation system**, not an autonomous financial agent.
