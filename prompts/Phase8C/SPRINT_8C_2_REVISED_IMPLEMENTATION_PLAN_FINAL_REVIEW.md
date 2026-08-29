# Revised Implementation Plan: Sprint 8C.2 – Multi-Domain Timeline Ledger & Narrative History

---

## 1. Executive Summary & Core Architectural Principle

**Sprint 8C.2** delivers the **Multi-Domain Timeline Ledger & Narrative History Engine**. It aggregates, normalizes, and indexes historical financial milestones across 7 domain sources into a unified, chronological, multi-generational timeline ledger.

### 🛡️ Central Architectural Invariant: Strict Provenance Hierarchy
$$\text{Authoritative Domain Data} \longrightarrow \text{Timeline Projection} \longrightarrow \text{Narrative Interpretation}$$
**Never**: $\text{Timeline} \longrightarrow \text{Authoritative Financial State}$.

- **Derived Projection Only**: The timeline is strictly a derived historical projection. It never acts as a primary source of truth.
- **Zero Source Mutation Guarantee**: Synchronizing the timeline writes *only* to `family_timeline_events`. It never mutates `transactions`, `insurance_policies`, `wills`, `financial_goals`, `proactive_triggers`, or other source tables.
- **Explicit Source Classification**:
  - **`AUTHORITATIVE_SOURCE`**: Transactions, insurance policies, financial goals, declared life events, wills & trusts.
  - **`DERIVED`**: Knowledge Graph edges (nominee / beneficiary relationships).
  - **`AI_DECISION` / Audit Evidence**: Acknowledged/resolved proactive triggers and explicit user audit decisions.
  - **`CALCULATED`**: Tax-derived milestones from `tax_profiles` and `tax_deductions`.

---

## 2. 7-Domain Ingestion, Event Identity & Provenance Matrix

### 🔑 Deterministic Event ID Formulation
$$\text{eventId} = \text{evt\_}\{\text{domain}\}\_\{\text{sourceType}\}\_\{\text{sourceId}\}\_\{\text{eventType}\}$$
*Example: `evt_PORTFOLIO_transactions_1052_ASSET_BUY`, `evt_GOAL_financial_goals_201_GOAL_ACHIEVED`, `evt_PROTECTION_insurance_policies_55_POLICY_ACTIVATED`.*

| Domain | Source Table | Source Classification | Event Types & Identity | Date Precedence | Valuation / Amount Meaning |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **`PORTFOLIO`** | `transactions`, `assets` | `AUTHORITATIVE_SOURCE` | `ASSET_BUY`, `ASSET_SELL`, `DIVIDEND_RECEIVED`, `INTEREST_RECEIVED` | `transaction.date` (Trade date) | Transaction cash amount (`BUY` / `SELL`) |
| **`PROTECTION`** | `insurance_policies` | `AUTHORITATIVE_SOURCE` | `POLICY_ACTIVATED`, `FLOATER_ADDED`, `PREMIUM_PAID` | `policy.start_date` (Activation date) | **`SUM_ASSURED`** (Coverage protection, NEVER net worth) |
| **`GOAL`** | `financial_goals` | `AUTHORITATIVE_SOURCE` | `GOAL_CREATED`, `GOAL_HALFWAY_FUNDED`, `GOAL_ACHIEVED` | `goal.created_at` / milestone timestamp | Target amount / allocated amount |
| **`LIFE_EVENT`** | `life_events` (Sprint 8B.2) | `AUTHORITATIVE_SOURCE` | `MARRIAGE_DECLARED`, `CHILD_BORN`, `RETIREMENT_COMMENCED`, `INHERITANCE_RECEIVED` | `event.event_date` (Effective event date) | Financial impact / liability |
| **`ESTATE`** | `wills`, `trusts` | `AUTHORITATIVE_SOURCE` | `WILL_REGISTERED`, `TRUST_FORMED`, `EXECUTOR_APPOINTED` | `will.execution_date` or `created_at` | Asset value / corpus covered |
| **`ESTATE` (KG)** | `graph_edges` | `DERIVED` | `NOMINEE_ASSIGNED`, `BENEFICIARY_LINKED` | `edge.created_at` | Target asset value (if available) |
| **`TAX`** | `tax_profiles`, `tax_deductions` | `CALCULATED` | `REGIME_SELECTED`, `STATUTORY_DEDUCTION_CLAIMED` | `tax_profiles.created_at` | Claimed deduction amount / tax savings |
| **`AI_DECISION`** | `proactive_triggers`, `ai_audit_trail` | `AI_AUDIT` | `TRIGGER_ACKNOWLEDGED`, `TRIGGER_RESOLVED`, `RECOMMENDATION_EXECUTED` | `trigger.acknowledged_at` | Potential exposure / savings addressed |

