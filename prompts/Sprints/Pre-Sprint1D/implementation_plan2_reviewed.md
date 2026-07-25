# Implementation Plan --- Pre-Sprint 1D: Architecture Alignment (Transaction Ownership Refactoring)

Perform an architectural alignment refactoring to establish that
**Transactions belong to a Holding** (ownership instance) rather than
directly to a generic global `Asset Master`.

> \[!IMPORTANT\] **Pre-Sprint 1D Refactoring Boundary**: - **NOT Sprint
> 1D**: Focus is strictly on transaction-holding ownership alignment. -
> **NO Portfolio, Tax, XIRR, Analytics, or Net Worth Engines**:
> Validation analysis only. - **NO UI Redesign**: Frontend remains 100%
> untouched. - **100% Backward Compatibility**: All 34 existing unit &
> regression tests must continue passing cleanly. - **Non-Destructive
> Backfill Migration**: Add `holding_id` to `transactions` with an
> automated migration script that creates default holdings for existing
> legacy transactions.

------------------------------------------------------------------------

## Target Architecture

    Family
     └── Family Member
          └── Entity
               └── Account
                    └── Holding (Account <-> Asset Master link)
                         ├── Asset Master (Security Master)
                         └── Transactions (Activities against this Holding)
                                └── Price History (via Asset Master)

-   **Asset Master**: Global security definition (e.g. `TCS` stock
    master `INE467B01029`).
-   **Holding**: Specific account-level ownership instance (e.g. Prijesh
    Zerodha Account TCS Holding).
-   **Transaction**: Activity recorded against a specific `Holding`
    (`holding_id`).
-   **Price History**: Daily closing market data associated with
    `Asset Master`.

------------------------------------------------------------------------

## User Review Required

> \[!NOTE\] **Migration & Backward Compatibility Strategy**:
> `holding_id` (FK to `holdings.id`) will be added to `transactions`. To
> guarantee 100% backward compatibility, existing `asset_id` (FK to
> `assets.id`) will be preserved as a fallback, and migration
> `003_transaction_holding_link.ts` will automatically resolve or create
> a default Holding for every existing transaction.

------------------------------------------------------------------------

## Proposed Changes

### Phase 1 --- Canonical Architecture Documentation

#### \[NEW\] [Transaction_Ownership_Design.md](file:///c:/Users/prije/Downloads/MyWorth/docs/Transaction_Ownership_Design.md)

Comprehensive design document detailing: - Architectural rationale for
linking Transactions to Holdings - Database migration & backfill
strategy - Impact analysis across Repositories, Services, and REST
APIs - Future engine readiness (XIRR, Capital Gains, Net Worth)

#### \[MODIFY\] [DATA_MODEL.md](file:///c:/Users/prije/Downloads/MyWorth/docs/DATA_MODEL.md)

Update data model specification with `holding_id` foreign key in
`transactions` and revised cardinality.

#### \[MODIFY\] [SYSTEM_ARCHITECTURE.md](file:///c:/Users/prije/Downloads/MyWorth/docs/SYSTEM_ARCHITECTURE.md)

Update system architecture specification reflecting
`Transaction -> Holding -> Account` flow.

#### \[MODIFY\] [ER_DIAGRAM.md](file:///c:/Users/prije/Downloads/MyWorth/docs/ER_DIAGRAM.md)

Update Mermaid ER diagram to show
`holdings ||--|{ transactions : "contains"`.

------------------------------------------------------------------------

### Phase 2 --- Versioned Database Migration (`003_transaction_holding_link.ts`)

#### \[NEW\] [003_transaction_holding_link.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db/migrations/003_transaction_holding_link.ts)

Migration script executing: 1.
`ALTER TABLE transactions ADD COLUMN holding_id INTEGER REFERENCES holdings(id)`
2. Backfill script: Automatically resolves or creates default
`accounts`, `assets_master`, and `holdings` for existing transactions,
setting `holding_id` for all records. 3. Index creation:
`idx_transactions_holding_id` on `transactions(holding_id)`.

#### \[MODIFY\] [db.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db.ts)

Register `migration003` in
`runMigrations(db, [migration001, migration002, migration003], dbPath)`.

------------------------------------------------------------------------

### Phase 3 --- Repository & Service Layer Refactoring

#### \[MODIFY\] [ITransactionRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/ITransactionRepository.ts) & [SQLiteTransactionRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteTransactionRepository.ts)

Add `holding_id` support to transaction interfaces, creation DTOs, and
query methods (`findByHoldingId`).

#### \[MODIFY\] [IHoldingRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/IHoldingRepository.ts) & [SQLiteHoldingRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteHoldingRepository.ts)

Include joined transaction counts or activity metadata.

------------------------------------------------------------------------

### Phase 4 --- Testing & Deliverables

#### \[MODIFY\] [runTests.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/runTests.ts)

Expand automated test suite to verify: - Migration
`003_transaction_holding_link.ts` execution and automated backfill -
`holding_id` transaction creation and querying by holding - All 34
existing Sprint 1A, 1B & 1C unit tests continue passing

------------------------------------------------------------------------

## Verification Plan

### Automated Tests

1.  `npm test` in `backend` (Unit, Repository, Migration, & Service
    tests).
2.  `npm run build` in `backend` (`tsc`).
3.  `npm run build` in `frontend` (`vite build`).

### Manual Verification

-   Verify database foreign key checks and migration backfill execution.

------------------------------------------------------------------------

# Architecture Review Comments (Solution Architect)

## Verdict

**Status: APPROVED WITH MINOR CHANGES**

Overall Rating: **9.8/10**

This alignment plan is the correct direction and closes the last major
architectural gap before business engines are introduced.

------------------------------------------------------------------------

## Mandatory Comments

### 1. Avoid Dual Source of Truth

The plan keeps both `asset_id` and `holding_id` on Transactions for
backward compatibility.

This is acceptable **only during migration**.

Please document a future deprecation strategy:

Phase 1: - asset_id + holding_id coexist.

Phase 2: - holding_id becomes mandatory.

Phase 3: - asset_id removed from Transaction after successful migration.

Document this roadmap inside `Transaction_Ownership_Design.md`.

------------------------------------------------------------------------

### 2. Do NOT Auto-create Accounts if Avoidable

Current wording proposes creating default Accounts during migration.

Instead:

-   First try to resolve existing: Family → Member → Entity → Account.

-   Only if impossible, create placeholder records and clearly mark them
    as migration-generated.

Avoid silent data creation.

------------------------------------------------------------------------

### 3. Holding Lifecycle

Document Holding lifecycle.

OPEN ↓ Additional Transactions ↓ Corporate Actions ↓ Partial Exit ↓ Full
Exit ↓ CLOSED

This belongs in DATA_MODEL.md.

------------------------------------------------------------------------

### 4. Transaction Repository

Besides `findByHoldingId()`, include:

-   findByAccount()
-   findByEntity()
-   findByFamilyMember()

These become useful aggregation points for future reporting engines.

------------------------------------------------------------------------

### 5. Future Engine Readiness

Add one short section documenting how this design enables:

-   XIRR Engine
-   Capital Gain Engine
-   Dividend Engine
-   Asset Allocation Engine
-   Net Worth Engine

No implementation required.

------------------------------------------------------------------------

## Approved

-   holding_id introduction
-   migration003
-   documentation updates
-   repository refactoring
-   backward compatibility
-   testing approach

Implementation may begin once these minor comments are incorporated.
