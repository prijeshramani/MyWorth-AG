# Implementation Plan: Sprint 8C.1 – Family Financial Health (FFH) Index Engine & Historical Snapshotting

---

## 1. Executive Summary & Sprint Scope

**Sprint 8C.1** delivers the deterministic **Family Financial Health (FFH) Index Engine (0–100)** and historical snapshotting infrastructure. It calculates executive-level composite financial health by integrating across all 5 Digital Twin domains, applies deterministic life-stage weighting, enforces explicit missing-data semantics (no silent zeroes), calculates dynamic comparative deltas, and provides family-scoped REST APIs.

### 🛡️ Core Fiduciary Invariants & Boundaries
- **Deterministic Math**: The FFH Index is 100% deterministic, deriving inputs directly from authoritative domain calculation engines (`DigitalTwinService`, `EstateHealthService`, `GoalPlanningService`, `TaxCalculationEngine`). No AI/LLM calculates health scores or confidence numbers.
- **Explicit Missing-Data Semantics**: Missing data produces explicit status codes (`UNKNOWN`, `INSUFFICIENT_DATA`, `NOT_APPLICABLE`, `KNOWN_ZERO`, `STALE`), never arbitrary score overrides.
- **Proportional Weight Redistribution**: Unavailable/non-applicable pillars redistribute their weight proportionally across available pillars: $W_i' = \frac{W_i}{\sum W_j} \times 100\%$.
- **Snapshot Deduplication**: Persistence to `family_health_history` is strictly deduplicated on `(family_id, snapshot_period, state_hash)`.
- **Server-Resolved Family Scope**: Family ID is derived strictly from `CorrelationContext.getFamilyId()`.

---

## 2. Proposed Changes & Component Breakdown

### 🏛️ Component 1: Family Financial Health Engine Service
#### [NEW] [FamilyFinancialHealthService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/familyOffice/FamilyFinancialHealthService.ts)

1. **5-Pillar Deterministic Calculation Engine**:
   - **Protection Shield (25% base)**:
     - Term cover ratio: $\min\left(100, \frac{\text{Active Term Sum Assured}}{\text{Required HLV}} \times 100\right)$
     - Health shield ratio: $\min\left(100, \frac{\text{Active Health Sum Assured}}{₹25,00,000} \times 100\right)$
     - Sub-score: $\text{TermRatio} \times 0.60 + \text{HealthRatio} \times 0.40$
     - Semantics: Missing HLV $\to$ `UNKNOWN`; Zero cover $\to$ Exact formula output ($0.0$).
   - **Liquidity & Reserves (20% base)**:
     - Emergency Runway: $\min\left(100, \frac{\text{Liquid Reserves}}{\text{Monthly Non-Discretionary Expenses} \times 6} \times 100\right)$
     - Semantics: Missing expense ledger $\to$ `INSUFFICIENT_DATA`; Zero cash $\to$ Exact formula output ($0.0$).
   - **Goals & Compounding (20% base)**:
     - Progress: Average progress across active financial goals: $\frac{1}{N} \sum \min\left(100, \frac{\text{Allocated}_i}{\text{Target}_i} \times 100\right)$
     - Semantics: Zero registered goals $\to$ `NOT_APPLICABLE` (Weight redistributed proportionally).
   - **Estate & Succession (15% base)**:
     - Direct score from `EstateHealthService.calculateEstateHealth(familyId)`.
     - Semantics: Evaluates Will registration, executor appointment, and asset nominee edge coverage.
   - **Tax & Data Hygiene (20% base)**:
     - Score: $\left(\frac{\min(150000, \text{Claimed 80C})}{150000} \times 50\right) + (\text{Twin Completeness Score} \times 50)$
     - Semantics: Derived from `tax_deductions` and `DigitalTwinService.calculateCompleteness()`.

