# Life Events Engine: System Architecture & Fiduciary Consequence Pipeline

## 1. Executive Summary

In personal family office operations, wealth management adjustments are driven primarily by **Life Events** rather than daily market fluctuation. A child's arrival changes life cover needs and introduces long-term education compounding goals; marriage consolidates household finances and requires health floater additions; salary step-ups expand investable surplus; home acquisitions introduce debt liability and Section 24(b) tax deductions; and retirement milestones pivot portfolios from asset accumulation to Systematic Withdrawal Plan (SWP) drawdown.

The **Life Events Engine (`LifeEventEngineService`)** is an event-driven, deterministic subsystem that:
1. Accepts explicit user life event declarations and detects prospective milestone candidates from account activity.
2. Ingests the point-in-time state from the **Family Digital Twin (`DigitalTwinService`)** as the authoritative baseline.
3. Evaluates multi-domain consequence propagation across **Tax**, **Protection Shield**, **Cashflow**, and **Goals & Trajectory**.
4. Enforces an explicit **Human Fiduciary Approval Gate** before committing long-term plan adjustments.
5. Emits sanitized, immutable audit trail events to `ai_audit_trail` via `AuditHookService`.

---

## 2. Architectural Pipeline

```
+----------------------------------------------------------------------------------------------------+
|                                      LIFE EVENT INGESTION                                          |
|            - Explicit User Declaration (`POST /api/v1/family-office/life-events/declare`)          |
|            - Candidate Detection (`GET /api/v1/family-office/life-events/candidates`)              |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                     AUTHENTICATION & SCOPE                                         |
|       - Scope derived strictly from authenticated session context (`CorrelationContext`)            |
|       - Rejects cross-family parameter overrides with `403 Forbidden`                               |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                    DIGITAL TWIN BASELINE                                           |
|       - In-memory point-in-time projection (`DigitalTwinService.getDigitalTwin(familyId)`)         |
|       - Provenance tracking: `baseline_state_hash`, `baseline_as_of`, `rule_version`               |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                               MULTI-DOMAIN CONSEQUENCE PROPAGATION                                 |
|  +---------------------+  +--------------------+  +---------------------+  +--------------------+  |
|  | Tax Impact          |  | Protection Shield  |  | Cashflow Impact     |  | Goal Impact        |  |
|  | (Sec 80C, 24b, TDS) |  | (HLV Gap, Floater) |  | (Surplus/Deficit)   |  | (Milestone Shift)  |  |
|  +---------------------+  +--------------------+  +---------------------+  +--------------------+  |
|  - Strict Non-Invention: Missing data yields `UNKNOWN` / `INSUFFICIENT_DATA` (No fake numbers)     |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                             HUMAN FIDUCIARY APPROVAL & AUDIT GATE                                  |
|            - Read-only simulation by default                                                       |
|            - `POST /process` records approved evaluation (No silent financial mutations)           |
|            - `POST /dismiss` preserves candidate evidence with audit trace                         |
|            - Publishes `LIFE_EVENT_PROCESSED` / `LIFE_EVENT_DISMISSED` via `AuditHookService`      |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Core Architectural Principles & Invariants

1. **Human-in-the-Loop Fiduciary Guardrail**: Consequence evaluation is strictly a read-only simulation. Approving a life event (`POST /process`) confirms the impact evaluation; it never silently mutates actual bank balances, demat holdings, or insurance policies.
2. **Zero Financial Invention**: If critical facts (such as loan tenure or salary bump) are missing, the engine returns explicit `null` and marks impacts as `UNKNOWN` or `INSUFFICIENT_DATA`.
3. **No Duplicate Financial Database**: Operates strictly as a computable semantic projection over SQLite and domain calculation engines (`TaxCalculationEngine`, `NetWorthEngine`).
4. **Idempotency & Concurrency**: Mutating endpoints enforce atomic SQLite transitions using `idempotencyMiddleware`.
5. **Death of Member Safety Boundary**: `DEATH_OF_MEMBER` triggers emergency estate and insurance claim checklists; automated asset transfer or claim submission is strictly prohibited.
