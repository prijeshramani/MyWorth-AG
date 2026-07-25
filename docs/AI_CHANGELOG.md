# AI Changelog

All changes executed by AI Coding Assistant are logged in reverse chronological order.

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

### Added
- `docs/DATA_MODEL.md`: Canonical entity-relationship standards and JSON metadata schemas.
- `docs/SYSTEM_ARCHITECTURE.md`: Architecture blueprint and 4-layer design flow.
- `docs/ER_DIAGRAM.md`: Dedicated Mermaid ER diagram.
- `backend/src/db/migrations/002_asset_master_and_holdings.ts`: Versioned migration script establishing `assets_master` and `holdings`.
- `backend/src/repositories/IAssetMasterRepository.ts` & `SQLiteAssetMasterRepository.ts`: Asset master repository interface and concrete SQLite implementation.
- `backend/src/repositories/IHoldingRepository.ts` & `SQLiteHoldingRepository.ts`: Holding repository interface and concrete SQLite implementation.
- `backend/src/schema/assetMasterSchemas.ts`: Zod validation schemas for asset master and holding DTOs.
- `backend/src/services/AssetMasterService.ts`: Master asset service with 3-tier deduplication.
- `backend/src/services/HoldingService.ts`: Holding domain service linking accounts to master assets.
- `backend/src/routes/v1/assetsMaster.ts`: REST controller for `/api/v1/assets-master`.
- `backend/src/routes/v1/holdings.ts`: REST controller for `/api/v1/holdings`.
- `docs/Sprint_1C_Retrospective.md`: Retrospective report for Sprint 1C.
- `prompts/summary/Sprint 1C - Implementation Summary.md`: Summary report for Sprint 1C.

---

## [Sprint 1B] - Domain Foundation & Ownership Model (2026-07-25)

### Summary
Established the core financial ownership hierarchy (`Family` -> `Family Members` -> `Entities` -> `Accounts`) for Family Wealth OS. Introduced a versioned database migration engine (`schema_migrations` tracking, numbered migration files, timestamped database file backups), a soft-delete strategy (`deleted_at TIMESTAMP`), full REST CRUD APIs (GET, POST, PUT, DELETE), Zod validation schemas with PAN regex and extended enums, an `OwnershipService` to validate 4-tier chain integrity, atomic transaction helpers (`runInTransaction`), and an expanded automated test suite (26 passing tests).

### Added
- `backend/src/db/migrationRunner.ts`: Versioned database migration runner with automated backup creator (`data/backups/myworth_backup_<timestamp>.db`).
- `backend/src/db/migrations/001_domain_foundation.ts`: Versioned migration script establishing `families`, `family_members`, `entities`, `accounts`, soft-delete columns (`deleted_at`), and partial UNIQUE index on `entities(pan_number)`.
- `backend/src/db/transactionHelper.ts`: Transaction helper exposing `runInTransaction`.
- `backend/src/repositories/IFamilyRepository.ts` & `SQLiteFamilyRepository.ts`: Family repository interface & implementation with soft-delete support.
- `backend/src/repositories/IFamilyMemberRepository.ts` & `SQLiteFamilyMemberRepository.ts`: Family Member repository interface & implementation with soft-delete support.
- `backend/src/repositories/IEntityRepository.ts` & `SQLiteEntityRepository.ts`: Entity repository interface & implementation with soft-delete and PAN lookup support.
- `backend/src/repositories/IAccountRepository.ts` & `SQLiteAccountRepository.ts`: Account repository interface & implementation with soft-delete and auto-masked account numbers.
- `backend/src/schema/domainSchemas.ts`: Zod validation schemas for all domain DTOs with PAN regex and extended Enums (`GRANDPARENT`, `GRANDCHILD`, `IN_LAW`, `PARTNERSHIP`, `LLP`).
- `backend/src/services/FamilyService.ts`: Domain service for Family and Family Member management.
- `backend/src/services/EntityService.ts`: Domain service with duplicate active PAN validation.
- `backend/src/services/AccountService.ts`: Domain service for Account management.
- `backend/src/services/OwnershipService.ts`: Domain service resolving full 4-tier ownership chain (`Family -> Family Member -> Entity -> Account`).
- `backend/src/routes/v1/families.ts`: REST controller with full CRUD (GET, POST, PUT, DELETE).
- `backend/src/routes/v1/familyMembers.ts`: REST controller with full CRUD (GET, POST, PUT, DELETE).
- `backend/src/routes/v1/entities.ts`: REST controller with full CRUD (GET, POST, PUT, DELETE).
- `backend/src/routes/v1/accounts.ts`: REST controller with full CRUD (GET, POST, PUT, DELETE) and ownership chain resolution (`GET /api/v1/accounts/:id/ownership-chain`).
- `docs/Sprint_1B_Retrospective.md`: Sprint 1B Retrospective document.
- `prompts/summary/Sprint 1B - Implementation Summary.md`: Comprehensive Sprint 1B summary report under `prompts/summary/`.

---

## [Sprint 1A] - Foundation Hardening & Security (2026-07-25)

### Summary
Implemented technical foundation hardening and security infrastructure without altering database schema, UI, or business logic. Decoupled all Express route handlers from direct SQL queries by establishing a clean Repository layer (`IAssetRepository`, `ITransactionRepository`, `IPriceRepository`, `ICredentialRepository`, `ISyncLogRepository`). Hardened network security with 127.0.0.1 loopback binding, restricted CORS policy, and AES-256-GCM column encryption for sensitive API tokens. Added structured JSON logging, correlation ID tracking, central error handling middleware, and automated unit test suite.
