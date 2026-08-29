# Sprint 8C.3 – Financial Time Machine & Point-in-Time Reconstruction
## Combined Implementation Plan Review

**Review Status:** 🟡 REVISE BEFORE IMPLEMENTATION

**Current verified baseline:** 348 PASSED, 0 FAILED

---

# 1. Overall Assessment

The proposed architecture is directionally correct.

The selection of a dedicated:

```text
FinancialTimeMachineService
```

is approved in principle because it provides a clean separation between:

```text
Current-State Digital Twin
```

and:

```text
Historical Point-in-Time Reconstruction
```

The following boundary remains correct:

```text
FinancialTimeMachineService
        =
Historical reconstruction
+
Domain-specific temporal orchestration

DigitalTwinService
        =
Current-state authoritative aggregation
```

However, the current implementation plan must be revised before production code is modified.

The primary concern is **historical evidence integrity**.

A Financial Time Machine must be more conservative than a normal valuation engine.

The fundamental rule is:

```text
Lack of historical evidence
        ≠
permission to use today's state.
```

---

# 2. CRITICAL – Verify Historical Data Availability Against Actual Schema

The plan currently states that the following are available:

```text
transactions
asset_prices
historical balance rows
estate registrations
tax profiles
```

Before implementation, this must be verified against the actual database schema and repositories.

For every claimed historical source, document:

| Source | Actual Table | Historical Field | Date Granularity | Family Scope | Coverage Limitation |
|---|---|---|---|---|---|

For example:

```text
asset_prices
```

must not simply be assumed to provide complete historical coverage.

The revised plan must verify:

- whether the table actually exists,
- which asset classes use it,
- whether prices are stored historically,
- whether prices are authoritative,
- whether dates are normalized,
- whether multiple prices can exist for the same asset/date,
- and whether the data is family-independent market data or family-specific valuation data.

### Required rule

Do not design fallback logic around a data source until its actual schema and data availability have been inspected.

---

# 3. CRITICAL – Define Deterministic `asOfDate` Cutoff Semantics

The plan must explicitly define what:

```text
asOfDate = 2026-01-31
```

means.

Recommended convention:

```text
The complete local calendar day is included.
```

However, the implementation must define the exact canonical timestamp boundary.

For example:

```text
asOfDate
→ end-of-day boundary in the application's defined timezone
```

or another explicitly documented convention.

The same convention must apply consistently across:

- transactions,
- asset prices,
- FD valuation,
- insurance policies,
- liabilities,
- tax records,
- goals,
- estate records.

### Required edge cases

The revised plan must define handling for:

1. Transactions with date only.
2. Transactions with timestamp.
3. Multiple transactions on the same date.
4. Events exactly on the cutoff boundary.
5. Price records dated on the cutoff date.
6. FD maturity occurring on the cutoff date.
7. Dates stored in UTC versus local calendar dates.

Do not leave this to implementation interpretation.

---

# 4. CRITICAL – No Unlimited Prior-Date Proxy

The current plan allows:

```text
Nearest prior price
```

but does not define an acceptable maximum age.

This is dangerous.

Example:

```text
Requested date: 2025-12-31

Last available price:
2023-01-01
```

The 2023 value must not silently be presented as a reasonable proxy for 2025.

### Required revision

Introduce an explicit proxy freshness policy.

The plan must define:

```text
maximumProxyAge
```

per:

- asset class,
- price frequency,
- or authoritative source type.

The threshold must be:

```text
versioned configuration
```

not hidden business logic.

The response must include:

```text
daysOfProxyLag
```

and, where applicable:

```text
proxyStatus
```

Suggested conceptual behaviour:

```text
Exact value
    → EXACT_HISTORICAL

Prior value within permitted window
    → PRIOR_DATE_PROXY

Prior value outside permitted window
    → HISTORICAL_SOURCE_UNAVAILABLE
```

Do not silently use stale values.

---

# 5. CRITICAL – Historical Holdings Reconstruction Must Be Explicit

The plan says:

```text
Weighted average purchase price from transactions
```

This is not sufficient as a reconstruction specification.

The revised plan must define the algorithm for reconstructing historical quantity.

At minimum specify handling for:

```text
BUY
SELL
SIP
REDEMPTION
TRANSFER
DIVIDEND
INTEREST
```

where supported by the existing transaction model.

### Required invariant

The Time Machine must first reconstruct:

```text
Units / Quantity owned as of asOfDate
```

and only then determine:

```text
Historical valuation
```

Conceptually:

```text
Transactions <= asOfDate
        ↓
Reconstruct quantity
        ↓
Quantity > 0?
        ↓
Historical price hierarchy
        ↓
Historical asset value
```

Do not derive historical value directly from current holdings.

### Important

If the transaction model does not contain sufficient information to reconstruct quantity correctly for an asset class:

```text
INSUFFICIENT_DATA
```

is preferable to a mathematically incorrect reconstruction.

---

# 6. CRITICAL – Current Mutable Records Are Not Historical Versions

This is the most important revision.

The plan currently suggests that:

```text
insurance_policies where start_date <= asOfDate
```

can be used as historical evidence.

This is only partially true.

A current policy row may have been modified after `asOfDate`.

Similarly, current records in:

```text
financial_goals
wills
trusts
graph_edges
tax profiles
```

may not represent the state that existed historically.

### Required architectural boundary

The revised plan must distinguish:

```text
Event/history-bearing source
```

from:

```text
Current mutable source record
```

For mutable records without version history:

```text
Current state must not automatically be projected backward in time.
```

Example:

```text
Policy started before asOfDate
+
current policy row exists
```

does not prove that every current field was true at `asOfDate`.

The revised plan must define, field by field where necessary:

### Safe historical facts

Examples may include:

```text
immutable start date
immutable original sum assured
transaction date
recorded event date
```

### Unsafe historical assumptions

Examples may include:

```text
current surrender value
current policy status if status history is absent
current nominee
current goal target
current estate configuration
```

When historical state cannot be established:

```text
HISTORICAL_SOURCE_UNAVAILABLE
```

must be returned.

---

# 7. Insurance Reconstruction Must Be Split Into Coverage and Value

The revised plan must explicitly separate:

```text
Protection state
```

from:

```text
Financial asset value
```

The invariant remains:

```text
SUM_ASSURED ≠ NET_WORTH
```

For a historical date, the Time Machine may report:

```text
Policy existed: YES / NO / UNKNOWN
Coverage: ₹X
Coverage provenance: ...
```

But it must not infer:

```text
Historical surrender value
```

unless an authoritative historical value exists or a deterministic calculation is genuinely supported by complete inputs.

### Required test

```text
Historical reconstructed net worth
must remain unchanged when only insurance sum assured changes.
```

---

# 8. Fixed Deposit Reconstruction Requires Explicit Date Rules

The plan correctly identifies:

```text
calculateFixedDepositValuation
```

as a potential deterministic source.

However, the revised plan must explicitly define:

### Before FD start date

```text
FD must not exist in reconstructed holdings.
```

Do not automatically represent this as:

```text
KNOWN_ZERO
```

at the holding level if the correct meaning is:

```text
NOT_YET_IN_EXISTENCE
```

Reuse an existing status only if appropriate.

### During FD tenure

Use deterministic calculation only if all required inputs exist.

### After maturity

Define:

- whether maturity value remains represented,
- whether the FD becomes cash,
- whether renewal history exists,
- whether post-maturity value is unknown without further evidence.

Do not assume a matured FD remained unchanged.

---

# 9. Liabilities Require a Full Reconstruction Strategy

The liabilities row in the matrix is currently too vague.

The revised plan must specify:

| Evidence | Reconstruction Behaviour |
|---|---|
| Exact historical outstanding balance | Exact |
| Prior authoritative balance | Proxy subject to freshness policy |
| Loan amortization inputs available | Deterministically calculated |
| Only original principal known | Not automatically current historical balance |
| No reliable evidence | Unknown / unavailable |

### Important

The following is not automatically valid:

```text
Initial principal loan amount
=
historical outstanding liability
```

unless no repayments or amortization have occurred.

The plan must not use principal as a historical balance without explicit provenance and calculation rules.

---

# 10. Goals Reconstruction Is Not Yet Sufficiently Defined

