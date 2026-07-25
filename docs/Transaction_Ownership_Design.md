# 📐 Transaction_Ownership_Design.md — Transaction Ownership Alignment Specification

**System Name**: Family Wealth OS  
**Author**: Lead Software Engineer & Software Architect  
**Date**: July 25, 2026  
**Status**: Architectural Alignment Specification (Pre-Sprint 1D)

---

## 1. Executive Summary & Rationale

In earlier foundation sprints (Sprint 0 - Sprint 1A), `transactions` were directly linked to legacy `assets` / `assets_master`:

```
Asset Master
   └── Transactions (Legacy Model - Problematic)
```

### Why This Model Is Insufficient for Family Wealth OS
A single global `Asset Master` definition (e.g. `TCS` stock `INE467B01029` or `HDFC Top 100` mutual fund) can be held simultaneously across multiple accounts owned by different family members or legal entities:
- **Prijesh Zerodha Demat Account** owns 100 shares of `TCS`.
- **Prijesh Groww Demat Account** owns 50 shares of `TCS`.
- **Spouse ICICI Direct Account** owns 200 shares of `TCS`.

A transaction represents a cash flow or quantity movement occurring within a specific account holding. Linking transactions directly to `Asset Master` obscures which account executed the buy/sell trade, breaking XIRR per account, capital gains lot matching per PAN, and entity-level net worth calculation.

### Target Ownership Hierarchy
```
Family
 └── Family Member
      └── Entity
           └── Account
                └── Holding (Account-to-Asset Ownership Link)
                     ├── Asset Master (Security Master: Symbol, ISIN, NAV)
                     └── Transactions (Activities against this Holding)
                            └── Price History (via Asset Master)
```

---

## 2. 3-Phase Deprecation & Migration Roadmap

To ensure 100% backward compatibility with existing legacy routes without dual-source-of-truth drift:

| Phase | Milestone | Behavior |
|---|---|---|
| **Phase 1 (Current - Pre-Sprint 1D)** | Backward Compatible Coexistence | `holding_id` added to `transactions`. Both `asset_id` and `holding_id` coexist. Migration `003_transaction_holding_link.ts` backfills `holding_id` for all transactions. |
| **Phase 2 (Sprint 1D / Phase 2)** | Mandatory Holding Ownership | `holding_id` becomes mandatory for all new `/api/v1/transactions` APIs and import services. `asset_id` auto-derived from `holding.asset_id`. |
| **Phase 3 (Post-Migration Clean Up)** | Legacy Column Deprecation | Legacy `asset_id` column deprecated and removed from `transactions` table schema after full domain migration verification. |

---

## 3. Non-Destructive Migration & Backfill Strategy (`003_transaction_holding_link.ts`)

1. **Schema Alteration**: Add `holding_id INTEGER REFERENCES holdings(id)` to `transactions` table with index `idx_transactions_holding_id`.
2. **Deterministic Backfill Logic**:
   - For every existing `transaction` record:
     - Check if a matching `holding` already exists for the transaction's `asset_id` under an active `account`.
     - If an existing `holding` is found, set `transaction.holding_id = holding.id`.
     - If no existing account/holding is found for the legacy asset, first resolve or create a clearly marked `[System Migration Default]` Account under the default Entity, create the `holding`, and link `transaction.holding_id = holding.id`.
   - **No Silent Data Creation**: Default accounts/holdings are explicitly prefixed with `[System Migration Default]`.

---

## 4. Future Business Engine Readiness Analysis

This refactored model directly unlocks downstream financial engines without schema churn:

### 4.1 XIRR Engine
- **Requirement**: Accurately track exact cash inflow/outflow dates and amounts per account/holding/entity.
- **Enabling Factor**: `holding_id` isolates transactions to specific account ownership boundaries. XIRR can be calculated per holding, per account, per entity, or consolidated per family.

### 4.2 Capital Gains & Tax Engine
- **Requirement**: Match purchase lots (FIFO) against sales lots under a specific tax entity (PAN number).
- **Enabling Factor**: `Transaction -> Holding -> Account -> Entity (PAN)` provides the complete audit path for Tax P&L and Form 26AS alignment.

### 4.3 Dividend & Income Engine
- **Requirement**: Attributes cash credit transactions to the receiving bank account while linking to the underlying asset master.
- **Enabling Factor**: Holding ownership separates dividend stock holdings from bank receiving accounts.

### 4.4 Asset Allocation & Rebalancing Engine
- **Requirement**: Aggregate holdings by `asset_type`, `category`, or `sector` across all family members.
- **Enabling Factor**: Queries join `Transaction -> Holding -> Asset Master (asset_type/metadata)` allowing dynamic drill-downs.

### 4.5 Net Worth Engine
- **Requirement**: Real-time evaluation of total assets across all accounts and entities.
- **Enabling Factor**: Net worth = `SUM(Holding Quantity * Asset Master Latest Price)`.
