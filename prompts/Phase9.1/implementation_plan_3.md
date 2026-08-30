# Sprint 9.1: Family Financial Onboarding & Actionable Completeness (Expanded Implementation Plan)

## Executive Summary & Architecture Reconciliation
This expanded implementation plan provides the complete, unabridged architectural details required for Sprint 9.1 production approval:

1. **Actual `X-Family-Id` Audit Table**: Full analysis of `app.ts`, `authenticateMiddleware.ts`, `CorrelationMiddleware.ts`, and downstream repositories, with exact code modification making JWT `user.familyId` immutable.
2. **Complete 4-Stage Onboarding Journey**: Detailed table mapping purpose, domains touched, existing reused forms/APIs, field strictness (required vs. conditional vs. optional), and skip/defer support.
3. **Initial 8-Action Registry**: Full table with detection conditions, resolution conditions, capabilities unlocked, impact levels, and deep-link routes based on existing domain entities.
4. **Final Deterministic Lexicographical Ranking**: 5-tier comparator (Category > Impact > Multi-Pillar > Capabilities Count > Stable Alphabetical Tie-Breaker) with zero arbitrary numeric weights.
5. **Clear Separation of Responsibilities**: `DigitalTwinService` (completeness) $\to$ `ActionGapAnalyzer` (gap translation) $\to$ `ActionRankingEngine` (ranking) $\to$ `FamilyCompletenessController` (authoritative response).
6. **Comprehensive Invariant Test Plan**: Action-by-action detection/resolution/isolation test matrix + 6 mandatory architectural invariant tests.

---

## User Review Required

> [!IMPORTANT]
> **Key Architecture Guarantees**:
> 1. **Zero Database Migrations**: All onboarding progress and action states are derived dynamically from authoritative domain records in SQLite.
> 2. **Zero Parallel Financial Models**: The wizard is strictly an orchestration layer submitting to existing domain APIs.
> 3. **Immutable Tenant Boundaries**: Authenticated JWT `user.familyId` strictly overrides client-supplied headers, query parameters, or request bodies.
> 4. **No Static Score Promises**: Action contracts describe qualitative impact and unlocked capabilities, leaving score calculations solely to `DigitalTwinService`.

---

## Proposed Implementation Sequence

- **Phase 1: Security Hardening** (`CorrelationMiddleware.ts` JWT precedence).
- **Phase 2: Backend Contracts & Ranking Engine** (`familyOfficeContracts.ts`, `ActionRankingEngine.ts`).
- **Phase 3: Service & Controller Integration** (`DigitalTwinService.ts`, `FamilyCompletenessController.ts`, `GET /api/v1/family-office/completeness/actions`).
- **Phase 4: Backend Automated Tests** (`onboardingCompleteness.test.ts`, `nextBestActionRanking.test.ts`, `serverAuthoritativeScopeSecurity.test.ts`).
- **Phase 5: Frontend API & Next-Best-Action Panel** (`digitalTwinService.ts`, `NextBestActionPanel.tsx`, `Dashboard.tsx`).
- **Phase 6: Progressive Onboarding Orchestration** (`OnboardingWizardModal.tsx` reusing modular sub-forms with skip/defer).
- **Phase 7: Frontend Build & Master Regression Verification** (`npm run build`, `npm test` 400+ tests).

---

## Verification Plan

### Automated Tests
- `npm test` in `backend/`: Verify master test suite (400+ tests) + 8-action detection/resolution/isolation tests + 6 mandatory invariant test suites:
  1. `10.1 No False Completion`
  2. `10.2 Skip Does Not Hide Gap`
  3. `10.3 Dynamic Recalculation`
  4. `10.4 No Static Score Promise`
  5. `10.5 Family Scope Security`
  6. `10.6 Data Integrity Precedence`
- `npm run build` in `frontend/`: Verify 0 compilation errors across all new components and hooks.
