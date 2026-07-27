# Phase 6UX Implementation Plan — Product Integration, UI Wiring & Data Management

**Goal**: Transform FamilyWealthOS from a collection of completed domain modules into a fully integrated, production-ready application supporting user onboarding, complete navigation, CRUD management, Import Center wiring, Data Manager console, Document Vault, Global Search, Settings, Demo vs Real Dataset toggling, and Developer Mode.

---

## Architecture Rules & Principles
1. **Zero Calculation Engine Changes**: Reuse existing investment, portfolio, protection, tax, and security calculation engines 100%.
2. **Maximum Component & Engine Reuse**: Reuse existing parsers (CAMS CAS, NSDL/CDSL, CSV, Excel, PDF, OCR), broker integrations (Kite, AngelOne, INDMoney), `ImportCenter.tsx`, `DocumentRepository.ts`, and atomic UI components (`MetricCard`, `HoldingTable`, `RiskGauge`, etc.).
3. **Seamless Product Wiring**: Every domain screen must be reachable via the navigation drawer.

---

## Proposed Changes

### 1. Navigation & State Management
#### [MODIFY] [NavigationDrawer.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/NavigationDrawer.tsx)
- Expand navigation items to include:
  - Dashboard (`/dashboard`)
  - Family & Members (`/family`)
  - Portfolio Tree (`/portfolio`)
  - Holdings (`/holdings`)
  - Transactions (`/transactions`)
  - Accounts & Brokers (`/accounts`)
  - Protection & Insurance (`/protection`)
  - Tax Intelligence (`/tax`)
  - Documents (`/documents`)
  - Import Center (`/import`)
  - Data Manager (`/data-manager`)
  - Estate Planning (`/estate` - Coming Soon)
  - Reports Generator (`/reports`)
  - Settings (`/settings`)
  - Developer Mode (`/developer`)

#### [MODIFY] [useUiStore.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/store/useUiStore.ts)
- Add state properties: `datasetMode` ('DEMO' | 'REAL'), `isGlobalSearchOpen` (boolean), `searchQuery` (string), `onboardingStep` (number), `isOnboardingComplete` (boolean).

---

### 2. Top Navbar & Global Search
#### [MODIFY] [TopNavbar.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/TopNavbar.tsx)
- Integrate **Global Search Bar** with real-time popup results searching across Family Members, Assets, Transactions, Insurance Policies, Documents, and Bank Accounts.
- Add **Dataset Toggle Switch** (Demo Data vs Personal Real Data).
- Add **Onboarding Quick Launcher** button.

#### [NEW] [GlobalSearchModal.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/common/GlobalSearchModal.tsx)
- Global search modal component querying all domains with category grouping and direct keyboard navigation (`Ctrl+K` shortcut).

---

### 3. Domain Views & CRUD Operations
#### [NEW] [FamilyManager.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/family/FamilyManager.tsx)
- Family & Member Management view: Add/edit/delete family members, assign roles (Head/Spouse/Child/Parent), update PAN, Aadhaar link status, and contact info.

#### [NEW] [AccountsManager.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/accounts/AccountsManager.tsx)
- Bank & Broker Accounts CRUD view: Add/edit/delete bank accounts, broker Demat accounts, and manage integration credentials (Kite, AngelOne, INDMoney).

#### [NEW] [DocumentVault.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/documents/DocumentVault.tsx)
- Document Vault & Repository view: Upload documents with file drag & drop, categorize by document type (PAN, Aadhaar, Insurance, Tax, Property, Bank Statements), preview documents, and attach to tax/insurance records.

#### [NEW] [DataManager.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/data/DataManager.tsx)
- Operational console for data management: Import History, Pending Reviews, Duplicate Record Detection (Merge/Skip/Overwrite), Parser Logs, Sync Status, and Export/Rollback management.

#### [NEW] [SettingsView.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/settings/SettingsView.tsx)
- Platform Settings view: User Profile, Security (Password update, Session management), Notification preferences, Theme options, Data Backup & Restore, Financial Year selection, and Dataset configuration.

