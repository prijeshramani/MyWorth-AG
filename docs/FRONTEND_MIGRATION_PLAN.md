# 🎨 FRONTEND_MIGRATION_PLAN.md — Frontend Architecture & Refactoring Strategy

**System Name**: Family Wealth OS  
**Author**: Lead Software Engineer & Software Architect  
**Date**: July 25, 2026  
**Status**: Target Specification (Sprint 0.5)

---

## 1. Executive Summary

The frontend migration refactors monolithic single-file components (`ImportCenter.tsx`, `Portfolio.tsx`) into modular, feature-based React 19 components. It introduces **TanStack Query (React Query)** for server-state management, **Zustand** for UI state (e.g. active family entity filter), and a centralized API client module to eliminate hardcoded `http://localhost:5000` URLs.

---

## 2. Screen-by-Screen Migration Strategy

| Current Screen | Action | Target Component / Feature Module | Refactoring Plan & Breakdown |
| :--- | :--- | :--- | :--- |
| **Dashboard (`/dashboard`)** | **REFACTOR** | `src/features/dashboard/` | Add Entity & Family Member filter bar at header. Break 600-line `Dashboard.tsx` into sub-components (`NetWorthBanner`, `AllocationPieChart`, `NetWorthTimeline`, `RecentActivityList`). |
| **Portfolio (`/portfolio`)** | **REFACTOR** | `src/features/portfolio/` | Break 800-line `Portfolio.tsx` into `AssetTable`, `AssetRow`, `AssetModal`, `XIRRBadge`, and `TaxLotDrawer`. Add entity grouping. |
| **Transactions (`/transactions`)** | **REFACTOR** | `src/features/transactions/` | Break 500-line `Transactions.tsx` into `TransactionGrid`, `FilterToolbar`, `TaxLotBadge`, and `ExportModal`. |
| **Cash Flow (`/cashflow`)** | **REUSE & REFACTOR**| `src/features/cashflow/` | Retain BankInsights visualization; break into `InflowOutflowChart`, `CategoryProgressBars`, and `BankAccountCard`. |
| **Import Center (`/import`)** | **REFACTOR** | `src/features/import/` | Break 1,500-line `ImportCenter.tsx` into step wizard components (`FileUploadStep`, `PasswordStep`, `EntitySelectStep`, `PreviewTableStep`). |

---

## 3. New Screens Required

| New Screen | Route | Purpose | Key UI Components |
| :--- | :--- | :--- | :--- |
| **Family & Entity Manager** | `/family` | Manage family members (Spouse, Child) and tax entities (Personal, HUF). | `MemberList`, `MemberModal`, `EntityCard`, `AccountMapper`. |
| **Goal Planner & Retirement** | `/goals` | Track financial goals and run Monte Carlo retirement projections. | `GoalCard`, `GoalProgressRing`, `RetirementSimulatorForm`. |
| **AI Personal CFO & Journal** | `/advisor` | View proactive AI wealth advice, log investment theses, and decision logs. | `AIRecommendationFeed`, `InvestmentThesisModal`, `DecisionJournalList`. |
| **Document Vault** | `/vault` | Secure local storage of financial statement PDFs and tax reports. | `DocumentGrid`, `PDFViewerModal`, `TagFilter`. |

---

## 4. Large Monolithic Component Decomposition

### 4.1 Decomposition of `ImportCenter.tsx` (1,500+ Lines -> 6 Modular Components)

```
frontend/src/features/import/
├── ImportCenterPage.tsx          # Main wizard orchestrator (100 lines)
├── components/
│   ├── FileUploadZone.tsx        # Drag-and-drop zone with file type badges (120 lines)
│   ├── PasswordModal.tsx         # Encrypted PDF password prompt (80 lines)
│   ├── EntitySelectDropdown.tsx  # Maps imported statement to target entity (90 lines)
│   ├── IngestionPreviewTable.tsx # Dry-run confirmation table with duplicate highlights (200 lines)
│   └── BrokerOAuthConnect.tsx    # Zerodha/AngelOne/INDmoney connection cards (150 lines)
└── hooks/
    └── useStatementImport.ts     # Custom hook containing import mutation & dry-run state
```

### 4.2 Decomposition of `Portfolio.tsx` (800+ Lines -> 5 Modular Components)

```
frontend/src/features/portfolio/
├── PortfolioPage.tsx             # Page layout & entity filter consumer (90 lines)
├── components/
│   ├── PortfolioHeader.tsx       # Summary total worth & asset type tab selector (110 lines)
│   ├── AssetGridTable.tsx        # Granular asset list table (180 lines)
│   ├── AssetRowItem.tsx          # Single asset row with NAV & XIRR formatting (120 lines)
│   ├── ManualAssetModal.tsx      # Modal form for adding manual assets (150 lines)
│   └── TaxLotDrawer.tsx          # Slide-out drawer showing FIFO tax lots (130 lines)
└── hooks/
    └── usePortfolioAssets.ts     # React Query hook fetching assets with auto-invalidation
```

---

## 5. Target Frontend Folder Structure

```
frontend/src/
├── app/
│   ├── App.tsx                   # Main router container
│   ├── main.tsx                  # Entry point
│   └── providers.tsx             # React Query Client & Theme Providers
├── api/
│   ├── apiClient.ts              # Centralized Axios instance (uses VITE_API_URL)
│   └── endpoints.ts              # Typed API endpoint URL constants
├── store/
│   └── useUIStore.ts             # Zustand store (active entity, theme, sidebar toggle)
├── components/ui/                # Shared reusable UI elements
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   └── Table.tsx
└── features/                     # Domain Feature Modules
    ├── dashboard/
    ├── portfolio/
    ├── transactions/
    ├── cashflow/
    ├── import/
    ├── family/
    ├── goals/
    └── advisor/
```
