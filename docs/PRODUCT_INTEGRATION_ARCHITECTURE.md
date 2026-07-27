# 🏛 PRODUCT_INTEGRATION_ARCHITECTURE.md — Product Integration Architecture

**System Name**: Family Wealth OS  
**Phase**: Phase 6UX (Product Integration, UI Wiring & Data Management)  
**Date**: July 27, 2026  
**Status**: APPROVED PRODUCT ARCHITECTURE  

---

## 1. Overview & Integration Blueprint

Phase 6UX transforms FamilyWealthOS into a fully connected, single-page application (SPA) where every completed module—Investments, Portfolio Analytics, XIRR, Net Worth, Protection & Insurance, Tax Intelligence, Platform Security, and Document Vault—is accessible via a centralized navigation system.

```
+---------------------------------------------------------------------------------------------------+
|                                      TOP NAVBAR CONTROLS                                          |
|  • Global Search Bar (Ctrl+K)    • Dataset Mode Toggle (DEMO vs REAL)    • Onboarding Launcher    |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+-----------------------+   +-----------------------------------------------------------------------+
|  NAVIGATION DRAWER    |   |                          PLATFORM VIEWPORTS                           |
| • Dashboard           |   | • Dashboard (KPI Cards, Net Worth, Alerts, Recent Activity)           |
| • Family & Members    |   | • FamilyManager (CRUD Family Members, Roles, PAN/Aadhaar)             |
| • Portfolio Tree      |   | • AccountsManager (Bank Accounts, Demat Broker Credentials)           |
| • Holdings            | ─>| • ProtectionDashboard (Life, Health, Score Matrix)                    |
| • Transactions        |   | • TaxDashboard (Old vs New Regime, 80C/80D Tracker, Calendar)         |
| • Accounts & Demat    |   | • DocumentVault (Drag & Drop Upload, Category Tagging)                |
| • Protection          |   | • ImportCenter (CAMS CAS, NSDL/CDSL, Excel, Broker APIs)               |
| • Tax Intelligence    |   | • DataManager (Import Review, Duplicate Resolution, Rollback)         |
| • Document Vault      |   | • DataQualityCenter (Missing PAN, Nominees, Cost Prices Audit)        |
| • Import Center       |   | • ReconciliationDashboard (Broker vs Portfolio, Tax vs Realized)      |
| • Data Manager        |   | • OnboardingWizard (8-Step Setup Workflow)                            |
| • Data Quality Center |   | • SettingsView (Security, Backup, Currency, Dataset Toggle)           |
| • Reconciliation      |   | • DeveloperConsole (DB Table Inspector, API Logs, Migrations)         |
| • Estate (Soon)       |   +-----------------------------------------------------------------------+
| • Reports Generator   |
| • Settings            |
| • Developer Mode      |
+-----------------------+
```

---

## 2. Shared State Management

- **Zustand `useUiStore`**: Manages current `activeTab`, `reportingCurrency` (INR/USD), `isDrawerOpen`, `datasetMode` (DEMO/REAL), `isGlobalSearchOpen`, `onboardingStep`, and widget layout choices.
- **Zustand `useAuthStore`**: Manages authenticated user session, JWT tokens, RBAC roles, and permissions.
- **TanStack Query (`@tanstack/react-query`)**: Handles server state caching with centralized query keys (`portfolio`, `dashboard`, `protection`, `tax`, `health`).
