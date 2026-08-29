# Final Implementation Plan: Sprint 8C.2 – Multi-Domain Timeline Ledger & Narrative History

---

## 1. Executive Summary & Core Architectural Principle

**Sprint 8C.2** delivers the **Multi-Domain Timeline Ledger & Narrative History Engine**. It aggregates, normalizes, and indexes historical financial milestones across 7 logical domains into a unified, chronological, multi-generational timeline ledger.

### 🛡️ Central Architectural Invariant: Strict Provenance Hierarchy
$$\text{Authoritative Domain Data} \longrightarrow \text{Timeline Projection} \longrightarrow \text{Narrative Interpretation}$$
**Never**: $\text{Timeline} \longrightarrow \text{Authoritative Financial State}$.

- **Derived Projection Only**: The timeline is strictly a derived historical projection. It never acts as a primary source of financial truth.
- **Single Writable Target Guarantee**: Synchronizing the timeline writes *only* to `family_timeline_events`. It executes zero inserts, updates, or deletes across `transactions`, `insurance_policies`, `wills`, `financial_goals`, `life_events`, `proactive_triggers`, `ai_audit_trail`, `tax_profiles`, `tax_deductions`, `tax_rules`, or `graph_edges`.
- **7 Logical Domains vs Physical Source Classification**:
  1. `PORTFOLIO`: `transactions`, `assets` (`AUTHORITATIVE_SOURCE`)
  2. `PROTECTION`: `insurance_policies` (`AUTHORITATIVE_SOURCE`)
  3. `GOAL`: `financial_goals` (`AUTHORITATIVE_SOURCE`)
  4. `LIFE_EVENT`: `life_events` (`AUTHORITATIVE_SOURCE`)
  5. `ESTATE`: `wills`, `trusts` (`AUTHORITATIVE_SOURCE`) & `graph_edges` (`DERIVED`)
  6. `TAX`: `tax_profiles`, `tax_deductions` (Source data interpreted via `TaxCalculationEngine` $\to$ `CALCULATED`)
  7. `AI_DECISION`: `proactive_triggers` (acknowledged/resolved triggers) & `ai_audit_trail` (`AI_AUDIT`)

> [!IMPORTANT]
> **Historical Revision Boundary**: Sprint 8C.2 preserves historical events that exist in authoritative source records. It does not manufacture past versions of mutable source records where the source table does not maintain an immutable change log.

---

## 2. Event-Instance Identity & Extraction Specifications

### 🔑 Stable Canonical Event ID Formulation
$$\text{eventId} = \text{evt\_}\{\text{domain}\}\_\{\text{sourceType}\}\_\{\text{sourceId}\}\_\{\text{eventType}\}\_[\{\text{canonicalMilestoneKey}\}]$$
*Note: Event IDs never use mutable timestamps like `updated_at`.*

