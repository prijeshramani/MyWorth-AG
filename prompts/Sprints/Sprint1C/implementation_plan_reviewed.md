# Implementation Plan --- Sprint 1C: Asset Master & Holdings Foundation

Introduce the **Asset Master** and **Holding** domain models
establishing global asset definitions and account-level ownership links
without a Portfolio abstraction.

> \[!IMPORTANT\] **Sprint Scope Boundary**: - **NO Portfolio
> Abstraction**: Assets belong directly to Accounts via Holdings
> (`Account -> Holding -> Asset Master`). - **NO UI Redesign**: Frontend
> visual components remain 100% untouched. - **NO Analytics, Goal, XIRR,
> Tax, or Net Worth Engines**: Focus is strictly on master definitions
> and ownership links. - **Transactions as Source of Truth**: Calculated
> metrics (current value, quantity, cost basis) are computed from
> transactions and prices, not duplicated as authoritative state in
> Holding. - **100% Backward Compatibility**: Legacy `assets`,
> `transactions`, `asset_prices`, and Sprint 1B ownership tables remain
> fully operational.

------------------------------------------------------------------------

## User Review Required

> \[!NOTE\] **Asset Master Naming & Disambiguation**: To preserve 100%
> backward compatibility with Sprint 1A legacy `assets` table, the new
> global asset master table will be named `assets_master` in database
> migration `002_asset_master_and_holdings.ts`, and the repository will
> be named `IAssetMasterRepository` / `SQLiteAssetMasterRepository.ts`.

------------------------------------------------------------------------

## Proposed Changes

### Phase 1 --- Versioned Database Migration (`002_asset_master_and_holdings.ts`)

#### \[NEW\] [002_asset_master_and_holdings.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db/migrations/002_asset_master_and_holdings.ts)

Migration script creating: 1. `assets_master` table: -
`id INTEGER PRIMARY KEY AUTOINCREMENT` -
`asset_type TEXT NOT NULL CHECK(asset_type IN ('STOCK', 'MUTUAL_FUND', 'ETF', 'BOND', 'FD', 'PPF', 'EPF', 'NPS', 'SSA', 'BANK', 'GOLD', 'REAL_ESTATE', 'CRYPTO', 'OTHER'))` -
`name TEXT NOT NULL` - `display_name TEXT NOT NULL` - `symbol TEXT`
(nullable, e.g., Ticker `RELIANCE.NS`) - `isin TEXT` (nullable, e.g.,
`INF209K01157`) - `currency TEXT NOT NULL DEFAULT 'INR'` -
`status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'DELISTED', 'MATURED'))` -
`metadata TEXT` (JSON text, optional) -
`created_at TEXT DEFAULT CURRENT_TIMESTAMP` -
`updated_at TEXT DEFAULT CURRENT_TIMESTAMP` -
`deleted_at TEXT DEFAULT NULL` 2. `holdings` table: -
`id INTEGER PRIMARY KEY AUTOINCREMENT` -
`account_id INTEGER NOT NULL REFERENCES accounts(id)` -
`asset_id INTEGER NOT NULL REFERENCES assets_master(id)` -
`opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP` - `closed_at TEXT`
(nullable) -
`status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'CLOSED'))` -
`created_at TEXT DEFAULT CURRENT_TIMESTAMP` -
`updated_at TEXT DEFAULT CURRENT_TIMESTAMP` -
`deleted_at TEXT DEFAULT NULL` 3. Partial Indexes: -
`idx_assets_master_isin_unique` on `assets_master(isin)` WHERE
`deleted_at IS NULL AND isin IS NOT NULL AND isin != ''` -
`idx_holdings_account_asset_unique` on `holdings(account_id, asset_id)`
WHERE `deleted_at IS NULL AND status = 'OPEN'`

#### \[MODIFY\] [db.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db.ts)

Register `migration002` in
`runMigrations(db, [migration001, migration002], dbPath)`.

------------------------------------------------------------------------

### Phase 2 --- Repository Layer

#### \[NEW\] [IAssetMasterRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/IAssetMasterRepository.ts) & [SQLiteAssetMasterRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteAssetMasterRepository.ts)

Interface and concrete SQLite implementation for `AssetMaster` CRUD,
search by ISIN, symbol, or type, and soft-delete support.

#### \[NEW\] [IHoldingRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/IHoldingRepository.ts) & [SQLiteHoldingRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteHoldingRepository.ts)

Interface and concrete SQLite implementation for `Holding` CRUD, query
by `account_id`, query by `asset_id`, and soft-delete support.

------------------------------------------------------------------------

### Phase 3 & 4 --- Zod Validation Schemas & Domain Services

#### \[NEW\] [assetMasterSchemas.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/schema/assetMasterSchemas.ts)

Zod validation schemas: - `CreateAssetMasterSchema`,
`UpdateAssetMasterSchema` - `CreateHoldingSchema`, `UpdateHoldingSchema`

#### \[NEW\] Domain Services

-   [AssetMasterService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/AssetMasterService.ts):
    Business logic for global asset master creation, deduplication by
    ISIN/symbol, and lookups.
-   [HoldingService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/HoldingService.ts):
    Business logic for creating holdings linking Accounts to Asset
    Masters, verifying Account and Asset exist, and managing open/closed
    status.

------------------------------------------------------------------------

