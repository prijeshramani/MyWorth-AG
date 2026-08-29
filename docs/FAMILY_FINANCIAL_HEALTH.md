# Family Financial Health (FFH) Index Architecture & Methodology

---

## 1. Executive Summary

The **Family Financial Health (FFH) Index (0–100)** is the authoritative, executive-level diagnostic metric within FamilyWealthOS. It evaluates multi-generational financial posture across five core financial pillars: **Protection Shield**, **Liquidity & Emergency Reserves**, **Goals & Planning**, **Estate & Succession**, and **Tax & Data Hygiene**.

Unlike naive scoring systems or opaque AI heuristics, the FFH Index is **100% deterministic**, mathematically grounded in authoritative domain calculation engines, dynamic across human life stages, and transparent in its data completeness lineage.

---

## 2. 5-Pillar Deterministic Formulas

### 🛡️ Pillar 1: Protection Shield
- **Authoritative Engines**: `DigitalTwinService`, `InsuranceRepository`
- **Core Metrics**:
  - Term Life Cover Ratio:
    $$\text{TermRatio} = \begin{cases}
    \min\left(100, \frac{\text{Active Term Sum Assured}}{\text{Required HLV}} \times 100\right) & \text{if HLV } > 0 \\
    100 & \text{if HLV is explicitly } \text{KNOWN\_ZERO} \text{ (no economic dependency)} \\
    \text{null (status: INSUFFICIENT\_DATA)} & \text{if HLV is missing / uncalculated}
    \end{cases}$$
  - Health Shield Ratio:
    $$\text{HealthRatio} = \min\left(100, \frac{\text{Active Health Sum Assured}}{\text{FFH\_RULE\_REGISTRY.HEALTH\_COVER\_BENCHMARK.parameterValue}} \times 100\right)$$
- **Pillar Score**: $\text{TermRatio} \times 0.60 + \text{HealthRatio} \times 0.40$
- **Semantics**: `KNOWN_ZERO` if zero cover with registered family members; `PARTIAL` if health exists without term HLV baseline.

---

### 💧 Pillar 2: Liquidity & Emergency Reserves
- **Authoritative Engine**: `DigitalTwinService`
- **Core Metrics**:
  - Emergency Runway Months:
    $$\text{RunwayMonths} = \frac{\text{Liquid Cash \& Bank Balances}}{\text{Monthly Non-Discretionary Expenses}}$$
- **Pillar Score**:
  $$\text{LiquidityScore} = \min\left(100, \frac{\text{RunwayMonths}}{\text{FFH\_RULE\_REGISTRY.EMERGENCY\_RUNWAY\_MONTHS.parameterValue}} \times 100\right)$$
- **Semantics**: Missing expense ledger returns `status: INSUFFICIENT_DATA`. Zero liquid reserves returns `score: 0.0, status: KNOWN_ZERO`.

---

### 🎯 Pillar 3: Goals & Planning
- **Authoritative Engine**: `GoalPlanningService`, `SQLiteGoalRepository`
- **Core Metrics**:
  - Individual Goal Progress: $\min\left(100, \frac{\text{Current Allocated Amount}_i}{\text{Target Amount}_i} \times 100\right)$
- **Pillar Score**:
  $$\text{GoalsScore} = \frac{1}{M} \sum_{i \in \text{ValidGoals}} \text{Progress}_i$$
- **Semantics**: If 0 active goals or all target amounts $\le 0$, status is `NOT_APPLICABLE` and weight is proportionally redistributed to the remaining 4 pillars.

---

### 📜 Pillar 4: Estate & Succession
- **Authoritative Engine**: `EstateHealthService`, `SQLiteEstateRepository`
- **Pillar Score**: Direct invocation of `EstateHealthService.calculateEstateHealth(familyId)`.
- **Semantics**: Evaluates Will registration status, executor appointment, trust formation, and nominee coverage across family assets.

---

### 📊 Pillar 5: Tax & Data Hygiene
- **Authoritative Engines**: `TaxCalculationEngine`, `DigitalTwinService`
- **Fiduciary-Safe Unified Formula**:
  $$\text{TaxAndDataScore} = (\text{ComplianceReadiness} \times 0.30) + (\text{DigitalTwinCompleteness} \times 0.40) + (\text{RegimeOptimization} \times 0.30)$$
