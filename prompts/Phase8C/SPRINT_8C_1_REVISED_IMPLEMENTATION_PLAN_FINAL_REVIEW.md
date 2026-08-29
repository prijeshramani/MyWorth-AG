# Revised Implementation Plan: Sprint 8C.1 – Family Financial Health (FFH) Index Engine & Historical Snapshotting

---

## 1. Executive Summary & Sprint Scope

**Sprint 8C.1** delivers the deterministic **Family Financial Health (FFH) Index Engine (0–100)** and historical snapshotting infrastructure. It calculates executive-level composite financial health by integrating across all 5 Digital Twin domains, applies an explicit deterministic life-stage weighting matrix, enforces fiduciary-safe Tax/Data scoring, preserves strict missing-data semantics (no silent zeroes), calculates dynamic comparative deltas with division-by-zero protection, and provides family-scoped REST APIs.

### 🛡️ Core Fiduciary Invariants & Review Guardrails
1. **Deterministic Orchestration Only**: The FFH Index is 100% deterministic, deriving metrics strictly from authoritative domain calculation engines (`DigitalTwinService`, `EstateHealthService`, `GoalPlanningService`, `TaxCalculationEngine`). FFH does not duplicate tax, HLV, expense, or valuation math.
2. **Explicit Life-Stage Weighting Matrix**: Explicit deterministic weights defined across all 4 life stages totaling 100%.
3. **Pillar Naming**: Corrected to **Goals & Planning** (authoritative owner: `GoalPlanningService`).
4. **Fiduciary-Safe Tax/Data Hygiene**: Tax score evaluates compliance readiness (30%), digital twin data completeness (40%), and tax regime optimization (30%). It does NOT reward spending money merely to claim 80C deductions.
5. **Versioned Financial Rule Parameters**: All thresholds (e.g. ₹25L health benchmark, 6-month emergency runway, ₹1.5L 80C limit) are parameterized with version, jurisdiction, and provenance metadata.
6. **Explicit Missing-Data & Weight Redistribution Semantics**: Missing data produces explicit status codes (`UNKNOWN`, `INSUFFICIENT_DATA`, `NOT_APPLICABLE`, `KNOWN_ZERO`, `STALE`). Incomplete data reduces `completenessScore` and sets `overallStatus = PARTIAL`, rather than silently inflating the score.
7. **Snapshot Comparability & Delta Math**: Delta calculations protect against division-by-zero (`previousScore = 0 => percentDelta = null`), and flag `WEIGHTING_OR_LIFESTAGE_CHANGED` when life stages differ.
8. **Server-Resolved Family Scope & Idempotency**: Family ID is derived strictly from `CorrelationContext.getFamilyId()`. `POST /snapshot` uses `idempotencyMiddleware` and `UNIQUE(family_id, snapshot_period, state_hash)`.

---

## 2. Explicit Life-Stage Weighting Matrix

### 📊 Matrix Definition

| Life Stage | Age / Condition Boundary | Protection | Liquidity | Goals & Planning | Estate | Tax & Data | Total |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`EARLY_CAREER`** | Primary earner age $< 32$, no minor dependents | **20%** | **25%** | **25%** | **5%** | **25%** | **100%** |
| **`FAMILY_EXPANSION`** | $32 \le \text{age} < 50$ OR minor dependents present | **30%** | **20%** | **25%** | **10%** | **15%** | **100%** |
| **`WEALTH_PRESERVATION`**| $50 \le \text{age} < 65$, not retired | **20%** | **20%** | **25%** | **20%** | **15%** | **100%** |
| **`RETIREMENT`** | Age $\ge 65$ OR retired status | **10%** | **30%** | **15%** | **35%** | **10%** | **100%** |

