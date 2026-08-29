# Revised Final Implementation Plan: Sprint 8C.2 – Multi-Domain Timeline Ledger & Narrative History

---

## 1. Executive Summary & Core Architectural Principle

**Sprint 8C.2** delivers the **Multi-Domain Timeline Ledger & Narrative History Engine**. It aggregates, normalizes, and indexes historical financial milestones across 7 logical domains into a unified, chronological, multi-generational timeline ledger.

### 🛡️ Central Architectural Invariant: Strict Provenance Hierarchy
$$\text{Authoritative Domain Data} \longrightarrow \text{Timeline Projection} \longrightarrow \text{Narrative Interpretation}$$
**Never**: $\text{Timeline} \longrightarrow \text{Authoritative Financial State}$.

- **Derived Projection Only**: The timeline is strictly a derived historical projection. It never acts as a primary source of financial truth.
- **Zero Source Mutation Guarantee**: Synchronizing the timeline writes *only* to `family_timeline_events`. It executes zero inserts, updates, or deletes across `transactions`, `insurance_policies`, `wills`, `financial_goals`, `life_events`, `proactive_triggers`, `ai_audit_trail`, `tax_profiles`, or `graph_edges`.
- **7 Logical Domains vs Physical Sources**:
  1. `PORTFOLIO`: `transactions`, `assets` (`AUTHORITATIVE_SOURCE`)
  2. `PROTECTION`: `insurance_policies` (`AUTHORITATIVE_SOURCE`)
  3. `GOAL`: `financial_goals` (`AUTHORITATIVE_SOURCE`)
  4. `LIFE_EVENT`: `life_events` (`AUTHORITATIVE_SOURCE`)
  5. `ESTATE`: `wills`, `trusts` (`AUTHORITATIVE_SOURCE`) & `graph_edges` (`DERIVED`)
  6. `TAX`: `tax_profiles`, `tax_deductions` (`CALCULATED` via `TaxCalculationEngine`)
  7. `AI_DECISION`: `proactive_triggers` (acknowledged/resolved triggers) & `ai_audit_trail` (`AI_AUDIT`)

---

## 2. Event-Instance Identity & Extraction Specifications

### 🔑 Canonical Deterministic Event ID Formulation
$$\text{eventId} = \text{evt\_}\{\text{domain}\}\_\{\text{sourceType}\}\_\{\text{sourceId}\}\_\{\text{eventType}\}\_[\{\text{eventInstanceId}\}]$$