2. **Deterministic Life-Stage Determination & Weight Rebalancing**:
   - Primary earner identified from `family_members` (highest income, or eldest active earner).
   - Stage classified as `EARLY_CAREER` ($< 32$ yrs), `FAMILY_EXPANSION` ($32..50$ yrs or minor dependents), `WEALTH_PRESERVATION` ($50..65$ yrs), or `RETIREMENT` ($> 65$ yrs or retired).
   - Applies life-stage base weights and redistributes any `NOT_APPLICABLE` pillar proportionally.

3. **Historical Snapshotting & Delta Attribution**:
   - Persists snapshot to `family_health_history` on monthly boundary (`YYYY-MM`) or on explicit request.
   - Computes dynamic delta vs previous monthly snapshot:
     - $\text{absoluteDelta} = \text{Score}_{\text{current}} - \text{Score}_{\text{prev}}$
     - $\text{percentDelta} = \frac{\text{Score}_{\text{current}} - \text{Score}_{\text{prev}}}{\text{Score}_{\text{prev}}} \times 100$
     - $\text{pillarAttribution} = \{ \text{Protection}: \Delta_{\text{prot}}, \text{Liquidity}: \Delta_{\text{liq}}, \dots \}$

---

### 🌐 Component 2: REST Controller & Express Routes
#### [NEW] [FamilyHealthController.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/controllers/FamilyHealthController.ts)
- `getHealth(req, res)`: Computes and returns current live FFH index, pillar breakdowns, life-stage weights, completeness, and historical deltas.
- `getHistory(req, res)`: Returns historical snapshot records from `SQLiteFamilyHealthRepository`.
- `createSnapshot(req, res)`: Takes explicit immutable snapshot for current point-in-time state.

#### [NEW] [familyHealthRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/familyHealthRoutes.ts)
- `GET /api/v1/family-office/health`
- `GET /api/v1/family-office/health/history`
- `POST /api/v1/family-office/health/snapshot`
- Mounted in `backend/src/index.ts` with `correlationMiddleware` and `idempotencyMiddleware`.

---

## 3. Invariant Test Plan (Sprint 8C.1)

#### [NEW] [familyFinancialHealth.test.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/sprint8c1/familyFinancialHealth.test.ts)
Dedicated test suite verifying:
1. **Protection Pillar Math**: Term life & health cover ratio formula verified with varying sum assured values.
2. **Liquidity Pillar Math**: Emergency runway months against 6-month burn benchmark.
3. **Goals Pillar & Proportional Redistribution**: `NOT_APPLICABLE` state when 0 goals exist and mathematical verification of proportional weight redistribution across remaining 4 pillars.
4. **Estate Pillar Integration**: Accurate propagation of `EstateHealthService` score.
5. **Tax & Data Hygiene Pillar**: 80C headroom and twin completeness score combination.
6. **Life-Stage Classification**: Accurate classification across `EARLY_CAREER`, `FAMILY_EXPANSION`, `WEALTH_PRESERVATION`, `RETIREMENT`.
7. **Snapshot Persistence & Idempotency**: Verification of `UNIQUE(family_id, snapshot_period, state_hash)` preventing duplicate history rows.
8. **Dynamic Delta Attribution**: Verification of mathematical accuracy of `absoluteDelta` and `pillarAttribution`.
9. **Cross-Family Security Isolation**: Verification that Family A cannot read or snapshot Family B's health index.
10. **Sub-500ms Performance Benchmark**: Full FFH evaluation completes in $\le 500\text{ms}$.

---

## 4. Verification & Baseline Integration

- **Master Test Harness Integration**: Wire `runSprint8c1Tests` into `runTests.ts`.
- **Test Reporting Standard**: Baseline **327** + Sprint 8C.1 tests (estimated ~12 tests) = **327 + X tests**, 0 failures.
- **TypeScript Strict Compilation**: `backend` and `frontend` `tsc --noEmit` = 0 errors.


---

