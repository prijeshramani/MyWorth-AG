# Session Context & Active Sprints

- **Current Version**: `v2.9.3`
- **Active Phase**: `Phase 8C – Family Financial Health, Timeline, Time Machine & Command Center`
- **Status**: `Sprint 8C.3 COMPLETE & HARDENED (387/387 Backend Tests Passing, 0 tsc errors). Ready for user sign-off prior to Sprint 8C.4 (Real-Time Collaboration & Family Access Control).`

---

## Active Sprint Deliverables
1. **Sprint 8C.3: Financial Time Machine, Point-in-Time Reconstruction & What-If Simulation Sandbox (COMPLETE & HARDENED)**:
   - **Point-in-Time Historical Reconstruction (`FinancialTimeMachineService.ts`)**: Deterministic multi-pillar economic reconstruction as of any `asOfDate <= CURRENT_DATE` using business-effective transaction dates with explicit mode (`reconstructionMode: 'HISTORICAL_ECONOMIC_STATE'`) and knowledge-time transparency (`knowledgeTimeStatus: 'NOT_FULLY_RECONSTRUCTABLE'`).
   - **5-Level Valuation Hierarchy**: `EXACT_HISTORICAL` (lag=0) $\to$ `PROXY_HISTORICAL` ($\le$ maxAgeDays: 30d Equity, 60d Debt/Gold, 365d Property) $\to$ `KNOWN_ACQUISITION_COST` $\to$ `CALCULATED` $\to$ `HISTORICAL_SOURCE_UNAVAILABLE`.
   - **Mandatory Non-Fabrication Guardrails**: Missing historical values strictly return `null` with status `INSUFFICIENT_DATA` (never fabricated numeric `0`); post-maturity FDs without redemption are omitted from net worth with `totalMarketValue: null`, `lifecycleStatus: 'MATURED_PENDING_REINVESTMENT'`.
   - **Protection Shield Isolation**: `SUM_ASSURED` across term and health policies is reported strictly under `protectionShield` and never enters gross assets or net worth.
   - **In-Memory What-If Simulation Sandbox (`WhatIfSimulationEngine.ts`)**: Zero-write sandbox executing 5 closed scenarios (`RECURRING_SIP_STEP_UP`, `ONE_TIME_LUMP_SUM_INVESTMENT`, `RETIREMENT_AGE_ADJUSTMENT`, `GOAL_CONTRIBUTION_REALLOCATION`, `TAX_REGIME_OPTIMIZATION_SCENARIO`) over deep-cloned baselines with deterministic SHA-256 baseline state hashing.
   - **Production-Safe Family Scope Authorization**: `TimeMachineController.ts` strictly authorizes from `CorrelationContext.getFamilyId()`, failing closed on missing context (`ValidationError`) and rejecting mismatched client query/body parameters (`403 FORBIDDEN`).
   - **Non-Fabricated Tax Optimization**: Unverified income profiles return `status: 'INSUFFICIENT_DATA'` with `taxSavingsBenefit: null` (never arbitrary ₹15L fallback).
   - **Comprehensive 21-Table Zero-Write Verification**: Tested with SHA-256 full database state fingerprinting before and after all 5 scenarios.
   - **Assumption Provenance**: Explicit tracking of `USER_PROVIDED`, `FAMILY_PROFILE`, and `SYSTEM_ASSUMPTION` sources in `assumptionsUsed`.
   - **Master Test Suite Expansion**: 39 dedicated invariant tests in `financialTimeMachine.test.ts` advancing master test suite from 348 to **387 passing tests (0 failures)**.
   - **Documentation Deliverables**: `docs/FINANCIAL_TIME_MACHINE.md`, `prompts/Phase8C/SPRINT_8C_3_OUTPUT_REVIEW.md`.

