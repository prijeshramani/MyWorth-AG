# FamilyWealthOS – Current Phase

## Active Phase
**Phase 7E – Theme Versatility, Insurance Management & Portfolio Analytics Workspace**

## Completed Deliverables & System Enhancements

### 1. Light & Dark Theme System
- Added `Sun`/`Moon` theme toggle button in `TopNavbar.tsx`.
- Enabled persistent theme selection (`'dark'` | `'light'`) in `localStorage` (`myworth_theme`).
- Implemented CSS variables and Light Theme class overrides in `index.css` covering all cards, sidebars, headers, tables, badges, and modals.

### 2. Insurance Management System (`/protection`)
- Built policy registration modal supporting Health, Term Life, LIC, ULIP, Endowment, Critical Illness, Accident, and General Insurance.
- Captured Insurer Name, Policy Number, Policy Holder, Sum Assured, Premium Amount & Frequency, Due Date, Nominee Name & Relationship.
- Mounted `POST /api/v1/insurance/policies` and `POST /api/v1/policies` endpoints.
- Added Category Tabs (`All Policies`, `Term Life`, `Health`, `LIC & Savings`) and switchable Table/Card views.

### 3. Portfolio Analytics Workspace (`/portfolio`)
- Added Family Member Scope Filter chip bar (`All Members`, `Rajesh Sharma`, `Priya Sharma`, etc.).
- Added **Invested vs Current Valuation View** with side-by-side cost vs current market value metrics.
- Added Workspace mode toggling: `Invested vs Valuation`, `Holdings View`, and `Allocation Breakdown`.

### 4. AI Recommendation Engine Deduplication & Idempotency
- Resolved duplicate recommendation accumulation by enforcing active record updates in `SQLiteRecommendationRepository.ts`.
- Added automatic duplicate active record purging on dashboard retrieval.
