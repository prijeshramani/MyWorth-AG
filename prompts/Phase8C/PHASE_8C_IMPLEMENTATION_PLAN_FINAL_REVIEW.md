# Implementation Plan: Phase 8C – Family Financial Health, Timeline, Time Machine & Command Center (Approved Architecture)

---

## 1. Executive Summary & Strategic Objectives

**Phase 8C** delivers the executive synthesis layer, chronological family ledger, retroactive time machine, counterfactual simulation sandbox, and decision-centric command center of the **Personal Family Office OS**. It builds directly upon the Phase 8B foundation (Contracts, 5-Pillar Digital Twin, Life Events Engine, and Proactive Observer).

---

## 2. Core Architectural & Fiduciary Guardrails

```
+----------------------------------------------------------------------------------------------------+
|                                    PHASE 8C SYSTEM BOUNDARIES                                      |
+----------------------------------------------------------------------------------------------------+
  1. DETERMINISTIC FFH         -> Explicit formulas & provenance; no ad-hoc score overrides.
  2. DERIVED TIMELINE          -> Read-only projection over authoritative SQLite domain tables.
  3. QUALIFIED TIME MACHINE    -> Historical reconstruction with explicit completeness; zero price fakes.
  4. ZERO-MUTATION WHAT-IF     -> Reuses WhatIfSimulationEngine; isolated deep-clone in-memory sandbox.
  5. SINGLE OBSERVER ENGINE    -> Proactive triggers solely governed by Sprint 8B.3 Cooldown Registry.
  6. SAFE ACTION ROUTING       -> No direct UI mutations; risk-tiered confirmation via AIActionRegistry.
  7. SERVER-RESOLVED SCOPE     -> Authoritative familyId derived strictly from CorrelationContext.
  8. MEASURED TEST METHODOLOGY -> Previous Baseline (316) + New Sprint Tests (X) = Total (316 + X).
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Pillar 1: Family Financial Health (FFH) Scoring Contract

### 3.1 Formal Calculation Matrix

| Pillar | Metric / Sub-Score | Input Field | Target / Benchmark | Calculation Owner | Deterministic Formula | Missing Data / Explicit Semantics | Freshness | Version |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Protection (25%)** | Term Cover Ratio (60%) + Health Shield Ratio (40%) | Active Term Life Sum Assured, Health Sum Assured from `insurance_policies` | Required HLV from `DigitalTwinService`, Baseline Family Health Target (₹25L) | `DigitalTwinService` / `InsuranceRepository` | $\min\left(100, \left(\frac{\text{TermCover}}{\text{HLVTarget}} \times 60\right) + \left(\frac{\text{HealthCover}}{\text{HealthTarget}} \times 40\right)\right)$ | Missing HLV $\to$ `UNKNOWN`; Zero cover $\to$ Formula calculates strictly $0.0$ (no ad-hoc overrides) | $\le 30$d | `2026.1` |
| **Liquidity (20%)** | Emergency Runway Months | Liquid Bank Balances + Liquid MFs from `assets` | 6 Months of Non-Discretionary Expenses | `DigitalTwinService` / `CashflowService` | $\min\left(100, \left(\frac{\text{LiquidReserves}}{\text{MonthlyBurn} \times 6}\right) \times 100\right)$ | Missing Burn $\to$ `INSUFFICIENT_DATA`; Zero Reserves $\to$ Formula calculates $0.0$ | $\le 7$d | `2026.1` |
| **Goals (20%)** | Goal Compounding & Progress Pace | Current Allocated vs Target from `financial_goals` | Individual Goal Targets & Timelines | `GoalPlanningService` | $\frac{1}{N} \sum_{i=1}^N \min\left(100, \frac{\text{Allocated}_i}{\text{Target}_i} \times 100\right)$ | Zero registered goals $\to$ `NOT_APPLICABLE` (Weight redistributed proportionally) | $\le 30$d | `2026.1` |
| **Estate (15%)** | Will Registration & Nominee Coverage | Active Wills, Nominee Edges in Knowledge Graph | 100% Asset Nominee Linkage + Valid Will | `EstateHealthService` | Direct score from `EstateHealthService.calculateEstateHealth(familyId)` | Missing graph sync $\to$ `STALE`; No Will/Nominees $\to$ Exact score from formula | $\le 90$d | `2026.1` |
| **Tax & Data (20%)** | Section 80C Utilization (50%) + Data Completeness (50%) | Claimed 80C Deductions from `tax_deductions`, Twin Completeness | ₹1,50,000 Statutory Limit, 1.0 (100%) Twin Completeness | `TaxCalculationEngine` / `DigitalTwinService` | $\left(\frac{\min(150000, \text{Claimed80C})}{150000} \times 50\right) + (\text{TwinCompletenessScore} \times 50)$ | Missing deductions $\to$ Pro-rated on known items; Completeness from Digital Twin | $\le 30$d | `2026.1` |

### 3.2 Deterministic Family Life-Stage Selection & Weight Redistribution

#### Selection Algorithm:
1. **Identify Primary Earner**: Member with the highest declared annual income in `family_members`. If incomes are equal or undeclared, select the eldest member with employment status `ACTIVE`.
2. **Evaluate Stage**:
   - `RETIREMENT`: Primary earner age $> 65$, or employment status = `RETIRED`.
   - `WEALTH_PRESERVATION`: Primary earner age $50 \le \text{age} \le 65$.
   - `FAMILY_EXPANSION`: Minor dependents present ($< 18$ yrs), or primary earner age $32 \le \text{age} < 50$ (Default).
   - `EARLY_CAREER`: Primary earner age $< 32$ with 0 minor dependents.

#### Proportional Weight Redistribution Formula:
When a pillar evaluates to `NOT_APPLICABLE` (e.g. Goals when 0 goals exist):
$$W_i' = \frac{W_i}{\sum_{j \in \text{Available}} W_j} \times 100\%$$

### 3.3 Snapshot Cadence & Deduplication
- **Cadence**: Snapshots are persisted to `family_health_history` on distinct monthly boundaries or when a material state change occurs ($|\Delta \text{Score}| \ge 2.5$ pts).
- **Idempotency & Deduplication**: If a snapshot already exists for the same `familyId`, same `stateHash`, and same calendar month (`YYYY-MM`), redundant snapshot insertion is suppressed.
- **Dynamic Deltas**: Calculated dynamically: $\Delta_{\text{total}} = \text{Score}_{\text{current}} - \text{Score}_{\text{prev}}, \quad \Delta_{\text{pillar}} = \text{PillarScore}_{\text{current}} - \text{PillarScore}_{\text{prev}}$.

---

## 4. Pillar 2: Unified Family Timeline Ledger

### 4.1 Ingestion & Normalization Matrix

| Domain | Source Table | Filter Criteria | Event Date Field | Deduplication Identity |
| :--- | :--- | :--- | :--- | :--- |
| **Transactions** | `transactions` | $|\text{Amount}| \ge \text{Threshold}$ (Default ₹1,00,000) AND NOT Internal Transfer | `transaction_date` | `SHA256("TXN", id)` |
| **Insurance** | `insurance_policies` | Policy activation, renewal window ($\le 30$d) | `start_date` / `next_premium_due_date` | `SHA256("INS", id, event_type)` |
| **Goals** | `financial_goals` | Creation, milestone crossed ($\ge 50\%, 100\%$) | `created_at` / `updated_at` | `SHA256("GOAL", id, event_type)` |
| **Tax** | `tax_deductions`, `itr_filings` | Return filed, 80C limit maximized | `filing_date` / `tax_year` | `SHA256("TAX", id, tax_year)` |
| **Estate** | `wills`, `trusts` | Will registered, executor nominated | `execution_date` | `SHA256("EST", id, execution_date)` |
| **Life Events** | `life_events` | Life event declared or processed | `event_date` | `SHA256("LE", id)` |
| **Proactive Triggers** | `proactive_triggers` | Status = `ACKNOWLEDGED` or `RESOLVED` | `updated_at` | `SHA256("TRG", trigger_id, status)` |

### 4.2 Synchronization & Update/Delete Semantics
- Derived read model over authoritative tables.
- Updates to source records update the timeline projection in place via `UPSERT`. Deletions of source records purge the corresponding timeline record.
- Internal bank-to-bank transfers excluded; threshold evaluates absolute amount.

---

## 5. Pillar 3: Financial Time Machine & Zero-Mutation Sandbox

### 5.1 Qualified Retroactive Reconstruction Matrix

| Asset Class | Historical Quantity ($T_{\text{target}}$) | Historical Price / Valuation Policy | Calculation Engine | Missing Data Semantics |
| :--- | :--- | :--- | :--- | :--- |
| **Equities & Stocks** | $\sum_{t \le T} \text{BuyUnits} - \sum_{t \le T} \text{SellUnits}$ | Exact closing price from `asset_prices` where $\text{date} \le T$ (within 90 days) | `PortfolioValuationStrategy` | If no price within 90d $\to$ `UNKNOWN` (Zero price substitution strictly forbidden) |
| **Mutual Funds** | $\sum_{t \le T} \text{Units}$ | Historical NAV from `asset_prices` where $\text{date} \le T$ | `MutualFundValuationStrategy` | Missing NAV $\to$ `UNKNOWN` |
| **Fixed Deposits** | Principal deposited $\le T$ | Accrued compounding interest up to $T$ | `fdValuation.ts` | Complete date inputs required; else `INSUFFICIENT_DATA` |
| **Bank Accounts** | Net cumulative credits/debits up to $T$ | Account balance as of $T$ | `CashflowService` | Missing statements $\to$ `UNKNOWN` |
| **PPF / EPF / NPS** | Cumulative contributions up to $T$ | Authoritative historical ledger balance | Existing EPF/NPS Parsers | Missing ledger $\to$ `HISTORICAL_SOURCE_UNAVAILABLE` |
| **Real Estate** | Active ownership verified $\le T$ | Recorded purchase cost or registered circle valuation $\le T$ | `AssetRepository` | Unvalued property $\to$ `KNOWN_ACQUISITION_COST` |
| **Insurance** | Policy active on $T$ | Sum Assured and Surrender Value status on $T$ | `InsuranceRepository` | Missing policy state $\to$ `UNKNOWN` |

- **Cutoff**: `targetDate 23:59:59.999Z` (inclusive).

### 5.2 Zero-Mutation Counterfactual Sandbox
- Clones `DigitalTwinState` into ephemeral memory (`WhatIfSimulationState`). Zero database writes.
- Validates parameters via Zod (`monthlySipAmount`, `sipStepUpPercent`, `targetRetirementAge`).
- Returns `{ scenarioId, baselineStateHash, baselineAsOf, scenarioParameters, calculationVersion, generatedAt }`.

---

## 6. Pillar 4: Family Command Center UX & Action Safety

### 6.1 Action Risk Classification & Routing
- `INFORMATIONAL`: Direct navigation with pre-filtered context.
- `LOW_RISK`: In-place mutation (e.g. snooze trigger 1..30d) with idempotency key.
- `MEDIUM_RISK`: Confirmation modal displaying before/after impact (e.g. update goal SIP).
- `HIGH_RISK`: 2-Step fiduciary authorization via `AIActionRegistry` (e.g. loan prepayment, entity deletion).

---

## 7. Sprint-by-Sprint Execution Roadmap

| Sprint | Focus Area | Deliverables |
| :--- | :--- | :--- |
| **Sprint 8C.0** | **Contracts, Zod Schemas & Migrations (Foundation Only)** | - Zod contracts for FFH (`FamilyFinancialHealthSchema`), Timeline (`FamilyTimelineEventSchema`), Time Machine (`TimeMachineReconstructionSchema`, `WhatIfScenarioSchema`).<br>- Migration `019_family_health_and_timeline.ts` (`family_health_history`, `family_timeline_events`).<br>- Repositories: `SQLiteFamilyHealthRepository.ts`, `SQLiteFamilyTimelineRepository.ts`.<br>- Invariant test suite verifying schemas, serialization, and migration safety. |
| **Sprint 8C.1** | **Family Financial Health (FFH) Engine** | - `FamilyFinancialHealthService.ts` implementing the 5-pillar calculation matrix.<br>- Dynamic life-stage selection and proportional weight redistribution.<br>- Monthly snapshot cadence with state-hash deduplication.<br>- Calculated absolute, percentage, and pillar attribution deltas.<br>- REST endpoints (`GET /health`, `GET /health/history`, `POST /health/snapshot`).<br>- Invariant tests. |
| **Sprint 8C.2** | **Unified Family Timeline Ledger** | - `FamilyTimelineService.ts` aggregating transactions, policies, goals, tax, estate, life events, triggers.<br>- Deduplication identity (`SHA256(sourceType, sourceId)`).<br>- Configurable transaction threshold with internal transfer exclusions.<br>- Idempotent sync runner and update/delete projection consistency.<br>- REST endpoints (`GET /timeline`, `POST /timeline/sync`).<br>- Invariant tests. |
| **Sprint 8C.3** | **Financial Time Machine & Simulation Sandbox** | - `FinancialTimeMachineService.ts` implementing qualified retroactive reconstruction with asset-class matrix.<br>- Deterministic cutoff semantics and provenance tagging (`CALCULATED`, `HISTORICAL_SOURCE`, `UNKNOWN`).<br>- Extending `WhatIfSimulationEngine.ts` with deep-clone Digital Twin sandbox support.<br>- Strict parameter validation and zero-database-mutation invariant tests.<br>- REST endpoints (`GET /time-machine/reconstruct`, `POST /time-machine/simulate`).<br>- Invariant tests. |
| **Sprint 8C.4** | **Family Command Center UI** | - Executive Vitals Strip (Net Worth, FFH Circular Gauge, Emergency Runway).<br>- Prioritized Action Radar (Strict max 3 cards with 5-point explainability).<br>- Domain Matrices 2x2 Grid (Portfolio, Protection, Goals, Tax/Estate).<br>- Interactive Timeline Strip & Time Machine Scrubber.<br>- What-If Scenario Drawer.<br>- Safe action routing (no direct UI mutations). Zero frontend business logic.<br>- End-to-end integration tests. |

---

## 8. Measurable Verification & Testing Standards

- **Test Reporting Standard**: $\text{Previous Baseline (316)} + \text{New Sprint Tests (X)} = \text{Total (316 + X)}, 0 \text{ Failures}$.
- **Performance Targets (p95)**:
  - FFH calculation $\le 500\text{ms}$
  - Timeline query $\le 500\text{ms}$
  - Time Machine reconstruction $\le 1000\text{ms}$
  - What-If simulation $\le 1000\text{ms}$
- **TypeScript Strict Compilation**: `backend` and `frontend` `tsc --noEmit` = 0 errors.
- **Cross-Family Security**: Strict authorization verification across all endpoints.


---

# ChatGPT Final Review Comments

## Verdict

**🟢 APPROVED WITH TARGETED FINAL CORRECTIONS**

The revised plan has successfully incorporated the major architecture requirements from the previous review. It is now sufficiently mature to proceed toward Sprint 8C.0.

I do **not** recommend another strategic redesign.

However, there are a few remaining contract-level issues that should be corrected **before implementation**, particularly around historical valuation semantics, configurable regulatory/business targets, status vocabulary, and timeline event semantics.

---

# 1. CRITICAL – Historical Price Policy Is Still Not Truly "Exact"

The plan currently says for equities:

> Exact closing price from `asset_prices` where date <= T (within 90 days)

This creates an ambiguity.

If the target date is 31-Dec-2025 and the available price is 15-Dec-2025, that is **not the exact historical price on the target date**.

### Required correction

Use explicit semantics:

```text
PRICE_ON_TARGET_DATE
PRICE_PRIOR_TO_TARGET_DATE
NO_HISTORICAL_PRICE
```

Recommended rule:

```text
Price on target date
    → PRICE_ON_TARGET_DATE

