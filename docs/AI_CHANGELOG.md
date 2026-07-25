# AI Changelog

All changes executed by AI Coding Assistant are logged in reverse chronological order.

---

## [Architecture v1.0] - Domain Architecture Version 1.0 Stabilization & Engine Roadmap (2026-07-25)

### Summary
Finalized, approved, and froze the core domain architecture (`Family -> Family Member -> Entity -> Account -> Holding -> Asset Master / Transactions -> Price History`) as **Version 1.0 (Frozen)**. Created `docs/Architecture_v1.0.md`, updated `DATA_MODEL.md` with Asset Identifier Strategy and Asset Classification Strategy, updated `SYSTEM_ARCHITECTURE.md` with Engine Architecture specifications (`backend/src/engines/`: `NetWorthEngine`, `XirrEngine`, `CapitalGainEngine`, `DividendEngine`, `AssetAllocationEngine`, `TaxEngine`, `GoalEngine`), and updated system roadmap.

### Added & Updated
- `docs/Architecture_v1.0.md`: Canonical Architecture Version 1.0 specification document.
- `docs/DATA_MODEL.md`: Updated with `Domain Architecture Version: 1.0 (Frozen)` header, Asset Identifier Strategy, and Future Classification Strategy.
- `docs/SYSTEM_ARCHITECTURE.md`: Updated with `Domain Architecture Version: 1.0 (Frozen)` header, Engine Architecture section (`backend/src/engines/`), and updated roadmap.

---

## [Pre-Sprint 1D] - Architecture Alignment: Transaction Ownership Refactoring (2026-07-25)

### Summary
Refactored transaction ownership so that transactions belong to a specific `Holding` instance (`Account -> Holding -> Transactions`) rather than directly to a generic global `Asset Master`. Introduced database migration `003_transaction_holding_link.ts` with deterministic backfilling for legacy unlinked transactions, added `holding_id` support and multi-level aggregation methods (`findByHoldingId`, `findByAccount`, `findByEntity`, `findByFamilyMember`) to `ITransactionRepository`, created canonical architectural alignment specification `docs/Transaction_Ownership_Design.md`, and updated `DATA_MODEL.md`, `SYSTEM_ARCHITECTURE.md`, and `ER_DIAGRAM.md`.

### Added & Refactored
- `docs/Transaction_Ownership_Design.md`: Canonical architectural design specification for transaction holding ownership and 3-phase deprecation roadmap.
- `backend/src/db/migrations/003_transaction_holding_link.ts`: Versioned database migration adding `holding_id` to `transactions` with deterministic backfill.
- `backend/src/repositories/ITransactionRepository.ts` & `SQLiteTransactionRepository.ts`: Added `holding_id` and multi-level aggregation queries (`findByHoldingId`, `findByAccount`, `findByEntity`, `findByFamilyMember`).

---

## [Sprint 1C] - Asset Master & Holdings Foundation (2026-07-25)

### Summary
Introduced global `assets_master` definitions (supporting 14 asset types) and `holdings` ownership links without introducing a Portfolio abstraction. Created `docs/DATA_MODEL.md`, `docs/SYSTEM_ARCHITECTURE.md`, and `docs/ER_DIAGRAM.md`. Implemented 3-tier master asset deduplication (ISIN -> Symbol+Type -> Name+Type), Zod validation schemas, `AssetMasterService`, `HoldingService`, REST endpoints under `/api/v1/assets-master` and `/api/v1/holdings`, and expanded test suite to 34 passing tests.
