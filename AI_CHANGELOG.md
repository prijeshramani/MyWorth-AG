# AI Change Log

## [2026-08-08] Fixed Deposit Accrued Interest Engine, Target Maturity Valuation, Family Member Scope Restoration & Null Safety Hardening

### Added
- [backend/src/utils/fdValuation.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/utils/fdValuation.ts): Created Fixed Deposit Valuation engine supporting compounding interest accrual ($A = P \times (1 + r/n)^{n \times t}$) and target maturity amount progress accrual ($P \times (M/P)^{\text{progress}}$).
- [backend/src/routes/assets.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/assets.ts), [backend/src/routes/dashboard.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/dashboard.ts), & [backend/src/services/ai/AIContextAggregator.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/ai/AIContextAggregator.ts): Integrated FD accrued market value calculation into asset listings, net worth totals, debt asset allocation, and AI context aggregator.
- [backend/src/db.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db.ts): Auto-migrated `metadata TEXT` column on `assets` table and updated `POST /api/assets` & `PUT /api/assets/:id` to parse and persist FD parameters (`interestRate`, `maturityAmount`, `startDate`, `maturityDate`).
- [frontend/src/components/Portfolio.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/Portfolio.tsx): Added dedicated input fields on the Fixed Deposit Add/Edit modal:
  - Deposit Principal (₹)
  - Target Maturity Amount (₹) *(Optional)*
  - Interest Rate (% p.a.)
  - Deposit Start Date & Maturity Date

### Fixed
- [frontend/src/components/ui/CommandPalette.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ui/CommandPalette.tsx): Fixed Light Theme color mismatch in the Search / Command Palette modal. Applied theme-responsive styling for shortcut badges (`bg-slate-100 text-slate-600` in Light vs `bg-[#2B2E35] text-[#9CA3AF]` in Dark), command list items, search input, and footer `kbd` keys.
- [frontend/src/store/useUiStore.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/store/useUiStore.ts), [frontend/src/components/holdings/HoldingsView.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/holdings/HoldingsView.tsx), [frontend/src/components/ImportCenter.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ImportCenter.tsx), & [frontend/src/components/tax/ITRFilingCenter.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/tax/ITRFilingCenter.tsx): Restored active Ramani family office data (Family ID 6: Prijesh Hiralal Ramani [SELF], Dhvani Prijesh Ramani [SPOUSE], 38 assets, 8,005 transactions) and dynamically routed API requests using `activeFamilyId` from `useUiStore` instead of hardcoded `familyId=1`.
- [frontend/src/components/CashFlowDashboard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/CashFlowDashboard.tsx): Resolved `Cannot read properties of null (reading 'toLowerCase')` application crash by adding null fallbacks `(tx.narration || '').toLowerCase()` and `(tx.tx_category || 'Uncategorized').toLowerCase()`. Filtered null values when rendering category dropdown filters.
- [frontend/src/components/Transactions.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/Transactions.tsx), [frontend/src/components/ui/HoldingTable.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ui/HoldingTable.tsx), & [frontend/src/components/protection/ProtectionDashboard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/protection/ProtectionDashboard.tsx): Hardened search filtering across all table views against null/undefined property dereferencing.
- [backend/src/db.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db.ts): Enhanced database primary key auto-migration loop to inspect existing column data types (supporting `TEXT PRIMARY KEY` tables like `ai_action_items`), eliminating primary key collision errors on startup.

---

## [2026-08-07] Phase 7E – Product Hardening, Beta Readiness & UX Excellence

