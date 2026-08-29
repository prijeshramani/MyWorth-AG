# FamilyWealthOS – Sprint 8C.3 Agent Planning Prompt

## Sprint 8C.3: Financial Time Machine & Point-in-Time Reconstruction

### Current Project State

Sprint 8C.2 is complete and closed.

Current verified baseline:

* **Sprint 8C.0** – Foundation Contracts & Migration 019: ✅ Complete
* **Sprint 8C.1** – Family Financial Health Index & Historical Snapshotting: ✅ Complete
* **Sprint 8C.2** – Multi-Domain Timeline Ledger & Deterministic Narrative History: ✅ Complete
* **Master Test Suite:** **348 PASSED, 0 FAILED**
* **Backend TypeScript:** Clean
* **Frontend TypeScript:** Clean

The next sprint is:

> **Sprint 8C.3 – Financial Time Machine & Point-in-Time Reconstruction**

---

# PRIMARY INSTRUCTION

## DO NOT MODIFY PRODUCTION CODE YET

Your task in this phase is to:

1. Analyse the existing architecture.
2. Inspect all relevant existing services, repositories, contracts, migrations and tests.
3. Determine what historical information is genuinely available.
4. Design Sprint 8C.3 around the actual available data.
5. Create a detailed implementation plan.

### STOP after creating the implementation plan.

Do not:

* modify production code,
* create migrations,
* modify contracts,
* change existing business logic,
* begin implementation,
* or start Sprint 8C.4.

---

# 1. SPRINT OBJECTIVE

Design a **Financial Time Machine** that allows the application to reconstruct, as faithfully as possible:

> **"What did FamilyWealthOS know about the family's financial position at a particular point in time?"**

The Time Machine must support point-in-time reconstruction without:

* fabricating historical values,
* backfilling unavailable market prices,
* treating today's data as historical truth,
* or confusing current-state projections with historical evidence.

The central principle is:

```text
AUTHORITATIVE HISTORICAL DATA
        +
EXACT HISTORICAL RECORDS
        +
EXPLICITLY LABELLED PROXIES
        +
KNOWN ACQUISITION COSTS
        ↓
POINT-IN-TIME RECONSTRUCTION
        ↓
PROVENANCE-AWARE DIGITAL TWIN
        ↓
TIME MACHINE RESPONSE
```

---

# 2. MOST IMPORTANT FIDUCIARY INVARIANT

The Financial Time Machine must never imply greater historical certainty than the available evidence supports.

The system must distinguish at minimum:

```text
EXACT_HISTORICAL
PRIOR_DATE_PROXY
KNOWN_ACQUISITION_COST
HISTORICAL_SOURCE_UNAVAILABLE
UNKNOWN
```

Where appropriate, continue using the existing authoritative provenance terminology already introduced in the FamilyWealthOS contracts.

### Critical rule

A reconstructed value must never be presented simply as:

```text
₹50,00,000 on 1 January 2024
```

if the actual meaning is:

```text
Estimated using the nearest known prior value.
```

The provenance must remain available to both:

* API consumers,
* and the future UI.

---

# 3. FIRST: ANALYSE THE EXISTING ARCHITECTURE

Before proposing implementation, inspect the existing codebase.

At minimum analyse:

## A. Digital Twin

Inspect:

```text
DigitalTwinService
AIContextAggregator
FamilyFinancialHealthService
```

Determine:

* what current-state data the Digital Twin aggregates,
* whether it already supports `asOfDate`,
* which values are calculated,
* which values originate from authoritative sources,
* and what assumptions currently depend on "now".

---

## B. Financial Time Machine Contracts

Inspect the existing Sprint 8C.0 contracts, including:

```text
TimeMachineReconstructionSchema
ReconstructedAssetHoldingSchema
WhatIfScenarioInputSchema
WhatIfSimulationResultSchema
```

Determine:

* whether the existing schemas are sufficient,
* whether they contain assumptions not yet implementable,
* and whether changes would be required.

Do not modify them yet.

Document proposed changes separately in the plan.

---

## C. Portfolio and Transaction History

Inspect all portfolio-related tables and services.

Determine exactly what historical evidence exists for:

```text
Asset purchases
Asset sales
Transactions
Current holdings
Historical valuations
NAV data
Market prices
Fixed deposits
Other investment instruments
```

The implementation plan must clearly distinguish:

```text
transaction history
```

from:

```text
historical valuation history
```

They are not the same thing.

---

## D. Protection / Insurance

Inspect:

```text
insurance policies
premium information
policy start dates
maturity dates
coverage values
surrender values
```

Determine what can genuinely be reconstructed historically.

Examples:

A policy may have:

```text
Policy start date
Sum assured
Current status
```

This does not automatically mean historical surrender value is available.

The plan must not invent historical policy valuations.

---

## E. Goals

Inspect the goals model.

Determine whether historical versions exist for:

```text
Target amount
Current amount
Goal status
Goal creation
Goal completion
```

If only the current row exists, explicitly document the limitation.

Do not reconstruct previous goal targets unless historical evidence exists.

---

## F. Tax

Inspect:

```text
TaxCalculationEngine
tax_profiles
tax_deductions
relevant tax history
```

Determine whether historical tax calculations can genuinely be reconstructed.

Important distinction:

```text
Historical tax data
```

vs

```text
Recalculating old tax scenarios using today's rules
```

The Time Machine must not silently apply current tax rules to historical periods unless this is explicitly represented as a scenario calculation rather than historical reconstruction.

---

## G. Estate

Inspect:

```text
EstateHealthService
wills
estate records
nominee / beneficiary relationships
knowledge graph
```

Determine what historical information exists.

Do not infer that today's estate arrangement existed at an earlier date.

---

## H. Life Events

Inspect:

```text
LifeEventService
life_events
event dates
lifecycle status
```

Life events are potentially important historical anchors.

Determine how declared and detected events can participate in point-in-time reconstruction.

---

## I. Timeline Ledger

Inspect Sprint 8C.2:

```text
FamilyTimelineService
family_timeline_events
Timeline contracts
Timeline provenance
state hashes
event dates
sourceObservedAt
sourceStateHash
```

Determine exactly how the Timeline Ledger can assist reconstruction.

### Important architectural rule

The timeline is:

```text
A derived historical projection
```

It is not automatically the authoritative source of financial state.

The Time Machine may use timeline events as evidence or navigation anchors, but must not elevate the derived timeline above authoritative domain data.

---

## J. Historical Snapshots

Inspect:

```text
family_health_history
```

and any other snapshot/history infrastructure.

Determine whether these snapshots can be used as:

```text
historical evidence
```

and precisely what they represent.

Do not assume an FFH snapshot contains a complete Digital Twin reconstruction unless the stored data actually supports that conclusion.

---

# 4. REQUIRED ARCHITECTURAL PRINCIPLE

The plan must explicitly define the reconstruction hierarchy.

Recommended conceptual hierarchy:

```text
LEVEL 1
Exact authoritative historical state

↓

LEVEL 2
Authoritative transaction/event history

↓

LEVEL 3
Nearest prior authoritative state

↓

LEVEL 4
Known acquisition/original cost

↓

LEVEL 5
Historical source unavailable

↓

LEVEL 6
Unknown
```

However, do not blindly adopt this hierarchy if the existing architecture requires a more precise model.

Analyse the actual data first.

---

# 5. DEFINE THE MEANING OF `asOfDate`

This is critical.

The plan must explicitly define:

```text
asOfDate
```

as:

> The requested point in time for which the system attempts to reconstruct the family's financial state.

It must also distinguish:

```text
eventDate
```

from:

```text
sourceEffectiveDate
```

from:

```text
sourceObservedAt
```

from:

```text
reconstructionPerformedAt
```

These must not be conflated.

---

# 6. RECONSTRUCTION MUST BE DOMAIN-SPECIFIC

Do not create one generic fallback algorithm for every financial domain.

The implementation plan should define domain-specific reconstruction strategies.

For example:

## Portfolio

Potential evidence order might be:

```text
Exact historical valuation
→ transaction-derived holdings + authoritative price
→ nearest prior valuation
→ acquisition cost
→ unavailable
```

But validate whether the current data model actually supports each level.

---

## Fixed Deposits

Determine whether the existing:

```text
fdValuation.ts
```

can deterministically calculate historical accrued value.

If the required information exists, a calculated historical value may be legitimate.

If so, it must clearly state:

```text
provenance = CALCULATED
```

with:

```text
calculationVersion
ruleVersion
inputs
```

The plan must define exactly what happens when required historical inputs are missing.

---

## Insurance

Separate:

```text
coverage protection
```

from:

```text
financial asset value
```

Maintain the existing valuation invariant.

For example:

```text
SUM_ASSURED ≠ NET_WORTH
```

Do not allow Time Machine reconstruction to accidentally add insurance coverage to historical net worth.

---

## Goals

Historical reconstruction must reflect what was actually known at the requested date.

If historical goal versions do not exist:

```text
HISTORICAL_SOURCE_UNAVAILABLE
```

may be more honest than using today's target.

---

## Tax

Separate:

```text
historical filed/recorded data
```

from:

```text
hypothetical recalculation
```

The Time Machine reconstruction should not silently become a What-If engine.

---

# 7. STATE COMPLETENESS AND CONFIDENCE

The Time Machine response must not only return values.

It should communicate:

```text
Completeness
Confidence
Provenance
Unavailable domains
Proxy usage
```

The plan should determine whether to reuse existing concepts such as:

```text
PillarStatusEnum
ProvenanceTypeEnum
Digital Twin completeness
```

rather than creating competing semantics.

Avoid duplicate status models.

---

# 8. NO HISTORICAL FABRICATION

The following are explicitly prohibited.

## Prohibited

```text
Using today's portfolio value as a historical value.
```

```text
Using today's insurance surrender value for a past date.
```

```text
Using today's goal target as an old target without evidence.
```

```text
Applying current tax rules and presenting the result as historical fact.
```

```text
Inventing market prices for dates where no price exists.
```

```text
Interpolating values unless interpolation is explicitly approved,
mathematically justified, and labelled as CALCULATED/ESTIMATED.
```

Default behaviour should favour:

```text
UNKNOWN
```

over fabricated precision.

---

# 9. TIME MACHINE OUTPUT CONTRACT

The implementation plan should propose a clear response model.

Conceptually, something similar to:

```text
TimeMachineReconstruction
├── familyId
├── asOfDate
├── reconstructionPerformedAt
├── overallCompleteness
├── overallStatus
├── domains
│   ├── portfolio
│   ├── protection
│   ├── liquidity
│   ├── goals
│   ├── estate
│   └── tax
├── reconstructedAssets
├── provenanceSummary
├── unavailableData
├── warnings
├── calculationVersion
└── stateHash
```

Do not implement this structure blindly.

First compare it with the existing 8C.0 contracts.

---

# 10. POINT-IN-TIME DIGITAL TWIN

Determine whether Sprint 8C.3 should:

### Option A

Extend:

```text
DigitalTwinService
```

to support:

```text
getDigitalTwin(familyId, asOfDate)
```

or:

### Option B

Create a dedicated:

```text
FinancialTimeMachineService
```

which orchestrates domain-specific historical reconstruction.

The plan must justify the architectural decision.

### Guardrail

Do not overload the existing current-state Digital Twin with historical responsibilities if doing so would:

* break existing callers,
* introduce hidden `asOfDate` assumptions,
* or complicate current-state calculations.