### Phase 5 --- REST API Endpoints (`/api/v1/*`)

#### \[NEW\] [assetsMaster.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/v1/assetsMaster.ts)

-   `GET /api/v1/assets-master` (List/search master assets)
-   `GET /api/v1/assets-master/:id` (Get single asset master)
-   `POST /api/v1/assets-master` (Create asset master)
-   `PUT /api/v1/assets-master/:id` (Update asset master)
-   `DELETE /api/v1/assets-master/:id` (Soft-delete asset master)

#### \[NEW\] [holdings.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/v1/holdings.ts)

-   `GET /api/v1/holdings` (List holdings, filter by `accountId` or
    `assetId`)
-   `GET /api/v1/holdings/:id` (Get single holding)
-   `POST /api/v1/holdings` (Create holding link)
-   `PUT /api/v1/holdings/:id` (Update holding)
-   `DELETE /api/v1/holdings/:id` (Soft-delete holding link)

#### \[MODIFY\] [index.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/index.ts)

Mount `/api/v1/assets-master` and `/api/v1/holdings` routers.

------------------------------------------------------------------------

### Phase 6 --- Tests & Deliverables

#### \[MODIFY\] [runTests.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/runTests.ts)

Expand automated test suite to verify: - Migration
`002_asset_master_and_holdings` execution - `AssetMasterRepository` &
`HoldingRepository` CRUD - ISIN deduplication and symbol lookups -
Soft-delete behavior for assets master and holdings - Account-to-Asset
holding linkage validation (`HoldingService`) - All 26 existing Sprint
1A & 1B unit tests continue passing

#### \[MODIFY\] [.ai/SESSION_CONTEXT.md](file:///c:/Users/prije/Downloads/MyWorth/.ai/SESSION_CONTEXT.md) & [AI_CHANGELOG.md](file:///c:/Users/prije/Downloads/MyWorth/docs/AI_CHANGELOG.md)

#### \[NEW\] [Sprint_1C_Retrospective.md](file:///c:/Users/prije/Downloads/MyWorth/docs/Sprint_1C_Retrospective.md)

#### \[NEW\] [Sprint 1C - Implementation Summary.md](file:///c:/Users/prije/Downloads/MyWorth/prompts/summary/Sprint%201C%20-%20Implementation%20Summary.md)

------------------------------------------------------------------------

## Verification Plan

### Automated Tests

1.  `npm test` in `backend` (Unit, Repository, Migration, & Service
    tests).
2.  `npm run build` in `backend` (`tsc`).
3.  `npm run build` in `frontend` (`vite build`).

### Manual Verification

-   Verify `/api/v1/assets-master` and `/api/v1/holdings` endpoints via
    local HTTP requests.

------------------------------------------------------------------------

# Architecture Review Comments (Solution Architect)

## Overall Verdict

**Status: APPROVED WITH MANDATORY CHANGES**

Overall score: **9.4/10**

The implementation plan is well aligned with Sprint 1B and preserves the
agreed architecture. The following items should be addressed before
implementation begins.

------------------------------------------------------------------------

## Mandatory Changes

### 1. Add DATA_MODEL.md (Missing)

Create `docs/DATA_MODEL.md` containing:

-   Complete ER model
-   Table descriptions
-   PK/FK relationships
-   Cardinality
-   Stored vs Computed fields
-   Business rules
-   Asset lifecycle
-   Holding lifecycle

This document becomes the canonical data reference.

------------------------------------------------------------------------

### 2. Add SYSTEM_ARCHITECTURE.md (Missing)

Create `docs/SYSTEM_ARCHITECTURE.md` documenting:

-   Overall architecture
-   Layered design
-   Domain model
-   Repository → Service → API flow
-   Folder structure
-   API conventions
-   Migration strategy
-   ADRs
-   Future roadmap

This becomes the architectural blueprint.

------------------------------------------------------------------------

### 3. Add ER_DIAGRAM.md (Missing)

Create a Mermaid ER diagram.

This document should evolve with every sprint.

------------------------------------------------------------------------

### 4. Clarify Holdings

Holding must be treated as an **ownership link**, not the authoritative
financial state.

Transactions remain the source of truth.

If any calculated values are introduced later (quantity, average cost,
current value), clearly document them as cache/projection values.

------------------------------------------------------------------------

### 5. Asset Metadata

The proposed optional JSON metadata field is approved.

Document examples for:

-   Mutual Fund (AMC, Category)
-   FD (Interest Rate, Maturity)
-   PPF
-   EPF
-   NPS
-   Real Estate
-   Gold

This avoids future schema churn.

------------------------------------------------------------------------

### 6. Asset Deduplication

Deduplicate Assets using business rules:

Priority:

1.  ISIN
2.  Symbol + Asset Type
3.  Name + Asset Type

Not every Asset has an ISIN.

------------------------------------------------------------------------

### 7. Future Extension

Ensure Asset Master design remains extensible for:

-   Insurance
-   Sovereign Gold Bonds
-   Physical Gold
-   Vehicles
-   Collectibles

No implementation required now.

------------------------------------------------------------------------

## Approved

-   assets_master naming
-   holdings table
-   versioned migration 002
-   repositories
-   services
-   REST APIs
-   soft delete
-   transaction-as-source-of-truth
-   backward compatibility

Proceed once the above comments are incorporated.