# ChatGPT Review Comments – Sprint 8C.1

## Review Status

**🟡 REVISE PLAN BEFORE IMPLEMENTATION**

The Sprint 8C.1 direction is correct and appropriately builds on the 8C.0 contracts/repositories. However, several important financial-model and historical-comparison semantics must be locked down before production code is written.

**Do NOT implement Sprint 8C.1 yet.**

---

# 1. CRITICAL – Explicit Life-Stage Weighting Matrix

The plan says:

> "Applies life-stage base weights"

but does not define the actual weights for each life stage.

This cannot be left to implementation discretion.

Create an explicit deterministic table:

| Life Stage | Protection | Liquidity | Goals/Planning | Estate | Tax/Data |
|---|---:|---:|---:|---:|---:|
| EARLY_CAREER | TBD | TBD | TBD | TBD | TBD |
| FAMILY_EXPANSION | TBD | TBD | TBD | TBD | TBD |
| WEALTH_PRESERVATION | TBD | TBD | TBD | TBD | TBD |
| RETIREMENT | TBD | TBD | TBD | TBD | TBD |

The final values must be approved before coding.

Also document:

- why each weight changes
- whether weights always total 100%
- how unavailable pillars are removed
- how remaining weights are normalized

Do not let the service invent these values.

---

# 2. CRITICAL – Separate Base Weights From Life-Stage Weights

The architecture has historically used:

```text
Protection      25%
Liquidity       20%
Goals/Retirement 20%
Estate          15%
Tax/Data        20%
```

The new plan introduces life-stage weighting.

Define explicitly:

```text
Base Weight
      ↓
Life-Stage Weight
      ↓
Unavailable Pillar Removal
      ↓
Proportional Normalization
      ↓
Final Effective Weight
```

Persist the final effective weights in the snapshot.

This is essential for historical comparability.

---

# 3. CRITICAL – "Goals & Compounding" Is Misnamed

The proposed pillar is:

> Goals & Compounding

but the actual formula only calculates goal progress.

There is no defined compounding component.

### Required correction

Either:

**Option A — preferred**

Rename it:

> **Goals & Planning**

or

**Option B**

Define a deterministic compounding metric and its authoritative calculation engine.

Do not retain "Compounding" in the name if no compounding calculation exists.

---

# 4. CRITICAL – Tax Score Must Not Reward Spending More for Tax Benefits

The current formula is:

```text
(min(150000, Claimed 80C) / 150000 × 50)
+
(Twin Completeness × 50)
```

This effectively treats higher 80C utilization as better financial health.

That is not necessarily a valid fiduciary principle.

A user should not be encouraged to invest/spend merely to maximize a tax deduction.

### Required redesign

Define Tax/Data Hygiene as something such as:

```text
Tax compliance/readiness
+
Data completeness
+
Tax efficiency where applicable
```

The exact formula must be deterministic and approved.

At minimum:

- 80C utilization should NOT automatically be interpreted as financial health.
- Existing `TaxCalculationEngine` remains authoritative.
- Missing tax information must produce `INSUFFICIENT_DATA` rather than a low score.
- No recommendation to invest purely to increase FFH.

---

# 5. CRITICAL – Tax Calculation Ownership

The plan currently references:

```text
tax_deductions
```

The FFH service must NOT become a second tax engine.

Required architecture:

```text
FamilyFinancialHealthService
        ↓
TaxCalculationEngine
        ↓
Tax Metrics
        ↓
FFH Tax/Data Hygiene Score
```

The service may consume authoritative tax outputs, but must not independently recreate tax rules.

---

# 6. CRITICAL – Version All Financial Rule Parameters

The following values appear in the plan:

```text
₹25,00,000 health target
6-month emergency runway
₹1,50,000 80C limit
```

These must not be unversioned literals inside the service.

Represent them as versioned rule/configuration parameters:

```text
ruleCode
ruleVersion
effectiveFrom
jurisdiction
sourceReference
parameterValue
```

The same principle should apply to any future threshold.

---

# 7. IMPORTANT – Protection Health Target Requires Provenance

The ₹25L health-cover benchmark needs explicit provenance.

Do not silently present it as a universal fiduciary requirement.

The calculation should expose:

```text
targetValue
targetType
ruleVersion
sourceReference
```

If the target is a FamilyWealthOS policy assumption rather than a statutory requirement, document that clearly.

---

# 8. IMPORTANT – Emergency Runway Needs Expense Definition

The formula uses:

```text
Monthly Non-Discretionary Expenses × 6
```

Define exactly what counts as:

```text
Non-Discretionary Expenses
```

Reuse the existing cashflow/expense classification engine if one exists.

Do not invent a second expense classification inside FFH.

If expense classification is unavailable:

```text
INSUFFICIENT_DATA
```

rather than assuming all expenses are non-discretionary.

---

# 9. IMPORTANT – Goals Score Needs Target/Allocation Semantics

The formula:

```text
Allocated / Target
```

needs explicit definitions.

Clarify:

- What is `Allocated`?
- Is it current asset value earmarked for the goal?
- Are future SIPs included?
- Are multiple assets counted?
- How are goals with no target date treated?
- How are inactive/expired goals treated?
- How are zero targets handled?

Reuse `GoalPlanningService` as the authoritative owner.

---

# 10. IMPORTANT – Estate Score Must Be Normalized

The plan says:

> Direct score from EstateHealthService

Verify that the returned value is already normalized to:

```text 0–100
```

If not, define the deterministic conversion before feeding it into FFH.

Do not assume another service's score scale.

---

# 11. CRITICAL – Missing Data Must Never Become a Score Override

The plan correctly says:

> Missing data produces explicit status codes.

Preserve this invariant throughout the implementation.

Examples:

```text
Missing HLV
→ Protection = UNKNOWN

Missing expense ledger
→ Liquidity = INSUFFICIENT_DATA

No goals
→ Goals = NOT_APPLICABLE

Known zero cash
→ Liquidity score = deterministic 0
```

Do not convert missing information to `0`.

---

# 12. CRITICAL – Weight Redistribution Semantics

The formula:

```text
W'i = Wi / ΣWj × 100%
```

is correct as a normalization approach.

However, define exactly which statuses make a pillar unavailable.

Recommended:

```text
NOT_APPLICABLE
UNKNOWN
INSUFFICIENT_DATA
```

must NOT automatically be treated identically without considering fiduciary semantics.

For example:

```text NOT_APPLICABLE
```

means the pillar genuinely does not apply.

Whereas:

```text INSUFFICIENT_DATA
```

means the pillar applies but cannot currently be assessed.

These should not necessarily have identical effects on the overall score.

### Required decision

Define whether `UNKNOWN/INSUFFICIENT_DATA`:

1. redistribute weight,
2. reduce overall confidence/completeness,
3. or both.

Do not hide poor data by simply redistributing its weight.

---

# 13. CRITICAL – Overall FFH Score Needs Completeness

If two families have:

```text Family A:
5 pillars fully known

Family B:
2 pillars known
3 pillars unavailable
```

they should not necessarily receive equally authoritative-looking scores.

The response must expose:

```text overallScore
overallStatus
completenessScore
effectiveWeights
```

and the UI must be able to distinguish:

> 78/100 with 100% data completeness

from:

> 78/100 with 58% data completeness.

---

# 14. IMPORTANT – Life-Stage Classification Needs Deterministic Edge Cases

The plan says:

```text EARLY_CAREER < 32
FAMILY_EXPANSION 32..50 or minor dependents
WEALTH_PRESERVATION 50..65
RETIREMENT >65 or retired
```

There is overlap between:

```text FAMILY_EXPANSION 32..50
WEALTH_PRESERVATION 50..65
```