#### [NEW] [DeveloperConsole.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/developer/DeveloperConsole.tsx)
- Developer Mode console: Database Table Viewer (Read-only schema inspector), API Logs & Error Logs console, Migration Status, Tax Rule Engine Inspector, and Performance Metrics dashboard.

#### [NEW] [OnboardingWizard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/onboarding/OnboardingWizard.tsx)
- 8-Step Interactive Onboarding Wizard for new users:
  1. Family Setup -> 2. Members -> 3. Bank Accounts -> 4. Broker / Statement Import -> 5. Insurance -> 6. Tax Profile -> 7. Document Upload -> 8. Dashboard Ready.

#### [NEW] [EstatePlaceholder.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/estate/EstatePlaceholder.tsx)
- Coming Soon preview panel for Phase 6B Estate & Wealth Succession.

---

### 4. App Assembly & Navigation Routing
#### [MODIFY] [App.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/App.tsx)
- Wire `activeTab` to all views: `dashboard`, `family`, `investments`, `portfolio`, `holdings`, `transactions`, `accounts`, `protection`, `tax`, `documents`, `import`, `data-manager`, `estate`, `reports`, `settings`, `developer`, and `onboarding`.

---

## Verification Plan

### Automated Build & Unit Tests
- Backend Unit Tests: `npm test` in `backend` (Ensure 161+ tests pass).
- Frontend Build: `npm run build` in `frontend` (`tsc -b && vite build` completes with 0 errors).

### Manual UX Verification
- Navigation test across all 15 menu tabs.
- Global Search modal popup (`Ctrl+K`) filtering records.
- Onboarding Wizard 8-step flow test.
- Import Center file upload & review workflow test.
- Developer Mode DB schema viewer test.


---

# ChatGPT Architecture Review & Mandatory Recommendations (Pre-Implementation)

## Overall Assessment
**Status:** APPROVED WITH MANDATORY ENHANCEMENTS

The implementation plan is well aligned with Phase 6UX. However, the following items are REQUIRED before implementation begins.

## 1. Reuse Before Build (Highest Priority)
Before creating any new component, search the existing codebase and reuse:
- Existing parser framework
- Existing broker integrations (Kite, AngelOne, INDMoney, etc.)
- Existing OCR engine
- Existing CSV/Excel/PDF importers
- Existing CAMS CAS / NSDL/CDSL parsers
- Existing ImportCenter implementation
- Existing DocumentRepository
- Existing API services and hooks

Do not duplicate functionality.

## 2. Import Review Workflow
Implement:
Import -> Parse -> Validate -> Preview -> User Correction -> Duplicate Detection -> Approval -> Persist

Never write imported data directly to production tables.

## 3. Data Mapping Engine
Allow users to map source columns to application fields.
Persist mapping profiles for reuse.

## 4. Duplicate Detection & Rollback
Detect duplicate:
- Transactions
- Holdings
- SIPs
- Dividends
- Insurance Policies
- Tax Records

Support:
- Merge
- Skip
- Overwrite
- Full Import Rollback

## 5. Reconciliation Dashboard
Add reconciliation between:
- Broker vs Portfolio
- Portfolio vs Tax
- Bank vs Transactions
- Documents vs Investments

Highlight mismatches.

## 6. Manual Entry Everywhere
Every importable entity must also support manual CRUD.

## 7. Dashboard Customization
Support:
- Drag & Drop widgets
- Hide/Show widgets
- Save dashboard layouts
- Quick actions

## 8. Data Quality Center
Add:
- Missing PAN
- Missing Nominee
- Missing Cost Price
- Missing Purchase Date
- Missing Tax Profile
- Duplicate Assets
- Validation warnings

## 9. Developer Mode
Extend Developer Mode with:
- Seed Data Manager
- Rule Viewer
- API Inspector
- Performance Metrics
- Migration Status
- Feature Flags
- Environment Information

## 10. Future Estate Readiness
Document upload should already support attaching documents to:
- Family
- Investments
- Insurance
- Tax
- Future Estate module

## 11. UI/UX
Implement:
- Empty states
- Skeleton loading
- Error boundaries
- Responsive layouts
- Keyboard shortcuts
- Accessibility

## 12. Acceptance Criteria
The application should be usable by the product owner with real financial data after this phase completes.