### 🔍 Rationale for Life-Stage Weight Shifts:
- **`EARLY_CAREER`**: High focus on liquidity (career mobility) and early wealth compounding; lower estate complexity (5%).
- **`FAMILY_EXPANSION`**: Protection shield is paramount (30%) due to high family dependency, debt (home loan), and HLV risk; liquidity buffer at 20%.
- **`WEALTH_PRESERVATION`**: Estate planning expands (20%) as asset structures mature; protection shifts toward health coverage.
- **`RETIREMENT`**: Estate execution is dominant (35%); liquidity is high (30%) for living expenses; term insurance is minimized (10%).

### ⚖️ Multi-Tier Weight Processing Flow:
```text
Base Weights (25 / 20 / 20 / 15 / 20)
      ↓
Life-Stage Matrix Weights (e.g. 30 / 20 / 25 / 10 / 15)
      ↓
Pillar Availability Check (Identify NOT_APPLICABLE vs INSUFFICIENT_DATA vs COMPLETE)
      ↓
Proportional Normalization for NOT_APPLICABLE: W_i' = (W_i / sum(W_available)) * 100%
      ↓
Final Effective Weights (persisted in snapshot & returned in response)
```

---

## 3. Versioned Financial Rule Registry

To ensure financial parameters are never unversioned hardcoded magic numbers:

```typescript
export interface FinancialRuleParam<T> {
  ruleCode: string;
  ruleVersion: string;
  parameterName: string;
  parameterValue: T;
  effectiveFrom: string;
  jurisdiction: string;
  sourceReference: string;
  isStatutory: boolean;
}

export const FFH_RULE_REGISTRY = {
  HEALTH_COVER_BENCHMARK: {
    ruleCode: 'RULE_HEALTH_COVER_TIER1',
    ruleVersion: '2026.1',
    parameterName: 'familyHealthCoverTarget',
    parameterValue: 2500000, // ₹25 Lakhs
    effectiveFrom: '2026-01-01',
    jurisdiction: 'IN',
    sourceReference: 'FamilyWealthOS Tier-1 Metro Family Health Benchmark',
    isStatutory: false
  },
  EMERGENCY_RUNWAY_MONTHS: {
    ruleCode: 'RULE_EMERGENCY_RUNWAY_DEFAULT',
    ruleVersion: '2026.1',
    parameterName: 'emergencyRunwayMonthsTarget',
    parameterValue: 6, // 6 months
    effectiveFrom: '2026-01-01',
    jurisdiction: 'IN',
    sourceReference: 'Fiduciary Liquid Reserve Standard',
    isStatutory: false
  },
  SEC_80C_DEDUCTION_LIMIT: {
    ruleCode: 'RULE_IT_ACT_80C_CEILING',
    ruleVersion: '2026.1',
    parameterName: 'sec80CCeiling',
    parameterValue: 150000, // ₹1.5 Lakhs
    effectiveFrom: '2014-04-01',
    jurisdiction: 'IN',
    sourceReference: 'Income Tax Act 1961 Section 80C',
    isStatutory: true
  }
};
```

---

## 4. 5-Pillar Deterministic Formulas & Semantics

### 🛡️ 1. Protection Shield Pillar (Authoritative Engine: `DigitalTwinService` & `InsuranceRepository`)
- **Term Life Protection Ratio**:
  $$\text{TermRatio} = \begin{cases}
  \min\left(100, \frac{\text{Active Term Sum Assured}}{\text{Required HLV}} \times 100\right) & \text{if HLV } > 0 \\
  100 & \text{if HLV } = 0 \text{ (no economic dependency)} \\
  \text{UNKNOWN} & \text{if HLV calculation is missing}
  \end{cases}$$
- **Health Shield Protection Ratio**:
  $$\text{HealthRatio} = \min\left(100, \frac{\text{Active Health Sum Assured}}{\text{FFH\_RULE\_REGISTRY.HEALTH\_COVER\_BENCHMARK.parameterValue}} \times 100\right)$$
- **Pillar Score**: $\text{TermRatio} \times 0.60 + \text{HealthRatio} \times 0.40$.
- **Semantics**: If insurance records exist and sum assured = 0, score = 0.0 (`status: 'KNOWN_ZERO'`).