Define the boundary explicitly.

For example:

```text age < 32
32 <= age < 50
50 <= age < 65
age >= 65
```

Then separately apply the minor-dependent/retired override rules.

Also define:

- multiple earners
- no income data
- spouse/partner with different age
- no active earner

---

# 15. IMPORTANT – Life-Stage Changes Affect Historical Comparability

A score change can occur because:

```text financial state changed
```

or because:

```text life-stage changed
→ weighting changed
```

Snapshots must therefore persist:

```text lifeStage
weightingVersion
effectiveWeights
calculationVersion
```

Delta attribution should explicitly flag when the comparison is not directly apples-to-apples.

---

# 16. CRITICAL – Snapshot Semantics Must Be Deterministic

The plan says:

> monthly boundary or explicit request

Define:

```text GET /health
```

as live calculation only.

It must NOT create history.

Define:

```text POST /health/snapshot
```

as explicit persistence.

For automatic monthly snapshots:

```text same family
+
same snapshot period
+
same stateHash
→ no duplicate
```

Dashboard refreshes must never create snapshot rows.

---

# 17. IMPORTANT – Snapshot `asOf` Must Be Explicit

Each snapshot should retain:

```text asOf
snapshotPeriod
stateHash
calculationVersion
weightingVersion
lifeStage
effectiveWeights
completeness
```

This makes historical reproduction possible.

---

# 18. CRITICAL – Delta Percentage Division by Zero

The formula:

```text
(current - previous) / previous × 100
```

fails when:

```text previousScore = 0
```

Define:

```text previousScore = 0
→ absoluteDelta = currentScore
→ percentDelta = null
```

Never return:

```text Infinity
100%
0%
```

as a fabricated fallback.

---

# 19. IMPORTANT – Pillar Attribution Must Respect Weight Changes

If:

```text Protection weight changed from 25% → 30%
```

the resulting delta cannot be attributed entirely to financial improvement.

Store both:

```text rawPillarScore
effectiveWeight
weightedContribution
```

and document the attribution methodology.

If weighting versions differ, flag:

```text comparisonStatus = WEIGHTING_CHANGED
```

or equivalent.

---

# 20. IMPORTANT – Snapshot Idempotency Must Handle Concurrent Requests

The database constraint is already present from 8C.0:

```text UNIQUE(family_id, snapshot_period, state_hash)
```

The implementation should use it as the final concurrency guard.

Two simultaneous snapshot requests must result in:

```text one persisted row
```

not two rows.

---

# 21. IMPORTANT – `POST /health/snapshot` Must Be Idempotent

Because this is a state-changing persistence operation, it must use the existing Sprint 8B.0 idempotency framework.

Repeated requests with the same:

```text X-Idempotency-Key
```

must return the same result.

Do not create another idempotency mechanism.

---

# 22. IMPORTANT – Family Scope

All three endpoints must derive family scope from:

```text CorrelationContext.getFamilyId()
```

A client-supplied:

```text familyId
```

must not override the authorized scope.

Add tests for:

```text Family A cannot:
- read Family B health
- create Family B snapshot
- read Family B history
```

---

# 23. IMPORTANT – Performance Test Must Use Realistic Data

The plan proposes:

```text ≤ 500ms
```

Keep this as a measurable engineering target.

Test against the real dataset rather than a tiny synthetic family.

Report:

```text cold
warm
real dataset
```

where practical.

Do not sacrifice correctness to meet the benchmark.

---

# 24. IMPORTANT – FFH Service Must Remain an Orchestrator

The service may:

```text retrieve authoritative metrics
normalize scores
apply configured weights
handle missing-data semantics
calculate composite score
persist snapshot
```

It must NOT duplicate:

```text portfolio valuation
tax calculation
estate scoring
goal calculation
expense classification
HLV calculation
```

Existing engines remain authoritative.

---

# 25. Test Coverage

