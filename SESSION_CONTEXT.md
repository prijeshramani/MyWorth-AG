# Session Context & Active Sprints

- **Current Version**: `v2.7.0`
- **Active Phase**: `Phase 8B – Core Family Office Engine Foundation`
- **Status**: `Sprint 8B.2 COMPLETE (289/289 Backend Tests Passing). Ready for Sprint 8B.3 (Proactive Fiduciary AI Observer).`

---

## Active Sprint Deliverables
1. **Sprint 8B.2: Life Events Engine & Multi-Domain Consequence Propagation (COMPLETE)**:
   - **Database Migration (`017_life_events.ts`) & Repository (`SQLiteLifeEventRepository.ts`)**: Schema for lifecycle milestones with explicit provenance (`baseline_state_hash`, `baseline_as_of`, `rule_version`).
   - **Core Engine (`LifeEventEngineService.ts`)**: Declaration ingestion, candidate detection, 10-event deterministic consequence propagation across Tax, Protection Shield, Cashflow, and Goals based on `DigitalTwinState`.
   - **Human Fiduciary Approval Gate**: Enforces read-only simulation by default; requires explicit approval (`POST /process`) to confirm evaluation without silent mutations.
   - **Sanitized Fiduciary Audit**: Publishes `LIFE_EVENT_DECLARED`, `LIFE_EVENT_PROCESSED`, and `LIFE_EVENT_DISMISSED` via `AuditHookService`.
   - **REST API (`LifeEventController.ts` & `lifeEventRoutes.ts`)**: Mounted endpoints with idempotency middleware and strict dynamic family scope authorization.
   - **Documentation Deliverables**: `docs/LIFE_EVENTS_ARCHITECTURE.md`, `docs/LIFE_EVENTS_CONSEQUENCE_MATRIX.md`, `docs/LIFE_EVENTS_DATA_MODEL.md`.
   - **Sprint 8B.2 Test Suite**: 20 dedicated assertions in `backend/src/__tests__/sprint8b2/lifeEvents.test.ts` advancing master test suite from 269 to 289 passing tests with 0 failures.

2. **Sprint 8B.1: Digital Twin Foundation & State Hydration (COMPLETE)**:
   - **Digital Twin Orchestration (`backend/src/services/familyOffice/DigitalTwinService.ts`)**: Core orchestration service hydrating the 5-pillar `DigitalTwinState` (Lineage, Balance Sheet, Protection Shield, Trajectory, Governance) as an in-memory semantic projection over authoritative SQLite tables.
   - **Deterministic 5-Pillar Completeness Model**: Multi-domain mathematical scoring engine ($15\%$ Lineage, $25\%$ Balance Sheet, $25\%$ Protection, $20\%$ Trajectory, $15\%$ Governance) with status tiering (`COMPLETE`, `PARTIAL`, `INSUFFICIENT_DATA`).
   - **Zero Artificial Fallback Safeguards**: Removed arbitrary ₹2.5 Cr HLV and placeholder names; missing data returns explicit `null` with status `'UNKNOWN'` or `'INSUFFICIENT_DATA'`.
   - **Canonical State Hashing & Provenance**: Deterministic SHA-256 state hash ($H_{\text{state}}$) excluding volatile metadata; explicit point-in-time freshness timestamps (`latestPriceDate`, `latestTransactionDate`, `latestPolicySyncDate`, `latestGraphSyncDate`).
   - **Fiduciary Audit & Deduplication**: Integrated with `AuditHookService` publishing `DIGITAL_TWIN_HYDRATED` to `ai_audit_trail` with sanitized payload and duplicate write suppression.
   - **REST API & Security**: `GET /api/v1/family-office/digital-twin` and `GET /api/v1/family-office/digital-twin/completeness` with strict runtime authorized family scope resolution.
   - **Architecture Documentation**: `docs/DIGITAL_TWIN_ARCHITECTURE.md` and `docs/DIGITAL_TWIN_DATA_SOURCE_MATRIX.md`.
   - **Sprint 8B.1 Test Suite**: 31 dedicated assertions in `backend/src/__tests__/sprint8b1/digitalTwin.test.ts` advancing master test suite from 238 to 269 passing tests with 0 failures.

