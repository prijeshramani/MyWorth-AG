# Final Implementation Plan: Sprint 8C.1 – Family Financial Health (FFH) Index Engine & Historical Snapshotting

---

## 1. Executive Summary & Sprint Scope

**Sprint 8C.1** delivers the deterministic **Family Financial Health (FFH) Index Engine (0–100)** and historical snapshotting infrastructure. It calculates executive-level composite financial health by integrating across all 5 Digital Twin domains, applies an explicit deterministic life-stage weighting matrix, enforces a unified fiduciary-safe Tax/Data formula, preserves strict missing-data semantics (no silent zeroes), calculates dynamic comparative deltas with division-by-zero protection, and provides family-scoped REST APIs.

### 🛡️ Core Fiduciary Invariants & Review Guardrails
1. **Deterministic Orchestration Only**: The FFH Index is 100% deterministic, deriving metrics strictly from authoritative domain engines (`DigitalTwinService`, `EstateHealthService`, `GoalPlanningService`, `TaxCalculationEngine`). FFH does not duplicate domain math.
2. **Unified Tax/Data Hygiene Formula**: Standardized single formula: Compliance & Readiness (30%) + Twin Completeness (40%) + Regime Optimization (30%). No standalone reward for consuming 80C deductions.
3. **Deterministic Life-Stage Precedence**: Explicit hierarchical rule prioritizing retirement status $\to$ minor dependents $\to$ age brackets.
4. **HLV KNOWN_ZERO vs INSUFFICIENT_DATA**: $\text{TermRatio} = 100$ only if HLV engine explicitly confirms `KNOWN_ZERO` (no economic dependency). Missing data returns `INSUFFICIENT_DATA`.
5. **Goals & Planning**: Clean naming (`GoalPlanningService`), zero-target protection (excluded from progress), and equal weighting across valid active goals.
6. **Estate Empty-Data Semantics**: Zero estate tracking data returns `INSUFFICIENT_DATA`. Only explicit absence of wills/nominees with existing assets returns evaluated `KNOWN_ZERO` / low score.
7. **Snapshot Read-Only Return on Duplicate**: If identical `(family_id, snapshot_period, state_hash)` exists, returns existing snapshot immediately without `UPDATE` or write.
8. **Deterministic `stateHash`**: Canonical SHA-256 over domain hashes, calculation versions, life stage, weights, and pillar scores (excluding volatile timestamps/UUIDs).
9. **Historical `asOfDate` Boundary**: Live FFH engine calculates current state. Historical `asOfDate` returns `400 Bad Request` until Time Machine is delivered in Sprint 8C.3.
10. **Test Baseline**: Verified baseline is **328 PASSED** (327 from 8C.0 closure + 1 post-closure TimeMachine validation test).

---

## 2. Deterministic Life-Stage Precedence & Weight Matrix

### 🌲 Life-Stage Classification Precedence
```typescript
export function determineLifeStage(primaryEarner: { age: number; isRetired?: boolean }, minorDependentsCount: number): LifeStage {
  if (primaryEarner.isRetired === true || primaryEarner.age >= 65) {
    return 'RETIREMENT';
  }
  if (minorDependentsCount > 0 || (primaryEarner.age >= 32 && primaryEarner.age < 50)) {
    return 'FAMILY_EXPANSION';
  }
  if (primaryEarner.age >= 50 && primaryEarner.age < 65) {
    return 'WEALTH_PRESERVATION';
  }
  return 'EARLY_CAREER';
}
```

### 📊 Weighting Matrix

| Life Stage | Protection | Liquidity | Goals & Planning | Estate | Tax & Data | Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`EARLY_CAREER`** | **20%** | **25%** | **25%** | **5%** | **25%** | **100%** |
| **`FAMILY_EXPANSION`** | **30%** | **20%** | **25%** | **10%** | **15%** | **100%** |
| **`WEALTH_PRESERVATION`**| **20%** | **20%** | **25%** | **20%** | **15%** | **100%** |
| **`RETIREMENT`** | **10%** | **30%** | **15%** | **35%** | **10%** | **100%** |

