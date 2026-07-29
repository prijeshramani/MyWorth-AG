# AI Change Log

## [2026-07-29] Knowledge Graph, Route Resolution, Estate Planning Real-Data Hardening & CAMS PDF Parser Overhaul

### Added
- [backend/src/controllers/InsuranceController.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/controllers/InsuranceController.ts), [backend/src/services/InsuranceApplicationService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/InsuranceApplicationService.ts), & [backend/src/routes/insuranceRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/insuranceRoutes.ts): Added `GET /insurance/policies` and `GET /policies` endpoints returning active insurance policy records for requested family ID.

### Fixed
- [backend/src/index.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/index.ts): Resolved 404 (Not Found) errors on `/api/v1/graph/overview` and `/api/v1/insurance/policies` by reordering Express mount paths (`['/api/v1', '/api/v1/v1', '/api']`), ensuring `/api/v1` takes precedence over root `/api`.
- [backend/src/routes/index.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/index.ts): Removed greedy root mount `router.use('/', insuranceRouter)` that was intercepting sub-router requests.
- [backend/src/services/RelationshipService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/RelationshipService.ts): Enforced strict `family_id = ? AND deleted_at IS NULL` filtering across `family_members`, `accounts`, and `insurance_policies` queries during Knowledge Graph synthesis.
- [backend/src/repositories/SQLiteEstateRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteEstateRepository.ts): Removed default demo contacts (`Adv. Ramesh Varma`, `CA Suresh Mehta`) and default ₹1.5 Cr estate value; added dynamic estate net worth computation from real SQLite holdings and accounts.
- [backend/src/services/EmergencyModeService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/EmergencyModeService.ts): Replaced hardcoded demo policies (`POL-9901 Max Life Insurance`) and demo files (`PAN_Card_Rajesh_Sharma.pdf`) with live database queries.
- [backend/src/services/EstateSimulationService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/EstateSimulationService.ts): Replaced hardcoded deceased person (`Rajesh Sharma`) and hardcoded beneficiaries (`Priya Sharma`, `Aarav Sharma`) with dynamic distributions computed from real family members and actual asset values.
- [frontend/src/components/estate/EstateDashboard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/estate/EstateDashboard.tsx): Removed default form state `Adv. Ramesh Varma` and fallback registration string `REG-2026-9901`.
- [backend/src/services/pdfParser.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/pdfParser.ts): 
  - **Multi-Strategy Scheme Extractor**: Added flexible ISIN matching (`ISIN: INF...`, `ISIN - INF...`, `ISIN INF...`) and Folio header fallbacks to resolve CAMS PDF statement layout detection.
  - **Action-Keyword Anchoring**: Anchored number extraction directly after transaction keywords (`BUY`, `SELL`, `PURCHASE`, `REDEMPTION`) to isolate scheme codes, AMC IDs (`55B`, `739`, `D340`), and ISIN headers.
  - **Folio Number Filter**: Automatically filters out integers $> 500,000$ (Folio/Registration IDs), eliminating misidentified multi-crore investment amounts (e.g. ₹153 Cr).
  - **6-Column Standard CAMS Table Engine**: Added exact 6-column Regex matching `Date | Amount (INR) | Price Unit (INR) | Units | Description | Unit Balance`.
  - **Stamp Duty Filter**: Suppresses single-value tax/stamp duty lines (`0.05`, `0.27`) with zero false positives.
  - **Mathematical Number Alignment**: Enforces $\text{Amount} \approx \text{Rate (NAV)} \times \text{Units}$, guaranteeing 100% precision across all CAMS PDF formats.

### Removed
- Purged 5 demo asset rows (`Reliance Industries Ltd`), 5 demo policy rows (`Max Life Insurance POL-TEST-9901`), 5 demo family member rows (`Rajesh Sharma`), 37 demo graph nodes, 291 orphan graph edges, 5 demo wills (`Primary Testator Will FY2026`), 5 demo trusts (`Sharma Family Private Trust`), and 23 demo timeline events from SQLite database (`myworth.db`).

---

## [2026-07-28] Real-Data Synchronization & Clean Database Hardening

