# 🗄 DATA_MODEL.md — Family Wealth OS Data Model Specification

**System Name**: Family Wealth OS  
**Author**: Lead Software Engineer & Software Architect  
**Date**: July 25, 2026  
**Status**: Canonical Data Reference (Pre-Sprint 1D Alignment)

---

## 1. Domain Ownership & Asset Architecture

Family Wealth OS structures wealth management into a 5-tier entity-relationship model:

```
Family (Root Container)
 └── Family Members (Self, Spouse, Child, Parent, Sibling, Grandparent, Grandchild, In-Law, Other)
      └── Entities (Individual, HUF, Minor, Company, Trust, Partnership, LLP, Other)
           └── Accounts (Demat, Bank, EPF, PPF, NPS, FD, Folio, Credit Card, Other)
                └── Holdings (Account-to-Asset Ownership Links)
                     ├── Assets Master (Global Asset Definitions: Stock, Mutual Fund, Gold, FD, Real Estate, etc.)
                     └── Transactions (Activities against a Holding - Authoritative Source of Truth)
                            └── Price History (via Asset Master)
```

---

## 2. Table Schemas & Definitions

### 2.1 Ownership Model Tables (Sprint 1B)

#### `families`
Root boundary for family units.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `name`: TEXT NOT NULL
- `currency`: TEXT NOT NULL DEFAULT 'INR'
- `created_at`: TEXT DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TEXT DEFAULT CURRENT_TIMESTAMP
- `deleted_at`: TEXT DEFAULT NULL (Soft-delete timestamp)

#### `family_members`
Individual members within a family.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `family_id`: INTEGER NOT NULL (FK -> `families.id`)
- `name`: TEXT NOT NULL
- `relationship`: TEXT NOT NULL CHECK (`SELF`, `SPOUSE`, `CHILD`, `PARENT`, `SIBLING`, `GRANDPARENT`, `GRANDCHILD`, `IN_LAW`, `OTHER`)
- `date_of_birth`: TEXT (YYYY-MM-DD)
- `created_at`, `updated_at`, `deleted_at`: Standard timestamp audit columns

#### `entities`
Legal and tax entities owned by family members.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `family_member_id`: INTEGER NOT NULL (FK -> `family_members.id`)
- `name`: TEXT NOT NULL
- `entity_type`: TEXT NOT NULL CHECK (`INDIVIDUAL`, `HUF`, `MINOR`, `COMPANY`, `TRUST`, `PARTNERSHIP`, `LLP`, `OTHER`)
- `pan_number`: TEXT (Partial UNIQUE constraint where `deleted_at IS NULL AND pan_number IS NOT NULL AND pan_number != ''`)
- `created_at`, `updated_at`, `deleted_at`: Standard timestamp audit columns

#### `accounts`
Financial institution accounts registered under an entity.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `entity_id`: INTEGER NOT NULL (FK -> `entities.id`)
- `account_name`: TEXT NOT NULL
- `account_type`: TEXT NOT NULL CHECK (`DEMAT`, `BANK`, `EPF`, `PPF`, `NPS`, `FD`, `MUTUAL_FUND_FOLIO`, `CREDIT_CARD`, `OTHER`)
- `provider`: TEXT (e.g., Zerodha, CAMS, Karvy)
- `institution_name`: TEXT (e.g., HDFC Bank, ICICI Securities)
- `account_number`: TEXT
- `masked_account_number`: TEXT (e.g., `••••5678`)
- `nickname`: TEXT
- `is_active`: INTEGER NOT NULL DEFAULT 1 (1 = Active, 0 = Inactive)
- `created_at`, `updated_at`, `deleted_at`: Standard timestamp audit columns

---

### 2.2 Asset Master, Holdings & Transactions Tables (Sprint 1C & Pre-Sprint 1D)

#### `assets_master`
Global master definitions of financial instruments. Unique per security across all accounts.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `asset_type`: TEXT NOT NULL CHECK (`STOCK`, `MUTUAL_FUND`, `ETF`, `BOND`, `FD`, `PPF`, `EPF`, `NPS`, `SSA`, `BANK`, `GOLD`, `REAL_ESTATE`, `CRYPTO`, `OTHER`)
- `name`: TEXT NOT NULL
- `display_name`: TEXT NOT NULL
- `symbol`: TEXT (Nullable, e.g., Ticker `RELIANCE.NS`)
- `isin`: TEXT (Nullable, Partial UNIQUE constraint where `deleted_at IS NULL AND isin IS NOT NULL AND isin != ''`)
- `currency`: TEXT NOT NULL DEFAULT 'INR'
- `status`: TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (`ACTIVE`, `INACTIVE`, `DELISTED`, `MATURED`)
- `metadata`: TEXT (JSON text for asset-type specific attributes)
- `created_at`, `updated_at`, `deleted_at`: Standard timestamp audit columns

