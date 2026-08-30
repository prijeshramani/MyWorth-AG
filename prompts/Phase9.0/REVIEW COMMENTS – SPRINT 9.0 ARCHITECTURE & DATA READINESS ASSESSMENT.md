# REVIEW COMMENTS – SPRINT 9.0 ARCHITECTURE & DATA READINESS ASSESSMENT

## Review Status

**APPROVED WITH REQUIRED CLARIFICATIONS**

The Sprint 9.0 assessment correctly identifies the primary Phase 9 strategic direction:

> FamilyWealthOS should improve authoritative data completeness, onboarding, data quality, reconciliation, and historical readiness before adding additional advanced AI capabilities.

The assessment is therefore accepted as the architectural basis for Phase 9.

However, the following review comments must be addressed before Sprint 9.1 implementation planning begins.

---

# 1. Do Not Treat the ≥85% Completeness Figure as Established Fact

The assessment states or implies that the proposed minimum data foundation:

> guarantees or achieves ≥85% completeness.

This must not be treated as an architectural fact unless demonstrated mathematically against the actual existing Digital Twin completeness implementation.

## Required clarification

The future documentation must state:

> The proposed foundational dataset is expected to materially improve Digital Twin completeness and unlock additional intelligence capabilities. The actual completeness score must continue to be calculated by the authoritative completeness engine.

Do not:

- Hardcode an 85% threshold.
- Promise a specific completeness score without calculation.
- Design onboarding logic around an assumed score.

---

# 2. Sprint 9.1 Must Not Create a Second Completeness Engine

The proposed:

> "Top 3 Actions to Complete Your Profile"

capability is approved conceptually.

However, the architecture must remain:

> **Authoritative Domain Data → Digital Twin / Completeness Evaluation → Gap Analysis → Deterministic Action Ranking → UI**

The frontend must not independently determine:

- What information is missing.
- Which action is most important.
- How completeness changes.
- Which capability is unlocked.

These decisions must be derived deterministically from authoritative backend/domain information.

---

# 3. The Onboarding Wizard Must Reuse Existing Domain Models

The proposed progressive onboarding experience must be an orchestration layer.

It must not introduce:

- A parallel onboarding asset model.
- A second insurance record format.
- Duplicate family profile storage.
- Temporary financial records that later need synchronization.

The preferred model is:

> **Onboarding Step → Existing Domain API / Domain Command → Authoritative Domain Data**

The onboarding experience may track UI progress separately if necessary, but financial facts must continue to exist only in their authoritative domain.

---

# 4. Do Not Freeze the Design to a "3-Step Wizard" Yet

The Sprint 9.0 assessment proposes a specific three-step onboarding flow.

The concept is accepted, but the exact number and structure of steps should be validated during Sprint 9.1 planning.

The implementation plan should compare the proposed onboarding journey against:

- Existing application navigation.
- Existing domain entry workflows.
- Dependencies between intelligence capabilities.
- Progressive disclosure requirements.

The objective is:

> Minimum user effort for maximum intelligence gain.

Do not add steps merely to fit a predefined wizard structure.

---

# 5. REQUIRED SECURITY CLARIFICATION – `X-Family-Id`

Sprint 9.0 identifies that CORS configuration still includes:

- `X-Family-Id`
- `x-family-id`

This requires explicit verification before Sprint 9.1 implementation.

The established architectural invariant remains:

> Family scope must be server-authoritative.

The agent must verify the complete request path when a client supplies `X-Family-Id`.

Document:

1. Whether the header is read anywhere.
2. Whether it can influence `CorrelationContext`.
3. Whether it can influence repository queries.
4. Whether it is ignored.
5. Whether it is rejected.
6. Whether any authorized administrative use case exists.

The outcome must confirm that an ordinary client cannot select another family by manipulating this header.

Do not assume that CORS presence alone is harmless.

---

# 6. Historical Fixed-Income Modeling Requires Instrument-Specific Rules

The recommendation to improve:

- Fixed Deposit
- PPF
- EPF

historical reconstruction is accepted.

However, these must not automatically be implemented using one generic compound-interest formula.

Future Sprint 9.3 architecture should support:

> **Instrument-Specific Valuation Rules + Explicit Historical Rule Provenance**

For every reconstructed value, distinguish where applicable:

- Exact historical evidence.
- Deterministic reconstruction using known instrument rules.
- Contractual/acquisition information.
- Proxy valuation.
- Historical source unavailable.