2. **Sprint 8B.0: Contracts, Correlation, Idempotency & Audit Infrastructure (COMPLETE)**:
   - **Data Contracts (`backend/src/contracts/familyOfficeContracts.ts`)**: Strongly typed Zod schemas for `EventEnvelopeSchema`, `ApiResponseEnvelopeSchema`, `DigitalTwinStateSchema`, `LifeEventDeclarationInputSchema`, `LifeEventCandidateSchema`, `LifeEventConsequenceSchema`, `ObserverRuleCodeEnum`, `ProactiveTriggerSchema`, and `ExplainabilityLineageSchema`.
   - **Correlation & Async Context (`backend/src/infrastructure/correlation/CorrelationContext.ts` & `correlationMiddleware.ts`)**: Node.js `AsyncLocalStorage` correlation store propagating `correlationId`, `causationId`, `familyId`, and `userId` across asynchronous call chains with zero parameter pollution.
   - **SQLite Idempotency Framework (`backend/src/db/migrations/016_idempotency_keys.ts` & `backend/src/repositories/SQLiteIdempotencyRepository.ts` & `idempotencyMiddleware.ts`)**: Atomic key reservation, request payload hashing (`request_hash`), response caching with `X-Cache: IDEMPOTENT_HIT`, and expired key purging.
   - **Fiduciary Audit Hooks & Event Bus (`backend/src/infrastructure/audit/AuditHookService.ts`)**: In-process pub/sub event bus validating Zod envelopes, auto-attaching active `correlationId`, dispatching subscribers, and logging immutable audit records to `ai_audit_trail`.
   - **Sprint 8B.0 Test Harness (`backend/src/__tests__/sprint8b0/`)**: 23 dedicated unit tests across contracts, correlation context, idempotency, and audit hooks integrated into master test suite with 238/238 passing tests.
   - **Dynamic Family Scoping & Hardcoded ID Purge**: Purged static `familyId = 1` assumptions across documentation and services (`SearchService`, `AIContextAggregator`, `AIAdvisorService`, `NotificationService`, `WhatIfSimulationEngine`, `RelationshipService`, `DashboardApplicationService`).

2. **Phase 8A: Personal Family Office Architecture Deliverables**:
   - **Family Office Vision (`docs/FAMILY_OFFICE_VISION.md`)**: Comprehensive philosophy and 10 pillars of the Personal Family Office OS.
   - **Family Digital Twin (`docs/FAMILY_DIGITAL_TWIN.md`)**: Unified semantic state machine integrating Lineage, Balance Sheet, Protection Shield, Trajectory, and Governance over SQLite & Knowledge Graph.
   - **Life Events Engine (`docs/LIFE_EVENTS_ENGINE.md`)**: Event-driven consequence propagation for Childbirth, Marriage, Salary shifts, Home purchases, Loan closures, and Retirement.
   - **Proactive AI Architecture (`docs/PROACTIVE_AI_ARCHITECTURE.md`)**: Autonomous fiduciary observer with confidence gating ($>85\%$), cooldown timers, and noise suppression.
   - **Family Financial Health Index (`docs/FAMILY_FINANCIAL_HEALTH.md`)**: Composite 0–100 index aggregating Protection, Liquidity, Retirement, Estate, and Tax.
   - **Family Timeline (`docs/FAMILY_TIMELINE.md`)**: Unified multi-domain chronological narrative and historical milestone ledger.
   - **AI Memory Model (`docs/AI_MEMORY_MODEL.md`)**: 4-Tier memory boundary strictly isolating Authoritative Truth, User Mandates, Episodic Chat Memory, and Derived Inferences.
   - **AI Explainability (`docs/AI_EXPLAINABILITY.md`)**: 5-Point Fiduciary Lineage Standard (*Why? Evidence? Rule? Calculation? Freshness?*).
   - **Financial Time Machine (`docs/FINANCIAL_TIME_MACHINE.md`)**: Retroactive point-in-time balance sheet reconstruction and zero-mutation What-If sandbox.
   - **Family Command Center (`docs/FAMILY_COMMAND_CENTER.md`)**: Decision-centric UX prioritizing actionable items over widget clutter.
   - **User Journeys (`docs/USER_JOURNEY_MAPS.md`) & Personas (`docs/USER_PERSONAS.md`)**: 4 end-to-end fiduciary journeys and 5 household archetypes.
   - **Phase 8 Strategic Roadmap (`docs/PHASE_8_ROADMAP.md`)**: Phased execution plan spanning 8A through 8F.
   - **Comprehensive Review Report (`docs/PHASE_8A_ARCHITECTURE_REVIEW.md`)**: Component reuse assessment, database schema additions, and implementation plan.