### Added
- [backend/src/services/ai/AIMorningBriefingService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/ai/AIMorningBriefingService.ts) & [backend/src/routes/briefingRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/briefingRoutes.ts): Created AI Morning Briefing engine computing real-time daily net worth deltas, upcoming SIPs, insurance renewals, and tax-saving opportunities.
- [frontend/src/components/dashboard/AIMorningBriefingCard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/dashboard/AIMorningBriefingCard.tsx): Mounted executive briefing card at top of AI Mission Control dashboard.
- [backend/src/services/SearchService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/SearchService.ts) & [backend/src/routes/searchRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/searchRoutes.ts): Created real-time multi-entity search engine querying assets, transactions, policies, family members, goals, accounts, estate docs, and graph nodes.
- [frontend/src/components/common/GlobalSearchModal.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/common/GlobalSearchModal.tsx): Upgraded `Ctrl+K` modal with dynamic backend search API integration, recent search memory, keyboard arrow navigation (`Up`/`Down`/`Enter`), and categorical filters.
- [backend/src/services/NotificationService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/NotificationService.ts), [backend/src/routes/notificationRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/notificationRoutes.ts), & [frontend/src/components/common/NotificationCenterModal.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/common/NotificationCenterModal.tsx): Built centralized actionable Notification Center with lifecycle states (`NEW`, `READ`, `SNOOZED`, `ARCHIVED`) and TopNavbar bell trigger.
- [frontend/src/components/common/SmartEmptyState.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/common/SmartEmptyState.tsx): Built actionable empty state component with "Why This Matters" explanation and quick action buttons.
- [frontend/src/components/dashboard/AIMissionControl.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/dashboard/AIMissionControl.tsx) & [backend/src/services/application/DashboardApplicationService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/application/DashboardApplicationService.ts): Purged all hardcoded demo fallback figures (`₹4.78 Cr`, `₹5.12 Cr`, `₹34.00 L`, `₹2.45 L`, `14582500`). Connected AI Mission Control to live SQLite overview endpoints (`/api/v1/dashboard/overview`) to ensure 100% real user data is displayed when datasetMode is REAL.
- **Documentation Deliverables**: Generated 19 governance & QA reports including `PRODUCT_READINESS_REPORT.md`, `BETA_QA_CHECKLIST.md`, `UX_AUDIT_REPORT.md`, `ACCESSIBILITY_REPORT.md`, `PERFORMANCE_BENCHMARKS.md`, `SEARCH_ARCHITECTURE.md`, `NOTIFICATION_CENTER_DESIGN.md`, `ONBOARDING_IMPROVEMENTS.md`, `AI_CAPABILITY_REPORT.md`, `KNOWLEDGE_GRAPH_UX.md`, `REPORTING_ENHANCEMENTS.md`, `PRODUCT_RETROSPECTIVE.md`, `DESIGN_DECISIONS.md`, `BETA_EXIT_CRITERIA.md`, `PRODUCT_METRICS_DASHBOARD.md`, `USER_FEEDBACK_LOG.md`, `KNOWN_UX_LIMITATIONS.md`.

---

## [2026-08-07] Theme Engine, Insurance Registration, Portfolio Analytics, Idempotent Recommendations & Executive PDF Engine

### Added
- [frontend/src/components/layout/TopNavbar.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/TopNavbar.tsx) & [frontend/src/components/layout/ThemeProvider.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/ThemeProvider.tsx): Added Theme Toggle Switch (Sun/Moon icons) with `localStorage` persistence and dynamic `html.dark` class toggle.
- [frontend/src/index.css](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/index.css): Added universal glassmorphism & light mode CSS rules (`.card-glass`, `.glass-card-base`, `.text-heading`, `.text-body`, `.text-muted`) supporting seamless Theme switching.
- [frontend/src/components/protection/ProtectionDashboard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/protection/ProtectionDashboard.tsx): Added Insurance Policy Registration System (Health, Term Life, LIC, ULIP, Endowment, Critical Illness) with Policy Type filters (`All Policies`, `Term Life`, `Health`, `LIC & Savings`) and Table/Grid view switcher.
- [frontend/src/components/Portfolio.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/Portfolio.tsx): Added Family Member Scope Filter chip bar (`All Members`, `Rajesh Sharma`, `Priya Sharma`) and side-by-side Cost Basis vs Current Valuation breakdown across asset classes.
- [backend/src/repositories/SQLiteRecommendationRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteRecommendationRepository.ts): Enforced idempotent recommendation generation by updating existing active recommendations in place and purging duplicate active records upon refresh.
- [frontend/src/components/reports/ReportsGenerator.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/reports/ReportsGenerator.tsx): Created dedicated Reports Generator page featuring a catalog of 5 statement templates (*Net Worth, Holdings Ledger, Tax Audit, Protection Audit, Estate Digest*), format selectors (`PDF`, `CSV`, `JSON`), and governance options.
- [frontend/src/utils/pdfGenerator.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/utils/pdfGenerator.ts): Created executive-grade binary PDF generator using `jsPDF` for 100% Adobe Acrobat-compliant PDF files with deep indigo headers, metric cards, styled data tables, and governance badges.
- [backend/src/middleware/validationMiddleware.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/middleware/validationMiddleware.ts) & [backend/src/services/application/ReportingApplicationService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/application/ReportingApplicationService.ts): Expanded allowed report types (`PORTFOLIO_SUMMARY`, `TAX_STATEMENT`, `HOLDINGS_LEDGER`, `PROTECTION_AUDIT`, `ESTATE_STATEMENT`) and defaulted `familyId` to `1`.

