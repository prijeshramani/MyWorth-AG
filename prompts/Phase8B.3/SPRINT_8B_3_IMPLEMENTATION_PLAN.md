# Sprint 8B.3 Implementation Plan: Proactive Fiduciary AI Observer & Cooldown Registry

## 1. Executive Summary & Fiduciary Boundaries

### Objective
Transition FamilyWealthOS intelligence from reactive query-response to a **proactive, event-driven fiduciary observer with human-controlled actions**. The **Proactive AI Observer (`ProactiveObserverService`)** and **Cooldown Registry (`CooldownRegistryService`)** evaluate deterministic rule conditions against the **Family Digital Twin** upon domain state mutations, enforce multi-tiered confidence and domain-specific data completeness gates, apply duplicate suppression and rule-specific cooldown periods, and generate actionable fiduciary recommendations with 5-point explainability lineage.

### Non-Negotiable Fiduciary Boundary
```
Authoritative Data
      ↓
Existing Calculation Engine (Deterministic, Zero Invention)
      ↓
Proactive Rule Evaluation
      ↓
Evidence + Domain Completeness Gate
      ↓
Proactive Recommendation
      ↓
Cooldown / Deduplication Gateway
      ↓
Notification Adapter / Presentation
      ↓
Human Decision (Acknowledge / Snooze / Dismiss / Act)
      ↓
Separate Authorized Action (Explicit User Execution)
```

**Absolute Invariant**: `Event → AI → Financial Action` is **strictly prohibited**. The Observer produces read-only recommendations and triggers. It never executes trades, modifies SIPs, reassigns nominees, or alters insurance policies without explicit human confirmation.

---

## 2. Terminology & Core Invariants

1. **Observer Role**: "Proactive, event-driven fiduciary observer with human-controlled actions". The observer autonomously *detects* and *evaluates*, but never autonomously *decides* or *acts* financially.
2. **Zero Financial Invention**: If domain facts (e.g., income, loan details, nominee records) are missing, the engine skips evaluation or emits `status: 'INSUFFICIENT_DATA'`. It never manufactures placeholder financial facts.
3. **Engine-Driven Truth**: All financial calculations (allocation drift, HLV gap, emergency fund months, tax headroom, goal delay) are executed by existing authoritative domain engines. `ProactiveObserverService` is purely an orchestration and gating layer.
4. **Server-Resolved Family Scope**: Family context is strictly derived from `CorrelationContext.getFamilyId()`. No client query/body/header parameter can establish or override family scope.
5. **Single Authoritative Record**: The `proactive_triggers` table is the sole authoritative persistence record. `NotificationService` acts as an adapter/presentation layer referencing `triggerId`.

---

## 3. Existing Architecture Inspection & Component Reuse

| Component | Status | Role in Sprint 8B.3 |
| :--- | :--- | :--- |
| **`DigitalTwinService`** | Existing (Sprint 8B.1) | Supplies 5-pillar state snapshot (`balanceSheet`, `protection`, `trajectory`, `lineage`, `governance`) and state hash $H_{\text{state}}$. |
| **`TaxCalculationEngine`** | Existing (Phase 6) | Computes authoritative Section 80C headroom and tax regime delta. |
| **`EstateHealthService`** | Existing (Phase 6) | Evaluates missing nominee graph edges and Will version dates. |
| **`GoalPlanningService`** | Existing (Phase 6) | Computes goal completion probability and delay metrics. |
| **`LifeEventEngineService`** | Existing (Sprint 8B.2) | Provides lifecycle event status for unresolved consequence triggers. |
| **`AuditHookService` & EventBus** | Existing (Sprint 8B.0) | Dispatches and logs sanitized audit events (`PROACTIVE_TRIGGER_CREATED`, `PROACTIVE_TRIGGER_DISMISSED`, `PROACTIVE_TRIGGER_SNOOZED`, `PROACTIVE_TRIGGER_RESOLVED`). |
| **`CorrelationContext`** | Existing (Sprint 8B.0) | Enforces ambient correlation and server-resolved `familyId` across background execution chains. |
| **`SQLiteIdempotencyRepository`** | Existing (Sprint 8B.0) | Guarantees idempotency on mutating trigger endpoints (`/snooze`, `/dismiss`, `/resolve`). |
| **`NotificationService`** | Existing (Phase 7) | Adapter layer for delivering proactive trigger summaries into the existing Notification Center without duplicate state. |

---

## 4. Rule $\to$ Calculation Engine Ownership Matrix