No target-date price, but permitted prior-date fallback exists
    → PRICE_PRIOR_TO_TARGET_DATE
    → mark valuation as APPROXIMATE / PROXY

No acceptable historical price
    → UNKNOWN
```

Never describe a prior-date price as an "exact" point-in-time valuation.

The 90-day fallback window must also be explicitly justified and configurable/versioned.

---

# 2. CRITICAL – Time Machine Completeness Must Be Aggregated

The asset-level provenance is good, but the overall reconstruction needs a clear summary:

```text
reconstructionCompleteness
reconstructionStatus
```

For example:

```text
COMPLETE
PARTIAL
INSUFFICIENT_DATA
```

The response should allow the UI to clearly say:

> "Historical reconstruction is 82% complete; property valuation is unavailable."

Do not return a plausible-looking total balance sheet without exposing incomplete components.

---

# 3. CRITICAL – Historical Valuation Must Not Mix Incompatible Semantics

The asset matrix currently mixes:

- market value
- acquisition cost
- registered valuation
- surrender value
- ledger balance

These are not necessarily comparable.

For example:

```text
Equity → market value
Property → acquisition cost
Insurance → sum assured
```

should not silently be presented as one homogeneous "net worth" figure.

### Required correction

Every reconstructed component should specify:

```text
valuationType
```

such as:

```text
MARKET_VALUE
BOOK_COST
ACQUISITION_COST
LEDGER_BALANCE
SUM_ASSURED
SURRENDER_VALUE
UNKNOWN
```

The Time Machine must distinguish:

> "Historical net worth"

from:

> "Historical known-value position."

If components are not comparable, the overall metric must be marked accordingly.

---

# 4. CRITICAL – PPF / EPF / NPS Status Vocabulary Is Inconsistent

The Phase 8B architecture established explicit semantics such as:

```text
CALCULATED
HISTORICAL_SOURCE
UNKNOWN
INSUFFICIENT_DATA
```

The revised plan introduces:

```text
HISTORICAL_SOURCE_UNAVAILABLE
```

This is a new status.

### Required correction

Do not introduce another status unless there is a compelling architectural reason.

Prefer:

```text
status = INSUFFICIENT_DATA
provenance = HISTORICAL_SOURCE_UNAVAILABLE
```

or:

```text
status = UNKNOWN
provenance = HISTORICAL_SOURCE_UNAVAILABLE
```

Keep the status vocabulary globally consistent.

---

# 5. IMPORTANT – Bank Account Historical Reconstruction Needs Opening Balance Semantics

The plan says:

> Net cumulative credits/debits up to T

This is insufficient by itself.

Correct reconstruction requires:

```text
Opening Balance
+
Credits
-
Debits
=
Balance at T
```

If the opening balance before the available transaction history is unknown:

```text
UNKNOWN / INSUFFICIENT_DATA
```

Do not assume zero.

---

# 6. IMPORTANT – Fixed Deposit Reconstruction Needs Compounding Contract

The plan correctly reuses `fdValuation.ts`.

Before implementation, explicitly define:

- principal date
- maturity date
- interest rate
- compounding frequency
- premature withdrawal treatment
- whether accrued interest is included before maturity
- target-date cutoff

The Time Machine must not create a second FD calculation formula.

---

# 7. IMPORTANT – Insurance Historical Valuation Needs Clear Semantics

The plan says:

> Sum Assured and Surrender Value status on T

But `sum assured` is not a balance-sheet value.

### Required distinction

Insurance reconstruction should expose separately:

```text
coverageAmount
cashValue
surrenderValue
premiumPaidToDate
policyStatus
```

Do not add Sum Assured to net worth.

If historical surrender/cash value is unavailable:

```text
UNKNOWN
```

rather than estimating it.

---

# 8. IMPORTANT – Real Estate "Registered Circle Valuation" Needs Source Provenance

The plan allows:

> Recorded purchase cost or registered circle valuation <= T

These are different valuation concepts.

Do not combine them as though they are equivalent.

Use:

```text
valuationType
valuationSource
valuationDate
```

If no authoritative historical valuation exists, retain:

```text
ACQUISITION_COST
```

or:

```text
UNKNOWN
```

Do not imply market value when only acquisition cost exists.

---

# 9. CRITICAL – FFH Health Target ₹25L Must Not Be an Unversioned Hardcode

The Protection formula introduces:

> Baseline Family Health Target (₹25L)

This is a business assumption.

It should be:

```text
configuration / rule parameter
+
ruleVersion
+
effectiveDate
+
sourceReference
```

Do not hardcode ₹25,00,000 inside `FamilyFinancialHealthService`.

The same principle applies to:

- 6-month emergency runway
- ₹1,50,000 Section 80C limit
- ₹1,00,000 timeline transaction threshold
- 30-day renewal window
- 90-day freshness windows

Regulatory limits should have explicit rule/version provenance.

---

# 10. IMPORTANT – 80C Limit Must Be Versioned

The plan uses:

```text
₹1,50,000
```

This is currently treated as a fixed formula parameter.

Even if the value is currently correct, tax rules are changeable.

Use:

```text
ruleCode
ruleVersion
effectiveFrom
jurisdiction
sourceReference
```

and keep the tax calculation itself owned by `TaxCalculationEngine`.

---

# 11. IMPORTANT – Timeline Event Date for Proactive Triggers Is Questionable

The plan currently uses:

```text
Proactive Trigger
→ updated_at
```

as the timeline event date.

This means:

```text
Trigger created
→ user acknowledges
→ updated_at changes
```

and the timeline could move the event simply because the user acknowledged it.

That is undesirable.

### Required correction

Separate:

```text
triggerCreatedAt
triggerUpdatedAt
triggerResolvedAt
```

The timeline should use the **domain-relevant event timestamp**, not arbitrary lifecycle updates.

For example:

```text
AI recommendation generated
→ createdAt

