# 🏛 Architecture_v1.0.md — Canonical Architecture Specification (v1.0 Frozen)

**System Name**: Family Wealth OS  
**Author**: Lead Software Engineer & Software Architect  
**Date**: July 25, 2026  
**Status**: APPROVED — DOMAIN ARCHITECTURE VERSION 1.0 (FROZEN)

---

## 1. Domain Architecture Version 1.0 (Frozen)

The core domain model of Family Wealth OS is hereby finalized, approved, and frozen as **Version 1.0**. 

Future development must build business capabilities, data importers, and computational engines on top of this stable model rather than refactoring or modifying the fundamental ownership hierarchy.

```
Family (Root Boundary)
 └── Family Member (Self, Spouse, Child, Parent, Sibling, Grandparent, Grandchild, In-Law, Other)
      └── Entity (Individual, HUF, Minor, Company, Trust, Partnership, LLP, Other)
           └── Account (Demat, Bank, EPF, PPF, NPS, FD, Folio, Credit Card, Other)
                └── Holding (Account-to-Asset Ownership Link)
                     ├── Asset Master (Security Master: Symbol, ISIN, Currency, NAV)
                     └── Transactions (Activities against a Holding - Authoritative Source of Truth)
                            └── Price History (via Asset Master)
```

No new core domain entities should be introduced without an explicit, formal architectural review.

---

## 2. Architectural Principles & Directives

1. **Evolution Before Replacement**: Reuse > Refactor > Replace. The system evolves gracefully through versioned migrations (`schema_migrations` tracking & automated database backups).
2. **Local-First & Privacy-First**: 100% of sensitive financial data, plain-text statements, and SQLite records reside on local encrypted storage (AES-256-GCM encryption for API credentials).
3. **Transactions as Authoritative Source of Truth**: Financial position, unit quantities, cost basis, and valuations are derived dynamically from transaction history and market prices. Holdings store ownership links (`account_id`, `asset_id`, `opened_at`, `closed_at`, `status`), NOT static authoritative balances.
4. **Strict Layer Responsibilities**:
   - **Services**: Orchestrate domain workflows, validation, and multi-entity cross checks.
   - **Repositories**: Encapsulate SQL queries and soft-delete filtering (`WHERE deleted_at IS NULL`).
   - **Engines**: Pure computational modules responsible for complex financial math (XIRR, Tax, Net Worth).

---

## 3. Stored vs. Computed Data Philosophy

| Data Category | Stored vs. Computed | Storage Location | Rationale |
|---|---|---|---|
| **Master Security Definitions** | Stored | `assets_master` | Canonical global definitions shared across accounts. |
| **Account Ownership Links** | Stored | `holdings` | Identifies which account owns which asset. |
| **Cashflows & Lot Movements** | Stored | `transactions` | Historical cashflows and lot events are immutable source records. |
| **Market Prices & NAVs** | Stored | `asset_prices` | Time-series market closing data per master asset. |
| **Current Holding Quantity** | Computed | Derived at Runtime | `SUM(BUY + REINVEST + BONUS + SPLIT) - SUM(SELL)` |
| **Cost Basis & FIFO Lots** | Computed | Derived at Runtime | Calculated via FIFO lot matching against buy transactions. |
| **Current Market Valuation** | Computed | Derived at Runtime | `Computed Quantity * Latest Price` (from `asset_prices`). |
| **Unrealized Gain / Loss** | Computed | Derived at Runtime | `Current Market Valuation - Cost Basis`. |
| **Account / Entity Net Worth** | Computed | Derived at Runtime | `SUM(Holding Valuations)` for all active holdings under the account/entity. |

---

## 4. Computational Engine Roadmap (`backend/src/engines/`)

Future calculation logic will be isolated into specialized, stateless engine modules:

```
backend/src/engines/
├── NetWorthEngine.ts        # Dynamic multi-currency valuation & aggregation
├── XirrEngine.ts             # Account/Holding cashflow XIRR calculation
├── CapitalGainEngine.ts     # FIFO lot matching & Short/Long-Term Tax P&L
├── DividendEngine.ts        # Income & dividend yield attribution
├── AssetAllocationEngine.ts # Portfolio asset class & sector exposure
├── TaxEngine.ts             # Advance tax & Form 26AS estimation
└── GoalEngine.ts            # Financial goal tracking & Monte Carlo projections
```

---

## 5. System Roadmap

The system roadmap focuses on building business capabilities on top of Architecture v1.0:

- **Sprint 1D**: Transaction Engine Foundation (Transaction ingestion, normalization, and holding validation)
- **Sprint 2**: Price Engine (Historical NAV, Yahoo Finance, AMFI, and NPS market price synchronization)
- **Sprint 3**: Analytics Engine (Dynamic asset allocation, net worth aggregation, multi-member drilldowns)
- **Sprint 4**: Tax & Capital Gains Engine (FIFO P&L lot matching, STCG/LTCG tax estimation)
- **Sprint 5**: Goal Planning Engine (Goal tracking, SIP progress, asset liability matching)