| Logical Domain | Source Table | Source Classification | Event Types & Stable Identity Strategy | Date Precedence & Fallbacks | Amount Meaning & Type |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **`PORTFOLIO`** | `transactions` | `AUTHORITATIVE_SOURCE` | `evt_PORTFOLIO_transactions_${tx.id}_${tx.type}` | `tx.date` (Trade Date) $\to$ Fallback `tx.created_at` | Cash value (`amountType: 'TRANSACTION'`) |
| **`PROTECTION`** | `insurance_policies` | `AUTHORITATIVE_SOURCE` | `evt_PROTECTION_insurance_policies_${p.id}_ACTIVATED`<br>`evt_PROTECTION_insurance_policies_${p.id}_SCHEDULED_PREMIUM_DUE` | `p.start_date` $\to$ Fallback `p.created_at` | **`SUM_ASSURED`** (Coverage protection, NEVER net worth)<br>`PREMIUM` for premium due |
| **`GOAL`** | `financial_goals` | `AUTHORITATIVE_SOURCE` | `evt_GOAL_financial_goals_${g.id}_CREATED`<br>`evt_GOAL_financial_goals_${g.id}_HALFWAY_FUNDED`<br>`evt_GOAL_financial_goals_${g.id}_ACHIEVED` | `g.created_at` / transition timestamp | Target amount / allocated amount (`amountType: 'GOAL_TARGET'`) |
| **`LIFE_EVENT`** | `life_events` | `AUTHORITATIVE_SOURCE` | `evt_LIFE_EVENT_life_events_${e.id}_DECLARED`<br>`evt_LIFE_EVENT_life_events_${e.id}_PROCESSED` | `e.event_date` (Effective) $\to$ Fallback `e.declared_at` | Net financial impact (`amountType: 'FINANCIAL_IMPACT'`) |
| **`ESTATE`** | `wills`, `trusts` | `AUTHORITATIVE_SOURCE` | `evt_ESTATE_wills_${w.id}_REGISTERED`<br>`evt_ESTATE_trusts_${t.id}_FORMED` | `w.execution_date` $\to$ Fallback `w.created_at` | Asset value covered (`amountType: 'ESTATE_CORPUS'`) |
| **`ESTATE` (KG)** | `graph_edges` | `DERIVED` | `evt_ESTATE_graph_edges_${edge.id}_NOMINEE` | `edge.created_at` | Target asset value (if available) |
| **`TAX`** | `tax_profiles`, `tax_deductions` | `CALCULATED` | `evt_TAX_tax_profiles_${tp.id}_REGIME_${tp.financial_year}`<br>`evt_TAX_tax_deductions_${td.id}_SECTION_${td.section}` | `tp.created_at` / `td.created_at` | Deduction claimed / tax savings (`amountType: 'TAX_DEDUCTION'`) |
| **`AI_DECISION`** | `proactive_triggers`, `ai_audit_trail` | `AI_AUDIT` | `evt_AI_DECISION_proactive_triggers_${trg.trigger_id}_ACKNOWLEDGED`<br>`evt_AI_DECISION_proactive_triggers_${trg.trigger_id}_RESOLVED`<br>`evt_AI_DECISION_ai_audit_trail_${aud.action_id}_EXECUTED` | `trg.acknowledged_at` $\to$ `trg.resolved_at` $\to$ `aud.created_at` | Exposure / savings addressed (`amountType: 'ESTIMATED_EXPOSURE'`) |

### 🛡️ Key Domain Extraction Guardrails
1. **Premium Due vs Paid**: `PREMIUM_PAID` is **excluded** because `insurance_policies` does not store granular payment receipts. `PREMIUM_DUE` is projected with `eventStatus: 'SCHEDULED'`. When `next_premium_due_date` updates in the source policy, the single scheduled event is updated in-place.
2. **AI Audit Ingestion Allow-List**: Only explicitly allow-listed decision actions (`TRIGGER_ACKNOWLEDGED`, `TRIGGER_RESOLVED`, `RECOMMENDATION_EXECUTED`, `USER_DECISION_RECORDED`) enter the timeline. Raw model telemetry, prompts, and internal logs are strictly excluded.
3. **Estate KG Language**: KG-derived events use distinct derived phrasing: `"Beneficiary relationship recorded in FamilyWealthOS knowledge graph."` preserving non-statutory distinction.

---

## 3. Provenance, Versioning & Historical Date Semantics

Every projected event stores granular, decoupled metadata fields:

```typescript
export interface TimelineEventMetadata {
  eventDate: string;             // Canonical date milestone actually occurred
  dateProvenance: 'AUTHORITATIVE_EVENT_DATE' | 'FALLBACK_CREATION_DATE' | 'UNKNOWN_DATE';
  sourceObservedAt: string;      // Timestamp when FamilyWealthOS read/projected the source row
  sourceStateHash: string;       // Deterministic SHA-256 over key-sorted canonical source fields
  provenance: 'AUTHORITATIVE_SOURCE' | 'DERIVED' | 'CALCULATED' | 'AI_AUDIT';
  eventStatus: 'HISTORICAL' | 'SCHEDULED';
  calculationVersion: string;     // Projection logic version ('2026.1')
  ruleVersion: string;            // Rule registry version ('2026.1')
  
  // Sanitized Allow-Listed Narrative Fields (Validated via Zod)
  memberDisplayName?: string;
  assetDisplayName?: string;
  insurerDisplayName?: string;
  policyType?: string;
  quantity?: number;
  targetYear?: number;
  financialYear?: string;
  urgency?: string;
  sectionCode?: string;
  maskedIdentifier?: string;     // Last 4 digits only (e.g. "••••1234") derived centrally by maskIdentifier()
}
```

