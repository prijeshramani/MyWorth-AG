# FINAL REVIEW COMMENTS – SPRINT 9.1 IMPLEMENTATION PLAN

## Status

**REQUIRES ONE FINAL PLAN REVISION BEFORE IMPLEMENTATION APPROVAL**

The revised plan correctly incorporates the major architectural corrections from the previous review.

The following decisions are accepted:

- No fixed completeness point-gain promises.
- Qualitative impact levels.
- Explicit affected capabilities.
- No onboarding-state database migration in Sprint 9.1.
- No dismissed-action persistence.
- Skip/defer does not hide authoritative gaps.
- Actions resolve only after authoritative data satisfies the resolution condition.
- Backend-owned deterministic ranking.
- Top 3 as the default UI presentation.
- Data Integrity category precedence above Missing Foundation and Intelligence Enrichment.

However, the current document is still too high-level to safely begin implementation.

The following details must be added.

---

# 1. REQUIRED – ACTUAL `X-Family-Id` REQUEST-PATH AUDIT

Do not document only the proposed fix.

Document the actual current-state findings.

The revised plan must answer:

1. Where is `X-Family-Id` currently accepted?
2. Is it only listed in CORS configuration, or is it read by application code?
3. Does it influence `CorrelationContext`?
4. Does it influence family-scoped repository queries?
5. Where is authenticated user identity attached to the request?
6. Is `user.familyId` guaranteed for all ordinary authenticated family routes?
7. What is the behavior for unauthenticated/system routes?
8. Why is `CorrelationMiddleware.ts` the correct modification point?

Only after documenting the actual request path should the security change be finalized.

---

# 2. REQUIRED – DEFINE THE ONBOARDING JOURNEY

The plan currently proposes a "4-stage setup modal."

The revised plan must justify the onboarding structure.

Document:

- The proposed stages.
- The purpose of each stage.
- Which authoritative domains each stage touches.
- Which existing APIs/forms are reused.
- Which fields are required versus optional.
- Which stages can be skipped/deferred.
- Why the proposed structure minimizes user effort.

Do not create a new financial data model.

The structure must remain:

> Onboarding UI → Existing Domain Workflow/API → Authoritative Domain Data

The exact number of stages is acceptable only after it is justified.

---

# 3. REQUIRED – DEFINE DETERMINISTIC RANKING CRITERIA

Priority category alone is insufficient.

Document deterministic ranking rules.

At minimum, define:

## Ranking Level 1

Priority category:

```text
A – Data Integrity
B – Missing Foundation
C – Intelligence Enrichment
D – Optional Enrichment
```

## Ranking Level 2

Within-category impact criteria.

For example, evaluate:

- Number of blocked capabilities.
- Whether a core calculation is blocked.
- Whether resolving the action unlocks dependent intelligence.
- Whether the missing data affects multiple domains.

The exact scoring mechanism must remain internal and deterministic.

## Ranking Level 3

Stable tie-breaking.

The same authoritative input must always produce the same action order.

Do not use randomness.

---

# 4. REQUIRED – DEFINE THE INITIAL ACTION REGISTRY

The implementation plan must identify the initial Sprint 9.1 actions.

For every initial action, document:

| Action ID | Category | Detection Condition | Resolution Condition | Why It Matters | Affected Capabilities | Impact Level |
|---|---|---|---|---|---|---|

The initial set should remain intentionally small and high-value.

Do not attempt to model every possible missing financial field in Sprint 9.1.

---

# 5. REQUIRED – CLARIFY DATA INTEGRITY PRODUCERS

Sprint 9.2 is responsible for the formal Data Quality & Reconciliation Foundation.

Therefore, clarify how Category A actions work in Sprint 9.1.

Preferred approach:

> The ActionRankingEngine supports Category A from day one, but Sprint 9.1 consumes only already-existing deterministic integrity signals.

If no authoritative integrity signals currently exist:

> Category A has no active producers during Sprint 9.1.

Do not build a major new reconciliation engine inside Sprint 9.1.

---

# 6. REQUIRED – CLARIFY SERVICE RESPONSIBILITIES

Prevent `DigitalTwinService` from becoming a general-purpose orchestration service.

Document logical responsibilities:

## DigitalTwinService

Responsible for:

- Authoritative completeness.
- Domain readiness.
- Missing-data semantics.

Not responsible for:

- UI routes.
- Ranking presentation logic.
- Independent score assumptions.

## Action Gap Analysis

Responsible for:

- Translating authoritative readiness/missing conditions into actionable gaps.

## ActionRankingEngine

Responsible for:

- Category precedence.
- Deterministic within-category ranking.
- Stable ordering.

## Controller

Responsible for:

- Family scope resolution through existing authoritative request context.
- Calling the relevant services.
- Returning the contract.

A separate physical `ActionGapAnalyzer` service is optional if the implementation can maintain this separation cleanly without unnecessary abstraction.

---

# 7. REQUIRED – DEFINE ENDPOINT RESPONSE BEHAVIOR

Clarify:

- Maximum number of actions returned.
- Whether all active actions are returned or bounded.
- How Top 3 is determined.
- How the frontend obtains additional actions.
- Response behavior when no actionable gaps exist.

Recommended principle:

> Backend owns ranking. Frontend owns how many ranked items are displayed.

---

# 8. REQUIRED – PAN AND SENSITIVE DATA HANDLING

Do not make PAN a universal onboarding requirement unless existing authoritative domain rules already require it.

The plan must explicitly classify:

### Required foundational information

Information genuinely required for current intelligence capabilities.

### Conditional information

Information required only for applicable tax/KYC workflows.

### Optional enrichment

Information that improves future intelligence.

The onboarding layer must not introduce stricter collection requirements than the existing authoritative domains without explicit justification.

---

# 9. REQUIRED – IMPLEMENTATION SEQUENCE

Add an exact implementation sequence.

Recommended order:

1. Current security request-path verification.
2. Contracts.
3. Authoritative gap analysis.
4. Deterministic ranking.
5. Read-only endpoint.
6. Backend tests.
7. Frontend API integration.
8. Next-Best-Action panel.
9. Onboarding orchestration.
10. Frontend tests/build.
11. Full regression suite.

The agent may adjust the sequence if justified.

---

# 10. REQUIRED – EXPLICIT NON-GOALS

Retain and explicitly list:

- No database migration.
- No persistent onboarding state.
- No dismissed-action persistence.
- No parallel financial models.
- No new financial mathematics.
- No formal reconciliation engine.
- No external data integrations.
- No AI-generated financial facts.
- No client-controlled family scope.

---

# REQUIRED NEXT DELIVERABLE

Revise:

# `SPRINT_9.1_IMPLEMENTATION_PLAN.md`

The revision should add the required implementation detail above.

Do not begin production implementation.

After producing the final revised implementation plan:

> STOP AND WAIT FOR APPROVAL.