### 💧 2. Liquidity & Emergency Reserves Pillar (Authoritative Engine: `DigitalTwinService`)
- **Emergency Runway Months**:
  $$\text{RunwayMonths} = \frac{\text{Liquid Cash \& Bank Balances}}{\text{Monthly Non-Discretionary Expenses}}$$
  *(Non-discretionary expenses include EMIs, insurance premiums, and essential living expenses classified by `DigitalTwinService`).*
- **Pillar Score**:
  $$\text{LiquidityScore} = \min\left(100, \frac{\text{RunwayMonths}}{\text{FFH\_RULE\_REGISTRY.EMERGENCY\_RUNWAY\_MONTHS.parameterValue}} \times 100\right)$$
- **Semantics**: Missing expense ledger produces `status: 'INSUFFICIENT_DATA'`. Known zero cash produces `score: 0.0, status: 'KNOWN_ZERO'`.

### 🎯 3. Goals & Planning Pillar (Authoritative Engine: `GoalPlanningService` & `financial_goals`)
- **Pillar Score**:
  $$\text{GoalsScore} = \frac{1}{N} \sum_{i=1}^{N} \min\left(100, \frac{\text{Current Asset Allocation}_i}{\text{Target Amount}_i} \times 100\right)$$
- **Semantics**:
  - If $N = 0$ active financial goals: `status = 'NOT_APPLICABLE'`, score is `null`, and its weight is proportionally redistributed to the remaining 4 pillars.
  - Inactive/expired goals are excluded from calculation.

### 📜 4. Estate & Succession Pillar (Authoritative Engine: `EstateHealthService`)
- **Pillar Score**: Direct invocation of `EstateHealthService.calculateEstateHealth(familyId)`.
- **Normalization Verification**: Validates score is $0..100$. Evaluates Will registration status, executor appointment, and nominee coverage across family assets.
- **Semantics**: If zero estate records exist, returns evaluated score based on baseline nominee coverage.

### 📊 5. Tax & Data Hygiene Pillar (Authoritative Engine: `TaxCalculationEngine` & `DigitalTwinService`)
- **Fiduciary-Safe Formula**:
  - **Component A: Tax Compliance & Regime Optimization (30%)**: Evaluates whether active tax regime (Old vs New) is optimal according to `TaxCalculationEngine`, and whether PAN/advance tax tracking is active.
  - **Component B: Data Completeness & Twin Freshness (40%)**: Derived directly from `DigitalTwinService.calculateCompleteness()`.
  - **Component C: Statutory Deduction Utilization (30%)**: Evaluates claimed statutory deductions up to statutory limits without penalizing families that choose the New Tax Regime (where 80C is non-applicable).
- **Semantics**: If tax records are missing, produces `status: 'INSUFFICIENT_DATA'`.

---

## 5. Proposed Changes by Component

### 🏛️ Component 1: Core Engine Service
#### [NEW] [FamilyFinancialHealthService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/familyOffice/FamilyFinancialHealthService.ts)
- `calculateHealth(familyId: number): Promise<FamilyFinancialHealth>`:
  - Invokes `DigitalTwinService.hydrateDigitalTwin(familyId)`.
  - Determines primary earner and classifies life stage (`EARLY_CAREER`, `FAMILY_EXPANSION`, `WEALTH_PRESERVATION`, `RETIREMENT`).
  - Evaluates all 5 pillars using authoritative domain services.
  - Calculates proportional effective weights and composite score:
    $$\text{overallScore} = \sum_{i \in \text{Available}} \text{pillarScore}_i \times \text{effectiveWeight}_i$$
  - Computes `completenessScore` and `overallStatus` (`COMPLETE`, `PARTIAL`, `INSUFFICIENT_DATA`).
  - Computes dynamic delta vs previous monthly snapshot from `SQLiteFamilyHealthRepository`.
- `createSnapshot(familyId: number, asOfDate?: string): Promise<FamilyHealthSnapshotRow>`:
  - Computes live health and state hash.
  - Persists snapshot to `family_health_history` with idempotency and duplicate deduplication.