| Rule Code | Domain | Authoritative Calculation Engine | Output Metric Evaluated | Threshold & Provenance |
| :--- | :--- | :--- | :--- | :--- |
| **`DRIFT_EQUITY_OVERWEIGHT`** | Portfolio | `DigitalTwinService` (Balance Sheet) | $\text{Current Equity \%} - \text{Target Equity \%}$ | Drift $> +5.0\%$ (Rule v2026.1 / SEBI RIA Asset Allocation Standard) |
| **`CONCENTRATION_SINGLE_STOCK`**| Portfolio | `DigitalTwinService` (Balance Sheet) | $\max(\text{Holding Value}) / \text{Liquid Portfolio Value}$ | Single Holding $> 20.0\%$ (Rule v2026.1 / Fiduciary Risk Benchmark) |
| **`INSURANCE_RENEWAL_DUE`** | Protection | `insurance_policies` repository | $\text{Next Premium Due Date} - \text{Today}$ | Due within $\le 30$ Days (Rule v2026.1 / IRDAI Grace Period Policy) |
| **`PROTECTION_HLV_GAP`** | Protection | `DigitalTwinService` (Protection Shield) | $\text{Required HLV Cover} - \text{Active Term Cover}$ | Gap $> 0$ (Rule v2026.1 / Pure Human Life Value Model) |
| **`EMERGENCY_FUND_DEFICIT`** | Liquidity | `DigitalTwinService` (Cashflow & Reserves) | $\text{Liquid Reserves} / \text{Monthly Fixed Burn}$ | Reserves $< 4.0$ Months (Rule v2026.1 / CFP Liquidity Standard) |
| **`EXCESS_IDLE_CASH`** | Liquidity | `DigitalTwinService` (Cashflow & Reserves) | $\text{Savings Account Balance} / \text{Monthly Fixed Burn}$ | Balance $> 12.0$ Months (Rule v2026.1 / Cash Drag Optimization) |
| **`GOAL_OFF_TRACK_DRIFT`** | Goals | `GoalPlanningService` / `financial_goals` | Milestone Completion Probability | Probability $< 60.0\%$ (Rule v2026.1 / Goal Trajectory Model) |
| **`TAX_80C_OPPORTUNITY`** | Tax | `TaxCalculationEngine` | $₹1,50,000 - \text{Eligible 80C Invested}$ | Headroom $> ₹25,000$ & Old Regime (Rule v2026.1 / IT Act 1961) |
| **`ESTATE_NOMINEE_GAP`** | Estate | `EstateHealthService` / `graph_edges` | Count of un-nominated active assets | Un-nominated assets $\ge 1$ (Rule v2026.1 / Estate Succession Standard) |

---

## 5. Domain Event $\to$ Targeted Rule Trigger Mapping

| Domain Event | Mutated Domain | Targeted Rules Evaluated (Subset) | Avoided / Skipped Rules |
| :--- | :--- | :--- | :--- |
| **`ASSET_SAVED` / `ASSET_PRICE_UPDATED`** | Portfolio | `DRIFT_EQUITY_OVERWEIGHT`, `CONCENTRATION_SINGLE_STOCK`, `ESTATE_NOMINEE_GAP` | Insurance, Tax, Goals, Liquidity |
| **`TRANSACTION_IMPORTED`** | Cashflow / Liquidity | `EMERGENCY_FUND_DEFICIT`, `EXCESS_IDLE_CASH` | Insurance, Estate, Tax, Goals |
| **`POLICY_SAVED` / `POLICY_RENEWED`** | Protection | `INSURANCE_RENEWAL_DUE`, `PROTECTION_HLV_GAP` | Portfolio, Estate, Liquidity, Goals |
| **`TAX_RECORD_SAVED`** | Tax | `TAX_80C_OPPORTUNITY` | Portfolio, Protection, Estate, Goals |
| **`GOAL_SAVED`** | Goals | `GOAL_OFF_TRACK_DRIFT` | Portfolio, Protection, Estate, Tax |
| **`LIFE_EVENT_PROCESSED`** | Multi-Domain | Re-evaluates rules impacted by approved life event consequence | None (Targeted full domain pass) |

---

## 6. Multi-Tiered Confidence & Completeness Gating Model