---

## 3. Versioned Timeline Rule Registry (`TIMELINE_RULE_REGISTRY`)

```typescript
export const TIMELINE_RULE_REGISTRY = {
  VERSION: '2026.1',
  JURISDICTION: 'IN',
  THRESHOLDS: {
    PORTFOLIO_CRITICAL_AMOUNT: {
      value: 1000000, // ₹10 Lakhs
      unit: 'INR',
      description: 'Transactions exceeding ₹10L are marked CRITICAL'
    },
    PORTFOLIO_HIGH_AMOUNT: {
      value: 100000, // ₹1 Lakh
      unit: 'INR',
      description: 'Transactions exceeding ₹1L are marked HIGH'
    },
    PROTECTION_CRITICAL_COVER: {
      value: 10000000, // ₹1 Crore
      unit: 'INR',
      description: 'Insurance policies with sum assured >= ₹1 Cr are marked CRITICAL'
    },
    GOAL_HIGH_TARGET: {
      value: 2500000, // ₹25 Lakhs
      unit: 'INR',
      description: 'Goals with target >= ₹25L are marked HIGH'
    }
  }
};
```

---

## 4. Deterministic Narrative History Template Engine

Narratives are **100% deterministic** parameterized templates formatted in Indian currency format (e.g. ₹10,00,000 / ₹1.5 Cr). No AI/LLM calculates or fabricates narrative facts:

```typescript
export class TimelineNarrativeEngine {
  public static renderNarrative(event: CreateTimelineEventInput): string {
    const meta = event.metadata_json ? JSON.parse(event.metadata_json) : {};
    const formattedAmount = event.amount !== null && event.amount !== undefined 
      ? formatIndianCurrency(event.amount) 
      : '';

    switch (event.event_type) {
      case 'ASSET_BUY':
        return `${meta.memberName || 'Family'} acquired ${meta.quantity || ''} units of ${meta.assetName || event.title} for ${formattedAmount}.`;
      case 'ASSET_SELL':
        return `${meta.memberName || 'Family'} sold ${meta.quantity || ''} units of ${meta.assetName || event.title} realizing ${formattedAmount}.`;
      case 'POLICY_ACTIVATED':
        return `${meta.insurerName || ''} ${meta.policyType || ''} policy activated with ${formattedAmount} coverage (Policy #${meta.policyNumber || ''}).`;
      case 'GOAL_CREATED':
        return `Financial goal milestone: "${event.title}" target of ${formattedAmount} established for target year ${meta.targetYear || ''}.`;
      case 'GOAL_ACHIEVED':
        return `Goal achieved: "${event.title}" reached 100% funding with ${formattedAmount} accumulated.`;
      case 'WILL_REGISTERED':
        return `${meta.memberName || 'Primary Testator'} registered Will (${meta.status || 'ACTIVE'}) with Sub-Registrar.`;
      case 'LIFE_EVENT_PROCESSED':
        return `Life milestone: ${event.title} effectively commenced on ${event.event_date}.`;
      case 'TRIGGER_ACKNOWLEDGED':
        return `Fiduciary action: Acknowledged recommendation "${event.title}" (${meta.urgency || 'HIGH'} urgency).`;
      default:
        return event.description || event.title;
    }
  }
}
```

---

## 5. Currency, FX & Provenance Handling

- **Currency Invariant**: All amounts record explicit `currency` (defaults to `'INR'`).
- **Foreign Assets (USD)**: Recorded with `currency: 'USD'`. Metadata contains `{ fxRate, inrAmount, fxDate, fxProvenance: 'CALCULATED' }`.
- **Amount Type Separation**:
  - `BUY` / `SELL` / `DIVIDEND` $\longrightarrow$ `amountType: 'TRANSACTION'`
  - `SUM_ASSURED` $\longrightarrow$ `amountType: 'SUM_ASSURED'` (*Coverage protection, NEVER net worth*)
  - `PREMIUM` $\longrightarrow$ `amountType: 'PREMIUM'`
  - `TARGET` / `ALLOCATION` $\longrightarrow$ `amountType: 'GOAL_TARGET'`
  - `DEDUCTION` $\longrightarrow$ `amountType: 'TAX_DEDUCTION'`

---

## 6. Proposed Changes by Component

### 🏛️ Component 1: Core Timeline Engine Service
#### [NEW] `backend/src/services/familyOffice/FamilyTimelineService.ts`

1. **7 Domain Extractors**:
   - `extractPortfolioEvents(familyId)`: Ingests `transactions` and `assets`, applies `PORTFOLIO_CRITICAL_AMOUNT` thresholds, generates deterministic IDs.
   - `extractProtectionEvents(familyId)`: Ingests `insurance_policies`, marks `amountType: 'SUM_ASSURED'`, tags covered members.
   - `extractGoalEvents(familyId)`: Ingests `financial_goals`, extracts creation and progress milestones.
   - `extractLifeEvents(familyId)`: Ingests `life_events` (Sprint 8B.2).
   - `extractEstateEvents(familyId)`: Ingests `wills`, `trusts` (`AUTHORITATIVE_SOURCE`) and `graph_edges` (`DERIVED`).
   - `extractTaxEvents(familyId)`: Ingests `tax_profiles` and `tax_deductions` (`CALCULATED`).
   - `extractAIDecisionEvents(familyId)`: Ingests acknowledged `proactive_triggers` (`AI_AUDIT`).
2. **Synchronization Orchestration**:
   - `syncFamilyTimeline(familyId)`:
     - Extracts all events across the 7 domains.
     - Generates deterministic narrative summaries via `TimelineNarrativeEngine`.
     - Detects deleted source records and removes obsolete projection rows.
     - Calls `familyTimelineRepository.batchUpsertEvents(events)` (atomic transaction inside repository).
3. **Query Engine**:
   - `getTimeline(familyId, filter)`:
     - Filter by `domain`, `familyMemberId`, `startDate`, `endDate`, `importanceTier`, `minAmount`, `search`.
     - Deterministic chronological ordering (`event_date DESC, id DESC`).
     - Pagination (`limit: 1..100`, `offset: >= 0`).

---

### 🌐 Component 2: REST Controller & Express Routes
#### [NEW] `backend/src/controllers/FamilyTimelineController.ts`
- `getTimeline(req, res)`: Parse filters and pagination, return timeline records.
- `syncTimeline(req, res)`: On-demand sync with `idempotencyMiddleware`.

#### [NEW] `backend/src/routes/familyTimelineRoutes.ts`
- `GET /api/v1/family-office/timeline`
- `POST /api/v1/family-office/timeline/sync` (idempotent)
- Mounted in `backend/src/routes/index.ts` at `/family-office/timeline`.

---

## 7. Comprehensive Invariant Test Plan (Sprint 8C.2)

#### [NEW] `backend/src/__tests__/sprint8c2/familyTimeline.test.ts`

1. **7-Domain Normalization & Provenance Tagging**:
   - Ingests controlled test fixtures across Portfolio, Protection, Goal, Life Event, Estate, KG Edge, Tax, and AI Decision.
   - Verifies explicit provenance tags (`AUTHORITATIVE_SOURCE`, `DERIVED`, `CALCULATED`, `AI_AUDIT`).
2. **Deterministic Event ID Formulation & Deduplication**:
   - Verifies `evt_${domain}_${sourceType}_${sourceId}_${eventType}` prevents collision and duplicate rows on repeated sync.
3. **Amount Type & Valuation Invariant**:
   - Verifies insurance events record `amountType = 'SUM_ASSURED'` and are tagged as coverage protection.
4. **Deterministic Narrative History Generation**:
   - Verifies rendered narratives match deterministic templates with proper Indian currency formatting.
5. **Multi-Dimensional Query Filtering**:
   - Domain filter (`domain = 'PORTFOLIO'`).
   - Family member filter (`familyMemberId = memberA.id`).
   - Date range filter (`startDate` & `endDate`).
   - Importance tier filter (`importanceTier = 'CRITICAL'`).
   - Min amount filter (`minAmount = 1000000`).
   - Text search (`search = 'HDFC'`).
6. **No-Mutation Invariant on Source Tables**:
   - Verifies `syncFamilyTimeline(familyId)` writes ONLY to `family_timeline_events` and executes 0 writes to source tables.
7. **Stale / Deleted Source Cleanup**:
   - Soft-deleting a source record removes the associated derived timeline row on next sync.
8. **Cross-Family Security Isolation**:
   - Family A cannot view or sync Family B's timeline.
9. **Deterministic Performance Benchmark**:
   - Fixture of 100 transactions, 10 policies, 5 goals, 5 estate records syncs and queries in $\le 100\text{ms}$.

---

## 8. Verification & Baseline Integration

- **Master Test Harness**: Wire `runSprint8c2Tests` into `runTests.ts`.
- **Baseline**: Current verified baseline **337 PASSED** $\to$ Master suite green with **337 + X PASSED (0 FAILURES)**.
- **TypeScript Strict Compilation**: `backend` and `frontend` `tsc --noEmit` = **0 errors**.
- **Documentation**: Synchronize `SESSION_CONTEXT.md`, `AI_CHANGELOG.md`, `docs/PHASE_8_ROADMAP.md`, and `docs/FAMILY_TIMELINE_LEDGER.md`.


---

# ChatGPT Final Review – Revised Sprint 8C.2 Plan

## Verdict

**🟡 REVISE ONCE MORE BEFORE IMPLEMENTATION**

The Agent has incorporated the major architectural feedback very well. The provenance hierarchy, source classification, deterministic narrative approach, versioned thresholds, source non-mutation, and Time Machine compatibility are all significant improvements.

However, several **event-identity and historical-projection semantics remain insufficiently precise**. These should be resolved before coding because they affect the correctness of the timeline ledger and Sprint 8C.3.

This is **not a request for another architectural redesign**. The architecture is sound; the remaining work is contract hardening.

---

# 1. CRITICAL – Event ID Is Still Not Sufficient for Repeating Events

The proposed identity is:

```text
evt_${domain}_${sourceType}_${sourceId}_${eventType}
```

This works only when one source record can produce at most one event of a given type.

That is not true for several proposed events.

Examples:

```text
insurance_policy
    → PREMIUM_PAID
    → PREMIUM_PAID
    → PREMIUM_PAID