---

### 🌐 Component 2: REST Controller & Express Routes
#### [NEW] [FamilyHealthController.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/controllers/FamilyHealthController.ts)
- `getHealth(req, res)`: Live evaluation (no DB writes).
- `getHistory(req, res)`: Historical snapshots with pagination.
- `createSnapshot(req, res)`: Explicit snapshot creation.

#### [NEW] [familyHealthRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/familyHealthRoutes.ts)
- `GET /api/v1/family-office/health`
- `GET /api/v1/family-office/health/history`
- `POST /api/v1/family-office/health/snapshot`
- Mounted in `backend/src/index.ts` with `correlationMiddleware` and `idempotencyMiddleware`.

---

## 6. Comprehensive Invariant Test Plan (Sprint 8C.1)

#### [NEW] [familyFinancialHealth.test.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/sprint8c1/familyFinancialHealth.test.ts)

1. **Pillar Unit Calculations**:
   - Protection: Term ratio (with/without HLV) + Health ratio against ₹25L benchmark.
   - Liquidity: Emergency runway months against 6-month non-discretionary burn.
   - Goals & Planning: Goal progress average and `NOT_APPLICABLE` state when 0 goals exist.
   - Estate: Normalized $0..100$ score from `EstateHealthService`.
   - Tax & Data Hygiene: Multi-component formula verifying no penalty under New Tax Regime.
2. **Missing Data & Status Vocabulary**:
   - `UNKNOWN`, `INSUFFICIENT_DATA`, `NOT_APPLICABLE`, `KNOWN_ZERO`, `COMPLETE`, `PARTIAL`.
   - Verify missing data never defaults to `0` or overrides valid partial calculations.
3. **Life-Stage Matrix & Weight Redistribution**:
   - Verify weights across `EARLY_CAREER`, `FAMILY_EXPANSION`, `WEALTH_PRESERVATION`, `RETIREMENT`.
   - Proportional weight redistribution verification when Goals is `NOT_APPLICABLE`: $\sum W_i' = 1.00$.
4. **Historical Snapshots & Delta Math**:
   - First snapshot baseline.
   - Second snapshot delta calculation.
   - Division-by-zero protection: When $\text{previousScore} = 0 \to \text{percentDelta} = \text{null}$.
   - Life-stage change delta attribution flag: `comparisonStatus = 'WEIGHTING_OR_LIFESTAGE_CHANGED'`.
   - Snapshot deduplication: Same family + same `snapshot_period` + same `state_hash` updates without creating duplicate rows.
5. **Cross-Family Security Isolation**:
   - Family A cannot read or snapshot Family B's financial health.
6. **Performance Benchmark**:
   - Full FFH index evaluation completes in $\le 500\text{ms}$ on real family office dataset.

---

## 7. Verification & Baseline Integration

- **Master Test Harness**: Wire `runSprint8c1Tests` into `runTests.ts`.
- **Test Metric Standard**: Baseline **328** + Sprint 8C.1 tests $\to$ Master suite green with **0 failures**.
- **Strict TypeScript Compilation**: `backend` and `frontend` `tsc --noEmit` = **0 errors**.
- **Documentation**: Synchronize `SESSION_CONTEXT.md`, `AI_CHANGELOG.md`, `docs/PHASE_8_ROADMAP.md`, and `docs/FAMILY_FINANCIAL_HEALTH.md`.


---

# ChatGPT Final Review – Revised Sprint 8C.1 Plan

## Verdict

**🟡 REVISE ONCE MORE BEFORE IMPLEMENTATION**

The Agent has incorporated almost all major guardrails correctly. The explicit life-stage matrix, versioned rule registry, missing-data semantics, authoritative-engine boundaries, zero-division protection, and historical comparability handling are strong improvements.

However, I found several remaining issues that should be resolved before coding. These are mostly **financial semantics and contract consistency**, not a need for another architectural redesign.

---