```text
1. Domain Data Completeness Gate ($S_{\text{domain}} \ge \theta_{\text{comp}}$)
   - Evaluates completeness of the specific domain required for the rule (not generic global score).
   - If Insurance completeness < 75%, skip PROTECTION_HLV_GAP with status 'INSUFFICIENT_DATA'.

2. Calculation Determinism Gate
   - Zero placeholder synthesis. Math executes strictly via domain engine formulas.

3. Evidence Confidence Gate ($C_{\text{evidence}} \ge \theta_{\text{conf}}$)
   - Rule-specific requirement (e.g. 100% for Policy Due Dates, 95% for Concentration, 90% for Drift).

4. AI Presentation Boundary
   - LLMs format explanations, summaries, and action labels only AFTER deterministic gating passes.
   - LLMs NEVER participate in financial rule evaluation or trigger qualification.
```

---

## 7. Deduplication, Cooldown & Materiality Architecture

### Identity Separation
- **Immutable Trigger Identity**:
  $$\text{TriggerId} = \text{trg\_} + \text{SHA256}(\text{familyId} : \text{ruleCode} : \text{entityId} : H_{\text{state}} : \text{ruleVersion})[0..16]$$
- **Cooldown Entity Identity**:
  $$\text{CooldownKey} = (\text{familyId}, \text{ruleCode}, \text{entityId})$$

### Rule-Specific Materiality Override Functions
If an active cooldown exists, a new trigger is emitted ONLY if the financial state has shifted beyond the rule's specific materiality threshold $\Delta_{\text{mat}}$:
- `DRIFT_EQUITY_OVERWEIGHT`: Absolute equity drift change $|\text{Drift}_{\text{now}} - \text{Drift}_{\text{last}}| \ge 2.5\%$.
- `CONCENTRATION_SINGLE_STOCK`: Concentration ratio change $|\text{Conc}_{\text{now}} - \text{Conc}_{\text{last}}| \ge 3.0\%$.
- `EMERGENCY_FUND_DEFICIT`: Liquid reserve change $|\text{Reserves}_{\text{now}} - \text{Reserves}_{\text{last}}| \ge 15.0\%$.
- `INSURANCE_RENEWAL_DUE`: Enters new 7-day final urgency bracket ($\le 7$ days).
- `TAX_80C_OPPORTUNITY`: Additional tax deduction headroom change $\ge ₹25,000$.

### User Action Policies
- **`SNOOZE`**: Accepts `snoozeDays` validated strictly in range $[1, 30]$ days.
- **`DISMISS`**: Enforces rule-specific dismissal cooldown ($2\times$ standard cooldown period) without permanently hiding issues.
- **`RESOLVED` vs `STALE` Lifecycle Semantics**:
  - `RESOLVED`: The underlying financial risk condition is verified as cleared/fixed (e.g. policy renewed, 80C invested).
  - `STALE`: The baseline Digital Twin state hash changed ($H_{\text{new}} \ne H_{\text{old}}$), invalidating the previous recommendation context and requiring re-evaluation.

---

## 8. Database Schema (`018_proactive_triggers_and_cooldowns.ts`)

```sql
-- 1. Cooldown Registry Table
CREATE TABLE IF NOT EXISTS proactive_cooldown_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  rule_code TEXT NOT NULL,
  rule_version TEXT NOT NULL DEFAULT '2026.1',
  entity_id TEXT NOT NULL DEFAULT 'FAMILY',
  last_triggered_at TEXT NOT NULL,
  cooldown_until TEXT NOT NULL,
  last_state_hash TEXT NOT NULL,
  last_metric_value REAL,
  status TEXT CHECK(status IN ('ACTIVE', 'COOLDOWN', 'DISMISSED', 'SNOOZED')) DEFAULT 'COOLDOWN',
  snoozed_until TEXT,
  dismissed_at TEXT,
  dismiss_reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id),
  UNIQUE(family_id, rule_code, entity_id)
);

-- 2. Proactive Triggers Table (Authoritative Store)
CREATE TABLE IF NOT EXISTS proactive_triggers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trigger_id TEXT UNIQUE NOT NULL,
  family_id INTEGER NOT NULL,
  rule_code TEXT NOT NULL,
  rule_version TEXT NOT NULL DEFAULT '2026.1',
  entity_id TEXT NOT NULL DEFAULT 'FAMILY',
  urgency TEXT CHECK(urgency IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')) NOT NULL,
  priority_score INTEGER NOT NULL DEFAULT 50,
  confidence_pct REAL NOT NULL,
  data_completeness_score REAL NOT NULL,
  headline TEXT NOT NULL,
  rationale TEXT NOT NULL,
  evidence_payload_json TEXT NOT NULL DEFAULT '{}',
  explainability_lineage_json TEXT NOT NULL DEFAULT '{}',
  action_payload_json TEXT NOT NULL DEFAULT '{}',
  state_hash TEXT NOT NULL,
  as_of_date TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  status TEXT CHECK(status IN ('ACTIVE', 'ACKNOWLEDGED', 'SNOOZED', 'DISMISSED', 'RESOLVED', 'STALE', 'EXPIRED')) DEFAULT 'ACTIVE',
  snoozed_until TEXT,
  resolved_at TEXT,
  resolved_reason TEXT,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id)
);

CREATE INDEX IF NOT EXISTS idx_proactive_triggers_family_status ON proactive_triggers(family_id, status);
CREATE INDEX IF NOT EXISTS idx_proactive_triggers_rule ON proactive_triggers(family_id, rule_code);
CREATE INDEX IF NOT EXISTS idx_cooldown_lookup ON proactive_cooldown_registry(family_id, rule_code, entity_id);
```

