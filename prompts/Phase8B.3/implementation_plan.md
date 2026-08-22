# Sprint 8B.3 Implementation Plan: Proactive Fiduciary AI Observer & Cooldown Registry

Transition FamilyWealthOS intelligence from reactive query-response to a **proactive, event-driven fiduciary observer with human-controlled actions**.

## User Review Required

> [!IMPORTANT]
> **Strict Fiduciary Invariant**: The Observer operates under a non-negotiable **Zero Financial Invention** and **Zero Autonomous Mutation** boundary. It evaluates deterministic rules via existing domain calculation engines (`TaxCalculationEngine`, `NetWorthEngine`, `EstateHealthService`, `GoalPlanningService`, `DigitalTwinService`) and produces actionable recommendations with full 5-Point Explainability Lineage. It strictly never executes trades, modifies SIPs, reassigns nominees, or alters insurance policies without explicit human confirmation.

## Summary of Refinements from Architectural Review

1. **Terminology**: Clarified as *"Proactive, event-driven fiduciary observer with human-controlled actions"* (no autonomous financial action).
2. **Single Authoritative Record**: The `proactive_triggers` table is the sole authoritative persistence record. `NotificationService` acts as an adapter/presentation layer referencing `triggerId`.
3. **Server-Resolved Family Scope**: Family context is strictly derived from `CorrelationContext.getFamilyId()`.
4. **Rule $\to$ Calculation Owner Matrix**: Explicitly assigns each of the 9 rules to its existing authoritative calculation service.
5. **Separated Identity**:
   - $\text{TriggerId} = \text{familyId} : \text{ruleCode} : \text{entityId} : H_{\text{state}} : \text{ruleVersion}$
   - $\text{CooldownKey} = (\text{familyId}, \text{ruleCode}, \text{entityId})$
6. **Domain-Specific Completeness Gate**: Rules evaluate completeness of the specific domain they depend on ($S_{\text{domain}} \ge 0.75$), rather than relying purely on global scores.
7. **Rule-Specific Materiality Override**: Bypasses active cooldowns only when financial drift shifts beyond $\Delta_{\text{mat}}$ (e.g. $|\Delta\text{Drift}| \ge 2.5\%$).
8. **Explicit Lifecycle**: `ACTIVE` $\to$ `ACKNOWLEDGED` $\to$ `SNOOZED` (1–30 days max) $\to$ `DISMISSED` $\to$ `RESOLVED` (condition cleared) / `STALE` (state hash changed requiring re-evaluation) $\to$ `EXPIRED`.
9. **Persisted Lineage Fields**: Explicit database columns for `family_id`, `rule_code`, `rule_version`, `entity_id`, `state_hash`, `as_of_date`, `data_completeness_score`, `correlation_id`, `expires_at`, `status`.

---

## Proposed Changes

### 1. Data Contracts & Database Migration

#### [MODIFY] [backend/src/contracts/familyOfficeContracts.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/contracts/familyOfficeContracts.ts)
- Extend `ProactiveTriggerSchema` and `ObserverRuleCodeEnum` to include `stateHash`, `dataCompletenessScore`, and `explainabilityLineage`.
- Define `CooldownRecordSchema` and `ProactiveTriggerActionInputSchema` (with $[1, 30]$ days snooze validation).

#### [NEW] [backend/src/db/migrations/018_proactive_triggers_and_cooldowns.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db/migrations/018_proactive_triggers_and_cooldowns.ts)
- Create `proactive_cooldown_registry` table indexed on `(family_id, rule_code, entity_id)`.
- Create `proactive_triggers` table indexed on `(family_id, status)` and `(trigger_id)`.
- Register in [backend/src/db.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db.ts).

---

### 2. Repositories & Services

#### [NEW] [backend/src/repositories/SQLiteProactiveTriggerRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteProactiveTriggerRepository.ts)
- CRUD repository for proactive triggers and cooldown registry management.

#### [NEW] [backend/src/services/familyOffice/CooldownRegistryService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/familyOffice/CooldownRegistryService.ts)
- Enforces rule-level cooldown timers, duplicate key hashing, and rule-specific material shift overrides ($\Delta_{\text{mat}}$).

#### [NEW] [backend/src/services/familyOffice/ProactiveObserverService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/familyOffice/ProactiveObserverService.ts)
- Orchestrates targeted rule execution for the 9 core rules:
  1. `DRIFT_EQUITY_OVERWEIGHT`
  2. `CONCENTRATION_SINGLE_STOCK`
  3. `INSURANCE_RENEWAL_DUE`
  4. `PROTECTION_HLV_GAP`
  5. `EMERGENCY_FUND_DEFICIT`
  6. `EXCESS_IDLE_CASH`
  7. `GOAL_OFF_TRACK_DRIFT`
  8. `TAX_80C_OPPORTUNITY`
  9. `ESTATE_NOMINEE_GAP`
- Evaluates domain completeness ($S_{\text{domain}} \ge 75\%$) and evidence confidence ($\ge 85\%$).
- Invalidates stale triggers (`ACTIVE` $\to$ `STALE` or `RESOLVED`) when state shifts.
- Dispatches `PROACTIVE_TRIGGER_CREATED`, `PROACTIVE_TRIGGER_DISMISSED`, `PROACTIVE_TRIGGER_SNOOZED`, `PROACTIVE_TRIGGER_RESOLVED` via `AuditHookService`.

---

### 3. REST API Controllers & Routing

#### [NEW] [backend/src/controllers/ProactiveObserverController.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/controllers/ProactiveObserverController.ts)
- Endpoints for listing triggers, evaluating rules, acknowledging, snoozing, dismissing, and resolving with server-resolved family scope.

#### [NEW] [backend/src/routes/proactiveObserverRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/proactiveObserverRoutes.ts)
- Mounted at `/api/v1/family-office/proactive` in [backend/src/routes/index.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/index.ts).

---

## Verification Plan

### Automated Tests
- Unit and integration tests in `backend/src/__tests__/sprint8b3/proactiveObserver.test.ts`:
  1. **9 Core Rule Evaluations**: Verified against active family dataset.
  2. **Domain Completeness Gating**: Tests skipping rules when domain data completeness $< 75\%$.
  3. **Confidence Gating**: Tests skipping rules when evidence confidence $< 85\%$.
  4. **Cooldown Enforcement**: Tests suppression of duplicate triggers within the cooldown window.
  5. **Material Change Override**: Tests triggering when financial drift shifts beyond $\Delta_{\text{mat}}$.
  6. **Stale vs Resolved Semantics**: Tests transition to `RESOLVED` when cleared and `STALE` when baseline shifts without clearing.
  7. **Snooze Bounds Validation**: Tests rejection of snooze periods outside $1..30$ days.
  8. **Idempotency & Concurrency**: Tests `/snooze`, `/dismiss`, `/resolve` idempotency key handling.
  9. **Security & Scope Isolation**: Tests 403 rejection on cross-family trigger access.
  10. **Audit Trail Logging**: Tests sanitized audit records in `ai_audit_trail`.
  11. **Performance Benchmark**: Target $\le 250$ms for targeted rule evaluation across the active family dataset.
- Master test harness: `npm test` advances passing assertions from 289 with 0 failures.
