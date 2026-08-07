# Session Context & Active Sprints

- **Current Version**: `v2.1.0`
- **Active Phase**: `Phase 7D – Premium UI/UX Modernization & Design System`
- **Status**: `Completed & Modernized (Design System: Apple Intelligence + Linear Style)`

---

## Active Sprint Deliverables
1. **AI Wealth Advisor Core**: Multi-skill AI orchestration layer consuming Context, Memory, Evidence, and Recommendation services without raw SQL queries or financial calculations.
2. **AI Skill Registry**: 7 core wealth skills (*Portfolio Analysis, Tax Assistant, Estate Advisor, Retirement Coach, Goal Planner, Recommendation Explainer, Insurance Advisor*).
3. **Product Governance**: Created root-level `ROADMAP.md` and `product/` governance repository (`UX_BACKLOG.md`, `BETA_BUGS.md`, `FEATURE_REQUESTS.md`, `AI_BACKLOG.md`, `RELEASE_NOTES.md`, `KNOWN_LIMITATIONS.md`).
4. **Interactive Advisor UI**: Glassmorphism chat stream with evidence cards, action execution confirmation modals, follow-up prompt chips, and Markdown conversation export.

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
11. **Build & Test Status**:
    - Backend TypeScript build: **PASSED (0 ERRORS)**
    - Frontend Vite production build: **PASSED (0 ERRORS)**
    - Adobe Acrobat PDF Reader verification: **PASSED (100% VERIFIED)**

---

## Instructions for Next Session / Developer Commands
- **Reset Database**: `npm run db:reset` (runs migrations 001 through 011 cleanly).
- **Run Application**: `npm run dev` (launches backend Express server on port 3001 and frontend Vite dev server on port 5173).
- **Run Full Build**: `npm run build`
- **Run Backend Tests**: `cd backend && npm test`