# 1. CRITICAL – Tax/Data Formula Is Still Internally Inconsistent

The Executive Summary says:

> Tax score is based on Compliance Readiness (30%), Digital Twin completeness (40%), and Regime Optimization (30%).

But Section 4 now says:

> Component A = Tax Compliance & Regime Optimization (30%)
> Component B = Data Completeness (40%)
> Component C = Statutory Deduction Utilization (30%)

This reintroduces the exact ambiguity we previously removed.

### Required correction

Choose one final formula and use it everywhere.

Recommended:

```text
Tax & Data Hygiene
=
Compliance & Filing Readiness        30%
+
Digital Twin Completeness/Freshness 40%
+
Tax Regime Optimization              30%
```

Do **not** make "higher 80C utilization" a standalone positive health factor.

If statutory deduction utilization is retained as an input, it must be a **sub-component of tax optimization**, not a fiduciary-health reward for consuming deductions.

---

# 2. CRITICAL – Life-Stage Precedence Is Still Ambiguous

The matrix says:

```text
FAMILY_EXPANSION:
age 32–50 OR minor dependents

RETIREMENT:
age >=65 OR retired
```

A retired person with minor dependents could technically satisfy both.

The service must define precedence.

### Required deterministic precedence

Recommended:

```text
IF retired == true OR age >= 65
    → RETIREMENT
ELSE IF minorDependents > 0
    → FAMILY_EXPANSION
ELSE IF age >= 50
    → WEALTH_PRESERVATION
ELSE IF age >= 32
    → FAMILY_EXPANSION
ELSE
    → EARLY_CAREER
```

The exact policy can differ, but it must be explicit and tested.

---

# 3. CRITICAL – HLV = 0 Must Not Automatically Mean "No Economic Dependency"

The Protection formula says:

```text
HLV = 0 → TermRatio = 100
```

with the interpretation:

> no economic dependency.

This is too strong.

There is a major difference between:

```text HLV was calculated and legitimately equals 0
```

and:

```text HLV calculation returned 0 because required income/dependency data is missing
```

### Required correction

Only return:

```text TermRatio = 100
```

when the authoritative HLV engine explicitly returns:

```text status = KNOWN_ZERO
reason = NO_ECONOMIC_DEPENDENCY
```

If the HLV value is unavailable or incomplete:

```text TermRatio = UNKNOWN / INSUFFICIENT_DATA
```

Do not infer absence of dependency from numeric zero alone.

---

# 4. IMPORTANT – Health Coverage Benchmark Needs Per-Family / Existing Coverage Semantics

The health formula uses:

```text Active Health Sum Assured / ₹25L
```

This is acceptable as the current FamilyWealthOS benchmark, but the implementation should clearly distinguish:

```text benchmark target
vs
regulatory requirement
```

The registry already marks it `isStatutory = false`, which is good.

Persist the rule provenance in the pillar evidence so the UI can explain why ₹25L was used.

---

# 5. IMPORTANT – Goals Formula Needs Zero-Target Protection

Current formula:

```text Current Asset Allocation / Target Amount
```

Add explicit handling for:

```text Target Amount = 0
```

Do not divide by zero.

Recommended:

```text zero target
→ goal excluded from score OR NOT_APPLICABLE
```

The exact behaviour should be deterministic and documented.

Also confirm that `Current Asset Allocation` comes directly from `GoalPlanningService`, rather than being recomputed by FFH.

---

# 6. IMPORTANT – Goals Averaging Needs Weighting Semantics

The current formula uses:

```text 1/N × Σ goal progress
```

This gives a ₹50L retirement goal the same influence as a ₹1L vacation goal.

That may be acceptable for the initial version, but it should be an explicit design decision.

### Required

Document one of:

```text EQUAL_GOAL_WEIGHT
```

or:

```text TARGET_VALUE_WEIGHTED
```

or another deterministic approach.

Do not leave this implicit.

---

# 7. CRITICAL – Estate "Zero Records" Semantics Need Verification

The plan says:

> If zero estate records exist, returns evaluated score based on baseline nominee coverage.

This could accidentally turn **missing estate data** into a positive/negative score.

### Required correction

Verify what `EstateHealthService` actually returns for:

```text no estate records
```

If it means:

```text data unavailable
```

then FFH must preserve:

```text INSUFFICIENT_DATA
```

If it explicitly determines:

```text no will
no nominee
no executor
```

then a deterministic score may be appropriate.

Do not infer estate health from an empty table.

---

# 8. CRITICAL – Snapshot Deduplication Wording Is Incorrect

The plan says:

> Same family + same snapshot_period + same state_hash updates without creating duplicate rows.

The 8C.0 database constraint is:

```text
UNIQUE(family_id, snapshot_period, state_hash)
```

This prevents duplicates but does not by itself define whether the existing row is:

```text updated
```

or:

```text returned unchanged
```

### Required correction

Define explicit semantics.

Recommended:

```text same key
→ return existing snapshot
→ no UPDATE
→ no new row
```

Unless there is a legitimate reason to update metadata.

Do not create an accidental write on every snapshot request.

---

# 9. IMPORTANT – State Hash Must Be Defined

The plan uses `stateHash` for snapshot identity but does not specify its exact input.

Define that it is calculated from a deterministic canonical representation of the relevant FFH inputs, for example:

```text authoritative domain state
+
calculationVersion
+
rule versions
+
lifeStage
+
effective weights
```

Do NOT include:

```text generatedAt
requestId
random UUID
```

Otherwise identical states will produce different hashes.

---

# 10. IMPORTANT – Snapshot `asOfDate` Must Affect the Calculation

`createSnapshot(familyId, asOfDate?)` accepts an historical date.

The implementation must define whether the FFH engine can actually calculate the FFH state **as of that date**.

If existing domain engines only support current-state data:

```text historical asOfDate
→ reject / unsupported
```

rather than silently calculating today's FFH and storing it under a historical date.

This is particularly important because the Time Machine is only planned for 8C.3.

---

# 11. CRITICAL – Baseline Test Count Is Inconsistent

The previous verified Sprint 8C.0 output reported:

```text 327 PASSED
```

The current plan says:

```text Baseline 328
```

No 8C.1 implementation has happened yet.

### Required correction

Use the actual current baseline from the latest verified master suite.

If the Agent intentionally added one verification test after 8C.0 closure, it must explicitly state:

```text Previous verified baseline: 327
Additional post-closure verification: +1
Current baseline: 328
```

Otherwise use:

```text Baseline: 327
```

Do not silently change the baseline.

---

# 12. IMPORTANT – `GET /health` Must Not Persist Anything

The plan correctly says live evaluation has no DB writes.

Add a hard regression test verifying:

```text GET /health
→ no family_health_history insert
→ no state mutation
→ no audit mutation unless explicitly intended
```

Dashboard refresh must never create snapshots.

---

# 13. IMPORTANT – `POST /snapshot` Must Reuse Existing Idempotency

Good that the plan specifies `idempotencyMiddleware`.

Make the acceptance criterion explicit:

```text Same X-Idempotency-Key
→ same response
→ no duplicate snapshot
```

Do not create a second FFH-specific idempotency mechanism.

---

# 14. IMPORTANT – Family Scope Must Be Tested on Every Endpoint

The plan correctly uses:

```text CorrelationContext.getFamilyId()
```

Add tests for:

```text Family A:
GET /health
GET /health/history
POST /health/snapshot
```

and verify none can access Family B.

A client-supplied `familyId` must be ignored/rejected.

---

# 15. IMPORTANT – Completeness Score Formula Must Be Explicit

The plan says:

> Computes completenessScore

but does not define exactly how.

Before implementation, specify:

```text What constitutes a complete pillar?
How are partial pillars weighted?
How does stale data affect completeness?
How are NOT_APPLICABLE pillars treated?
```

Example:

```text completeness =
Σ effective weight of sufficiently known pillars
/
Σ applicable effective weights
× 100
```

