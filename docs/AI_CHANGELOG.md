# AI Changelog

All changes executed by AI Coding Assistant are logged in reverse chronological order.

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

### Refactored & Hardened
- `backend/src/db.ts`: Integrated versioned migration execution on database startup (`initDb`).
- `backend/src/index.ts`: Mounted `/api/v1/*` domain routers.
- `backend/src/__tests__/runTests.ts`: Expanded unit test suite from 11 to 26 passing tests.

### Testing & Verification
- Backend compilation: `tsc` passed with 0 errors.
- Frontend compilation: `vite build` passed with 0 errors.
- Automated unit test suite (`npm test`): 26 tests passed, 0 failed.

---

## [Sprint 1A] - Foundation Hardening & Security (2026-07-25)

### Summary
Implemented technical foundation hardening and security infrastructure without altering database schema, UI, or business logic. Decoupled all Express route handlers from direct SQL queries by establishing a clean Repository layer (`IAssetRepository`, `ITransactionRepository`, `IPriceRepository`, `ICredentialRepository`, `ISyncLogRepository`). Hardened network security with 127.0.0.1 loopback binding, restricted CORS policy, and AES-256-GCM column encryption for sensitive API tokens. Added structured JSON logging, correlation ID tracking, central error handling middleware, and automated unit test suite.

### Added
- `backend/src/errors/AppError.ts`: Custom error class hierarchy (`AppError`, `ValidationError`, `NotFoundError`, `DatabaseError`, `FinancialComputationError`).
- `backend/src/services/encryptionService.ts`: AES-256-GCM symmetric encryption utility with backward-compatible plain-text fallback.
- `backend/src/utils/logger.ts`: Structured JSON logger with `maskSensitiveData` utility.
- `backend/src/middleware/correlationMiddleware.ts`: Request correlation ID tracking (`X-Correlation-ID`).
- `backend/src/middleware/errorHandlerMiddleware.ts`: Express global error middleware returning standardized error response envelopes.
- `backend/src/repositories/IAssetRepository.ts` & `SQLiteAssetRepository.ts`: Asset Repository interface and concrete SQLite implementation.
- `backend/src/repositories/ITransactionRepository.ts` & `SQLiteTransactionRepository.ts`: Transaction Repository interface and concrete SQLite implementation.
- `backend/src/repositories/IPriceRepository.ts` & `SQLitePriceRepository.ts`: Asset Price Repository interface and concrete SQLite implementation.
- `backend/src/repositories/ICredentialRepository.ts` & `SQLiteCredentialRepository.ts`: Credential Repository interface with transparent AES-256-GCM encryption.
- `backend/src/repositories/ISyncLogRepository.ts` & `SQLiteSyncLogRepository.ts`: Sync Log Repository interface and concrete SQLite implementation.
- `backend/src/__tests__/runTests.ts`: Automated unit test runner.

### Security & Hardening
- **CORS Lock**: Restricted Express CORS origin from `*` to `http://localhost:5173` and `http://127.0.0.1:5173`.
- **Loopback Binding**: Explicitly bound Express app listener to `127.0.0.1` interface to prevent LAN exposure.
- **Credential Encryption**: Encrypted broker API keys and passwords in SQLite `credentials` table using AES-256-GCM (`enc:iv:tag:ciphertext`).
- **Data Leak Fix**: Removed debug text file dump (`data/raw_cams_text.txt`) from CAMS PDF parsing route.

### Refactored
- `backend/src/routes/assets.ts`: Replaced direct `db.prepare()` SQL queries with Asset and Price Repositories.
- `backend/src/routes/transactions.ts`: Replaced direct `db.prepare()` SQL queries with Transaction and Asset Repositories.
- `backend/src/routes/dashboard.ts`: Replaced direct `db.prepare()` SQL queries with Repositories.
- `backend/src/routes/cashflow.ts`: Replaced direct `db.prepare()` SQL queries with Repositories.
- `backend/src/routes/import.ts`: Replaced inline SQL asset lookup and duplicate checks with Repositories.
- `backend/src/services/kiteService.ts`, `angeloneService.ts`, `indmoneyService.ts`: Replaced direct SQL credential queries with `credentialRepository`.
- `backend/src/services/marketSync.ts`: Replaced direct SQL price updates and log inserts with `priceRepository` and `syncLogRepository`.

### Testing & Verification
- Backend compilation: `tsc` passed with 0 errors.
- Frontend compilation: `vite build` passed with 0 errors.
- Automated unit test suite (`npm test`): 11 tests passed, 0 failed.