### 🔒 Deterministic Canonical `sourceStateHash` Formula
$$\text{sourceStateHash} = \text{SHA256}(\text{canonicalJSON}(\{\text{sourceType}, \text{sourceId}, \text{economicFields}\}))$$
*Excludes `updated_at`, observation timestamps, and volatile projection IDs.*

---

## 4. Currency, FX Conversion & Filtering Contract

1. **Preserve Source Currency**: Currency is preserved (`INR`, `USD`, `EUR`). If unknown, marked `'UNKNOWN'`. Never silently defaulted to INR.
2. **Dynamic FX Conversion**:
   - Converted `inrAmount` is calculated **only** when an authoritative FX rate is provided by `MarketDataService` / `RBI_REFERENCE`.
   - If no FX rate is available, `amount` remains in source currency and `inrAmount` is `null`. Zero static/hardcoded FX constants in production code.
3. **Currency-Aware Filtering API Contract**:
   - Request parameter: `GET /api/v1/family-office/timeline?minAmount=1000000&minAmountCurrency=INR`
   - Evaluation:
     - INR events $\longrightarrow \text{amount} \ge 1000000$
     - USD events with authoritative `inrAmount` $\longrightarrow \text{inrAmount} \ge 1000000$
     - USD events without authoritative FX rate $\longrightarrow$ Excluded from INR filter (preventing cross-currency false positives).

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
*Importance tier is computed during projection and persisted in database; it is never recalculated on query.*

---

## 6. Deterministic Narrative Template Engine & Sanitization

Narratives are **100% deterministic** parameter-interpolated strings using Indian numbering conventions (₹10,00,000 / ₹1.5 Cr).