- **Semantics**: Does not penalize New Tax Regime users who legitimately do not use 80C deductions. Evaluates compliance readiness and data freshness.

---

## 3. Explicit Life-Stage Weighting Matrix

| Life Stage | Age / Condition Boundary | Protection | Liquidity | Goals & Planning | Estate | Tax & Data | Total |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`EARLY_CAREER`** | Primary earner age $< 32$, no minor dependents | **20%** | **25%** | **25%** | **5%** | **25%** | **100%** |
| **`FAMILY_EXPANSION`** | $32 \le \text{age} < 50$ OR minor dependents present | **30%** | **20%** | **25%** | **10%** | **15%** | **100%** |
| **`WEALTH_PRESERVATION`**| $50 \le \text{age} < 65$, not retired | **20%** | **20%** | **25%** | **20%** | **15%** | **100%** |
| **`RETIREMENT`** | Age $\ge 65$ OR retired status | **10%** | **30%** | **15%** | **35%** | **10%** | **100%** |

### Weight Processing Pipeline
```text
Base Weights (25 / 20 / 20 / 15 / 20)
      ↓
Life-Stage Matrix Weights (e.g. 30 / 20 / 25 / 10 / 15)
      ↓
Identify NOT_APPLICABLE Pillars (e.g. Goals when 0 goals configured)
      ↓
Proportional Normalization: W_i' = (W_i / sum(W_available)) * 100%
      ↓
Effective Weights (Persisted in snapshot & returned in response)
```

---

## 4. Completeness Score & Overall Status Resolution

### 📐 Completeness Score Formula
$$\text{completenessScore} = \frac{\sum_{i \in \text{Applicable}} \text{effectiveWeight}_i \times \text{PillarCompletenessFactor}_i}{\sum_{i \in \text{Applicable}} \text{effectiveWeight}_i}$$
Where:
- $\text{PillarCompletenessFactor} = 1.0$ if status is `COMPLETE` or `KNOWN_ZERO`.
- $\text{PillarCompletenessFactor} = 0.5$ if status is `PARTIAL`.
- $\text{PillarCompletenessFactor} = 0.0$ if status is `UNKNOWN`, `INSUFFICIENT_DATA`, or `STALE`.

### 🚦 Overall Status Precedence Hierarchy
1. If any applicable pillar is `INSUFFICIENT_DATA` $\longrightarrow$ `overallStatus = 'INSUFFICIENT_DATA'`.
2. Else if any applicable pillar is `PARTIAL`, `UNKNOWN`, or `STALE` $\longrightarrow$ `overallStatus = 'PARTIAL'`.
3. Else $\longrightarrow$ `overallStatus = 'COMPLETE'`.

---

## 5. Versioned Financial Rule Registry

| Rule Code | Version | Parameter Name | Value | Jurisdiction | Statutory | Source Reference |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `RULE_HEALTH_COVER_TIER1` | `2026.1` | `familyHealthCoverTarget` | ₹25,00,000 | `IN` | No | FamilyWealthOS Tier-1 Metro Health Standard |
| `RULE_EMERGENCY_RUNWAY_DEFAULT`| `2026.1` | `emergencyRunwayMonthsTarget` | 6 Months | `IN` | No | Fiduciary Liquid Reserve Standard |
| `RULE_IT_ACT_80C_CEILING` | `2026.1` | `sec80CCeiling` | ₹1,50,000 | `IN` | Yes | Income Tax Act 1961 Section 80C |

---

## 6. Snapshot Deduplication & Delta Comparability

1. **Non-Mutating Evaluation**: `GET /api/v1/family-office/health` performs live evaluation without writing to database.
2. **Duplicate Read-Only Return**: `POST /api/v1/family-office/health/snapshot` checks `(family_id, snapshot_period, state_hash)`. If matching record exists, returns existing row immediately without `UPDATE`.
3. **Delta Division-by-Zero Safety**: If $\text{previousScore} == 0 \longrightarrow \text{percentDelta} = \text{null}$.
4. **Life-Stage Delta Attribution**: If $\text{lifeStage}_{\text{current}} \neq \text{lifeStage}_{\text{prev}} \longrightarrow \text{comparisonStatus} = \text{'WEIGHTING\_OR\_LIFESTAGE\_CHANGED'}$.
5. **Historical Date Guard**: Past `asOfDate` parameters are rejected with `400 Bad Request` until Financial Time Machine is delivered in Sprint 8C.3.