2. **Sprint 8C.2: Multi-Domain Timeline Ledger & Narrative History (COMPLETE)**:
   - **Core Service (`FamilyTimelineService.ts`)**: Chronological 7-domain ledger projection aggregating Portfolio, Protection, Goals, Life Events, Estate, Tax, and AI Decisions.
   - **Deterministic Event Identity & Narrative Engine (`TimelineNarrativeEngine`)**: Collision-proof canonical IDs (`evt_${domain}_${sourceType}_${sourceId}_${eventType}_[${milestoneKey}]`), Indian currency formatting (`₹15 L`, `₹1.5 Cr`), and central identifier masking (`maskIdentifier`).
   - **Scheduled vs Historical Separation**: Future obligations tagged `SCHEDULED` and filtered from past historical queries by default.
   - **Valuation Invariant & Protection**: Insurance `SUM_ASSURED` explicitly isolated to `amountType = 'SUM_ASSURED'` (coverage protection).
   - **Fail-Closed Atomic Rollback & Zero Mutations**: Single-transaction atomic reconciliation (`batchReconcileTimeline`); confirmed 0 writes across all 11 domain source tables.
   - **REST API (`FamilyTimelineController.ts` & `familyTimelineRoutes.ts`)**: Mounted at `/api/v1/family-office/timeline` (`GET /`, `POST /sync`) with idempotency protection.
   - **Master Test Suite Expansion**: 11 dedicated invariant tests in `familyTimeline.test.ts` advancing master test suite from 337 to **348 passing tests (0 failures)** with 14ms execution latency ($\le 100\text{ms}$ budget).
   - **Documentation Deliverables**: `docs/FAMILY_TIMELINE_LEDGER.md`, `prompts/Phase8C/SPRINT_8C_2_OUTPUT_REVIEW.md`.

2. **Sprint 8C.1: Family Financial Health (FFH) Index Engine & Historical Snapshotting (COMPLETE)**:
   - **Core Engine (`FamilyFinancialHealthService.ts`)**: 100% deterministic composite scoring across 5 pillars (Protection, Liquidity, Goals & Planning, Estate, Tax/Data) reusing authoritative calculation engines (`DigitalTwinService`, `EstateHealthService`, `GoalPlanningService`, `TaxCalculationEngine`).
   - **Explicit Life-Stage Weighting Matrix**: Deterministic 4-tier precedence (`RETIREMENT` $\to$ `FAMILY_EXPANSION` $\to$ `WEALTH_PRESERVATION` $\to$ `EARLY_CAREER`) with proportional weight redistribution when Goals is `NOT_APPLICABLE`.
   - **Fiduciary-Safe Tax/Data Hygiene**: 30% Compliance + 40% Twin Completeness + 30% Regime Optimization (no 80C bias, no penalty under New Tax Regime).
   - **Versioned Rule Registry (`FFH_RULE_REGISTRY`)**: Parameterized thresholds for ₹25L health target, 6-month emergency runway, and ₹1.5L 80C ceiling.
   - **Snapshot Deduplication & Comparability**: Read-only return on identical `(family_id, snapshot_period, state_hash)`; division-by-zero protection (`percentDelta = null`); life-stage comparison flag (`WEIGHTING_OR_LIFESTAGE_CHANGED`); past `asOfDate` rejected with `ValidationError`.
   - **REST API (`FamilyHealthController.ts` & `familyHealthRoutes.ts`)**: Mounted at `/api/v1/family-office/health` (`GET /`, `GET /history`, `POST /snapshot`) protected by `idempotencyMiddleware` and server-resolved family scope.
   - **Master Test Suite Expansion**: 9 dedicated invariant test suites in `familyFinancialHealth.test.ts` advancing master test suite from 328 to **337 passing tests (0 failures)** with 3ms execution latency ($\le 500\text{ms}$ target).
   - **Documentation Deliverables**: `docs/FAMILY_FINANCIAL_HEALTH.md`, `prompts/Phase8C/SPRINT_8C_1_OUTPUT_REVIEW.md`.