The exact formula can differ, but it must be deterministic.

---

# 16. IMPORTANT – Overall Status Precedence Must Be Defined

The plan uses:

```text COMPLETE
PARTIAL
INSUFFICIENT_DATA
```

Define precedence.

For example:

```text Any critical pillar INSUFFICIENT_DATA
    → overallStatus = INSUFFICIENT_DATA

Else any pillar UNKNOWN / STALE
    → PARTIAL

Else
    → COMPLETE
```

Do not allow different services to choose different precedence.

---

# 17. IMPORTANT – Tax Regime Optimization Must Not Make Tax Choice a Moral Score

"Optimal regime" is inherently dependent on family circumstances.

The FFH service should consume a deterministic result from `TaxCalculationEngine`, such as:

```text regimeRecommendation
taxSavingsDelta
calculationConfidence
```

It should not independently decide:

> Old regime = good
> New regime = bad

or vice versa.

The score should evaluate **readiness/optimization evidence**, not preference.

---

# 18. IMPORTANT – Performance Benchmark

The ≤500ms target is reasonable.

Measure against the real FamilyWealthOS dataset and report:

```text cold
warm
real family dataset
```

Do not remove correctness checks simply to meet the target.

---

# 19. Test Coverage – Add Missing Invariants

The existing test plan is good but should add:

### Protection
- HLV `KNOWN_ZERO`
- HLV `INSUFFICIENT_DATA`
- health benchmark provenance

### Goals
- zero target
- inactive goals
- goal weighting decision

### Estate
- empty estate dataset
- genuine zero estate health

### Snapshot
- identical state returns existing row
- different stateHash creates new row
- same month/different state
- different month/same state
- deterministic hash

### API
- GET has zero writes
- POST idempotency
- cross-family access
- client familyId spoofing

### Historical
- unsupported historical `asOfDate`
- no silent current-state substitution

---

# 20. Documentation

On completion, synchronize:

```text
SESSION_CONTEXT.md
AI_CHANGELOG.md
docs/PHASE_8_ROADMAP.md
docs/FAMILY_FINANCIAL_HEALTH.md
```

Document:

- final weighting matrix
- final tax formula
- rule registry
- completeness formula
- overall status precedence
- snapshot/hash semantics
- historical `asOf` limitations
- actual test baseline
- actual performance

---

# 21. FINAL ACCEPTANCE CRITERIA

Sprint 8C.1 can be implemented after the plan explicitly confirms:

- [ ] One authoritative Tax/Data Hygiene formula.
- [ ] Deterministic life-stage precedence.
- [ ] HLV zero vs missing semantics.
- [ ] Health benchmark provenance.
- [ ] Zero-target goal handling.
- [ ] Goal weighting methodology.
- [ ] Empty estate semantics.
- [ ] Snapshot duplicate semantics.
- [ ] Deterministic stateHash inputs.
- [ ] Historical `asOfDate` behaviour.
- [ ] Correct verified test baseline.
- [ ] Explicit completeness formula.
- [ ] Explicit overall-status precedence.
- [ ] Tax regime optimization remains owned by `TaxCalculationEngine`.
- [ ] GET is strictly non-mutating.
- [ ] POST uses existing idempotency.
- [ ] All endpoints enforce server-derived family scope.
- [ ] Required invariant tests are included.

---

# FINAL DECISION

## 🟡 REVISE PLAN BEFORE IMPLEMENTATION

The Agent has done a **very good job incorporating the previous review**, and the architecture is now close to implementation-ready.

The remaining issues are primarily **contract precision**, especially:

1. Tax formula consistency
2. HLV zero vs missing-data semantics
3. Estate empty-data semantics
4. Snapshot/hash semantics
5. Historical `asOfDate` behaviour
6. Completeness/status formulas
7. Test-baseline accuracy

**Do not implement Sprint 8C.1 yet.**

Return the revised plan once these points are explicitly resolved.

After that, we should be able to give the Agent the green light for implementation.