goal
    → TARGET_REVISED
    → TARGET_REVISED
```

If `sourceId = policyId`, all premium payments would collide.

### Required correction

Define **event-instance identity per event type**.

For example:

```text
sourceType + sourceId + eventType + eventInstanceId
```

where:

- transaction events → transaction ID
- premium payment → premium/payment transaction ID
- goal milestone → milestone transition/version
- tax filing → filing/assessment period
- AI decision → trigger ID + lifecycle event
- estate relationship → edge/version or effective-date identity

The final event ID must remain deterministic.

Do not simply append timestamps, because timestamps can change and undermine idempotency.

---

# 2. CRITICAL – AI Decision Event Identity Must Be Lifecycle-Specific

The plan groups:

```text
TRIGGER_ACKNOWLEDGED
TRIGGER_RESOLVED
RECOMMENDATION_EXECUTED
```

under:

```text proactive_triggers / ai_audit_trail
```

These are separate lifecycle events.

A single trigger may legitimately produce:

```text
ACKNOWLEDGED
→ RESOLVED
```

Therefore the identity should explicitly contain the lifecycle event type and stable source event identity.

Recommended conceptual identity:

```text
triggerId + lifecycleEventType
```

For audit evidence, use the audit event ID where one exists.

Do not create timeline events from every raw `ai_audit_trail` row.

Only explicitly approved fiduciary/user decision events should enter the timeline.

---

# 3. CRITICAL – Premium Paid Must Have an Actual Payment Source

The Protection matrix currently defines:

```text PREMIUM_PAID
```

but its source is:

```text insurance_policies
```

A policy can have many premium payments.

The implementation must not generate multiple payment events from a single policy record without a distinct payment source.

### Required decision

Either:

1. Use the actual premium/payment transaction source if the existing model has one, or
2. Do not create `PREMIUM_PAID` timeline events in 8C.2 until a unique payment source exists.

Do not fabricate payment events from policy metadata.

---

# 4. CRITICAL – "7 Domain Sources" vs Actual Source Classification Needs Consistency

The plan says there are 7 domains, but the matrix effectively contains:

```text
PORTFOLIO
PROTECTION
GOAL
LIFE_EVENT
ESTATE
ESTATE/KG
TAX
AI_DECISION
```

That is **7 logical domains**, with Estate containing two source classes.

Document this explicitly so "7 domains" is not confused with "7 physical source tables".

---

# 5. CRITICAL – `asOfDate` / `stateHash` on Timeline Events Needs Precise Semantics

The plan says every event stores:

```text
asOfDate
stateHash
provenance
calculationVersion
ruleVersion
```

This is potentially problematic.

A timeline event is a historical projection of a source event. Its `eventDate` is not the same thing as a Digital Twin state snapshot's `asOfDate`.

Likewise, a global `stateHash` may imply that the event represents the entire family's state at that moment, which may be false.

### Required correction

Define these separately:

```text
eventDate
    = date the domain event actually occurred