| Domain | Source Table | Classification | Event Types & Identity Strategy | Date Precedence & Fallbacks | Amount Meaning & Type |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **`PORTFOLIO`** | `transactions` | `AUTHORITATIVE_SOURCE` | `evt_PORTFOLIO_transactions_${tx.id}_${tx.type}` | `tx.date` $\to$ Fallback `tx.created_at` | Cash value (`amountType: 'TRANSACTION'`) |
| **`PROTECTION`** | `insurance_policies` | `AUTHORITATIVE_SOURCE` | `evt_PROTECTION_insurance_policies_${p.id}_POLICY_ACTIVATED`<br>`evt_PROTECTION_insurance_policies_${p.id}_PREMIUM_DUE_${p.next_premium_due_date}` | `p.start_date` $\to$ Fallback `p.created_at` | **`SUM_ASSURED`** (Coverage protection, NEVER net worth)<br>`PREMIUM` for premium due |
| **`GOAL`** | `financial_goals` | `AUTHORITATIVE_SOURCE` | `evt_GOAL_financial_goals_${g.id}_GOAL_CREATED`<br>`evt_GOAL_financial_goals_${g.id}_GOAL_HALFWAY_FUNDED`<br>`evt_GOAL_financial_goals_${g.id}_GOAL_ACHIEVED`<br>`evt_GOAL_financial_goals_${g.id}_TARGET_REVISED_${g.updated_at}` | `g.created_at` / transition timestamp | Target amount / allocated amount (`amountType: 'GOAL_TARGET'`) |
| **`LIFE_EVENT`** | `life_events` | `AUTHORITATIVE_SOURCE` | `evt_LIFE_EVENT_life_events_${e.id}_DECLARED`<br>`evt_LIFE_EVENT_life_events_${e.id}_PROCESSED` | `e.event_date` (effective) $\to$ Fallback `e.declared_at` | Net financial impact (`amountType: 'FINANCIAL_IMPACT'`) |
| **`ESTATE`** | `wills`, `trusts` | `AUTHORITATIVE_SOURCE` | `evt_ESTATE_wills_${w.id}_WILL_REGISTERED`<br>`evt_ESTATE_trusts_${t.id}_TRUST_FORMED` | `w.execution_date` $\to$ Fallback `w.created_at` | Asset value covered (`amountType: 'ESTATE_CORPUS'`) |
| **`ESTATE` (KG)** | `graph_edges` | `DERIVED` | `evt_ESTATE_graph_edges_${edge.id}_NOMINEE_ASSIGNED` | `edge.created_at` | Target asset value if available |
| **`TAX`** | `tax_profiles`, `tax_deductions` | `CALCULATED` | `evt_TAX_tax_profiles_${tp.id}_REGIME_SELECTED_${tp.financial_year}`<br>`evt_TAX_tax_deductions_${td.id}_DEDUCTION_CLAIMED_${td.section}` | `tp.created_at` / `td.created_at` | Deduction claimed / tax savings (`amountType: 'TAX_DEDUCTION'`) |
| **`AI_DECISION`** | `proactive_triggers`, `ai_audit_trail` | `AI_AUDIT` | `evt_AI_DECISION_proactive_triggers_${trg.trigger_id}_ACKNOWLEDGED`<br>`evt_AI_DECISION_proactive_triggers_${trg.trigger_id}_RESOLVED`<br>`evt_AI_DECISION_ai_audit_trail_${aud.action_id}_EXECUTED` | `trg.acknowledged_at` $\to$ `trg.resolved_at` $\to$ `aud.created_at` | Exposure / savings addressed (`amountType: 'ESTIMATED_EXPOSURE'`) |

> [!IMPORTANT]
> **Premium Paid Decision**: In accordance with review point 3, `PREMIUM_PAID` is **excluded** from Sprint 8C.2 because `insurance_policies` does not record granular payment transaction receipts. Only `POLICY_ACTIVATED` and `PREMIUM_DUE` (indexed by `next_premium_due_date`) are projected. No payment events are fabricated.

---

## 3. Provenance, Versioning & Historical Date Semantics

Every projected event stores granular, decoupled metadata fields:

```typescript
export interface TimelineEventMetadata {
  eventDate: string;             // Date milestone actually occurred (e.g. 2024-03-15)
  dateProvenance: 'AUTHORITATIVE_EVENT_DATE' | 'FALLBACK_CREATION_DATE' | 'UNKNOWN_DATE';
  sourceAsOfDate: string;         // Timestamp when source record was read/projected
  sourceStateHash?: string;       // SHA-256 hash or version of the specific source entity
  provenance: 'AUTHORITATIVE_SOURCE' | 'DERIVED' | 'CALCULATED' | 'AI_AUDIT';
  calculationVersion: string;     // Projection logic version (e.g. '2026.1')
  ruleVersion: string;            // Rule registry version (e.g. '2026.1')
  
  // Sanitized Allow-Listed Template Fields
  memberDisplayName?: string;
  assetDisplayName?: string;
  insurerDisplayName?: string;
  policyType?: string;
  quantity?: number;
  targetYear?: number;
  urgency?: string;
  sectionCode?: string;
  maskedIdentifier?: string;     // Last 4 digits only (e.g. "••••1234")
}
```

---

## 4. Currency, FX Conversion & Filtering Policy

1. **Preserve Source Currency**: If source currency is `INR`, `USD`, `EUR`, it is explicitly recorded. If unknown, recorded as `'UNKNOWN'`. Never silently defaulted to INR unless source is explicitly known INR.
2. **FX Conversion Policy**:
   - Foreign transactions (`USD`) retain `currency: 'USD'`.
   - Converted `inrAmount` is calculated **only** if authoritative FX rate exists:
     `{ fxRateSource: 'RBI_REFERENCE', fxRateDate: '2026-08-01', fxRate: 87.50, fxProvenance: 'CALCULATED' }`.
   - If no FX rate exists, `amount` remains in original currency and `inrAmount` is not fabricated.