The plan acknowledges that historical goal target changes are unavailable.

Good.

But the revised plan must explicitly decide what Sprint 8C.3 returns for goals.

Possible examples:

### If immutable creation event exists

```text
Goal existed as of date
```

may be known.

### If current mutable target has no version history

```text
Historical target
=
HISTORICAL_SOURCE_UNAVAILABLE
```

unless an authoritative historical snapshot exists.

### Required rule

Do not use today's goal target as the target for a past date.

The response should support partial domain reconstruction rather than forcing every domain into a numeric value.

---

# 11. Estate Reconstruction Must Respect Historical Revision Limits

The plan says:

```text
estate registrations
wills
trusts
graph_edges
```

are available.

This does not automatically mean historical estate state is reconstructable.

The revised plan must identify:

- immutable registration date,
- effective date where available,
- revocation history,
- version history,
- current-only mutable records.

### Required rule

A will currently present in the database must not automatically be represented as valid on every date after its creation unless the authoritative data supports that conclusion.

Use:

```text
KNOWN
UNKNOWN
HISTORICAL_SOURCE_UNAVAILABLE
```

appropriately.

---

# 12. Tax Reconstruction Must Separate Historical Evidence From Recalculation

The revised plan must explicitly define whether Sprint 8C.3 reconstructs:

```text
Recorded historical tax state
```

or:

```text
Recalculated historical tax scenario
```

These are different.

### Historical reconstruction

May use:

```text
tax profiles
recorded deductions
financial year records
```

where genuinely historical.

### Recalculation

Must specify:

```text
historical tax rule version
jurisdiction
calculation version
```

It must never silently apply:

```text
today's tax rules
```

and label the result as historical fact.

If historical tax rules are not versioned in the current architecture:

```text
historical tax calculation should be explicitly limited or unavailable.
```

---

# 13. REQUIRED – Domain Reconstruction Matrix Must Be Expanded

The current matrix is useful but not sufficiently precise.

Replace it with the following structure:

| Domain / Asset | Historical Existence Evidence | Quantity / State Reconstruction | Exact Value Evidence | Allowed Proxy | Allowed Calculation | Cost Fallback | Unavailable Behaviour |
|---|---|---|---|---|---|---|---|

Populate this based on actual repository and schema analysis.

Do not fill a capability merely because it would be desirable.

---

# 14. REQUIRED – Evidence Date vs Record Creation Date

The revised plan must distinguish:

```text
economicEffectiveDate
```

from:

```text
recordCreatedAt
```

A record entered today about an event from two years ago may legitimately be evidence of the older event.

Conversely:

```text
record created before asOfDate
```

does not prove its current mutable values were valid at that time.

The reconstruction logic must prefer:

```text
economic effective date
```

over database observation time where available.

---

# 15. Historical Timeline Must Remain Secondary Evidence

Maintain the established invariant:

```text
Authoritative Domain Data
        ↓
Timeline Projection
        ↓
Narrative Interpretation
```

Never:

```text
Timeline Projection
        ↓
Authoritative Financial State
```

The Time Machine may use the timeline for:

- discovery,
- navigation,
- historical anchors,
- explanation.

But a timeline projection must not become the authoritative valuation source merely because it contains a relevant event.

---

# 16. State Hash Must Include Evidence Semantics

The plan proposes a deterministic canonical state hash.

Approved in principle.

However, the hash must include enough information that two numerically identical reconstructions with different provenance do not appear identical.

Conceptually include:

```text
familyId
asOfDate
normalized reconstructed values
provenance
proxy lag where applicable
domain source hashes
calculationVersion
ruleVersions
```

Exclude:

```text
reconstructionPerformedAt
request ID
correlation ID
random UUID
```

### Important

The exact canonicalization method must be shared and deterministic.

Do not implement multiple JSON hashing strategies across services.

Reuse an existing canonical hashing utility if one exists.

---

# 17. Completeness and Overall Status Must Be Explicit

The Time Machine must not only return asset values.

The revised plan must define:

```text
overallCompleteness
overallStatus
domainCompleteness
domainStatus
```

and their deterministic semantics.

Do not invent a second incompatible status model.