sourceAsOfDate
    = latest source-state date used to derive the event

sourceStateHash / sourceVersion
    = optional provenance of the source representation

calculationVersion
    = version of the projection logic

ruleVersion
    = version of timeline classification rules
```

Do not attach a whole-family Digital Twin `stateHash` unless it genuinely represents the state used to derive that event.

This distinction is important for Sprint 8C.3.

---

# 6. IMPORTANT – Date Precedence Needs Missing-Date Semantics

The plan defines precedence such as:

```text transaction.date
policy.start_date
event.event_date
```

But it does not define what happens when the preferred date is missing.

Required:

```text Preferred date available
    → use it

Preferred date unavailable + approved fallback exists
    → use fallback
    → record date provenance

No trustworthy date
    → event excluded or marked UNKNOWN_DATE
```

Never silently substitute `created_at` for a domain event date without documenting the fallback.

---

# 7. IMPORTANT – Source Deletion / Stale Cleanup Is Underspecified

The plan says:

> detects deleted source records and removes obsolete projection rows

But extraction alone cannot know which source rows were deleted unless the synchronizer maintains a source inventory or compares the current source set against the existing projection.

Also, a source record can remain present while one of its event types becomes obsolete.

### Required semantics

For each source domain:

```text Current authoritative event IDs
        ↓
Existing projected event IDs for family + source
        ↓
Set difference
        ↓
Delete obsolete projections
```

This must handle:

- source deletion
- source deactivation
- event-type removal
- changed event identity

Do not rely only on `deleteBySource()` if a source can remain while individual event instances disappear.

---

# 8. CRITICAL – `deleteBySource()` Can Be Too Broad

The repository method from 8C.0 is:

```text
deleteBySource(familyId, sourceType, sourceId)
```

This is safe for complete source deletion.

But if a policy remains active and only one projected event becomes obsolete, deleting all events for the policy may incorrectly remove valid history.

Add a more granular operation where needed:

```text
deleteByEventIds(familyId, eventIds)
```

or equivalent.

Use:

```text deleteBySource()
```

only when the entire source projection is obsolete.

---

# 9. IMPORTANT – Narrative Metadata Must Not Leak Sensitive Data

The deterministic narrative examples include:

```text
Policy #${meta.policyNumber}
```

This may expose sensitive policy/account identifiers in the timeline UI.

Likewise, arbitrary `metadata_json` should not be trusted as narrative input.

### Required guardrail

Narrative templates may use only an allow-listed sanitized metadata structure:

```text memberDisplayName
assetDisplayName
insurerDisplayName
policyType
quantity
targetYear
urgency
```

Never include:

```text PAN
bank account number
full policy number
folio number
customer identifiers
raw audit payload
```

unless explicitly masked and approved.

---

# 10. IMPORTANT – Narrative Engine Must Not Parse Arbitrary JSON Without Validation

The current example performs:

```text
JSON.parse(event.metadata_json)
```

without validation.

Use a schema-validated metadata object before rendering.

Malformed or unexpected metadata should result in:

```text safe fallback narrative
```

rather than a sync failure or unsafe content.

---

# 11. IMPORTANT – Narrative Event Date Must Use the Normalized Event Date

The example:

```text
event.event_date
```

should use the canonical normalized event date defined by the timeline contract.

Do not allow each narrative template to independently choose a source date.

The flow should be:

```text Source
→ normalized event
→ deterministic narrative
```

not:

```text Source
→ narrative chooses its own date
```

---

# 12. IMPORTANT – Currency Must Not Silently Default to INR

The plan says:

> currency defaults to INR.

This is potentially dangerous.

If the source currency is unknown, defaulting to INR can produce a false financial interpretation.

### Required rule

```text Source currency known
    → preserve source currency

Source currency unavailable
    → UNKNOWN / explicit currency-unavailable state