3. **Currency-Aware Filtering**:
   - `minAmount` evaluates against `amount` in source currency, or against `inrAmount` if FX conversion exists.

---

## 5. Versioned Timeline Rule Registry (`TIMELINE_RULE_REGISTRY`)

```typescript
export const TIMELINE_RULE_REGISTRY = {
  VERSION: '2026.1',
  JURISDICTION: 'IN',
  THRESHOLDS: {
    PORTFOLIO_CRITICAL_AMOUNT: { value: 1000000, unit: 'INR', description: 'Transactions >= ₹10L are CRITICAL' },
    PORTFOLIO_HIGH_AMOUNT: { value: 100000, unit: 'INR', description: 'Transactions >= ₹1L are HIGH' },
    PROTECTION_CRITICAL_COVER: { value: 10000000, unit: 'INR', description: 'Insurance cover >= ₹1 Cr is CRITICAL' },
    GOAL_HIGH_TARGET: { value: 2500000, unit: 'INR', description: 'Goals with target >= ₹25L are HIGH' }
  },
  // Importance Tier Precedence Hierarchy: CRITICAL > HIGH > MEDIUM > INFO
  IMPORTANCE_PRECEDENCE: ['CRITICAL', 'HIGH', 'MEDIUM', 'INFO'] as const
};
```

---

## 6. Deterministic Narrative Template Engine & Sanitization

All narrative summaries are **100% deterministic** parameter-interpolated strings using Indian numbering conventions (₹10,00,000 / ₹1.5 Cr).

```typescript
export class TimelineNarrativeEngine {
  public static renderNarrative(event: CreateTimelineEventInput): string {
    const meta = event.metadata_json ? JSON.parse(event.metadata_json) : {};
    const formattedAmount = event.amount !== null && event.amount !== undefined 
      ? formatIndianCurrency(event.amount) 
      : '';

    switch (event.event_type) {
      case 'ASSET_BUY':
        return `${meta.memberDisplayName || 'Family'} acquired ${meta.quantity || ''} units of ${meta.assetDisplayName || event.title} for ${formattedAmount}.`;
      case 'ASSET_SELL':
        return `${meta.memberDisplayName || 'Family'} sold ${meta.quantity || ''} units of ${meta.assetDisplayName || event.title} realizing ${formattedAmount}.`;
      case 'POLICY_ACTIVATED':
        return `${meta.insurerDisplayName || ''} ${meta.policyType || ''} policy activated with ${formattedAmount} coverage (Policy ${meta.maskedIdentifier || '••••'}).`;
      case 'PREMIUM_DUE':
        return `Premium due for ${meta.insurerDisplayName || ''} policy: ${formattedAmount} on ${event.event_date}.`;
      case 'GOAL_CREATED':
        return `Financial goal established: "${event.title}" target of ${formattedAmount} for target year ${meta.targetYear || ''}.`;
      case 'GOAL_ACHIEVED':
        return `Goal milestone: "${event.title}" achieved 100% target funding.`;
      case 'WILL_REGISTERED':
        return `${meta.memberDisplayName || 'Primary Testator'} registered Will with Sub-Registrar.`;
      case 'LIFE_EVENT_PROCESSED':
        return `Life milestone: ${event.title} effectively commenced on ${event.event_date}.`;
      case 'TRIGGER_ACKNOWLEDGED':
        return `Fiduciary action: Acknowledged recommendation "${event.title}".`;
      case 'REGIME_SELECTED':
        return `Tax profile updated: Preferred tax regime selected for FY ${meta.financialYear || ''}.`;
      default:
        return event.description || event.title;
    }
  }
}
```

> [!CAUTION]
> **Data Privacy**: PAN, bank account numbers, full folio numbers, and raw audit payloads are **strictly forbidden** from narrative strings. Policy numbers are masked to the last 4 digits (`••••1234`).

