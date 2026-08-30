# SPRINT 9.1 – FINAL IMPLEMENTATION PLAN EXPANSION REQUIRED

## Status

The architectural direction is now largely accepted.

However, the submitted `SPRINT_9.1_IMPLEMENTATION_PLAN.md` is a summary rather than the detailed implementation plan required for production approval.

The document claims that several detailed analyses and design decisions exist, but those details are not included in the deliverable.

Please expand the existing implementation plan. Do not change the approved scope and do not begin implementation.

---

# 1. Include the Actual `X-Family-Id` Request-Path Audit

Document actual codebase findings.

Include:

| Request Source | Currently Read? | Current Effect | Affected Code Path | Proposed Behavior |
|---|---|---|---|---|

Cover:

- `X-Family-Id`
- `x-family-id`
- Query parameters
- Request body
- Authenticated JWT user context

Also document behavior for:

- Ordinary authenticated family routes
- Unauthenticated routes
- System/internal routes

Do not merely describe the proposed fix.

---

# 2. Include the Full 4-Stage Onboarding Journey

For each stage document:

| Stage | Purpose | Authoritative Domains | Existing APIs/Forms Reused | Required Information | Conditional Information | Optional Information | Skip/Defer |
|---|---|---|---|---|---|---|---|

The plan must explicitly demonstrate:

> Onboarding UI → Existing Domain API → Authoritative Domain Data

No parallel financial model may be introduced.

---

# 3. Include the Actual Initial 8-Action Registry

The executive summary states that eight concrete actions have been defined.

Include them in the plan.

Use:

| Action ID | Category | Detection Condition | Resolution Condition | Why It Matters | Affected Capabilities | Impact Level |
|---|---|---|---|---|---|---|

All conditions must be based on authoritative existing domain data.

Do not invent missing-data conditions that are not supported by the current codebase.

---

# 4. Finalize the Deterministic Ranking Algorithm

The plan currently refers to an "Internal Weighted Impact Score."

Before implementation, evaluate whether a weighted numeric score is actually necessary.

Prefer a deterministic lexicographic ranking model unless weights provide a demonstrated benefit:

```text
1. Priority Category
2. Impact Level
3. Core Capability Blocked
4. Number of Affected Capabilities
5. Multi-Pillar Impact
6. Stable actionId tie-break
```

If numeric weights are retained, document:

- The exact weights
- Why they exist
- Why they cannot create unstable or arbitrary prioritization

The same authoritative input must always produce identical ordering.

---

# 5. Include Explicit Service Responsibilities

Document:

## DigitalTwinService

Owns:

- Authoritative completeness
- Domain readiness
- Missing-data semantics

## Action Gap Analysis

Owns:

- Translation of authoritative readiness into actionable gaps

A separate physical service is optional, but this logical responsibility must remain separate.

## ActionRankingEngine

Owns:

- Deterministic ranking
- Category precedence
- Stable ordering

## FamilyCompletenessController

Owns:

- Family scope from authoritative request context
- API composition
- Response delivery

---

# 6. Include the Actual Endpoint Contract

Document request and response behavior for:

```text
GET /api/v1/family-office/completeness/actions
```

Include:

- Overall completeness
- Pillar/domain readiness
- Ranked actions
- Empty-state behavior
- Maximum response size
- Whether all active actions are returned

Clarify:

> Backend owns ranking; frontend displays the Top 3 by default.

---

# 7. Expand the Test Plan

For every initial action, include:

- Detection test
- Resolution test
- Family isolation test where relevant

Also retain the six architectural invariants:

1. No False Completion
2. Skip Does Not Hide Gap
3. Dynamic Recalculation
4. No Static Score Promise
5. Family Scope Security
6. Data Integrity Precedence

---

# Stop Condition

After expanding the detailed implementation plan:

1. Save the complete revised `SPRINT_9.1_IMPLEMENTATION_PLAN.md`.
2. Summarize the final architectural decisions.
3. Stop.

Do not begin production implementation.