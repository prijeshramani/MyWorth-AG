# Implementation Plan – Add Insurance Policy UI, Family Member Portfolio Filter & Invested vs Current Valuation View

Address the missing Insurance Policy entry UI option, add Family Member filtering on the Portfolio page, and introduce a dedicated Invested Amount vs Current Value breakdown view.

## User Review Required

> [!IMPORTANT]
> - **Zero Regression to Existing Data**: All existing SQLite tables, calculation engines, and API contracts remain preserved.
> - **Insurance Policy Entry**: Adds a comprehensive modal to register Health, Term Life, LIC, ULIP, and Endowment policies with family member assignment and nominee details.
> - **Portfolio Dual-View Engine**: Adds a Family Member filter chip bar on the Portfolio page and a dedicated "Invested vs Current Value" side-by-side valuation view.

## Proposed Changes

---

### 1. Insurance Policy Entry API & UI (`ProtectionDashboard.tsx`)

#### [MODIFY] [backend/src/controllers/InsuranceController.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/controllers/InsuranceController.ts)
- Add `createPolicy` endpoint handler calling `insuranceAppService.createPolicy()`.

#### [MODIFY] [backend/src/services/InsuranceApplicationService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/InsuranceApplicationService.ts)
- Add `createPolicy` service method mapping incoming policy payload to `InsuranceRepository.create()`.

#### [MODIFY] [backend/src/routes/insuranceRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/insuranceRoutes.ts)
- Mount `POST /insurance/policies` and `POST /policies` endpoints.

#### [MODIFY] [frontend/src/services/insuranceService.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/insuranceService.ts)
- Add `createPolicy(policyData)` API client function.

#### [MODIFY] [frontend/src/components/protection/ProtectionDashboard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/protection/ProtectionDashboard.tsx)
- Add **"Add Insurance Policy"** modal supporting:
  - Policy Category (`TERM_LIFE`, `HEALTH`, `LIC`, `ULIP`, `ENDOWMENT`, `CRITICAL_ILLNESS`, `ACCIDENT`, `OTHER`)
  - Insurer Name (Max Life, HDFC Life, Star Health, LIC, ICICI Pru, Tata AIA, SBI Life, etc.)
  - Policy Number & Policy Holder (family member dropdown selector)
  - Sum Assured (Coverage Amount in ₹) & Annual Premium Amount (₹)
  - Premium Frequency (`ANNUAL`, `MONTHLY`, `SEMI_ANNUAL`) & Next Due Date
  - Primary Nominee Name & Relationship.

---

### 2. Family Member Portfolio View & Invested vs Current Valuation View (`Portfolio.tsx`)

#### [MODIFY] [frontend/src/components/Portfolio.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/Portfolio.tsx)
- Add **Family Member Selector Chip Bar** (`All Members`, `Rajesh Sharma`, `Priya Sharma`, etc.).
- Add **Invested vs Current Value Breakdown Mode**:
  - Hero summary cards: **Total Invested Amount**, **Current Market Value**, and **Unrealized Gain/Loss (₹ and %)**.
  - Side-by-side comparison columns in asset table:
    - **Asset & Category**
    - **Owner (Family Member)**
    - **Invested Amount (Cost)**
    - **Current Value**
    - **Unrealized Return (₹ & %)**

---

## Verification Plan

### Automated Build Verification
- Execute `npm run build` in `frontend` to verify 100% clean compilation with 0 TypeScript errors.

### Manual Verification
1. Open Protection & Insurance page (`/protection`) -> Click "Add Insurance Policy" -> Register a Health / LIC / Term Life policy -> Verify it appears in active policies and updates coverage metrics.
2. Open Portfolio page (`/portfolio`) -> Select a specific Family Member -> Verify metrics filter to that member.
3. Switch to "Invested vs Current Value" view -> Verify total cost, current market value, and gain/loss are clearly displayed side-by-side.
