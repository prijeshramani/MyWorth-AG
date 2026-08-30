# Sprint 9.1: Family Financial Onboarding & Actionable Completeness (Final Revision)

## Executive Summary & Architecture Reconciliation
This final revision incorporates all requirements from the Final Review Comments:
1. **Actual `X-Family-Id` Audit**: Detailed documentation of current vulnerability in `CorrelationMiddleware.ts:17` and the required security hardening where `req.user.familyId` is absolute and immutable.
2. **Defined 4-Stage Onboarding Journey**: Justified stage breakdown (Lineage $\to$ Balance Sheet $\to$ Protection/Tax $\to$ Goals/Succession) with field strictness and skip/defer support.
3. **Deterministic 3-Level Ranking**:
   - Level 1: Priority Category (A: Data Integrity > B: Missing Foundation > C: Intelligence Enrichment > D: Optional Enrichment).
   - Level 2: Internal Weighted Impact Score based on Impact Level + Blocked Capabilities count + Multi-Pillar penalty.
   - Level 3: Stable deterministic tie-breaking (alphabetical on `actionId`).
4. **Initial High-Value Action Registry**: 8 concrete actions mapped to specific detection and resolution conditions.
5. **Separation of Responsibilities**: `DigitalTwinService` (completeness) $\to$ `ActionRankingEngine` (ranking) $\to$ `FamilyCompletenessController` (authoritative routing).
6. **Explicit Invariant Test Strategy**: 6 mandatory test cases including *No False Completion*, *Skip Does Not Hide Gap*, *Dynamic Recalculation*, *No Static Score Promise*, *Family Scope Security*, and *Data Integrity Precedence*.

---

## User Review Required

> [!IMPORTANT]
> **Key Architecture Decisions Finalized**:
> 1. **Security Invariant Hardening**: `CorrelationMiddleware.ts` will strictly ignore client-supplied `X-Family-Id`, `x-family-id`, query params, and body attributes whenever `req.user` is present.
> 2. **Zero Database Migrations**: All onboarding and action states are derived dynamically from authoritative domain records; UI state is ephemeral.
> 3. **Deterministic 3-Level Ranking Engine**: Full server-side ranking guaranteeing stable, reproducible action prioritization without frontend guesswork.

---

## Proposed Implementation Sequence

1. **Step 1 – Security Hardening**: Harden `CorrelationMiddleware.ts` to enforce immutable `user.familyId` precedence for authenticated requests.
2. **Step 2 – Backend Contracts**: Add `NextBestActionSchema` and `ActionableCompletenessResponseSchema` to `familyOfficeContracts.ts`.
3. **Step 3 – Ranking Engine**: Implement `backend/src/services/familyOffice/ActionRankingEngine.ts` with 3-level deterministic ranking.
4. **Step 4 – Service & Controller**: Add `getActionableCompleteness(familyId)` to `DigitalTwinService.ts` and create `FamilyCompletenessController.ts` with route `GET /api/v1/family-office/completeness/actions`.
5. **Step 5 – Backend Tests**: Write and execute `onboardingCompleteness.test.ts`, `nextBestActionRanking.test.ts`, and `serverAuthoritativeScopeSecurity.test.ts`.
6. **Step 6 – Frontend Service**: Update `frontend/src/services/digitalTwinService.ts` to call actionable completeness endpoint.
7. **Step 7 – Next-Best-Action UI**: Create `NextBestActionPanel.tsx` (Top 3 default + expandable stream).
8. **Step 8 – Onboarding Orchestration UI**: Create `OnboardingWizardModal.tsx` (Progressive 4-stage flow reusing existing forms with skip/defer).
9. **Step 9 – Verification**: Run `npm test` across all test suites and `npm run build` in `frontend/`.

---

## Verification Plan

### Automated Tests
- `npm test` in `backend/`: Verify master test suite (400+ tests) + 6 invariant test cases:
  1. `10.1 No False Completion`
  2. `10.2 Skip Does Not Hide Gap`
  3. `10.3 Dynamic Recalculation`
  4. `10.4 No Static Score Promise`
  5. `10.5 Family Scope Security`
  6. `10.6 Data Integrity Precedence`
- `npm run build` in `frontend/`: Verify 0 compilation errors across all new components and hooks.