User acknowledged
→ lifecycle metadata, not a new historical event
```

If the timeline wants to display "decision completed", create a separate normalized event type with its own timestamp.

---

# 12. IMPORTANT – Timeline Deduplication Identity Needs Versioning

The current identities such as:

```text
SHA256("TXN", id)
SHA256("INS", id, event_type)
```

are good for stable source identity.

However, a source record can generate multiple legitimate timeline events over its lifecycle.

For example:

```text Insurance Policy
→ Activated
→ Renewed
→ Maturity
```

Using only:

```text id + event_type
```

is appropriate.

But ensure the event date and lifecycle state are updated rather than producing duplicate projections.

Document the source-to-timeline mapping as:

```text sourceId + eventType = logical event identity
eventDate = mutable projection attribute
```

---

# 13. IMPORTANT – Timeline Milestone Detection Must Be Deterministic

The plan contains:

```text Goal milestone crossed ≥ 50%, 100%
80C limit maximized
```

Define exactly how these are detected.

For example:

```text Goal progress:
previous progress < 50%
current progress >= 50%
→ milestone event
```

Otherwise every sync could recreate the same milestone.

The same applies to:

```text 80C maximized
```

Define the transition condition.

---

# 14. IMPORTANT – Timeline Synchronization Should Be Idempotent

The plan says "idempotent sync runner", which is correct.

Add the explicit invariant:

```text Run sync N times
        ↓