Historical calculations must never silently imply that reconstructed values are directly observed historical market values.

---

# 7. Data Quality Must Eventually Influence Action Prioritization

The proposed onboarding and completeness system should not permanently operate independently from data quality.

The long-term action model should support categories such as:

## Priority Category A – Data Integrity

Examples:

- Duplicate holdings.
- Contradictory values.
- Broken links.
- Negative quantity anomalies.

## Priority Category B – Missing Foundation

Examples:

- Missing family demographics.
- Missing insurance information.
- Missing liabilities.
- Missing essential tax profile.

## Priority Category C – Intelligence Enrichment

Examples:

- Acquisition dates.
- Beneficiary mappings.
- Additional goals.

## Priority Category D – Optional Enrichment

Information that improves experience but does not materially block intelligence.

Sprint 9.1 does not need to implement the complete Data Quality Center.

However, its architecture must not prevent Sprint 9.2 findings from becoming actionable priorities later.

---

# 8. Clarify the Import-Engine Asymmetry Finding

The assessment states that imported data may not automatically populate associated entity accounts or tax lot links.

Before treating this as Phase 9 technical debt, provide evidence for:

- The exact import path.
- The affected source.
- The affected destination entities.
- The resulting user-visible or calculation impact.

Do not classify architectural debt based solely on an inferred relationship.

---

# 9. Validate Performance Estimates Before Including Them in Roadmaps

The assessment estimates that indexing and historical price backfill could improve Time Machine queries:

> from approximately 250ms to less than 15ms.

Unless benchmark measurements exist, this must be treated as an unverified hypothesis.

Future roadmap language should instead state:

> Benchmark current query performance and introduce indexing where evidence demonstrates a material performance requirement.

Do not introduce database indexes solely based on projected numbers.

---

# 10. Phase 9 Roadmap – Approved with Refinement

The recommended sequencing is accepted with the following refinement:

## Sprint 9.1

### Family Financial Onboarding & Actionable Completeness

Primary objectives:

- Progressive onboarding orchestration.
- Reuse of existing authoritative domain models.
- Deterministic completeness gap analysis.
- Next-best-action ranking.
- Clear explanation of missing information.
- Clear explanation of intelligence impact.

---

## Sprint 9.2

### Data Quality & Reconciliation Foundation

Primary objectives:

- Duplicate detection.
- Data conflicts.
- Missing acquisition information.
- Unlinked holdings.
- Stale data.
- Data quality status and review workflows.

---

## Sprint 9.3

### Historical Valuation & Instrument Intelligence

Primary objectives:

- Historical evidence architecture.
- Instrument-specific reconstruction.
- Fixed-income treatment.
- Historical valuation provenance.
- Historical completeness.

Do not use one generic compounding model for all instruments.

---

## Sprint 9.4

### External Data Integration Foundation

Only after:

- Internal authoritative data structures are stable.
- Reconciliation mechanisms exist.
- Source provenance and refresh semantics are clearly defined.

---

# 11. Required Next Deliverable

Proceed now to planning for:

# SPRINT 9.1 – FAMILY FINANCIAL ONBOARDING & ACTIONABLE COMPLETENESS

The next output must be:

# `SPRINT_9.1_IMPLEMENTATION_PLAN.md`

## Important

This is an implementation plan only.

Do not modify production code yet.

The plan must include:

1. Current-state architecture findings relevant to Sprint 9.1.
2. Exact existing domain APIs/services to be reused.
3. Proposed onboarding journey and justification.
4. Authoritative source of onboarding completeness.
5. Deterministic Next-Best-Action architecture.
6. Action ranking criteria.
7. How missing data affects intelligence capabilities.
8. Backend contracts required.
9. Frontend components required.
10. Database changes, if genuinely required.
11. Migration requirements, if any.
12. Security implications.
13. Family scope handling.
14. Read/write separation.
15. Idempotency considerations.
16. Test strategy.
17. Explicit non-goals.
18. Rollback/compatibility considerations.

The plan must also explicitly confirm:

> No parallel financial data model will be created.

---

# 12. Mandatory Stop Condition

After producing:

`SPRINT_9.1_IMPLEMENTATION_PLAN.md`

the agent must:

1. Summarize the plan.
2. Identify architectural decisions requiring review.
3. Stop.

Do not begin production implementation until the implementation plan is reviewed and approved.