2. **Sprint 8C.0: Contracts, Zod Schemas & Database Migration 019 (COMPLETE)**:
   - **Data Contracts (`familyOfficeContracts.ts`)**: Added authoritative schemas for FFH (`FamilyFinancialHealthSchema`, `FFHPillarScoreSchema`), Timeline (`TimelineEventSchema`, `TimelineQueryFilterSchema`), Time Machine (`TimeMachineReconstructionSchema`, `WhatIfScenarioInputSchema`, `WhatIfSimulationResultSchema`), with strict separation of status (`PillarStatusEnum`) and provenance (`ProvenanceTypeEnum`).
   - **Database Migration (`019_family_health_and_timeline.ts`)**: Created `family_health_history` (`UNIQUE(family_id, snapshot_period, state_hash)`) and `family_timeline_events` (`UNIQUE(family_id, event_id)`) with composite performance indexes.
   - **Repositories**: `SQLiteFamilyHealthRepository.ts` and `SQLiteFamilyTimelineRepository.ts` providing strictly family-scoped persistence, concurrency-safe deduplication, and atomic transaction batch upserts.
   - **Invariant Test Suite (`contractsAndMigrations.test.ts`)**: 12 dedicated invariant tests verifying Zod parsing, boundary rejections, Time Machine completeness bounds, migration safety, repository CRUD, and cross-family isolation (advancing master test suite from 316 to 328 passing tests, 0 failures).
   - **Documentation Deliverables**: `prompts/Phase8C/PHASE_8C_STRATEGIC_PLAN.md`, `prompts/Phase8C/SPRINT_8C_0_IMPLEMENTATION_PLAN.md`, and `prompts/Phase8C/SPRINT_8C_0_OUTPUT_REVIEW.md`.

2. **Sprint 8B.3: Proactive Fiduciary AI Observer & Cooldown Registry (COMPLETE)**:
   - **Database Migration (`018_proactive_triggers_and_cooldowns.ts`) & Repository (`SQLiteProactiveTriggerRepository.ts`)**: Authoritative schema for `proactive_triggers` and `proactive_cooldown_registry` with atomic SQLite transaction support.
   - **Cooldown & Materiality Service (`CooldownRegistryService.ts`)**: Deterministic SHA-256 trigger ID generation ($H_{\text{state}}$), intelligent cooldown suppression, zero-baseline emergence handling, and rule-specific materiality threshold overrides ($\Delta_{\text{mat}}$).
   - **Proactive Observer Engine (`ProactiveObserverService.ts`)**: Evaluates 9 deterministic fiduciary rules across all digital twin pillars, gates on domain completeness ($\ge 75\%$) and calculation confidence ($\ge 85\%$), auto-resolves obsolete triggers, supersedes material baseline shifts as `STALE`, persists 5-point explainability lineage, and mirrors high-urgency triggers to `NotificationService`.
   - **REST API (`ProactiveObserverController.ts` & `proactiveObserverRoutes.ts`)**: Comprehensive lifecycle endpoints (`/triggers`, `/evaluate`, `/acknowledge`, `/snooze`, `/dismiss`, `/resolve`) protected by `idempotencyMiddleware`, strict snooze bounds (1..30d), and server-resolved family scope.
   - **Documentation Deliverables**: `docs/PROACTIVE_AI_ARCHITECTURE.md`, `docs/PROACTIVE_RULE_CATALOG.md`, `docs/PROACTIVE_COOLDOWN_MODEL.md`, and `prompts/Phase8B.3/SPRINT_8B_3_OUTPUT_REVIEW.md`.
   - **Master Test Suite Expansion**: 27 dedicated invariant tests in `backend/src/__tests__/sprint8b3/proactiveObserver.test.ts` advancing master test suite from 289 to 316 passing tests with 0 failures (Rule evaluation latency: 11ms $\le$ 250ms target).

2. **Sprint 8B.2: Life Events Engine & Multi-Domain Consequence Propagation (COMPLETE)**:
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
    - Backend Master Test Suite: **337/337 PASSED (0 FAILURES)**

---

## Instructions for Next Session / Developer Commands
- **Reset Database**: `npm run db:reset` (runs migrations 001 through 019 cleanly).
- **Run Application**: `npm run dev` (launches backend Express server on port 5000 and frontend Vite dev server on port 5173).
- **Run Full Build**: `npm run build`
- **Run Backend Tests**: `cd backend && npm test`