```typescript
export class TimelineNarrativeEngine {
  public static renderNarrative(event: CreateTimelineEventInput): string {
    const parsed = TimelineNarrativeMetadataSchema.safeParse(
      event.metadata_json ? JSON.parse(event.metadata_json) : {}
    );
    const meta = parsed.success ? parsed.data : {};
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
      case 'SCHEDULED_PREMIUM_DUE':
        return `Scheduled premium due for ${meta.insurerDisplayName || ''} policy: ${formattedAmount} on ${event.event_date}.`;
      case 'GOAL_CREATED':
        return `Financial goal established: "${event.title}" target of ${formattedAmount} for target year ${meta.targetYear || ''}.`;
      case 'GOAL_ACHIEVED':
        return `Goal milestone: "${event.title}" achieved 100% target funding.`;
      case 'WILL_REGISTERED':
        return `${meta.memberDisplayName || 'Primary Testator'} registered Will with Sub-Registrar.`;
      case 'NOMINEE_ASSIGNED':
        return `Beneficiary relationship recorded in FamilyWealthOS knowledge graph.`;
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
> **Central Masking Function**: `maskIdentifier(rawId)` centrally derives `••••1234` and strips raw identifiers from `metadata_json`. PAN, bank accounts, and raw telemetry are never present.

---

## 7. Atomic Sync Rollback & Stale Reconciliation

During `syncFamilyTimeline(familyId)`:
1. **Extraction Phase**: Extracts events from all 7 logical domains in-memory. If any domain extractor encounters a fatal failure, the sync **fails closed**, rolls back the transaction, returns a domain-specific error, and preserves previous timeline. Empty domains are treated as valid with 0 events.
2. **Transaction Phase (`SQLiteFamilyTimelineRepository.batchReconcileTimeline`)**:
   - All delete and upsert operations execute inside **one SQLite transaction** (`db.transaction(...)`).
   - Query existing event IDs for family: $\text{ExistingIDs}$.
   - Calculate obsolete IDs: $\text{ObsoleteIDs} = \text{ExistingIDs} \setminus \text{CurrentIDs}$.
   - Delete obsolete event IDs (`DELETE FROM family_timeline_events WHERE family_id = ? AND event_id IN (...)`).
   - Upsert active events with `ON CONFLICT(family_id, event_id) DO UPDATE SET ...` to reconcile modified amounts, dates, or metadata.

---

## 8. Query, Search & Deterministic Pagination

1. **Ordering Invariant**:
   `ORDER BY event_date DESC, CASE importance_tier WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END ASC, event_id ASC`
   *(100% deterministic tie-breaking across rebuilds).*
2. **Search Implementation**:
   Indexed pattern matching `(title LIKE ? OR description LIKE ?)` bounded by limit/offset.
3. **Scheduled vs Historical Default**:
   `GET /api/v1/family-office/timeline` defaults to `event_date <= CURRENT_DATE` unless `includeScheduled=true`.

---

## 9. Comprehensive Invariant Test Plan (Sprint 8C.2)

#### [NEW] `backend/src/__tests__/sprint8c2/familyTimeline.test.ts`

1. **7-Domain Normalization & Provenance Tagging**:
   - Ingests controlled fixtures for Portfolio, Protection, Goal, Life Event, Estate, KG Edge, Tax, and AI Decision.
   - Verifies explicit provenance tags (`AUTHORITATIVE_SOURCE`, `DERIVED`, `CALCULATED`, `AI_AUDIT`).
2. **Repeating Event Identity Non-Collision**:
   - Tests multiple goal milestones and policy lifecycle events without ID collisions.
3. **Scheduled vs Historical Event Separation**:
   - Asserts `PREMIUM_DUE` is tagged `eventStatus: 'SCHEDULED'` and filtered from default historical view.
4. **Valuation Invariant & Protection Coverage**:
   - Asserts `SUM_ASSURED` is tagged as coverage, never net-worth value.
5. **Deterministic Narrative Generation & Masking**:
   - Asserts narratives format Indian currency and centrally mask policy identifiers (`••••1234`).
6. **Currency-Aware `minAmountCurrency` Filtering**:
   - Tests USD transaction with and without FX rate; asserts USD excluded from INR filter when no FX rate exists.
7. **No-Mutation Invariant across All 11 Source Tables**:
   - Asserts 0 inserts, 0 updates, 0 deletes on all 11 source tables during sync.
8. **Atomic Sync Failure Rollback**:
   - Simulates a domain failure during sync; asserts database transaction rolls back and preserves existing timeline.
9. **Deterministic Rebuild Test**:
   - Syncs timeline $\to$ captures state $\to$ purges timeline $\to$ syncs again $\to$ asserts 100% identical event IDs, dates, importance tiers, provenances, and narrative strings.
10. **Cross-Family Security Isolation**:
    - Family A cannot access or sync Family B's timeline events.
11. **Full-Domain Performance Benchmark**:
    - Fixture with 100 transactions, 10 policies, 5 goals, 3 life events, 5 estate records, 4 tax records, 5 AI decisions, 10 KG edges $\to$ sync + query $\le 100\text{ms}$.
    - Reports breakdown: extraction, normalization, DB upsert, query, total.

---

# ChatGPT Final Review – Sprint 8C.2

## Verdict

**🟢 APPROVED FOR IMPLEMENTATION — with implementation-time guardrails below**

The revised plan has addressed the substantive issues from the previous review. In particular, the plan now explicitly covers:

- Stable event identity without mutable timestamps
- Scheduled vs historical event separation
- `sourceObservedAt` vs event date
- Deterministic source-state hashing
- Historical revision boundary
- Zod narrative metadata validation
- Central identifier masking
- Currency-aware filtering
- Dynamic/authoritative FX handling
- AI audit allow-list
- Derived KG narrative semantics
- Atomic delete + upsert reconciliation
- Fail-closed sync behaviour
- Deterministic rebuild testing
- Family isolation
- 337-test baseline preservation

The plan is now suitable for implementation.

---

# Implementation-Time Guardrails

These are not blockers to approval, but the Agent must preserve them while coding.

## 1. Event Identity Must Remain Stable

Do not introduce mutable fields such as:

```text
updated_at
created_at
observation timestamp
random UUID
```

into event IDs unless the field is explicitly part of the immutable event-instance identity.

For current-source projections, prefer the stable source ID + event type.

---

## 2. Scheduled Premium Events Are Not Historical Facts

`SCHEDULED_PREMIUM_DUE` must remain:

```text
eventStatus = SCHEDULED
```

and must not be presented as:

```text PREMIUM_PAID
```

or any indication that payment occurred.

The default timeline query correctly excludes future scheduled events unless explicitly requested.

---

## 3. `sourceStateHash` Must Be Canonical

The implementation must use one deterministic canonicalization algorithm.

The hash must represent the source entity/event state, not the entire family.

Do not include volatile projection/read fields.

---

## 4. Important: Current-Source Projection Is Not Full Historical Versioning

The implementation must preserve the documented boundary:

> If a mutable source table does not retain historical versions, Sprint 8C.2 cannot reconstruct previous versions.

Do not generate synthetic historical events merely because a current record has changed.

---

## 5. Narrative Fallback Must Remain Safe

The narrative engine currently uses:

```text
parsed metadata → fallback {}
```

This is acceptable only if invalid metadata results in a safe deterministic narrative.

A malformed metadata payload must never cause the entire timeline sync to fail.

---

## 6. Currency Semantics

The implementation must not compare raw numeric values across currencies.

For:

```text minAmountCurrency = INR
```

foreign events are eligible only when an authoritative INR conversion exists.

No hardcoded FX rates.

---

## 7. Atomicity

All reconciliation must occur as:

```text extract
    ↓
