# Proactive Fiduciary AI Observer Architecture (Sprint 8B.3)

---

## 1. Executive Summary & Core Invariant

The **Proactive Fiduciary AI Observer** operates as a deterministic calculation & fiduciary rule evaluation engine that continuously monitors the family office state (via the 5-pillar Digital Twin) without executing autonomous financial actions.

### 🛡️ Strict Fiduciary Invariant
$$\text{Authoritative Data} \longrightarrow \text{Calculation Engine} \longrightarrow \text{Deterministic Observer Rule} \longrightarrow \text{Evidence} \longrightarrow \text{Recommendation} \longrightarrow \text{Cooldown / Deduplication} \longrightarrow \text{Notification} \longrightarrow \text{Human Decision} \longrightarrow \text{Separate Authorized Action}$$

**Under no circumstances does the system execute:**
$$\text{Event} \longrightarrow \text{AI} \longrightarrow \text{Financial Action} \quad (\text{Strictly Prohibited})$$

---

## 2. Invocation Model & System Classification

### Classification: **Evaluation Engine with Targeted Invocation**
For Sprint 8B.3, the observer operates as a high-performance evaluation engine invoked via:
1. **Targeted REST Invocation**: `POST /api/v1/family-office/proactive/evaluate` (with strict family authorization and safety gating).
2. **Domain Event Hooks**: Targeted evaluations triggered by lifecycle events (`LIFE_EVENT_PROCESSED`, `DIGITAL_TWIN_HYDRATED`).
3. **Standing Daemon/Cron Scheduling**: Deferred to application-level runtime packaging.

### 🧠 Deterministic Rule Engine vs AI Clarification
- **Zero AI Hallucination**: AI / LLM is **not** responsible for calculating financial metrics, determining whether a rule condition is true, computing confidence scores, or executing financial mutations.
- **Role of LLM**: In future phases, LLM layers may explain, summarize, or translate already-generated triggers for human family members, but will never override or fabricate deterministic financial evidence.

---

## 3. Observer Architecture & Information Flow

```mermaid
flowchart TD
    subgraph Data Layer
        DT[DigitalTwinService] -->|Hydrated 5-Pillars| POS[ProactiveObserverService]
        DB[(proactive_triggers & proactive_cooldown_registry)] <--> POS
    end

    subgraph Evaluation Pipeline
        POS --> GateCheck{Completeness >= 75% & Confidence >= 85%}
        GateCheck -- Yes --> RuleEval[9 Deterministic Rule Evaluators]
        GateCheck -- No --> Suppress[Suppress Trigger Creation / INSUFFICIENT_DATA]
        RuleEval --> CDCheck{Cooldown Registry Check}
        CDCheck -- Suppressed --> Skip[Skip Duplicate Trigger]
        CDCheck -- Material Override or Window Expired --> AtomicTx[Atomic DB Transaction]
    end

    subgraph Fiduciary Dispatch
        AtomicTx --> Trg[proactive_triggers Record]
        AtomicTx --> Cooldown[proactive_cooldown_registry Update]
        AtomicTx --> Audit[ai_audit_trail Event Dispatch]
        AtomicTx --> Notif[NotificationService Mirror (Presentation Adapter)]
    end

    subgraph Human Control Plane
        Trg --> REST[REST API /api/v1/family-office/proactive]
        REST --> Human[Family Decision Maker]
        Human -->|Acknowledge| REST
        Human -->|Snooze 1..30d| REST
        Human -->|Dismiss with Reason| REST
        Human -->|Resolve with Explanation| REST
    end
```

---

## 4. Event-to-Rule Invocation Matrix

To optimize compute and avoid unnecessary full-table scans, domain events target specific rule subsets:

| Domain Event | Target Rule Subset | Rationale |
| :--- | :--- | :--- |
| `DIGITAL_TWIN_HYDRATED` | All 9 Rules | Full periodic / manual refresh of the family financial twin |
| `PORTFOLIO_VALUATION_CHANGED` | `DRIFT_EQUITY_OVERWEIGHT`, `CONCENTRATION_SINGLE_STOCK` | Asset price movements or trades alter allocations |
| `INSURANCE_POLICY_UPDATED` | `INSURANCE_RENEWAL_DUE`, `PROTECTION_HLV_GAP` | Premium dates or sum assured changes alter protection shield |
| `LIFE_EVENT_PROCESSED` | `PROTECTION_HLV_GAP`, `EMERGENCY_FUND_DEFICIT`, `GOAL_OFF_TRACK_DRIFT`, `TAX_80C_OPPORTUNITY` | Life milestones shift expenses, dependents, and goals |
| `GOAL_UPDATED` | `GOAL_OFF_TRACK_DRIFT` | Target amount or SIP changes alter goal trajectory |
| `TAX_PROFILE_UPDATED` | `TAX_80C_OPPORTUNITY` | Deduction claims or regime elections alter headroom |
| `KNOWLEDGE_GRAPH_SYNCED` | `ESTATE_NOMINEE_GAP` | Entity title, will, or nominee link modifications |

---

## 5. Five-Point Explainability Lineage

Every proactive trigger persists a complete 5-point explainability lineage payload:

1. **Why (`why`)**: Plain-language fiduciary rationale grounded in authoritative calculation.
2. **Evidence (`evidence`)**: Serialized JSON payload containing exact numeric inputs, benchmarks, and deltas.
3. **Rule (`rule`)**: Immutable rule code and version string (e.g. `DRIFT_EQUITY_OVERWEIGHT:2026.1`).
4. **Calculation (`calculation`)**: Originating calculation engine owner and mathematical formula reference.
5. **Freshness (`freshness`)**: Snapshot as-of timestamp establishing point-in-time state provenance.

---

## 6. Key Components & Responsibilities

| Component | File Path | Architectural Role |
| :--- | :--- | :--- |
| **Contracts** | `backend/src/contracts/familyOfficeContracts.ts` | Zod schemas, enums, DTOs for triggers, cooldowns, and actions |
| **Migration** | `backend/src/db/migrations/018_proactive_triggers_and_cooldowns.ts` | Relational tables with composite performance indexes |
| **Repository** | `backend/src/repositories/SQLiteProactiveTriggerRepository.ts` | Type-safe database CRUD with atomic SQLite transactions |
| **Cooldown Service** | `backend/src/services/familyOffice/CooldownRegistryService.ts` | Deterministic SHA-256 trigger ID generation, cooldown math, and materiality delta detection |
| **Observer Engine** | `backend/src/services/familyOffice/ProactiveObserverService.ts` | Core engine evaluating 9 deterministic rules against Digital Twin, gating ($\ge 75\%$), and stale management |
| **REST Controller** | `backend/src/controllers/ProactiveObserverController.ts` | Express controller validating inputs and enforcing server-resolved family scope |
| **Router** | `backend/src/routes/proactiveObserverRoutes.ts` | REST endpoints with idempotency middleware protection |

---

## 7. Security, Scope & Failure Isolation

1. **Server-Resolved Family Scope**: Family ID is derived strictly from `CorrelationContext.getFamilyId()`. No client query or body parameter can tamper with or override family scope.
2. **Idempotency Protection**: All mutating endpoints (`acknowledge`, `snooze`, `dismiss`, `resolve`) are wrapped in `idempotencyMiddleware` using the `X-Idempotency-Key` header.
3. **Notification Failure Isolation**: The `proactive_triggers` record is authoritative. Failures in external notification presentation adapters do not rollback or abort trigger persistence.
4. **Fiduciary Audit Trail**: Every trigger creation, resolution, snooze, and dismissal produces an immutable audit record in `ai_audit_trail` referencing the triggering rule, state hash, correlation ID, and rationale.