---

## 7. Stale Event & Deletion Reconciliation Strategy

During `syncFamilyTimeline(familyId)`:
1. Extract current active event IDs across all 7 domains: $\text{CurrentIDs}$.
2. Query existing projected event IDs in database: $\text{ExistingIDs} = \text{SELECT event\_id FROM family\_timeline\_events WHERE family\_id = ?}$.
3. Calculate obsolete IDs: $\text{ObsoleteIDs} = \text{ExistingIDs} \setminus \text{CurrentIDs}$.
4. Call `SQLiteFamilyTimelineRepository.deleteByEventIds(familyId, ObsoleteIDs)` inside the transaction.
5. Upsert active events with `ON CONFLICT(family_id, event_id) DO UPDATE SET ...` to reconcile modified amounts, dates, or metadata.

---

## 8. Query, Search & Deterministic Pagination

1. **Ordering Invariant**:
   `ORDER BY event_date DESC, CASE importance_tier WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END ASC, event_id ASC`
   *(Guarantees 100% deterministic tie-breaking across rebuilds).*
2. **Search Implementation**:
   Indexed pattern matching: `(title LIKE ? OR description LIKE ?)` bounded by limit/offset.
3. **Pagination**:
   Offset pagination for Sprint 8C.2 (`limit: 1..100`, `offset: >= 0`).

---

## 9. Comprehensive Invariant Test Plan (Sprint 8C.2)

#### [NEW] `backend/src/__tests__/sprint8c2/familyTimeline.test.ts`

1. **7-Domain Normalization & Provenance Tagging**:
   - Ingests controlled fixtures for Portfolio, Protection, Goal, Life Event, Estate, KG Edge, Tax, and AI Decision.
   - Verifies explicit provenance tags (`AUTHORITATIVE_SOURCE`, `DERIVED`, `CALCULATED`, `AI_AUDIT`).
2. **Repeating Event Identity Non-Collision**:
   - Tests multiple goal revisions and multiple policy milestones on the same source record without ID collision.
3. **Valuation Invariant & Protection Coverage**:
   - Asserts `SUM_ASSURED` is tagged as coverage, never net-worth value.
4. **Deterministic Narrative Generation & Masking**:
   - Asserts narratives format Indian currency and mask policy identifiers (`••••1234`).
5. **Multi-Dimensional Query Filtering**:
   - Domain filter, member filter, date range, importance tier, min amount, and search.
6. **No-Mutation Invariant across All 11 Source Tables**:
   - Asserts 0 inserts, 0 updates, 0 deletes on source tables during sync.
7. **Stale / Obsolete Event Deletion Reconciliation**:
   - Deleting a goal or updating a milestone purges obsolete projection rows on next sync.
8. **Currency & FX Semantics**:
   - Tests USD transaction with and without FX rate; asserts no fake INR fabrication.
9. **Cross-Family Security Isolation**:
   - Family A cannot access or sync Family B's timeline events.
10. **Deterministic Full-Domain Performance Benchmark**:
    - Fixture with 100 transactions, 10 policies, 5 goals, 3 life events, 5 estate records, 4 tax records, 5 AI decisions, 10 KG edges $\to$ sync + query $\le 100\text{ms}$.

---

# ChatGPT Final Review – Sprint 8C.2 Revised Final Plan

## Verdict

**🟡 REVISE ONCE MORE BEFORE IMPLEMENTATION**

The Agent has successfully incorporated the majority of the previous hardening requirements. The plan is now substantially stronger and the core architecture is correct.

However, there are still a few **implementation-level contradictions and historical-integrity gaps** that should be resolved before production code is modified.

This should be the **final review pass**; no architectural redesign is required.

---

# 1. CRITICAL – Event Identity Still Uses Mutable Fields

The plan uses identities such as:

```text
GOAL_HALFWAY_FUNDED
TARGET_REVISED_${g.updated_at}
PREMIUM_DUE_${p.next_premium_due_date}
```

`updated_at` and `next_premium_due_date` are mutable.

That means the same logical source state can generate a different event ID after an update, potentially leaving obsolete events that must later be deleted.