Prefer reuse of:

```text
PillarStatusEnum
```

or existing shared contracts where semantically appropriate.

### Required precedence

Define what happens when:

```text
one domain = COMPLETE
one domain = UNKNOWN
one domain = INSUFFICIENT_DATA
```

The overall status must be deterministic.

---

# 18. Family Scope and API Security

The proposed endpoint is acceptable in principle:

```text
GET /api/v1/family-office/time-machine
```

However, the revised plan must explicitly confirm:

```text
familyId = CorrelationContext.getFamilyId()
```

The following must not become authoritative:

```text
query familyId
body familyId
UI familyId
asset ID belonging to another family
```

### Required tests

Test:

```text
Family A requests reconstruction
with Family B asset/source identifier
→ rejected or excluded
```

Cross-family isolation must cover:

- assets,
- transactions,
- policies,
- liabilities,
- goals,
- estate data,
- tax data.

---

# 19. API Validation Must Be Fully Specified

Define:

```text
asOfDate format
maximum future date
future date behaviour
minimum supported date
timezone convention
invalid date behaviour
```

### Recommended

Future reconstruction requests should not silently behave as current-state reconstruction.

Either:

```text
reject future date
```

or explicitly document supported behaviour.

Do not allow:

```text
asOfDate = future date
```

to accidentally become:

```text
current date
```

---

# 20. Performance Target Needs Revision

The plan proposes:

```text
sub-100ms benchmark
```

This is unnecessarily aggressive and may encourage shortcuts.

Previous Phase 8C architecture guidance defined:

```text
Time Machine reconstruction ≤ 1000ms
```

as the appropriate initial target.

Use a realistic benchmark based on:

- asset count,
- transaction volume,
- price history volume,
- number of policies,
- liabilities,
- goals,
- estate records.

Correctness and provenance take priority over latency.

Report:

```text
data extraction
historical reconstruction
valuation
hash generation
total
```

---

# 21. Test Count Must Not Be Invented

The current plan says:

```text
348 + 12 = 360 PASSED
```

Do not treat this as an acceptance target.

Use:

```text
Previous baseline: 348 PASSED
New Sprint 8C.3 tests: X
Final total: 348 + X
Failures: 0
```

The actual number must result from the required invariant coverage.

---

# 22. Required Test Coverage Must Be Expanded

The revised test strategy must include at minimum:

## A. Exact Historical Valuation

```text
Exact price exists on asOfDate
→ EXACT_HISTORICAL
```

## B. Valid Prior-Date Proxy

```text
No exact price
Prior price within configured freshness window
→ PRIOR_DATE_PROXY
```

## C. Expired Prior-Date Proxy

```text
Prior price older than allowed freshness window
→ HISTORICAL_SOURCE_UNAVAILABLE
```

## D. Historical Quantity Reconstruction

Test:

```text
buy
sell
partial sell
multiple buys
```

where supported by the transaction model.

## E. No Future Leakage

```text
Data economically effective after asOfDate
→ must not influence reconstruction
```

Also test:

```text
record entered after asOfDate
but representing an earlier authoritative event
→ handled according to evidence-date rules
```

## F. Mutable Source Boundary

Test that current mutable fields are not projected backward without historical evidence.

## G. FD Lifecycle

Test:

```text
before start
during tenure
on maturity
after maturity
```

## H. Insurance Invariant

```text
SUM_ASSURED
never contributes to net worth.
```

## I. Liability Reconstruction

Test:

```text
exact balance
proxy
calculated amortization where supported
principal-only insufficient case
```

## J. Cross-Family Isolation

## K. Deterministic Hash

## L. Timezone Boundary

## M. Historical Tax Rule Boundary

## N. Missing Historical Data

Explicitly verify:

```text
UNKNOWN
INSUFFICIENT_DATA
HISTORICAL_SOURCE_UNAVAILABLE
```

rather than fabricated numeric values.

---

# 23. What-If Scope Must Be Explicitly Resolved

There is a scope inconsistency.

The broader Phase 8C roadmap describes Sprint 8C.3 as:

```text
Financial Time Machine
+
What-If Simulation Sandbox
```

The current implementation plan only covers point-in-time reconstruction.