2. **AI Insights & Intelligent Recommendations Engine Overhaul**:
   - **Dynamic Term Life Insurance Evaluation**: Replaced static mock values with live SQLite database queries in `RecommendationOrchestrator.ts`. Correctly evaluates active term policies against the ₹2.5 Cr HLV requirement and generates `Term Life Insurance Target Achieved` confirmation card when coverage is satisfied (e.g. ₹3.01 Cr total coverage).
   - **Dynamic Section 80C Tax Evaluation**: Aggregates actual investments in EPF, PPF, SSY, and ELSS (₹21,58,503) and outputs `Section 80C Limit Fully Maximized`.
   - **Dynamic Net Estate Valuation**: Formats actual net estate valuation (₹0.57 Cr) for Will succession planning recommendations.
   - **Accept/Dismiss Action Persistence**: Updated `saveRecommendation()` in `SQLiteRecommendationRepository.ts` to check if a user decision (`ACCEPTED`, `DISMISSED`, `COMPLETED`) exists, preventing accepted recommendation cards from resurrecting back as active on refetch.
   - **Accurate Metric KPI Cards**: Replaced fallback `|| 1` and `|| 16500000` in `RecommendationsDashboard.tsx` with nullish coalescing (`?? 0`), resolving misleading "1 Critical Action Items" and fake impact totals when 0 open risks exist.
2. **Global Search API SQL Schema & Null-Safety Fix**:
   - Resolved `500 Internal Server Error` on `GET /api/v1/search/query`.
   - Updated SQL queries in `SearchService.ts` to match the actual SQLite database schema (`assets` joined with `family_members` and `asset_prices`, `family_members.pan`, `insurance_policies.id`, and `financial_goals`).
   - Added isolated `try-catch` blocks around each entity query for maximum fault tolerance.
3. **Import Center Expansion**:
   - **EPF & INDMoney Statements**: EPF and INDMoney order book statement parsing and imports.
   - **Upstox & AngelOne Stock Imports**: AngelOne stocks import (13 holdings worth ₹1,18,410.01) and Upstox API sync for family members.
4. **NPS Multi-FY Scheme & Tier I/II Account Separation**:
   - Multi-FY scheme tracking across historical NPS statements.
   - Tier I vs Tier II PRAN sub-account separation (`PRAN-T1` vs `PRAN-T2`) with custom UI badges (`NPS Tier I`, `NPS Tier II`).
5. **Zerodha Kite OAuth Redirect Decoupling**:
   - Decoupled `App.tsx` and `ImportCenter.tsx` state by having `ImportCenter` read `window.location.search` directly on mount.
   - Added top-level React `ErrorBoundary` in `App.tsx` for crash prevention.
6. **Insurance Policy Floater Fields & API 500 Fix**:
   - Added `is_family_floater` & `covered_member_ids` columns via `015_insurance_floater_fields.ts` migration.
   - Added safe `policyHolderId` fallback in `InsuranceApplicationService.ts`.
7. **Bank & Broker Accounts Manager Theme & Family Member Ownership Fix**:
   - Added **Primary Account Holder** dropdown in `AccountsManager.tsx` modal form allowing assignment to any active family member.
   - Fixed Light/Dark theme styles for modal popup and accounts table.
   - Updated `POST /api/assets` (`backend/src/routes/assets.ts`) to persist `family_member_id` and insert initial opening balance into `asset_prices` table immediately (e.g. Bank of Baroda ₹3,340.40).
8. **Graphify Codebase Knowledge Graph**:
   - Rebuilt codebase AST dependency graph via `graphify update .` (1,274 nodes, 1,662 edges, 224 communities).

---

## Session Context & System State

## Current Active Configuration
- **Environment**: Development / Local Execution
- **OS**: Windows 11
- **Database Engine**: SQLite 3 via `better-sqlite3` (`data/myworth.db`)
- **Default Dataset Mode**: `REAL` (All UI components default to live SQLite queries with 0-state fallbacks for empty databases)
- **Authentication**: Pre-configured dev user (`rajesh@sharma.family`, Family ID: 1). Logout button enabled in [TopNavbar.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/TopNavbar.tsx) to test [LoginPage.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/auth/LoginPage.tsx).

---

