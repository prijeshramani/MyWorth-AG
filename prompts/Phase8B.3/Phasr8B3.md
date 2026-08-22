# FamilyWealthOS – Sprint 8B.3

## Proactive Fiduciary AI Observer & Cooldown Registry

### Objective

Sprint 8B.0, 8B.1 and 8B.2 are complete and hardened.

Current baseline:

* **289/289 tests passing**
* Backend TypeScript: **0 errors**
* Frontend TypeScript: **0 errors**
* Dynamic family scoping
* Digital Twin
* Life Events & Consequence Engine
* Idempotency
* Correlation
* Audit infrastructure
* Explainability/provenance

The next capability is:

> **Proactive Fiduciary AI Observer & Cooldown Registry**

The objective is to move from:

```text
User asks → AI responds
```

to:

```text
Authoritative Data Changes
        ↓
Relevant Condition Detected
        ↓
Deterministic Evaluation
        ↓
Evidence + Confidence + Data Completeness
        ↓
Proactive Recommendation
        ↓
Cooldown / Duplicate Check
        ↓
User Notification
        ↓
Human Decision
```

---

# CRITICAL RULE

### This request is for an IMPLEMENTATION PLAN ONLY.

**Do NOT modify production code.**

**Do NOT create migrations.**

**Do NOT implement the Observer.**

**Do NOT implement UI changes.**

**Do NOT implement notifications.**

First inspect the current repository and produce the implementation plan.

---

# 1. Inspect Existing Architecture

Before proposing anything, inspect and document how the following currently work:

* `DigitalTwinService`
* Digital Twin contracts
* `LifeEventEngineService`
* Life Event contracts
* Consequence Engine
* `EventBus`
* `AuditHookService`
* `CorrelationContext`
* SQLite Idempotency
* `NotificationService`
* AI Advisor
* AI Context Aggregator
* existing AI recommendation infrastructure
* existing notification/recommendation lifecycle
* existing cooldown/deduplication functionality, if any

### Important

**Reuse existing infrastructure wherever possible.**

Do not create duplicate services or frameworks.

---

# 2. Define the Proactive Observer

Define exactly what the Observer owns.

It may:

* detect relevant changes
* select applicable rules
* gather evidence
* evaluate deterministic conditions
* assess confidence/data completeness
* generate recommendations
* apply duplicate suppression
* apply cooldowns
* assign priority
* create notification/recommendation records
* maintain audit lineage

It must NOT:

* calculate portfolio valuation itself
* calculate tax itself
* calculate insurance itself
* calculate retirement itself
* calculate goals itself
* modify financial records
* execute investments
* modify SIPs
* change beneficiaries
* submit tax filings

Existing domain engines remain authoritative.

---

# 3. Define Initial Proactive Rules

Propose a **small, high-value initial rule set**, covering where supported:

### Portfolio

* Allocation drift
* Concentration risk

### Insurance

* Renewal approaching
* Maturity approaching
* Coverage gap

### Liquidity

* Emergency fund below target

### Goals

* Goal falling behind

### Tax

* Tax-saving opportunity where authoritative data supports it

### Estate

* Missing nominee
* Estate documentation gap

### Life Events

* Unresolved Life Event consequence

For EACH rule define:

```text
Rule Code
Trigger
Evidence
Existing Calculation/Service Used
Condition
Recommendation
Priority
Confidence Requirement
Data Completeness Requirement
Cooldown
Duplicate Key
User Action
```

---

# 4. Confidence & Data Completeness

Keep these separate:

```text
Evidence Confidence
Data Completeness
Calculation Determinism
AI Interpretation Confidence
```

AI confidence must never compensate for poor financial data.

Define the exact gating model.

---

# 5. Recommendation Model

Design the recommendation contract.

It should support:

* recommendation ID
* family scope
* rule code/version
* domain
* priority
* recommendation status
* evidence
* impact
* recommendation
* confidence
* data completeness
* Digital Twin `stateHash`
* `asOf`
* creation timestamp
* expiry
* correlation ID

Reuse existing explainability contracts wherever possible.

---

# 6. Duplicate Suppression

Define how the system prevents the same recommendation from appearing repeatedly.

The design should consider:

```text
family
rule
entity
baseline stateHash
rule version
```

A material state change should be able to create a new recommendation.

---

# 7. Cooldown Registry

Design a rule-specific cooldown mechanism.

Determine whether existing notification/recommendation infrastructure can be extended.

Define:

* cooldown duration
* next eligible time
* last state hash
* rule status
* material-change override
* dismissal behavior

Avoid a single global cooldown.

---

# 8. Recommendation Lifecycle

Inspect the existing lifecycle and reuse it where possible.

Determine support for:

* New
* Seen
* Acknowledged
* Dismissed
* Snoozed
* Resolved
* Expired
* Stale

Do not introduce unnecessary states.

---

# 9. Stale Recommendations

Define what happens when:

```text
Recommendation created
        ↓
Digital Twin changes
        ↓
Recommendation is no longer valid
```

The system must not continue showing stale financial advice as current.

---

# 10. Proactive AI Boundary

AI may be used for:

* explanation
* summarization
* natural-language presentation
* prioritization where justified

AI must NOT determine financial truth.

Correct:

```text
Deterministic Rule:
Allocation drift = 8.7%

        ↓

AI:
"Your equity allocation is above your target range."
```

Not:

```text
AI:
"I think your portfolio is too risky."
```

without deterministic evidence.

---

# 11. Event-Driven Execution

Prefer:

```text
Domain Event
    ↓
Relevant Rules
    ↓
Targeted Evaluation
```

Avoid:

```text
Every minute
    ↓
Hydrate entire Digital Twin
    ↓
Run every rule
```

Identify which existing events can trigger the Observer.

Do not invent an unnecessary event infrastructure.

---

# 12. Security

Every operation must resolve:

```text
Authenticated User
        ↓
Authorized Active Family
        ↓
Observer
```

A client-supplied `familyId` must never override the authorized family.

Include cross-family authorization tests in the plan.

---

# 13. Idempotency & Audit

Reuse Sprint 8B.0 infrastructure.

Any state-changing recommendation operation such as:

* dismiss
* snooze
* acknowledge
* resolve

must be idempotent.

Reuse:

* `AuditHookService`
* `CorrelationContext`
* `EventBus`

Do not create a second framework.

Audit records must remain sanitized.

---

# 14. Failure Isolation

If one rule fails:

```text
Portfolio Rule       ✅
Insurance Rule       ❌
Goal Rule            ✅
Estate Rule          ✅
```

the remaining rules must continue.

Define:

* timeout
* retry
* failure handling
* logging/audit
* observability

---

# 15. Performance

Define an initial performance target for targeted rule evaluation.

Use the current real dataset for benchmarking.

Do not optimize prematurely.

---

# 16. Database & API

Determine whether existing tables/services can support the Observer.

Only propose new migrations if genuinely required.

Define the minimum API surface needed for:

* listing recommendations
* viewing recommendation details
* acknowledge
* dismiss
* snooze
* resolve

Reuse existing API response/error conventions.

---

# 17. UI

**Do not redesign the UI in this sprint.**

Determine how the existing Notification Center / dashboard / AI interface can consume the new recommendation capability.

Any required UI work should be documented as a separate future task.

---

# 18. Testing

Current baseline:

**289 tests**

The implementation plan must define tests for:

* every initial rule
* confidence gating
* completeness gating
* duplicate suppression
* cooldown
* material state changes
* stale recommendations
* cross-family access
* idempotency
* failure isolation
* event triggering
* regression

Use:

```text
Previous baseline: 289
New tests: X
Current total: 289 + X
Failures: 0
```

Do not artificially target a test count.

---

# 19. Business Logic Protection

The implementation MUST NOT modify existing:

* portfolio calculations
* tax calculations
* insurance calculations
* retirement calculations
* goal calculations
* estate calculations
* Digital Twin calculations
* Life Event calculations

The Observer is an orchestration layer.

Existing domain engines remain authoritative.

---

# 20. Required Deliverable

Create:

`prompts/Phase8B.3/SPRINT_8B_3_IMPLEMENTATION_PLAN.md`

It must contain:

1. Objective
2. Scope
3. Non-goals
4. Existing components inspected
5. Components reused
6. Components to extend
7. New components required
8. Observer architecture
9. Trigger/event mapping
10. Rule catalogue
11. Confidence model
12. Recommendation model
13. Explainability
14. Duplicate suppression
15. Cooldown model
16. Recommendation lifecycle
17. Stale recommendation handling
18. Database changes
19. API design
20. Notification integration
21. AI role
22. Security
23. Idempotency
24. Audit
25. Failure isolation
26. Performance
27. Test strategy
28. Migration strategy
29. Rollback strategy
30. Acceptance criteria
31. Risks
32. Explicit business-logic protection statement

Also identify any existing documents that should be updated.

---

# FINAL INSTRUCTION

**STOP after creating the implementation plan.**

Do not write production code.

Do not create migrations.

Do not modify contracts.

Do not modify the UI.

Do not implement the Observer.

Return:

1. `SPRINT_8B_3_IMPLEMENTATION_PLAN.md`
2. Summary of architecture findings
3. Existing components that can be reused
4. New components proposed
5. Open questions requiring review

## The implementation will begin only after the implementation plan has been reviewed and explicitly approved.

