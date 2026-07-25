# 🏛 SYSTEM_ARCHITECTURE.md — Family Wealth OS Architecture Specification

**System Name**: Family Wealth OS  
**Author**: Lead Software Engineer & Software Architect  
**Date**: July 25, 2026  
**Status**: Architecture Blueprint (Sprint 1C)

---

## 1. System Overview & Core Principles

Family Wealth OS is a local-first, privacy-focused private wealth operating system designed to run on desktop environments with complete offline capabilities.

### Primary Design Directives
- **Evolution before Replacement**: Build iteratively on existing SQLite database foundations.
- **Local-First & Privacy-First**: 100% of personal financial data, plain-text statements, and database records remain encrypted on local storage. No cloud leaks.
- **Transactions as Source of Truth**: Financial metrics are dynamically computed from transactions and market prices.
- **Strict 4-Layer Clean Architecture**:
  ```
  [Presentation / REST Controllers] (/api/v1/*)
           │
           ▼
  [Domain Services] (FamilyService, EntityService, AccountService, OwnershipService, AssetMasterService, HoldingService)
           │
           ▼
  [Repository Layer] (IFamilyRepository, IEntityRepository, IAccountRepository, IAssetMasterRepository, IHoldingRepository)
           │
           ▼
  [Database Infrastructure] (SQLite via better-sqlite3 with versioned migrationRunner)
  ```

---

## 2. Layer Responsibilities

### 2.1 Presentation Layer (Express REST Controllers)
- Route handlers located under `backend/src/routes/v1/*.ts`.
- Validates HTTP request payloads via Zod schemas.
- Maps domain responses to standardized API envelopes:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null,
    "timestamp": "2026-07-25T18:30:00.000Z"
  }
  ```
- Catches exceptions and forwards to `errorHandlerMiddleware`.

### 2.2 Domain Services Layer
- Located under `backend/src/services/*.ts`.
- Enforces domain rules, validation, and multi-entity cross checks:
  - `OwnershipService`: Validates full 4-tier chain (`Family -> Member -> Entity -> Account`).
  - `AssetMasterService`: Executes 3-tier asset deduplication (ISIN -> Symbol+Type -> Name+Type).
  - `EntityService`: Enforces active PAN uniqueness checks.
  - `HoldingService`: Manages ownership links between accounts and master assets.

### 2.3 Repository Layer
- Located under `backend/src/repositories/*.ts`.
- Decouples SQL queries from Express handlers.
- Implements soft-delete filtering (`WHERE deleted_at IS NULL`).
- Supports atomic transaction blocks (`runInTransaction`).

### 2.4 Database Infrastructure
- SQLite database (`data/myworth.db`) managed via `better-sqlite3`.
- Managed by `migrationRunner.ts` tracking applied migrations in `schema_migrations`.
- Creates timestamped database file backups in `data/backups/` before migration execution.

---

## 3. Directory Structure

```
MyWorth/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── migrationRunner.ts
│   │   │   ├── transactionHelper.ts
│   │   │   └── migrations/
│   │   │       ├── 001_domain_foundation.ts
│   │   │       └── 002_asset_master_and_holdings.ts
│   │   ├── errors/
│   │   │   └── AppError.ts
│   │   ├── middleware/
│   │   │   ├── correlationMiddleware.ts
│   │   │   └── errorHandlerMiddleware.ts
│   │   ├── repositories/
│   │   │   ├── IFamilyRepository.ts / SQLiteFamilyRepository.ts
│   │   │   ├── IFamilyMemberRepository.ts / SQLiteFamilyMemberRepository.ts
│   │   │   ├── IEntityRepository.ts / SQLiteEntityRepository.ts
│   │   │   ├── IAccountRepository.ts / SQLiteAccountRepository.ts
│   │   │   ├── IAssetMasterRepository.ts / SQLiteAssetMasterRepository.ts
│   │   │   └── IHoldingRepository.ts / SQLiteHoldingRepository.ts
│   │   ├── schema/
│   │   │   ├── domainSchemas.ts
│   │   │   └── assetMasterSchemas.ts
│   │   ├── services/
│   │   │   ├── FamilyService.ts
│   │   │   ├── EntityService.ts
│   │   │   ├── AccountService.ts
│   │   │   ├── OwnershipService.ts
│   │   │   ├── AssetMasterService.ts
│   │   │   └── HoldingService.ts
│   │   ├── routes/
│   │   │   └── v1/
│   │   │       ├── families.ts
│   │   │       ├── familyMembers.ts
│   │   │       ├── entities.ts
│   │   │       ├── accounts.ts
│   │   │       ├── assetsMaster.ts
│   │   │       └── holdings.ts
│   │   └── __tests__/
│   │       └── runTests.ts
├── docs/
│   ├── DATA_MODEL.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── ER_DIAGRAM.md
│   └── AI_CHANGELOG.md
└── prompts/
    └── summary/
        ├── Sprint 1A - Implementation Summary.md
        ├── Sprint 1B - Implementation Summary.md
        └── Sprint 1C - Implementation Summary.md
```