## Active Session Milestones
1. **DB Lifecycle Reset Engine**: Fully operational with `npm run db:reset`. Dynamic table drops resolve Windows file lock issues.
2. **Knowledge Graph & Express Route Precedence**:
   - Fixed 404 Not Found bug on `/api/v1/graph/overview` and `/api/v1/insurance/policies` by correcting Express route mount ordering in [index.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/index.ts).
   - Knowledge Graph renders active nodes & edges populated cleanly from user's imported data.
   - **Idempotent Edge Synchronization**: Made `addEdge()` in [SQLiteKnowledgeGraphRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteKnowledgeGraphRepository.ts) idempotent. Purged 2,103 duplicate active edges from SQLite database, preventing `Active Directed Edges` count from inflating when clicking "Sync Graph".
3. **Indian Tax Intelligence & ITR-Wala E-Filing Module (with Member Selection)**:
   - Fixed 404 Not Found error on `/api/v1/tax/summary` in [TaxApplicationService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/TaxApplicationService.ts) by adding fallback resolution to active families in DB.
   - Enhanced [CapitalGainsCalculator.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/engines/tax/CapitalGainsCalculator.ts) & [itrRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/itrRoutes.ts) to calculate Realized and Unrealized Capital Gains across stock/MF holdings.
   - Added **Family Member Selector Dropdown** in [ITRFilingCenter.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/tax/ITRFilingCenter.tsx) so users can filter Capital Gains and generate official ITR JSON files for individual family members under their respective PANs!