validate/normalize
    ↓
ONE DB transaction
    ├── delete obsolete
    └── upsert current
    ↓
commit
```

If extraction fails, there must be no partial timeline mutation.

If DB reconciliation fails, the entire transaction must roll back.

---

## 8. Single Writable Repository Target

`syncFamilyTimeline()` must only mutate:

```text family_timeline_events
```

No:

```text audit trail
triggers
source tables
graph edges
tax tables
goal tables
```

should be modified as side effects.

---

## 9. Stable Rebuild Behaviour

The rebuild test must confirm not merely event IDs but the full normalized projection:

```text eventId
eventType
eventDate
eventStatus
amount
currency
importance
provenance
sourceStateHash
narrative
```

are identical after:

```text purge → rebuild
```

---

## 10. Performance

The ≤100ms benchmark is acceptable as an engineering target.

Do not weaken validation, provenance, family isolation, or transaction integrity to meet it.

Report:

```text extraction
normalization
DB reconciliation
query
total
```

as planned.

---

# Minor Documentation Corrections

These do not require another plan cycle.

### A. 11 source tables

The plan says "all 11 source tables" but the listed source objects should remain explicitly enumerated in the test implementation so there is no ambiguity.

### B. Search

`LIKE` search is acceptable for 8C.2. Do not prematurely introduce FTS5 unless actual performance testing shows the need.

### C. Scheduled events

Keep the distinction between:

```text historical timeline
```

and:

```text scheduled/future obligations
```

in API response documentation and UI contracts.

---

# Final Approval

## 🟢 Sprint 8C.2 APPROVED FOR IMPLEMENTATION

The architecture is now sufficiently hardened.

### Agent implementation instruction

```text
Sprint 8C.2 Final Plan APPROVED.

Proceed with implementation exactly according to the final approved plan.

Implementation guardrails:
1. Preserve stable deterministic event IDs.
2. Keep scheduled events distinct from historical facts.
3. Preserve sourceObservedAt/sourceStateHash semantics.
4. Do not fabricate historical revisions.
5. Validate and sanitize narrative metadata.
6. Never leak raw sensitive identifiers.
7. Preserve currency and authoritative FX semantics.
8. Use the existing idempotency and family-scope infrastructure.
9. Timeline synchronization may mutate only family_timeline_events.
10. Delete + upsert reconciliation must be atomic.
11. Any fatal domain extraction failure must fail closed.
12. Keep timeline provenance explicit.
13. Do not modify unrelated business logic.
14. Run the full master test suite and both TypeScript builds.
15. Verify the deterministic rebuild invariant.
16. Report actual test count as 337 + X; do not invent a target.
17. Update SESSION_CONTEXT.md, AI_CHANGELOG.md and Phase 8 roadmap documentation.
18. STOP after Sprint 8C.2 implementation and provide the Output Review.
19. Do not begin Sprint 8C.3 automatically.
```

**No further planning revision is required unless implementation uncovers a contradiction with the approved architecture.**