Prefer explicit separation if appropriate.

---

# 11. CACHING AND PERSISTENCE

Analyse whether Time Machine reconstructions should be:

```text
calculated on demand
```

or:

```text
persisted
```

Do not automatically introduce a new database table.

Consider:

* determinism,
* reconstruction cost,
* data changes,
* rule version changes,
* historical evidence changes,
* and cache invalidation.

The plan must explicitly justify the chosen approach.

---

# 12. STATE HASHING

If the reconstructed state uses a `stateHash`, define exactly what it represents.

It should be deterministic.

Do not include:

```text
reconstructionPerformedAt
random UUIDs
request IDs
```

Recommended conceptual inputs:

```text
familyId
asOfDate
domain source hashes
normalized reconstructed values
provenance
calculationVersion
ruleVersions
```

But validate this against the existing project conventions.

---

# 13. API DESIGN

Propose REST endpoints without implementing them.

Possible conceptual endpoint:

```text
GET /api/v1/family-office/time-machine?asOfDate=YYYY-MM-DD
```

The Agent must determine:

* validation rules,
* maximum historical range,
* timezone semantics,
* family scope enforcement,
* idempotency requirements,
* error responses.

### Family scope

As established in previous sprints:

```text
familyId must be server-resolved.
```

The client must not be trusted to choose another family.

---

# 14. TIMEZONE SEMANTICS

Explicitly define the interpretation of:

```text
asOfDate = YYYY-MM-DD
```

For example:

```text
End of calendar day
```

or:

```text
Start of calendar day
```

Choose one deterministic convention.

This is especially important because existing FD valuation work already required day-level normalization.

The convention must be consistent across domains.

---

# 15. RELATIONSHIP WITH WHAT-IF SIMULATION

The existing contracts include:

```text
WhatIfScenarioInput
WhatIfSimulationResult
```

Sprint 8C.3 must clarify whether What-If simulation is:

```text
IN SCOPE
```

or:

```text
OUT OF SCOPE
```

### Default expectation

Historical reconstruction and What-If simulation should remain separate.

```text
Time Machine
=
What happened / what can be reconstructed?

What-If
=
What could happen under hypothetical assumptions?
```

Do not merge these concepts without explicit architectural justification.

---

# 16. REQUIRED TEST STRATEGY

The implementation plan must include explicit tests.

At minimum propose tests for:

## A. Exact Historical Reconstruction

```text
Given authoritative historical data
→ reconstruct exact value
→ provenance = EXACT_HISTORICAL
```

---

## B. Prior-Date Proxy

```text
Historical value unavailable
Prior authoritative value exists
→ use according to approved domain rules
→ provenance = PRIOR_DATE_PROXY
```

---

## C. Acquisition Cost

```text
Historical valuation unavailable
Known acquisition cost exists
→ use cost only where domain rules allow
→ provenance = KNOWN_ACQUISITION_COST
```

---

## D. Historical Source Unavailable

```text
No legitimate evidence
→ value unavailable
→ provenance/status explicitly indicates limitation
```

---

## E. No Future Leakage

This is critical.

```text
Data created after asOfDate
must not influence reconstruction
```

unless it explicitly records a historical event that occurred before `asOfDate`.

---

## F. Insurance Valuation Invariant

```text
SUM_ASSURED
must never enter reconstructed net worth.
```

---

## G. Cross-Family Isolation

```text
Family A
cannot reconstruct Family B.
```

---

## H. Deterministic Reconstruction

Repeated reconstruction using unchanged evidence must produce:

```text
identical normalized state
identical provenance
identical stateHash
```

excluding explicitly volatile response metadata.

---

## I. Timezone Boundary

Test:

```text
asOfDate boundary
```

around midnight and date normalization.

---

## J. Historical Rule Boundary

Ensure current rules are not silently applied as historical facts.

---