Before implementation, the revised plan must explicitly choose one of the following.

## Option A – Include What-If in Sprint 8C.3

If included, define:

```text
FinancialTimeMachineService
        =
Historical reconstruction

WhatIfSimulationEngine
        =
Hypothetical scenario calculation
```

Do not merge these responsibilities.

What-If must:

- operate on an isolated copy,
- perform zero authoritative database mutations,
- avoid shared nested references,
- validate scenario parameters,
- preserve the original state hash.

## Option B – Explicitly Defer What-If

If the project scope has intentionally changed:

- document the deferral,
- update the roadmap,
- define which sprint will implement it.

### No ambiguity

The Agent must not silently omit a planned major capability.

---

# 24. Migration Assessment

The conclusion:

```text
No database migration required
```

is acceptable only after the actual schema analysis above.

Do not treat:

```text
existing date columns
```

as proof that historical reconstruction is supported.

A migration is not automatically required merely because history is incomplete.

The correct priority is:

```text
Existing authoritative evidence
        ↓
Conservative reconstruction
        ↓
Explicit limitation
```

Do not create synthetic history tables merely to make the Time Machine appear more complete.

---

# 25. Documentation Requirements

The revised plan must include:

```text
docs/FINANCIAL_TIME_MACHINE.md
```

or an equivalent Phase 8C architecture document.

It must document:

1. Meaning of `asOfDate`
2. Cutoff timezone convention
3. Historical evidence hierarchy
4. Domain reconstruction matrix
5. Proxy freshness policy
6. Mutable source historical limitations
7. Provenance semantics
8. Completeness/status semantics
9. Insurance valuation invariant
10. Historical tax boundary
11. State hash definition
12. What-If scope decision
13. Known limitations

Also update after implementation only:

```text
SESSION_CONTEXT.md
AI_CHANGELOG.md
docs/PHASE_8_ROADMAP.md
```

---

# 26. Revised Acceptance Criteria

Sprint 8C.3 may proceed to implementation only when the plan explicitly demonstrates:

- [ ] Actual historical data sources have been verified against schema and repositories.
- [ ] `asOfDate` cutoff semantics are deterministic.
- [ ] No future data leakage is possible.
- [ ] Record creation date is not confused with economic effective date.
- [ ] Historical holdings are reconstructed from historical transactions, not current holdings.
- [ ] Proxy values have explicit freshness limits.
- [ ] Stale proxies become unavailable rather than silently accepted.
- [ ] Mutable current records are not projected backward as historical truth.
- [ ] FD lifecycle semantics are explicit.
- [ ] Liabilities have a legitimate historical reconstruction strategy.
- [ ] Insurance coverage remains separate from net worth.
- [ ] Goals historical limitations are explicit.
- [ ] Estate historical revision limitations are explicit.
- [ ] Historical tax evidence is separated from recalculation.
- [ ] Timeline remains a derived secondary projection.
- [ ] Provenance is attached to reconstructed values.
- [ ] Completeness and overall status are deterministic.
- [ ] State hashes include provenance-relevant semantics.
- [ ] Family scope is server-resolved.
- [ ] Cross-family isolation is tested.
- [ ] What-If scope is explicitly resolved.
- [ ] No test count is pre-invented.
- [ ] Performance target prioritizes correctness.
- [ ] No production code has been modified during planning.

---

# FINAL DECISION

## 🟡 REVISE THE IMPLEMENTATION PLAN ONCE MORE

The architecture does **not require a redesign**.

The Agent should revise the existing plan by incorporating the above historical-evidence and temporal-integrity guardrails.

## Agent Instruction

```text
Sprint 8C.3 implementation plan review feedback has been provided.

Please revise the existing implementation plan.

DO NOT modify production code.

DO NOT create production migrations.

DO NOT begin implementation.

First:
1. Verify every claimed historical data source against the actual schema and repositories.
2. Resolve all historical cutoff and provenance ambiguities.
3. Define the complete domain reconstruction matrix.
4. Resolve the What-If scope inconsistency.
5. Update the implementation plan.

Then return the revised plan and explicitly confirm:

"No production code has been modified."

STOP and wait for review approval.
```