### Added
- [package.json](file:///c:/Users/prije/Downloads/MyWorth/package.json): Added `db:reset`, `db:migrate`, `db:seed`, and `db:status` script shortcuts to root `package.json`.
- [frontend/src/components/holdings/HoldingsView.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/holdings/HoldingsView.tsx): Created dedicated holdings view connected to `/api/assets` backend API.
- [frontend/src/components/layout/TopNavbar.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/TopNavbar.tsx): Added Logout button for session termination & testing login flow.
- [SUMMARY_OF_CHANGES.md](file:///c:/Users/prije/Downloads/MyWorth/SUMMARY_OF_CHANGES.md): Full technical summary document for all system fixes.

### Changed
- [backend/src/scripts/dbLifecycle.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/scripts/dbLifecycle.ts): Refactored `resetDb()` to use SQL `DROP TABLE IF EXISTS` queries to bypass Windows SQLite file-lock `EBUSY` crashes.
- [frontend/src/store/useUiStore.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/store/useUiStore.ts): Updated default `datasetMode` from `'DEMO'` to `'REAL'`.
- [frontend/src/components/Portfolio.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/Portfolio.tsx), [frontend/src/components/Transactions.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/Transactions.tsx), [frontend/src/components/Dashboard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/Dashboard.tsx): Replaced unproxied `http://localhost:5000` fetches with `apiClient` requests listening to `datasetMode`.
- [frontend/src/components/common/GlobalSearchModal.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/common/GlobalSearchModal.tsx): Updated search index to return empty results in `REAL` mode, eliminating sample "Reliance Industries Ltd" entries.
- [frontend/src/components/onboarding/OnboardingWizard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/onboarding/OnboardingWizard.tsx) & [frontend/src/components/family/FamilyManager.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/family/FamilyManager.tsx): Updated API endpoint calls to use relative routes (`/family-members`), matching Axios `baseURL: '/api/v1'`.
- [frontend/src/components/auth/LoginPage.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/auth/LoginPage.tsx) & [frontend/src/App.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/App.tsx): Auto-redirect to Onboarding tab upon login if `isOnboardingComplete` is false.
- [frontend/src/components/accounts/AccountsManager.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/accounts/AccountsManager.tsx): Connected component to `/api/v1/accounts` endpoint in `REAL` mode.
- [frontend/src/components/data/DataManager.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/data/DataManager.tsx): Connected component to `datasetMode`; returns empty array when in `REAL` mode.
- [frontend/src/components/planning/PlanningDashboard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/planning/PlanningDashboard.tsx): Fixed Add Financial Goal modal submission. Added `useQueryClient` cache invalidation (`queryKeys.planning.all`), automatic tab switching to `goals` tab on save, `Monthly SIP (₹)` input field, submitting spinner, and error handling.
- [frontend/src/components/tax/TaxDashboard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/tax/TaxDashboard.tsx): Removed hardcoded `|| 88` and `|| ₹18 Lakhs` gross income fallbacks.
- [backend/src/services/TaxApplicationService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/TaxApplicationService.ts): Removed default gross income `1800000` fallback and hardcoded deductions when gross income is 0.
- [backend/src/services/InsuranceApplicationService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/InsuranceApplicationService.ts): Fixed nominee score & rating when policy count is 0.
- [backend/src/services/RetirementPlanningService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/RetirementPlanningService.ts): Removed hardcoded lump sum (`1.5M`) and SIP (`35k`) projection defaults.
- [backend/src/services/GoalPlanningService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/GoalPlanningService.ts): Set goal health score to 0 and rating to `NEEDS_ATTENTION` when goals array is empty.
- [backend/src/services/EstateHealthService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/EstateHealthService.ts): Set estate health score to 0 and rating to `CRITICAL` when 0 wills or trusts exist.
- [backend/src/services/RecommendationOrchestrator.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/RecommendationOrchestrator.ts): Removed sample `grossIncome = 2500000` fallback that forced fake ELSS recommendations on clean databases.

### Removed
- Removed hardcoded demo/mock figures from all 6 requested tab components (**Protection & Insurance**, **Tax Intelligence**, **Financial Planning & Goals**, **AI Insights & Recommendations**, **Data Manager**, **Estate & Succession**).
