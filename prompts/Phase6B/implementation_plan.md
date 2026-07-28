# Phase 6B Implementation Plan — Estate Planning, Legacy & Wealth Succession

**Goal**: Build a complete, enterprise-grade **Estate Planning, Legacy & Wealth Succession Domain** for FamilyWealthOS consuming the Knowledge Graph layer built in Phase 6B.0. Includes Will Management, Trust Management, Beneficiary Conflict & Gap Resolution, Death Scenario Estate Distribution Simulator, Estate Health Scoring ($S_{\text{Estate}}$), Emergency Mode, and Digital Vault expansion for succession documents.

---

## Architecture Rules & Principles
1. **Knowledge Graph Consumption**: Reuse the canonical Knowledge Graph layer from Phase 6B.0 for all entity relationships (Owners, Nominees, Beneficiaries, Trustees, Executors, Documents). Zero duplicate relationship logic.
2. **Zero Calculation Engine Modifications**: Investment, Portfolio, XIRR, Net Worth, Protection, Tax, and Security engines remain 100% UNTOUCHED.
3. **Strict Multi-Tenancy & Auditability**: Enforce `family_id` filtering and audit logging on all estate operations.
4. **AI & Advisor Readiness**: Expose clean, reusable Estate Query Services for downstream AI Advisor integration.

---

## Proposed Changes

### 1. Database Migration `008_estate_planning.ts`
#### [NEW] [008_estate_planning.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db/migrations/008_estate_planning.ts)
Create SQLite tables:
- `estate_profiles`: `id`, `family_id`, `estate_health_score`, `estate_value`, `primary_executor_id`, `lawyer_contact`, `ca_contact`, `last_reviewed_at`, `created_at`.
- `wills`: `id`, `family_id`, `testator_id`, `title`, `current_version`, `status` ('DRAFT' | 'ACTIVE' | 'REGISTERED' | 'REVOKED'), `registration_number`, `registered_at`, `review_due_date`, `executor_name`, `witness1_name`, `witness2_name`, `document_id`.
- `will_versions`: `id`, `will_id`, `version_number`, `changes_summary`, `document_id`, `created_at`.
- `trusts`: `id`, `family_id`, `trust_name`, `trust_type` ('FAMILY' | 'PRIVATE' | 'CHARITABLE' | 'REVOCABLE' | 'IRREVOCABLE'), `deed_number`, `corpus_amount`, `settlor_id`, `document_id`, `status`.
- `trustees`: `id`, `trust_id`, `person_id`, `trustee_role` ('PRIMARY' | 'CO_TRUSTEE' | 'SUCCESSOR'), `status`.
- `beneficiaries`: `id`, `estate_profile_id`, `person_id`, `entitlement_percent`, `relationship_type`, `notes`.
- `estate_simulations`: `id`, `family_id`, `scenario_name`, `deceased_person_id`, `total_estate_value`, `simulated_distribution_json`, `tax_impact_estimate`, `created_at`.
- `estate_alerts`: `id`, `family_id`, `alert_type`, `severity`, `title`, `description`, `status`.

#### [MODIFY] [db.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db.ts)
- Register `migration008` in migration runner array.

---

### 2. Backend Repositories & Calculation Services
#### [NEW] [SQLiteEstateRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteEstateRepository.ts)
- Data access repository for estate profiles, wills, will versions, trusts, trustees, beneficiaries, and simulations.

#### [NEW] [EstateHealthService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/EstateHealthService.ts)
- Estate Health Scoring Engine calculating $S_{\text{Estate}}$ ($0.25 W_{\text{Will}} + 0.25 N_{\text{Nominee}} + 0.20 T_{\text{Trust}} + 0.15 D_{\text{Doc}} + 0.15 L_{\text{Liquidity}}$).

#### [NEW] [EstateSimulationService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/EstateSimulationService.ts)
- Death Scenario & Inheritance Simulator generating simulated asset allocation trees and legal heir entitlement breakdowns.

#### [NEW] [EmergencyModeService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/EmergencyModeService.ts)
- Emergency mode console service retrieving critical contacts (CA, Lawyer, Doctor, Primary Executor), key insurance policy numbers, and emergency document access links.

#### [NEW] [EstateController.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/controllers/EstateController.ts) & [estateRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/estateRoutes.ts)
- REST endpoints mounted at `/api/v1/estate`:
  - `GET /api/v1/estate/dashboard`
  - `GET /api/v1/estate/health`
  - `GET /api/v1/estate/wills`
  - `GET /api/v1/estate/trusts`
  - `GET /api/v1/estate/emergency`
  - `GET /api/v1/estate/simulation/:scenario`
  - `POST /api/v1/estate/will`
  - `POST /api/v1/estate/trust`
  - `POST /api/v1/estate/simulation`

---

### 3. Backend Unit Tests
#### [MODIFY] [runTests.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/runTests.ts)
- Add Section 25 tests: Estate Profile creation, Will versioning, Trust creation, Estate Health Score computation, Death Scenario Simulator, and REST APIs. (Target: **178+ tests passing**).

---

### 4. Frontend Estate Planning Module
#### [NEW] [estateService.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/estateService.ts) & [useEstateDashboard.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/hooks/useEstateDashboard.ts)
- Typed API client and TanStack Query hooks.

#### [NEW] [EstateDashboard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/estate/EstateDashboard.tsx)
- Complete Estate Planning Dashboard featuring:
  - Estate Health Score ($S_{\text{Estate}}$ Risk Gauge & KPI Cards)
  - Will Manager Panel (Status, Versions, Executors, Review Reminders)
  - Family Trust Manager (Private/Family Trusts, Trustees, Corpus)
  - Inheritance & Death Scenario Distribution Simulator
  - Emergency Mode Quick Action Panel (CA, Lawyer, Insurance, Key Docs)
  - Succession Alert Feed & Timeline

#### [MODIFY] [NavigationDrawer.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/NavigationDrawer.tsx) & [App.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/App.tsx)
- Replace Estate "SOON" badge with active **Estate & Succession** navigation drawer tab and route active tab in `App.tsx`.

---

## Verification Plan

### Automated Build & Unit Tests
- Backend Unit Tests: `npm test` in `backend` (Target: 178+ tests passing).
- Frontend Production Build: `npm run build` in `frontend` (`tsc -b && vite build` completes in ~20s with 0 errors).

### Manual UX Verification
- Navigation to `/estate` tab.
- Testing Will Manager version creation and status tracking.
- Testing Trust Manager trustee assignment.
- Running Death Scenario Distribution Simulation.
- Launching Emergency Mode modal view.
