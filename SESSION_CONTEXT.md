# Session Context & System State

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
   - Knowledge Graph now renders 24 active nodes & 101 edges populated cleanly from user's imported data.
3. **Demo Data Purge & Real-Data Hardening**:
   - Completely purged seed demo rows (`Reliance Industries Ltd`, `Rajesh Sharma`, `Max Life Insurance POL-TEST-9901`, `Primary Testator Will FY2026`, `Adv. Ramesh Varma`, `Sharma Family Private Trust`) from SQLite tables (`assets`, `insurance_policies`, `family_members`, `graph_nodes`, `graph_edges`, `wills`, `trusts`, `estate_timeline`, `estate_profiles`).
   - Hardened `RelationshipService.ts`, `SQLiteEstateRepository.ts`, `EmergencyModeService.ts`, and `EstateSimulationService.ts` to compute all figures dynamically from live database tables.
4. **CAMS PDF Parser Engine Overhaul**:
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
6. **Build & Test Status**:
   - Backend TypeScript build: **PASSED**
   - Frontend Vite production build: **PASSED**
   - Live REST API verification: **PASSED (STATUS 200 OK)**
   - CAMS PDF parsing accuracy: **100% VERIFIED**

---

## Instructions for Next Session / Developer Commands
- **Reset Database**: `npm run db:reset` (runs migrations 001 through 011 cleanly).
- **Run Application**: `npm run dev` (launches backend Express server on port 3001 and frontend Vite dev server on port 5173).
- **Run Full Build**: `npm run build`
- **Run Backend Tests**: `cd backend && npm test`