---

## 9. REST API Design

All endpoints strictly resolve family scope via `CorrelationContext.getFamilyId()`.

- `GET /api/v1/family-office/proactive/triggers`: Lists active/filtered proactive triggers for the authorized family.
- `POST /api/v1/family-office/proactive/evaluate`: Runs targeted rule evaluation against latest state (idempotent, no duplicate trigger spam).
- `GET /api/v1/family-office/proactive/triggers/:id/explain`: Returns 5-Point Explainability Lineage for a trigger.
- `POST /api/v1/family-office/proactive/triggers/:id/acknowledge`: Idempotently marks trigger acknowledged.
- `POST /api/v1/family-office/proactive/triggers/:id/snooze`: Idempotently snoozes trigger ($1 \le \text{days} \le 30$).
- `POST /api/v1/family-office/proactive/triggers/:id/dismiss`: Idempotently dismisses trigger with reason.
- `POST /api/v1/family-office/proactive/triggers/:id/resolve`: Idempotently marks trigger resolved.

---

## 10. Audit Trail Catalog

All events are published via `AuditHookService` with sanitized payloads:
1. `PROACTIVE_TRIGGER_CREATED`: Logged when a new trigger passes confidence/cooldown gates.
2. `PROACTIVE_TRIGGER_ACKNOWLEDGED`: Logged when user views/acknowledges trigger.
3. `PROACTIVE_TRIGGER_SNOOZED`: Logged when user snoozes trigger.
4. `PROACTIVE_TRIGGER_DISMISSED`: Logged when user dismisses trigger with reason.
5. `PROACTIVE_TRIGGER_RESOLVED`: Logged when condition is verified resolved (manually or auto-cleared).

---

## 11. Testing & Verification Strategy

- **Baseline Test Assertion Count**: **289 PASSED, 0 FAILED**.
- **Sprint 8B.3 Test Suite (`backend/src/__tests__/sprint8b3/proactiveObserver.test.ts`)**:
  1. **9 Core Rule Evaluations**: Verified against active family dataset (Drift, Concentration, Renewal, HLV Gap, Emergency Fund, Excess Cash, Goal Drift, 80C Opportunity, Nominee Gap).
  2. **Domain Data Completeness Gating**: Tests skipping rules when domain data completeness is below threshold ($S < 0.75$).
  3. **Confidence Gating**: Tests skipping rules when evidence confidence $< 85\%$.
  4. **Cooldown Registry Enforcement**: Tests suppression of duplicate triggers during active cooldown window.
  5. **Material Shift Override**: Tests bypassing cooldown when financial drift $\Delta \ge \Delta_{\text{mat}}$.
  6. **Stale vs Resolved Semantics**: Tests transition to `RESOLVED` when cleared and `STALE` when state hash shifts without clearing.
  7. **Snooze Bounds Validation**: Tests rejection of snooze periods outside $1..30$ days.
  8. **Idempotency & Concurrency**: Tests parallel mutations using `idempotencyMiddleware`.
  9. **Cross-Family Security Scope Isolation**: Tests 403 Forbidden on mismatched family context.
  10. **Sanitized Audit Trail Provenance**: Tests absence of raw PII in audit records.
  11. **Performance Benchmark**: Target $\le 250$ms for targeted rule evaluation across the family dataset.
- **Master Test Harness Regression**: `npm test` runs all 31 test sections, advancing from 289 to $\ge 310$ passed assertions with **0 failures**.