### Required rule

Event identity must be based on a **stable source event identity**, not a mutable timestamp.

For events without a natural event ID, use a deterministic canonical instance key such as:

```text
sourceId + eventType + milestoneVersion
```

or another explicitly defined immutable event-instance identifier.

If a source model does not contain sufficient history to reconstruct revisions, **do not pretend that every revision is a historical event**. Project only the currently authoritative milestone.

---

# 2. CRITICAL – Premium Due Is Not a Historical Event Unless It Actually Occurred

The plan now correctly excludes fabricated `PREMIUM_PAID` events, but it introduces:

```text
PREMIUM_DUE_${p.next_premium_due_date}
```

A future premium due date is an obligation/scheduled milestone, not necessarily a historical event.

### Required distinction

Either:

```text eventType = PREMIUM_DUE
eventStatus = SCHEDULED
```

or explicitly classify it as a future projection rather than historical narrative.

It must not appear in a "historical timeline" as though the premium payment occurred.

Also define what happens when `next_premium_due_date` changes:

```text old scheduled event → obsolete
new scheduled event → current
```

---

# 3. CRITICAL – `sourceAsOfDate` Is Still Ambiguous

The plan defines:

```text sourceAsOfDate = Timestamp when source record was read/projected
```

This is effectively a **projection/read timestamp**, not the historical state date.

For Time Machine compatibility, distinguish:

```text eventDate
    = when the event actually occurred

sourceObservedAt
    = when FamilyWealthOS read the source

sourceEffectiveDate
    = date represented by the source state, if available

sourceStateHash
    = deterministic fingerprint of source state used

calculationVersion
    = projection logic version

ruleVersion
    = timeline classification rule version
```

### Required correction

Rename `sourceAsOfDate` to something like:

```text sourceObservedAt
```

unless it genuinely represents a historical source-state date.

This will prevent 8C.3 from confusing observation time with historical financial state.

---

# 4. CRITICAL – `sourceStateHash` Must Be Deterministic and Source-Scoped

The plan says:

```text SHA-256 hash or version of the specific source entity
```

"Hash or version" is too ambiguous.

Define one deterministic mechanism.

Recommended:

```text sourceStateHash =
SHA256(canonicalJSON(relevant source fields))
```

The canonical representation must exclude:

```text updatedAt
read timestamps
random IDs generated by projection
```

unless those fields are genuinely part of the source's economic state.

This hash should represent the **specific source entity/event**, not the entire family.

---

# 5. CRITICAL – Historical Revision Semantics Are Still Limited by Current Source Tables

The plan says:

> updated amounts, dates, or metadata are reconciled

That is correct for the current projection.

But this does **not preserve historical revisions**.

Example:

```text Goal target = ₹50L
→ later changed to ₹75L
```

If `financial_goals` only stores the current value, 8C.2 cannot reconstruct that ₹50L ever existed.

### Required documentation

Explicitly state:

> Sprint 8C.2 preserves historical events that exist in authoritative source records. It does not manufacture historical versions of mutable source records where the source system does not retain version history.

This is critical for 8C.3.

---

# 6. CRITICAL – The Narrative Engine Example Is Still Not Schema-Safe

The plan says:

```typescript
const meta = event.metadata_json ? JSON.parse(event.metadata_json) : {};
```

without validation.

But the review requirement explicitly asked for schema validation.

### Required correction

Use:

```text TimelineNarrativeMetadataSchema.safeParse(...)
```

or equivalent validation.

On invalid metadata:

```text safe deterministic fallback
```

Do not allow malformed metadata to crash timeline synchronization.

---

# 7. IMPORTANT – Narrative Code Uses `event.event_date`

The plan previously established canonical normalized event dates, but the narrative example still directly references:

```text event.event_date
```

This is acceptable only if `CreateTimelineEventInput.event_date` is explicitly the **normalized canonical event date**.

### Required

Document:

```text TimelineNarrativeEngine never reads raw source dates.
It receives only the normalized TimelineEvent contract.
```

---

# 8. IMPORTANT – `maskedIdentifier` Must Be Generated by the Sanitizer