---

## 3. Versioned Financial Rule Registry

```typescript
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

## 4. Pillar Calculation Formulas & Semantics

### 🛡️ 1. Protection Shield (Authoritative: `DigitalTwinService` & `InsuranceRepository`)
- **Term Life Ratio**:
  $$\text{TermRatio} = \begin{cases}
  \min\left(100, \frac{\text{Active Term Sum Assured}}{\text{Required HLV}} \times 100\right) & \text{if HLV } > 0 \\
  100 & \text{if HLV is explicitly } \text{KNOWN\_ZERO} \text{ (no dependency)} \\
  \text{null (status: INSUFFICIENT\_DATA)} & \text{if HLV is missing / uncalculated}
  \end{cases}$$
- **Health Shield Ratio**:
  $$\text{HealthRatio} = \min\left(100, \frac{\text{Active Health Sum Assured}}{\text{FFH\_RULE\_REGISTRY.HEALTH\_COVER\_BENCHMARK.parameterValue}} \times 100\right)$$
- **Score**: $\text{TermRatio} \times 0.60 + \text{HealthRatio} \times 0.40$ (or normalized if one sub-component is `NOT_APPLICABLE`).

### 💧 2. Liquidity & Emergency Reserves (Authoritative: `DigitalTwinService`)
- **Runway Months**: $\frac{\text{Liquid Cash \& Bank Balances}}{\text{Monthly Non-Discretionary Expenses}}$
- **Score**: $\min\left(100, \frac{\text{RunwayMonths}}{\text{FFH\_RULE\_REGISTRY.EMERGENCY\_RUNWAY\_MONTHS.parameterValue}} \times 100\right)$
- **Semantics**: Missing expense ledger $\to$ `status: INSUFFICIENT_DATA`. Zero cash $\to$ `score: 0.0, status: KNOWN_ZERO`.

### 🎯 3. Goals & Planning (Authoritative: `GoalPlanningService`)
- **Score**:
  $$\text{GoalsScore} = \frac{1}{M} \sum_{i \in \text{ValidGoals}} \min\left(100, \frac{\text{Current Asset Allocation}_i}{\text{Target Amount}_i} \times 100\right)$$
- **Semantics**: Active goals with $\text{Target Amount} \le 0$ are excluded. If $M = 0$ valid goals: `status = 'NOT_APPLICABLE'`, score = `null`, weight redistributed proportionally.

### 📜 4. Estate & Succession (Authoritative: `EstateHealthService`)
- **Score**: Evaluated directly via `EstateHealthService.calculateEstateHealth(familyId)`.
- **Semantics**: If no estate data or nominee records exist $\to$ `status: INSUFFICIENT_DATA`. If assets exist with zero wills/nominees $\to$ evaluated numeric score (`KNOWN_ZERO` / low score).

### 📊 5. Tax & Data Hygiene (Authoritative: `TaxCalculationEngine` & `DigitalTwinService`)
- **Score**:
  $$\text{TaxAndDataScore} = (\text{ComplianceReadiness} \times 0.30) + (\text{DigitalTwinCompleteness} \times 0.40) + (\text{RegimeOptimization} \times 0.30)$$
- **Semantics**: Missing tax profile $\to$ `status: INSUFFICIENT_DATA`. No penalty under New Tax Regime.

---

## 5. Completeness & Overall Status Precedence

### 📐 Completeness Score (0.0 – 1.0)
$$\text{completenessScore} = \frac{\sum_{i \in \text{Applicable}} \text{effectiveWeight}_i \times \text{PillarCompletenessFactor}_i}{\sum_{i \in \text{Applicable}} \text{effectiveWeight}_i}$$
Where:
- $\text{PillarCompletenessFactor} = 1.0$ if status is `COMPLETE` or `KNOWN_ZERO`.
- $\text{PillarCompletenessFactor} = 0.5$ if status is `PARTIAL`.
- $\text{PillarCompletenessFactor} = 0.0$ if status is `UNKNOWN`, `INSUFFICIENT_DATA`, or `STALE`.

### 🚦 Overall Status Precedence
1. If any applicable pillar is `INSUFFICIENT_DATA` $\to$ `overallStatus = 'INSUFFICIENT_DATA'`.
2. Else if any applicable pillar is `PARTIAL`, `UNKNOWN`, or `STALE` $\to$ `overallStatus = 'PARTIAL'`.
3. Else $\to$ `overallStatus = 'COMPLETE'`.

---

## 6. Snapshot Persistence, Idempotency & Delta Comparability

1. **Duplicate Snapshot Read-Only Return**:
   - `createSnapshot` checks `findSnapshotByPeriodAndHash(familyId, snapshotPeriod, stateHash)`.
   - If found: returns existing record immediately without performing an `UPDATE` or insert.
2. **Deterministic `stateHash`**:
   - SHA-256 over: `{ familyId, calculationVersion: '2026.1', ruleVersions: FFH_RULE_REGISTRY, lifeStage, effectiveWeights, pillarScores: { ... }, domainHashes }`.
3. **Delta Calculation & Safety**:
   - If $\text{previousScore} == 0 \to \text{percentDelta} = \text{null}$.
   - If $\text{lifeStage}_{\text{current}} \neq \text{lifeStage}_{\text{prev}} \to \text{comparisonStatus} = \text{'WEIGHTING\_OR\_LIFESTAGE\_CHANGED'}$.
4. **Historical `asOfDate` Handling**:
   - If `asOfDate` is provided and refers to a past date/month $\to$ Returns `400 Bad Request` (`HISTORICAL_CALCULATION_UNSUPPORTED_IN_8C_1 - Use Financial Time Machine in Sprint 8C.3`).

---

## 7. Comprehensive Invariant Test Plan (Sprint 8C.1)

#### [NEW] `backend/src/__tests__/sprint8c1/familyFinancialHealth.test.ts`

1. **Pillar Unit Calculations**:
   - Protection: Term ratio (KNOWN_ZERO vs INSUFFICIENT_DATA vs exact HLV ratio) + Health ratio.
   - Liquidity: Emergency runway months against 6-month burn.
   - Goals & Planning: Equal weighting across valid goals; zero-target excluded; NOT_APPLICABLE when 0 goals.
   - Estate: Propagation of `EstateHealthService` score; empty estate dataset handling.
   - Tax & Data Hygiene: Unified formula verifying no 80C consumption bias.
2. **Deterministic Life-Stage Precedence**:
   - Hierarchy: Retirement $\to$ Minor Dependents $\to$ Age brackets.
3. **Completeness Score & Overall Status Precedence**:
   - Verifies completeness factor weighting and hierarchical status resolution.
4. **Snapshot Persistence & Idempotency**:
   - Read-only return on identical `(family_id, snapshot_period, state_hash)`.
   - `GET /health` creates 0 DB rows (strictly read-only).
   - `POST /snapshot` respects `X-Idempotency-Key`.
5. **Delta Math & Comparability**:
   - Division-by-zero protection (`previousScore = 0 => percentDelta = null`).
   - Life-stage change delta flag (`comparisonStatus = 'WEIGHTING_OR_LIFESTAGE_CHANGED'`).
6. **Cross-Family Security & Historical Date Guard**:
   - Family A cannot read or snapshot Family B.
   - Past `asOfDate` explicitly rejected with 400.
7. **Performance Benchmark**:
   - Full evaluation completes in $\le 500\text{ms}$ on real family dataset.

---

## 8. Verification & Baseline Integration

- **Master Test Harness**: Wire `runSprint8c1Tests` into `runTests.ts`.
- **Baseline**: Current verified baseline **328 PASSED** $\to$ Master suite green with **328 + X PASSED (0 FAILURES)**.
- **TypeScript Strict Compilation**: `backend` and `frontend` `tsc --noEmit` = **0 errors**.
- **Documentation**: Synchronize `SESSION_CONTEXT.md`, `AI_CHANGELOG.md`, `docs/PHASE_8_ROADMAP.md`, and `docs/FAMILY_FINANCIAL_HEALTH.md`.