The proposed tests are directionally correct, but expand them to cover:

### Calculation

- each pillar independently
- score boundaries 0 and 100
- zero-value inputs
- maximum-value inputs

### Missing data

- UNKNOWN
- INSUFFICIENT_DATA
- NOT_APPLICABLE
- KNOWN_ZERO

### Weighting

- each life stage
- redistribution
- weight sum = 100%
- incomplete-data behaviour

### Historical

- first snapshot
- second comparable snapshot
- stateHash duplicate
- different stateHash same month
- month boundary
- previous score = 0
- weighting version change

### Security

- cross-family read
- cross-family snapshot
- cross-family history

### Idempotency

- repeated identical snapshot request
- concurrent snapshot requests

### Regression

```text Previous baseline: 327
New Sprint 8C.1 tests: X
Current total: 327 + X
Failures: 0
```

Do NOT target an estimated test count.

---

# 26. Documentation

On completion, synchronize:

```text SESSION_CONTEXT.md
AI_CHANGELOG.md
docs/PHASE_8_ROADMAP.md
docs/FAMILY_FINANCIAL_HEALTH.md
```

Document:

- final formulas
- weighting matrix
- rule versions
- missing-data semantics
- snapshot semantics
- known limitations
- actual test count
- actual performance

---

# 27. FINAL ACCEPTANCE CRITERIA

Sprint 8C.1 should not be considered complete until:

- [ ] Life-stage weighting matrix is explicit and approved.
- [ ] Base vs life-stage weights are clearly separated.
- [ ] "Goals & Compounding" is corrected or fully implemented.
- [ ] Tax/Data Hygiene formula is fiduciary-safe.
- [ ] Tax calculations remain owned by `TaxCalculationEngine`.
- [ ] All financial thresholds are versioned/configurable.
- [ ] Expense classification remains authoritative.
- [ ] Goal metrics remain owned by `GoalPlanningService`.
- [ ] Estate score scale is verified.
- [ ] Missing data never becomes zero.
- [ ] UNKNOWN/INSUFFICIENT_DATA semantics are explicit.
- [ ] Overall score exposes completeness/status.
- [ ] Life-stage boundaries are deterministic.
- [ ] Historical snapshots persist weighting/version metadata.
- [ ] Snapshot creation is deterministic and idempotent.
- [ ] Percent delta handles previous score = 0.
- [ ] Pillar attribution handles weighting changes.
- [ ] All endpoints are family-scoped.
- [ ] Existing idempotency infrastructure is reused.
- [ ] Realistic performance benchmark passes.
- [ ] Master regression remains fully green.
- [ ] Documentation is synchronized.

---

# FINAL DECISION

## 🟡 REVISE PLAN BEFORE IMPLEMENTATION

The Sprint 8C.1 architecture is fundamentally correct and can proceed.

However, **do not allow coding yet**.

The Agent should first incorporate these corrections and return the revised Sprint 8C.1 implementation plan.

The most important decisions to lock down are:

1. **Exact life-stage weighting matrix**
2. **Fiduciary-safe Tax/Data Hygiene scoring**
3. **Treatment of UNKNOWN vs INSUFFICIENT_DATA in weight redistribution**
4. **Versioned financial thresholds**
5. **Historical snapshot comparability**
6. **Division-by-zero and weighting-change delta semantics**

Once those are incorporated, Sprint 8C.1 can move to implementation.

---

# Required Agent Response

After incorporating the review:

1. Return the revised `SPRINT_8C_1_IMPLEMENTATION_PLAN.md`.
2. Summarize changed sections.
3. Explicitly state the final life-stage weight matrix.
4. Explicitly state the final Tax/Data Hygiene formula.
5. Explicitly state UNKNOWN/INSUFFICIENT_DATA weighting behaviour.
6. Confirm no production code was modified.

**STOP after revising the plan. Do not implement Sprint 8C.1 yet.**