Only default to INR when the authoritative source itself is known to be INR-denominated.
```

Do not infer currency merely because the application is India-focused.

---

# 13. IMPORTANT – FX Conversion Needs Authoritative Provenance

For foreign assets the plan proposes:

```text fxRate
inrAmount
fxDate
fxProvenance
```

Define the source of the FX rate.

At minimum:

```text fxRateSource
fxRateDate
fxRate
baseCurrency
quoteCurrency
```

If no approved FX source exists:

```text retain original currency
do not fabricate INR conversion
```

The INR amount should not become authoritative merely because it is convenient for display.

---

# 14. CRITICAL – Tax Events Must Not Be Recreated From Raw Deduction Rows

The plan correctly classifies tax as `CALCULATED`, but it should be explicit that:

```text FamilyTimelineService
        ↓
TaxCalculationEngine
        ↓
Approved tax milestone/result
        ↓
Timeline event
```

The service must not infer:

```text "REGIME_SELECTED"
"STATUTORY_DEDUCTION_CLAIMED"
```

from arbitrary raw rows if the authoritative tax engine already owns these semantics.

Otherwise 8C.2 becomes a second tax interpretation engine.

---

# 15. IMPORTANT – Estate `graph_edges` Remain Derived Evidence

The plan correctly marks `graph_edges` as `DERIVED`.

Preserve that distinction in every event:

```text provenance = DERIVED
sourceType = graph_edges
```

A nominee/beneficiary relationship derived from the graph must never be presented as equivalent to a legally authoritative estate document.

Narrative wording should make this distinction clear where relevant.

---

# 16. CRITICAL – Importance Classification Needs Explicit Tie-Break Rules

The thresholds are versioned, which is good.

But events can satisfy multiple criteria.

Example:

```text ₹15L transaction
→ CRITICAL by amount
→ potentially HIGH by another rule
```

Define precedence:

```text CRITICAL > HIGH > MEDIUM > INFO
```

and whether domain-specific rules can override amount-based rules.

For example:

```text Insurance policy = HIGH because Term/Health
```

while:

```text Sum Assured >= ₹1Cr = CRITICAL
```

The final tier must be deterministic.

---

# 17. IMPORTANT – Amount Semantics Need Explicit Currency-Aware Filtering

The query supports:

```text minAmount
```

But what does:

```text minAmount = ₹10L
```

mean for USD events?

Do not compare:

```text 10,00,000 INR
```

directly against:

```text 10,00,000 USD
```

without an explicit normalization rule.

Recommended:

```text minAmountCurrency = INR
```

and only include converted events when an authoritative FX conversion exists.

Otherwise filter within source currency only.

---

# 18. IMPORTANT – Full-Text Search Is Still Underspecified

The plan says:

```text search = 'HDFC'
```

but does not define the implementation.

Before coding, specify whether search is:

```text SQLite LIKE
```

or:

```text SQLite FTS5
```

or another indexed mechanism.

Also define:

- searchable fields
- case sensitivity
- tokenization
- metadata inclusion
- narrative inclusion

For the initial sprint, a deterministic indexed `LIKE` search may be sufficient if dataset size is modest.

---

# 19. IMPORTANT – Pagination Consistency

The plan uses:

```text event_date DESC, id DESC
```

which is deterministic.

However, offset pagination can shift when a new event is inserted between requests.

This is acceptable for the initial sprint, but document:

```text 8C.2 = offset pagination
Future = cursor pagination if timeline volume requires it
```

Do not claim offset pagination provides snapshot-consistent traversal.

---

# 20. IMPORTANT – Sync Idempotency Semantics

`POST /timeline/sync` uses the existing idempotency middleware.

Explicitly define:

```text same X-Idempotency-Key + same request
    → same result

same X-Idempotency-Key + different request
    → reject