Same authoritative source state
        ↓
Same timeline projection
```

No duplicate rows.

Also test:

```text source updated
→ projection updated

source deleted
→ projection deleted/invalidated
```

---

# 15. IMPORTANT – FFH Snapshot Materiality Threshold Must Be Versioned

The plan introduces:

```text |Δ Score| ≥ 2.5
```

This is another business threshold.

Treat it as:

```text configuration
+
ruleVersion
+
effectiveDate
```

Do not hardcode it inside the service.

---

# 16. IMPORTANT – FFH Score Comparison Must Use Comparable Snapshots

If life-stage weighting changes between snapshots:

```text EARLY_CAREER
→ FAMILY_EXPANSION
```

a score delta may reflect a **weighting-model change**, not an actual financial improvement.

The history contract should record:

```text calculationVersion
lifeStage
weightingVersion
```

and comparisons should identify when a delta is not directly comparable.

---

# 17. IMPORTANT – API Mutation Semantics

The plan includes:

```text POST /health/snapshot
POST /timeline/sync
```

These are operational endpoints.

Ensure they:

- remain server-family-scoped
- are idempotent
- cannot modify authoritative financial records
- cannot be called for another family
- expose appropriate authorization

The Time Machine endpoints should remain read/simulation only.

---

# 18. IMPORTANT – 8C.0 Boundary Is Correct; Preserve It

The plan correctly states that 8C.0 is:

```text Contracts
Zod schemas
Migrations
Repositories
Invariant tests
```

Keep it that way.

Do NOT put FFH calculations or timeline synchronization into 8C.0.

---

# 19. IMPORTANT – What-If Validation Needs Family Ownership

The plan validates scenario parameters with Zod.

Also validate referenced IDs:

```text assetId
goalId
policyId
memberId
```

against the **authorized family scope**.

A valid-looking ID from another family must be rejected.

---

# 20. IMPORTANT – Command Center "LOW_RISK" Mutation

The plan classifies:

> snooze trigger 1..30d

as low-risk.

That is reasonable.

But all such mutations must continue using Sprint 8B.3 idempotency and lifecycle semantics.

Do not allow the Command Center to introduce its own trigger-state mutation API.

---

# 21. PERFORMANCE TARGETS – GOOD, BUT Measure Against Real Dataset

The proposed p95 targets are reasonable:

```text FFH ≤ 500ms
Timeline ≤ 500ms
Time Machine ≤ 1s
What-If ≤ 1s
```

Keep them as engineering targets, not architectural guarantees.

Measure:

- cold
- warm
- realistic family dataset
- concurrent requests

and record actual results.

---

# 22. FINAL ACCEPTANCE CRITERIA

Before Sprint 8C.0 implementation begins, the Agent should incorporate these final clarifications:

- [ ] Historical price fallback semantics distinguish exact vs prior-date proxy.
- [ ] Time Machine has an overall completeness/status result.
- [ ] Valuation types are explicit.
- [ ] Status vocabulary remains globally consistent.
- [ ] Bank opening-balance semantics are defined.
- [ ] FD reconstruction reuses the existing engine without duplication.
- [ ] Insurance coverage is separated from cash-value/net-worth treatment.
- [ ] Property valuation source/type is explicit.
- [ ] FFH health target is configurable/versioned.
- [ ] Tax thresholds/rules are versioned.
- [ ] Timeline trigger timestamps use domain event time rather than arbitrary `updated_at`.
- [ ] Timeline logical identity and mutable event-date semantics are defined.
- [ ] Goal/tax milestone transitions are deterministic.
- [ ] Timeline sync is idempotent and handles updates/deletes.
- [ ] FFH materiality threshold is versioned.
- [ ] FFH score comparisons account for weighting-version changes.
- [ ] Operational endpoints are idempotent and family-scoped.
- [ ] What-If referenced IDs are family-authorized.
- [ ] Command Center continues using existing action/idempotency infrastructure.
- [ ] Performance targets remain measurable targets.

---

# Final Decision

## 🟢 PHASE 8C STRATEGIC PLAN – APPROVED

The Agent has now addressed the major architectural feedback.

The remaining items above are **final contract hardening**, not a reason to redesign Phase 8C.

### Recommended next step

**Do not ask the Agent to revise the entire Phase 8C plan again.**

Instead:

1. Incorporate the final clarifications above.
2. Freeze the Phase 8C architecture.
3. Create the **Sprint 8C.0 Implementation Plan**.
4. Stop.
5. We review the 8C.0 plan before any code is written.

This preserves the workflow we have used throughout FamilyWealthOS:

```text
Architecture
   ↓
Sprint Plan
   ↓
Our Review
   ↓
Implementation
   ↓
Output Review
   ↓
Next Sprint
```

**Phase 8C is now ready to move into Sprint 8C.0.**