# 17. PERFORMANCE

Do not optimise prematurely.

First determine realistic data volume.

Define a reasonable target based on:

* number of assets,
* transactions,
* policies,
* goals,
* life events,
* timeline events.

Performance optimisation must not compromise:

```text
historical correctness
provenance
determinism
family isolation
```

---

# 18. MIGRATION RULE

Do not automatically create a database migration.

Only propose a migration if analysis demonstrates that the existing data model cannot support the minimum required functionality without it.

If historical evidence is unavailable, prefer:

```text
explicit limitation
```

over:

```text
creating synthetic historical data.
```

---

# 19. BACKWARD COMPATIBILITY

Sprint 8C.3 must not break:

```text
DigitalTwinService
FamilyFinancialHealthService
FamilyTimelineService
LifeEventService
ProactiveObserverService
existing Portfolio pages
existing Protection pages
existing API contracts
```

Any shared contract change must include:

* compatibility analysis,
* impacted callers,
* migration strategy,
* and regression tests.

---

# 20. DOCUMENTATION REQUIRED IN THE PLAN

The implementation plan must include:

## A. Architecture Decision

```text
Why the Time Machine architecture was selected.
```

## B. Historical Evidence Model

```text
What evidence exists and what does not.
```

## C. Domain Reconstruction Matrix

For every domain:

| Domain | Exact Historical | Proxy | Calculated | Unavailable Behaviour |
| ------ | ---------------- | ----- | ---------- | --------------------- |

Populate this based on the actual codebase.

## D. Provenance Model

Explain every provenance state.

## E. Known Limitations

Be explicit.

---

# 21. REQUIRED IMPLEMENTATION PLAN STRUCTURE

Create:

```text
prompts/Phase8C/SPRINT_8C_3_IMPLEMENTATION_PLAN.md
```

The plan must contain:

1. Executive Summary
2. Current Architecture Analysis
3. Historical Data Availability Assessment
4. Architectural Decision
5. Domain Reconstruction Matrix
6. Proposed Service Design
7. Contract Changes
8. Repository/Data Changes
9. API Design
10. `asOfDate` and Timezone Semantics
11. Provenance and Completeness Model
12. State Hash Strategy
13. Backward Compatibility Analysis
14. Failure and Missing-Data Behaviour
15. Test Strategy
16. Performance Strategy
17. Migration Assessment
18. Implementation Sequence
19. Risks and Known Limitations
20. Acceptance Criteria

---

# 22. FINAL PLANNING GUARDRAILS

Before returning the plan, confirm:

* [ ] No production code has been modified.
* [ ] No migration has been created unless strictly required and justified.
* [ ] Historical values are never fabricated.
* [ ] Current values cannot leak into past reconstruction.
* [ ] Timeline projections are not treated as authoritative financial truth.
* [ ] Insurance sum assured never enters net worth.
* [ ] Historical reconstruction is separated from What-If simulation.
* [ ] Provenance is explicit for every reconstructed value.
* [ ] Missing historical data remains visible.
* [ ] Family scope remains server-controlled.
* [ ] `asOfDate` semantics are deterministic.
* [ ] Repeated reconstruction is deterministic.
* [ ] Existing current-state functionality remains backward compatible.
* [ ] The current verified baseline of **348 PASSED** is documented.
* [ ] No test target count is invented.

---

# REQUIRED AGENT RESPONSE

Return:

## 1. Implementation Plan

```text
SPRINT_8C_3_IMPLEMENTATION_PLAN.md
```

## 2. Summary

Briefly explain:

* What historical data is actually available.
* What cannot be reconstructed.
* The chosen architecture.
* Whether a new migration is genuinely required.
* The provenance hierarchy.
* The most important known limitations.

## 3. Confirmation

Explicitly state:

> **No production code has been modified.**

# STOP

Do not begin implementation.

Wait for the implementation plan to be reviewed and approved.