```

Do not create a second timeline-specific idempotency implementation.

---

# 21. CRITICAL – No-Mutation Test Should Verify More Than Writes

The plan says source tables receive zero writes.

Also verify:

```text no deletes
no updates
no inserts
```

across:

```text transactions
insurance_policies
financial_goals
life_events
wills
trusts
tax_profiles
tax_deductions
proactive_triggers
ai_audit_trail
graph_edges
```

The timeline repository may mutate only:

```text family_timeline_events
```

---

# 22. IMPORTANT – Performance Benchmark Needs Query Dataset Definition

The revised benchmark is much better:

```text 100 transactions
10 policies
5 goals
5 estate records
```

But it omits:

```text life events
tax records
AI decisions
graph edges
```

Include representative fixtures for all seven logical domains.

Report separately:

```text extraction
normalization
DB upsert
query
total sync
```

Do not use the 100ms target as a reason to skip provenance or validation.

---

# 23. IMPORTANT – Event Ordering When Dates Are Equal

The plan uses:

```text event_date DESC, id DESC
```

Define whether the database `id` is deterministic across rebuilds.

If it is an auto-increment row ID, the ordering of equal-date events can change after deletion/reinsertion.

Prefer a stable tie-breaker:

```text event_date DESC
event_priority DESC
event_id ASC
```

or equivalent deterministic ordering.

This is particularly useful for narrative history and Time Machine reproducibility.

---

# 24. IMPORTANT – Event Titles and Narratives Must Be Derived, Not User-Editable Truth

Timeline `title` / `description` should be projection fields.

If a user edits them later, the next sync should deterministically restore them from the source.

Do not make timeline narrative fields authoritative.

---

# 25. IMPORTANT – Source Update Semantics

The plan covers deletion, but also define:

```text source amount changes
source event date changes
source member association changes
source status changes
```

The corresponding timeline projection should be updated deterministically rather than generating duplicate events.

---

# 26. IMPORTANT – AI Narrative Boundary

The plan correctly removes LLM generation from 8C.2.

Keep the architecture explicit:

```text 8C.2:
deterministic factual narrative

8C.3+:
AI may interpret timeline

AI interpretation:
DERIVED / NON-AUTHORITATIVE
```

Never allow future AI narrative output to overwrite the deterministic event facts.

---

# 27. REQUIRED ACCEPTANCE CRITERIA

Before implementation, the revised plan should explicitly confirm:

- [ ] Repeating event types have deterministic event-instance identity.
- [ ] AI lifecycle events have stable lifecycle-specific identities.
- [ ] `PREMIUM_PAID` has a real payment source or is excluded.
- [ ] Seven logical domains vs physical source tables is documented.
- [ ] `eventDate`, `sourceAsOfDate`, and source state/version semantics are separated.
- [ ] Missing-date fallback rules are deterministic.
- [ ] Deleted and obsolete event instances are reconciled.
- [ ] `deleteBySource` is not overused.
- [ ] Sensitive metadata is allow-listed/masked.
- [ ] Narrative metadata is schema-validated.
- [ ] Narrative uses canonical event dates.
- [ ] Currency is not silently assumed to be INR.
- [ ] FX provenance is explicit.
- [ ] Tax milestones come from `TaxCalculationEngine`.
- [ ] KG events remain explicitly `DERIVED`.
- [ ] Importance tier precedence is deterministic.
- [ ] Amount filtering is currency-safe.
- [ ] Search implementation is explicitly defined.
- [ ] Idempotency semantics are explicit.
- [ ] No-mutation tests cover all source tables.
- [ ] Performance fixtures cover all logical domains.
- [ ] Equal-date event ordering is stable.
- [ ] Source updates reconcile projections.
- [ ] Timeline remains derived and non-authoritative.

---

# FINAL DECISION

## 🟡 REVISE PLAN BEFORE IMPLEMENTATION

The Agent has done a strong job incorporating the previous review. The **core architecture is approved**.

The remaining issues are mainly about making the timeline a truly reliable historical ledger rather than merely a convenient event list.

### Highest-priority corrections

1. **Event-instance identity for repeating events**
2. **Premium payment source**
3. **Timeline event vs source-state provenance**
4. **Deletion/update reconciliation**
5. **Sensitive metadata / narrative sanitization**
6. **Currency and FX semantics**
7. **Tax milestone ownership**
8. **Stable event ordering**

Once these are explicitly incorporated, I would approve Sprint 8C.2 for implementation.

---

# Required Agent Response

After incorporating these final corrections:

1. Return the revised `SPRINT_8C_2_IMPLEMENTATION_PLAN.md`.
2. Summarize the changes made.
3. Explicitly provide the final event-identity strategy for each repeating event type.
4. Explicitly state the premium-payment source.
5. Explicitly state the `eventDate` vs `sourceAsOfDate` vs `stateHash/sourceVersion` semantics.
6. Explicitly state the stale/update reconciliation strategy.
7. Explicitly state the currency/FX policy.
8. Confirm that **no production code has been modified**.

**STOP after revising the plan. Do not implement Sprint 8C.2 yet.**
