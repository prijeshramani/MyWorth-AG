# Sprint 9.1 (Revised): Family Financial Onboarding & Actionable Completeness

## Executive Summary & Architecture Reconciliation
Sprint 9.1 establishes a unified, progressive onboarding orchestration flow and a deterministic Next-Best-Action (NBA) engine for **FamilyWealthOS**. This plan incorporates all required review clarifications:
- **Removal of Static Point Gains**: Replaced with qualitative `impactLevel` (`HIGH`, `MEDIUM`, `LOW`) and explicit `affectedCapabilities`.
- **Zero Initial Database Migrations**: Derived dynamic readiness from `DigitalTwinService` with ephemeral frontend state (no Migration 020).
- **Hardened Server-Authoritative Scope**: Authenticated JWT user context strictly overrides client-supplied headers/queries.
- **Dynamic Recalculation & Skip Semantics**: Skipping in the UI never hides data gaps; actions resolve only when authoritative records are persisted.

---

## User Review Required

> [!IMPORTANT]
> **Key Revisions Incorporated**:
> 1. **No Fixed Point Claims**: Action contracts explain *why it matters* and *what capabilities are enabled*, leaving score calculation exclusively to the authoritative `DigitalTwinService`.
> 2. **Ephemeral UI Progress**: No persistent dismissal table is introduced, ensuring critical gaps cannot be permanently suppressed.
> 3. **Bounded Ranked Actions with Top-3 UI Default**: The backend emits all active ranked actions (Category A: Data Integrity > Category B: Missing Foundation > Category C: Enrichment), and the UI displays Top 3 by default with an expandable stream.

---

## Proposed Changes

### 1. Backend Domain Contracts & Security Hardening
- **Modify** `backend/src/infrastructure/correlation/CorrelationMiddleware.ts`: Enforce authenticated JWT `user.familyId` as absolute and immutable over client headers/queries.
- **Modify** `backend/src/contracts/familyOfficeContracts.ts`: Add revised `NextBestActionSchema` (with `impactLevel`, `whyItMatters`, `affectedCapabilities`) and `ActionableCompletenessResponseSchema`.

### 2. Backend Completeness & Action Ranking Engine
- **New** `backend/src/services/familyOffice/ActionRankingEngine.ts`: Deterministic server-side evaluator ranking actions by Priority Tier (A: Data Integrity > B: Missing Foundation > C: Intelligence Enrichment).
- **Modify** `backend/src/services/familyOffice/DigitalTwinService.ts`: Expose `getActionableCompleteness(familyId)` returning overall score, pillar readiness, and all active ranked actions.
- **New** `backend/src/controllers/FamilyCompletenessController.ts` & Route: `GET /api/v1/family-office/completeness/actions`.

### 3. Frontend Onboarding & Next-Best-Action UI
- **New** `frontend/src/components/onboarding/OnboardingWizardModal.tsx`: Progressive 4-stage setup modal reusing existing sub-forms with skip/defer support.
- **New** `frontend/src/components/dashboard/NextBestActionPanel.tsx`: Prominent card stream on Dashboard displaying Top 3 actions with qualitative impact badges, capability tags, and 1-click navigation triggers.
- **Modify** `frontend/src/services/digitalTwinService.ts`: Add `getActionableCompleteness()` API client call.

---

## Verification Plan

### Automated Tests
- `npm test` in `backend/`: Verify master test suite + 6 new invariant test suites:
  1. `10.1 No False Completion`: Step visit without save does not resolve action.
  2. `10.2 Skip Does Not Hide Gap`: Skipping wizard does not alter completeness.
  3. `10.3 Dynamic Recalculation`: Resolution only occurs when underlying domain condition is satisfied.
  4. `10.4 No Static Score Promise`: Contracts contain no fixed numeric score claims.
  5. `10.5 Family Scope Security`: `X-Family-Id` tampering rejected/ignored on authenticated routes.
  6. `10.6 Data Integrity Priority`: Tier A outranks Tier B regardless of incoming data order.
- `npm run build` in `frontend/`: Verify 0 compilation errors across all new components and hooks.
