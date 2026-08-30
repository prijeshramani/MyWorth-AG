# Sprint 9.1: Family Financial Onboarding & Actionable Completeness

## Executive Summary & Background
Sprint 9.1 establishes a unified, progressive onboarding orchestration flow and a deterministic Next-Best-Action (NBA) engine for **FamilyWealthOS**. This directly addresses the data starvation and entry fragmentation identified in Sprint 9.0, while strictly upholding the mandate that no parallel financial data model is created.

---

## User Review Required

> [!IMPORTANT]
> **Key Architectural Decisions for User Review**:
> 1. **No Parallel Financial Data Model**: The onboarding wizard acts purely as an orchestration layer over existing domain services (`FamilyMemberController`, `AssetMasterService`, `InsuranceController`, `TaxController`, `GoalController`, `EstateController`).
> 2. **Deterministic Server-Side Next-Best-Action Ranking**: The backend `DigitalTwinService` and `ActionRankingEngine` evaluate missing data gaps and emit the top 3 prioritized actions with 1-click resolution deep-links.
> 3. **Security Invariant Hardening (`X-Family-Id`)**: Authenticated JWT user context strictly overrides any client-supplied `X-Family-Id` or query parameters to prevent cross-tenant access.

---

## Proposed Changes

### 1. Backend Domain Contracts & Security Hardening
- **Modify** `backend/src/infrastructure/correlation/CorrelationMiddleware.ts`: Enforce authenticated JWT `user.familyId` as absolute and immutable over client headers.
- **Modify** `backend/src/contracts/familyOfficeContracts.ts`: Add `NextBestActionSchema`, `ActionPriorityCategoryEnum`, and `ActionableCompletenessResponseSchema`.

### 2. Backend Completeness & Action Ranking Engine
- **New** `backend/src/services/familyOffice/ActionRankingEngine.ts`: Deterministic server-side evaluator ranking actions by Priority Tier (A: Data Integrity > B: Missing Foundation > C: Intelligence Enrichment).
- **Modify** `backend/src/services/familyOffice/DigitalTwinService.ts`: Expose `getActionableCompleteness(familyId)` returning overall score, pillar readiness, and ranked top 3 actions.
- **New** `backend/src/controllers/FamilyCompletenessController.ts` & Route: `GET /api/v1/family-office/completeness/actions`.

### 3. Frontend Onboarding & Next-Best-Action UI
- **New** `frontend/src/components/onboarding/OnboardingWizardModal.tsx`: Progressive 4-stage setup modal reusing existing sub-forms.
- **New** `frontend/src/components/dashboard/NextBestActionPanel.tsx`: Prominent card stream on Dashboard displaying top 3 actions with impact badges and 1-click action triggers.
- **Modify** `frontend/src/services/digitalTwinService.ts`: Add `getActionableCompleteness()` API client call.

---

## Verification Plan

### Automated Tests
- `npm test` in `backend/`: Verify master test suite + new invariant suites (`onboardingCompleteness.test.ts`, `nextBestActionRanking.test.ts`, `serverAuthoritativeScopeSecurity.test.ts`).
- `npm run build` in `frontend/`: Verify 0 compilation errors across all new components and hooks.