The plan says policy numbers are masked to the last four digits.

Do not allow upstream source metadata to provide:

```text maskedIdentifier
```

as an arbitrary string.

The sanitizer should derive it:

```text full policy number
→ maskIdentifier()
→ ••••1234
```

and then discard the raw identifier from narrative metadata.

This prevents accidental leakage if a caller passes an unmasked value.

---

# 9. CRITICAL – Currency-Aware `minAmount` Filtering Is Still Ambiguous

The plan says:

> `minAmount` evaluates against amount in source currency, or against `inrAmount` if FX conversion exists.

This can create inconsistent results.

Example:

```text minAmount = 10,00,000
USD event amount = 900,000 USD
```

Does `10,00,000` mean INR or USD?

### Required API contract

Use:

```text minAmount
minAmountCurrency
```

For example:

```text ?minAmount=1000000&minAmountCurrency=INR
```

Then:

- INR event → compare INR amount.
- USD event with authoritative INR conversion → compare `inrAmount`.
- USD event without authoritative conversion → exclude from INR-denominated filter.

Never silently compare numeric amounts across currencies.

---

# 10. IMPORTANT – FX Rate Example Must Not Be Hardcoded

The plan contains:

```text fxRateDate: '2026-08-01'
fxRate: 87.50
```

This must remain an **illustrative example**, not an implementation constant.

The actual implementation should obtain FX from an approved source/service or preserve the original currency.

Do not embed a static FX rate in production code.

---

# 11. IMPORTANT – Tax Event Provenance Is Slightly Misleading

The plan says:

```text tax_profiles, tax_deductions
CALCULATED via TaxCalculationEngine
```

but those are still source tables.

Clarify:

```text Source data:
tax_profiles / tax_deductions

Interpretation:
TaxCalculationEngine

Timeline classification:
CALCULATED
```

The timeline must never imply that the raw database rows themselves are calculated outputs.

---

# 12. IMPORTANT – AI Audit Event Selection Needs an Explicit Allow-List

The plan correctly says acknowledged/resolved triggers and executed audit actions.

Make the allow-list explicit.

For example:

```text TRIGGER_ACKNOWLEDGED
TRIGGER_RESOLVED
RECOMMENDATION_EXECUTED
USER_DECISION_RECORDED
```

Do not ingest arbitrary `ai_audit_trail` rows.

Raw model telemetry, prompt logs, diagnostic events, and internal execution records must never become family timeline events.

---

# 13. CRITICAL – Estate KG Narrative Must Preserve Derived Status

The plan correctly marks `graph_edges` as `DERIVED`.

Ensure narrative wording doesn't say:

> "Nominee assigned"

as if this were a legal fact.

Prefer something like:

```text "Beneficiary relationship recorded in FamilyWealthOS knowledge graph."
```

unless the authoritative source itself confirms the legal relationship.

This distinction matters for fiduciary integrity.

---

# 14. IMPORTANT – Future `PREMIUM_DUE` Events Need a Query Semantics Decision

If scheduled events are included in the same table, define whether:

```text GET /timeline
```

includes future events by default.

Recommended:

```text default:
past + current events

optional:
includeFuture=true
```

Otherwise the "historical timeline" may unexpectedly contain future obligations.

---

# 15. IMPORTANT – Importance Classification Should Be Computed Once

The plan defines precedence:

```text CRITICAL > HIGH > MEDIUM > INFO
```

Good.

Ensure that the final event stores the resolved tier.

Do not recalculate importance during every query.

This guarantees that historical importance remains tied to:

```text ruleVersion
```

under which the event was projected.

---

# 16. IMPORTANT – Sync Atomicity

The plan says:

```text delete obsolete IDs
+
upsert active events
```

inside the transaction.

Good.

Explicitly require:

```text all delete + upsert operations occur in ONE SQLite transaction
```

so a failed sync cannot leave the timeline half-refreshed.

---

# 17. IMPORTANT – Empty/Partial Domain Behaviour

If one source domain fails during synchronization, define behaviour.

Recommended:

```text fail closed
→ rollback entire sync
→ preserve previous timeline projection
→ return domain-specific error
```

Do not partially overwrite the timeline and silently omit one domain.

If a domain is genuinely empty:

```text zero records = successful domain with zero events
```

not an error.

---

# 18. IMPORTANT – No-Mutation Invariant Includes Schema Metadata

The test says zero writes across source tables.

Good.

Also ensure the synchronizer does not accidentally:

```text update lastSyncedAt
write audit records
update triggers
modify graph edges
```

unless those are explicitly part of the approved timeline synchronization contract.

The safest invariant is:

> `syncFamilyTimeline()` has exactly one writable repository target: `family_timeline_events`.

---

# 19. IMPORTANT – Performance Target

The full-domain fixture is now excellent:

```text 100 transactions
10 policies
5 goals
3 life events
5 estate
4 tax
5 AI
10 KG
```

Keep the ≤100ms target as an engineering benchmark.

However, report:

```text extraction time
normalization time
transaction/upsert time
query time
total
```

This will help identify bottlenecks before real production data volumes grow.

---

# 20. IMPORTANT – Test Event Rebuild Determinism

Add a test:

```text Sync
→ capture event IDs + normalized fields

Delete timeline projection

→ Sync again

Compare outputs
```

Expected:

```text identical event IDs
identical event dates
identical importance
identical provenance
identical narratives
```

This is an important invariant for a derived historical ledger.

---

# 21. IMPORTANT – Baseline Test Count

The plan should explicitly preserve the verified baseline:

```text Sprint 8C.1 = 337 PASSED
Sprint 8C.2 = 337 + X
```

Do not invent a target `X`.

The actual final test count must be reported after implementation.

---

# 22. FINAL ACCEPTANCE CRITERIA

Before implementation, confirm:

- [ ] Event identity never relies on mutable timestamps unless the timestamp is the explicit version identity.
- [ ] Scheduled `PREMIUM_DUE` events are explicitly distinguished from historical events.
- [ ] `sourceObservedAt` is separated from historical source-state semantics.
- [ ] `sourceStateHash` uses deterministic canonical hashing.
- [ ] Mutable-source revision limitations are documented.
- [ ] Narrative metadata is schema-validated.
- [ ] Identifier masking is performed centrally.
- [ ] `minAmountCurrency` is part of the API contract.
- [ ] FX examples are not hardcoded.
- [ ] Tax events consume authoritative TaxCalculationEngine semantics.
- [ ] AI audit ingestion is allow-listed.
- [ ] KG-derived narrative language preserves `DERIVED` provenance.
- [ ] Future-event visibility is explicitly defined.
- [ ] Importance is calculated during projection and persisted.
- [ ] Sync delete + upsert is atomic.
- [ ] Domain failure rolls back the complete sync.
- [ ] Empty domain is treated as valid.
- [ ] Timeline sync has exactly one writable target.
- [ ] Rebuild determinism test is included.
- [ ] Baseline remains 337 before Sprint 8C.2 implementation.

---

# FINAL DECISION

## 🟡 REVISE PLAN BEFORE IMPLEMENTATION

This is now **very close to implementation-ready**.

The previous major architectural concerns have been addressed correctly. The remaining work is precision around:

1. **Mutable event identity**
2. **Scheduled vs historical events**
3. **Historical source-state semantics**
4. **Narrative metadata validation**
5. **Currency-aware filtering**
6. **Atomic failure behaviour**
7. **Deterministic rebuilds**

Once those are explicitly incorporated, Sprint 8C.2 should receive the **🟢 implementation approval**.

---

# Required Agent Response

After incorporating these final comments:

1. Return the final `SPRINT_8C_2_IMPLEMENTATION_PLAN.md`.
2. Summarize the final changes.
3. Explicitly state the final event identity strategy.
4. Explicitly state scheduled-event semantics.
5. Explicitly state source observation vs historical state semantics.
6. Explicitly state currency/filter behaviour.
7. Explicitly state sync failure/rollback behaviour.
8. Confirm **zero production code changes**.

**STOP after revising the plan. Do not implement Sprint 8C.2 yet.**