#### `holdings`
Ownership link associating a specific `account_id` with an `asset_id`.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `account_id`: INTEGER NOT NULL (FK -> `accounts.id`)
- `asset_id`: INTEGER NOT NULL (FK -> `assets_master.id`)
- `opened_at`: TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
- `closed_at`: TEXT (Nullable, timestamp when holding is fully liquidated)
- `status`: TEXT NOT NULL DEFAULT 'OPEN' CHECK (`OPEN`, `CLOSED`)
- `created_at`, `updated_at`, `deleted_at`: Standard timestamp audit columns
- Partial UNIQUE constraint: `(account_id, asset_id)` WHERE `deleted_at IS NULL AND status = 'OPEN'`

#### `transactions`
Activities and cashflows recorded against a specific `holding_id`.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `holding_id`: INTEGER (FK -> `holdings.id`, Primary ownership relationship)
- `asset_id`: INTEGER (FK -> `assets.id` / `assets_master.id`, Legacy fallback during Phase 1 transition)
- `type`: TEXT NOT NULL CHECK (`BUY`, `SELL`, `DIVIDEND`, `INTEREST`, `DEPOSIT`, `WITHDRAWAL`, `SPLIT`, `BONUS`, `MERGER`, `FEE`, `TAX`, `OTHER`)
- `date`: TEXT NOT NULL (YYYY-MM-DD)
- `quantity`: REAL NOT NULL DEFAULT 0
- `price`: REAL NOT NULL DEFAULT 0
- `amount`: REAL NOT NULL DEFAULT 0
- `source`: TEXT (e.g., Zerodha, CAMS, Manual)
- `narration`: TEXT
- `tx_category`: TEXT
- `created_at`: TEXT DEFAULT CURRENT_TIMESTAMP

---

## 3. Holding Lifecycle & State Transitions

A `Holding` tracks account-level security ownership over time:

```
[OPEN] ──(Additional Buys / Reinvest / Dividends)──> [OPEN] (Active Holding)
  │
  ├──(Corporate Actions: Bonus, Split, Merger)─────> [OPEN] (Adjusted Lot Units)
  │
  ├──(Partial Sell / Exit)────────────────────────> [OPEN] (Reduced Quantity)
  │
  └──(Full Sell / Liquidate / Maturity)───────────> [CLOSED] (closed_at set)
```

- **OPEN**: Active holding ownership link. Quantity > 0 or active position.
- **CLOSED**: Position fully liquidated (Quantity = 0). `closed_at` set to final sell/exit transaction date.

---

## 4. Stored vs. Computed Fields Principle

> [!IMPORTANT]
> **Transactions are the Authoritative Source of Truth.**

- **Stored State**: `assets_master` definitions, `holdings` ownership links, `accounts`, and `transactions` records (date, quantity, price, amount, type).
- **Computed Projections**:
  - `Quantity` = `SUM(BUY + REINVEST + BONUS + SPLIT) - SUM(SELL)` from transactions.
  - `Cost Basis` = Computed FIFO purchase lot costs.
  - `Current Valuation` = Computed `Quantity * Latest Price` (from `asset_prices`).
  - `Unrealized Gain / Loss` = `Current Valuation - Cost Basis`.
- **Holdings Rule**: `holdings` DOES NOT store static quantity or valuation numbers as authoritative state. All metrics are computed dynamically at query time or exposed via read-model projections.

---

## 5. Asset Metadata Standards (JSON Schema Examples)

### 5.1 Mutual Fund
```json
{
  "amc": "HDFC Mutual Fund",
  "category": "Equity - Large Cap",
  "scheme_code": "101234",
  "plan": "DIRECT",
  "option": "GROWTH"
}
```

### 5.2 Fixed Deposit (FD)
```json
{
  "interest_rate": 7.25,
  "compounding_frequency": "QUARTERLY",
  "maturity_date": "2028-03-31",
  "auto_renew": false
}
```

### 5.3 Provident Fund (EPF / PPF)
```json
{
  "uan": "100987654321",
  "pf_number": "MH/BAN/0012345/000/0000123",
  "interest_rate": 8.25
}
```

### 5.4 Real Estate
```json
{
  "property_type": "RESIDENTIAL_APARTMENT",
  "area_sqft": 1450,
  "location": "Bengaluru, KA",
  "purchase_year": 2021
}
```