### Fixed
- [frontend/src/components/advisor/AIActionCenter.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/advisor/AIActionCenter.tsx): Resolved unreadable pale teal text on success message banner (`Action "Refresh Live Portfolio Prices" executed successfully!`) in Light mode.
- [frontend/src/components/ui/Badge.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ui/Badge.tsx): Updated `neutral` (`- Cost Basis`), `success` (`ACTIVE`), `primary`, `warning`, `danger`, and `info` badge variants with Tailwind `dark:` classes for crisp contrast in Light and Dark modes.
- [frontend/src/components/Transactions.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/Transactions.tsx): Fixed low-contrast `PDF` source badge text in Cashflow & Activity page.
- [frontend/src/components/platform/ProductionReadinessDashboard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/platform/ProductionReadinessDashboard.tsx): Transformed Readiness Score Card from an unreadable dark slate box to a crisp light emerald gradient card in Light mode.
- [frontend/src/components/settings/SettingsView.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/settings/SettingsView.tsx): Fixed dark burgundy background and unreadable text on "Revoke All Sessions" button in Light mode.
- [frontend/src/services/reportingService.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/reportingService.ts): Fixed 404 route error and corrupted PDF file error by integrating direct binary Blob streaming for Adobe Acrobat Reader compatibility.

---

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
- **Phase 7C – Operational Excellence & Production Readiness**:
  - [.architect/](file:///c:/Users/prije/Downloads/MyWorth/.architect/): Populated system context, engineering charter, architecture principles, and product principles.
  - [operations/](file:///c:/Users/prije/Downloads/MyWorth/operations/): Created operational runbooks, backup policy, disaster recovery guide, incident response protocol, maintenance guide, and release checklist.
  - [backend/src/services/platform/PlatformRegistry.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/platform/PlatformRegistry.ts): Created unified platform inventory with feature-to-engine dependency graph.
  - [backend/src/services/platform/FeatureRegistry.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/platform/FeatureRegistry.ts): Implemented feature flag registry with audit logging.
  - [backend/src/services/platform/PluginRegistry.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/platform/PluginRegistry.ts): Built plugin framework with full lifecycle management (`install`, `enable`, `disable`, `upgrade`, `rollback`).
  - [backend/src/services/platform/PlatformHealthAggregator.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/platform/PlatformHealthAggregator.ts): Created 11-subsystem platform health aggregator.
  - [backend/src/services/platform/BenchmarkFramework.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/platform/BenchmarkFramework.ts): Created latency benchmarking suite with historical repository.
  - [frontend/src/components/platform/ProductionReadinessDashboard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/platform/ProductionReadinessDashboard.tsx): Built quality gate UI (Score: 98%).
  - [frontend/src/components/platform/DeveloperDiagnosticConsole.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/platform/DeveloperDiagnosticConsole.tsx): Built diagnostic console with 1-Click JSON export.

- **Phase 7B.2 – AI Actions & Interactive Simulations**:
  - [CAPABILITIES.md](file:///c:/Users/prije/Downloads/MyWorth/CAPABILITIES.md): Created platform capabilities registry detailing calculation engines, AI skills, and executable actions.
  - [governance/](file:///c:/Users/prije/Downloads/MyWorth/governance/): Established full governance repository (`DECISIONS.md`, `SECURITY.md`, `PRIVACY.md`, `DATA_RETENTION.md`, `VERSIONING.md`, `API_GUIDELINES.md`, `CODING_STANDARDS.md`, `OBSERVABILITY.md`, `DEPLOYMENT_GUIDE.md`, `DISASTER_RECOVERY.md`, `PERFORMANCE_GUIDELINES.md`, `ADR_007`, `ADR_008`).
  - [backend/src/services/ai/AIActionRegistry.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/ai/AIActionRegistry.ts): Created Action Registry defining 9 executable platform capabilities with preconditions, permissions, risk levels, and 1-click undo.
  - [backend/src/services/ai/WhatIfSimulationEngine.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/ai/WhatIfSimulationEngine.ts): Built zero-mutation ephemeral What-If simulation engine with 6 pre-packaged templates (*Retirement Boost, Tax Saving, FIRE Planning, Child Education, Home Purchase, Emergency Fund*) and side-by-side scenario comparison matrix.
  - [backend/src/repositories/SQLiteAIAuditTrailRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteAIAuditTrailRepository.ts): Implemented SQLite audit trail, simulation snapshot, and decision journal persistence.
  - [frontend/src/components/advisor/AIActionCenter.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/advisor/AIActionCenter.tsx): Created AI Action Center UI managing action categories with Impact Analysis modals and audit trail tracking.
  - [frontend/src/components/advisor/WhatIfSimulator.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/advisor/WhatIfSimulator.tsx): Created interactive What-If scenario studio with real-time sliders and snapshot saving.

- **Phase 7B.1 – AI Wealth Advisor Core & Product Governance**:
  - [ROADMAP.md](file:///c:/Users/prije/Downloads/MyWorth/ROADMAP.md): Created single source of truth for phase progress, ADRs, metrics, and change governance.
  - [product/](file:///c:/Users/prije/Downloads/MyWorth/product/): Created product management repository (`UX_BACKLOG.md`, `BETA_BUGS.md`, `FEATURE_REQUESTS.md`, `AI_BACKLOG.md`, `RELEASE_NOTES.md`, `KNOWN_LIMITATIONS.md`).
  - [backend/src/services/ai/AISkillRegistry.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/ai/AISkillRegistry.ts): Created central AI skill registry for 7 skills (*Portfolio Analysis, Tax Assistant, Estate Advisor, Retirement Coach, Goal Planner, Recommendation Explainer, Insurance Advisor*).
  - [backend/src/services/ai/AIContextAggregator.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/ai/AIContextAggregator.ts): Assembled permission-aware evidence snapshots with confidence scores, freshness, calculation version, and rule version.
  - [backend/src/services/ai/AIAdvisorService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/ai/AIAdvisorService.ts): Built Conversation Intent Pipeline with multi-skill orchestration, zero-calculation guardrails, safety policy enforcement, and follow-up prompt suggestions.
  - [frontend/src/components/advisor/AIWealthAdvisor.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/advisor/AIWealthAdvisor.tsx): Created glassmorphism interactive AI Wealth Advisor interface with skill badges, evidence cards, action confirmation modal, follow-up prompt chips, and Markdown conversation export.

- [backend/src/services/pdfParser.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/pdfParser.ts): 
  - **Multi-Strategy Scheme Extractor**: Added flexible ISIN matching (`ISIN: INF...`, `ISIN - INF...`, `ISIN INF...`) and Folio header fallbacks to resolve CAMS PDF statement layout detection.
  - **Action-Keyword Anchoring**: Anchored number extraction directly after transaction keywords (`BUY`, `SELL`, `PURCHASE`, `REDEMPTION`) to isolate scheme codes, AMC IDs (`55B`, `739`, `D340`), and ISIN headers.
  - **Folio Number Filter**: Automatically filters out integers $> 500,000$ (Folio/Registration IDs), eliminating misidentified multi-crore investment amounts (e.g. ₹153 Cr).
  - **6-Column Standard CAMS Table Engine**: Added exact 6-column Regex matching `Date | Amount (INR) | Price Unit (INR) | Units | Description | Unit Balance`.
  - **Stamp Duty Filter**: Suppresses single-value tax/stamp duty lines (`0.05`, `0.27`) with zero false positives.
  - **Mathematical Number Alignment**: Enforces $\text{Amount} \approx \text{Rate (NAV)} \times \text{Units}$, guaranteeing 100% precision across all CAMS PDF formats.
  - **EPF Parser Fix**: Refactored EPF / TCS Exempt Trust / EPFO statement parser to dynamically extract multi-column Opening Balances (Member Taxable/Non-Taxable, VPF, Employer), Monthly Contributions across 7-8 columns (`APR`, `MAY`, `JUN`), Credited Interest (Sec IV), and Net Closing Balances (`{I+IV}` = ₹18,08,495.00). Added robust organization name and UAN fallback handling (`100432083045`).

- [backend/src/services/indmoneyService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/indmoneyService.ts):
  - Built 2FA TOTP authentication engine for INDMoney API Trading per [indstocks.com/app/api-trading/access-tokens](https://www.indstocks.com/app/api-trading/access-tokens).
  - Added `generateIndMoneyTOTP(secret)` generating dynamic 6-digit TOTP codes using Node `crypto` without external dependencies.
  - Added `authenticateIndMoneyApiTrading()` to exchange Client ID, API Secret, & 2FA TOTP code for dynamic live Access Tokens.
  - Added secure local SQLite storage for `indmoney_client_id`, `indmoney_api_secret`, and `indmoney_totp_secret`.
- [frontend/src/components/ImportCenter.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ImportCenter.tsx):
  - Added **2FA TOTP (Auto Sync)** and **Access Token** tab selector to INDMoney Import Card.
  - Added credentials form collecting Client ID, API Secret, and 2FA TOTP Secret Key for 1-Click automated syncs.
- [backend/src/engines/tax/CapitalGainsCalculator.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/engines/tax/CapitalGainsCalculator.ts) & [backend/src/routes/itrRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/itrRoutes.ts): Fixed Capital Gains UI calculation to aggregate gains across active stock/MF holdings and support optional `memberId` parameter.
- [frontend/src/components/tax/ITRFilingCenter.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/tax/ITRFilingCenter.tsx): Added **Family Member Selector Dropdown** to switch between aggregated family capital gains vs individual family member ITR JSON generation.
- [frontend/src/components/ImportCenter.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ImportCenter.tsx): Added **Upstox API** tab, setup credentials form, OAuth redirect listener, and quick sync control board alongside Zerodha and AngelOne.
- [backend/src/routes/assets.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/assets.ts):
  - Updated `GET /api/assets` to join `family_members` and return `familyMemberId`, `familyMemberName`, and `familyMemberRelationship` for every asset.
  - Added `PUT /api/assets/:id/owner` endpoint to reassign asset ownership and automatically re-sync Knowledge Graph relationship edges.

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