4. **INDMoney API Trading & 2FA TOTP Integration**:
   - Built 2FA TOTP authentication engine in [indmoneyService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/indmoneyService.ts) matching [INDstocks API Trading](https://www.indstocks.com/app/api-trading/access-tokens).
   - Dynamic 6-digit TOTP codes generated offline via Node `crypto` using `indmoney_totp_secret`.
   - Updated [ImportCenter.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ImportCenter.tsx) with credentials form (`Client ID`, `API Secret`, `2FA TOTP Secret Key`) and 1-Click automated sync button.
   - Added **Portfolio Holder Selection Card** to [ImportCenter.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ImportCenter.tsx).
   - Added `family_member_id` support to `assets` and `accounts` in [db.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db.ts) and [import.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/import.ts).
   - Added **Investment Holder Badges, In-Place Reassignment Dropdowns**, and **Family Member Filter Tab Bar** to [HoldingsView.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/holdings/HoldingsView.tsx) & [HoldingTable.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ui/HoldingTable.tsx).
   - Added `PUT /api/assets/:id/owner` endpoint in [assets.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/assets.ts) to reassign existing assets/transactions to any family member and automatically update the Knowledge Graph (`PERSON` $\xrightarrow{\text{OWNS}}$ `ASSET`).
4. **Demo Data Purge & Real-Data Hardening**:
   - Completely purged seed demo rows (`Reliance Industries Ltd`, `Rajesh Sharma`, `Max Life Insurance POL-TEST-9901`, `Primary Testator Will FY2026`, `Adv. Ramesh Varma`, `Sharma Family Private Trust`) from SQLite tables (`assets`, `insurance_policies`, `family_members`, `graph_nodes`, `graph_edges`, `wills`, `trusts`, `estate_timeline`, `estate_profiles`).
   - Hardened `RelationshipService.ts`, `SQLiteEstateRepository.ts`, `EmergencyModeService.ts`, and `EstateSimulationService.ts` to compute all figures dynamically from live database tables.
5. **CAMS PDF Parser Engine Overhaul**:
   - Resolved 0-transaction parsing issue by implementing a flexible multi-strategy scheme & ISIN extractor.
   - Fixed misidentified multi-crore investment amounts (e.g. ₹153 Cr) by anchoring on action keywords (`BUY`/`SELL`/`PURCHASE`/`REDEMPTION`) and filtering out integer Folio/Registration numbers ($> 500,000$).
   - Built a 6-column CAMS CAS table regex engine (`Date | Amount | Price/NAV | Units | Description | Unit Balance`) with automatic stamp duty filtering (`0.05`, `0.27`) and mathematical number alignment ($\text{Amount} \approx \text{Rate} \times \text{Units}$).
5. **Real-Data Readiness Verified Across All Navigation Views**:
   - Dashboard
   - Net Worth Console
   - Accounts & BankInsights Sync
   - Holdings
   - Knowledge Graph Explorer
   - Family Hub & Onboarding Wizard
   - Protection & Insurance
   - Tax Intelligence
   - Financial Planning & Goals
   - AI Insights & Recommendations
   - Estate & Succession Planning
   - Data Manager Console
   - Document Vault & Data Quality Center
   - Import Center PDF Parser Engine
6. **Theme Engine & High-Contrast Light Mode Modernization**:
   - Added Theme Toggle Switch (Sun/Moon icons) with `localStorage` persistence and dynamic `html.dark` class toggle.
   - Fixed 5 Light Theme contrast issues: AI Action Center success message banner, Portfolio Cost Basis badge, Cashflow PDF badge, Protection Active status & sum assured text, and Production Readiness Score Card.
7. **Insurance Policy Registration & Governance System**:
   - Added Policy Registration Modal in `ProtectionDashboard.tsx` for Health, Term Life, LIC, ULIP, Endowment, and Critical Illness policies.
   - Added Category Filter Tabs (`All Policies`, `Term Life`, `Health`, `LIC & Savings`) and Table/Grid view switcher.
   - Mounted `/api/v1/insurance/policies` and `/api/v1/policies` endpoints.
8. **Portfolio Analytics Workspace & Scope Filtering**:
   - Added Family Member Scope Filter chip bar (`All Members`, `Rajesh Sharma`, `Priya Sharma`).
   - Added side-by-side Cost Basis vs Current Valuation breakdown across asset classes.
9. **Idempotent AI Recommendations Engine**:
   - Enforced idempotent recommendation generation in `SQLiteRecommendationRepository.ts` by updating existing active recommendations in place and purging duplicate active records upon refresh.
10. **Reports Generator & Executive PDF Engine**:
    - Created dedicated Reports Generator page (`ReportsGenerator.tsx`) featuring 5 statement templates (*Net Worth, Holdings Ledger, Tax Audit, Protection Audit, Estate Digest*), format selectors (`PDF`, `CSV`, `JSON`), and governance options.
    - Created executive binary PDF generator (`pdfGenerator.ts`) using `jsPDF` for 100% Adobe Acrobat-compliant PDF files with deep indigo headers, metric cards, styled data tables, and governance badges.
    - Fixed 404 route error and PDF corruption issue when exporting statements.
11. **Fixed Deposit Accrued Interest & Target Maturity Valuation Engine**:
    - Created [fdValuation.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/utils/fdValuation.ts) utility supporting compounding interest accrual ($A = P \times (1 + r/n)^{n \times t}$) and target maturity progress accrual ($P \times (M/P)^{\text{progress}}$).
    - Integrated accrued FD market values into `GET /api/v1/assets`, `GET /api/v1/dashboard`, `AIContextAggregator.ts`, and `FixedDepositValuationStrategy.ts`.
    - Added explicit form fields on `Portfolio.tsx` modal: Deposit Principal (₹), Target Maturity Amount (₹), Interest Rate (% p.a.), Start Date, and Maturity Date.
12. **Active Family Scope Restoration & System-Wide Null Safety**:
    - Restored Ramani family office dataset (Family ID 6: Prijesh Hiralal Ramani [SELF], Dhvani Prijesh Ramani [SPOUSE], 38 assets, 8,005 transactions) and dynamically routed API requests using `activeFamilyId` from `useUiStore`.
    - Resolved `Cannot read properties of null (reading 'toLowerCase')` on Cashflow & Activity page (`CashFlowDashboard.tsx`).
    - Hardened `Transactions.tsx`, `HoldingTable.tsx`, and `ProtectionDashboard.tsx` against null property dereferencing.
    - Refined primary key auto-migration loop in `db.ts` to inspect existing column data types (`TEXT PRIMARY KEY`).
13. **Build & Test Status**:
    - Backend TypeScript build: **PASSED (0 ERRORS)**
    - Frontend Vite production build: **PASSED (0 ERRORS)**
    - Backend Unit Test Suite: **58/58 PASSED (215 Assertions Green)**

---

## Instructions for Next Session / Developer Commands
- **Reset Database**: `npm run db:reset` (runs migrations 001 through 011 cleanly).
- **Run Application**: `npm run dev` (launches backend Express server on port 5000 and frontend Vite dev server on port 5173).
- **Run Full Build**: `npm run build`
- **Run Backend Tests**: `cd backend && npm test`

