# 🏛 SYSTEM_ARCHITECTURE.md — Family Wealth OS Architecture Specification

**System Name**: Family Wealth OS  
**Author**: Lead Software Engineer & Software Architect  
**Date**: July 25, 2026  
**Status**: APPROVED — DOMAIN ARCHITECTURE VERSION 1.0 (FROZEN)

> [!IMPORTANT]
> **Domain Architecture Version: 1.0 (Frozen)**  
> The core domain hierarchy (`Family -> Family Member -> Entity -> Account -> Holding -> Asset Master / Transactions`) is architecturally frozen. Future development must extend system behavior and computational engines rather than modify the fundamental ownership hierarchy.

---

## 1. System Overview & Core Principles

Family Wealth OS is a local-first, privacy-focused private wealth operating system designed to run on desktop environments with complete offline capabilities.

### Primary Design Directives
- **Evolution before Replacement**: Build iteratively on existing SQLite database foundations.
- **Local-First & Privacy-First**: 100% of personal financial data, plain-text statements, and database records remain encrypted on local storage. No cloud leaks.
- **Transactions as Source of Truth**: Financial metrics are dynamically computed from transactions and market prices.
- **Strict Layer Responsibilities**:
  ```
  [Presentation / REST Controllers] (/api/v1/*)
           │
           ▼
  [Domain Services] (Orchestrate workflows & validation)
           │
           ├──> [Computational Engines] (Pure financial calculations: XIRR, Tax, Net Worth)
           │
           ▼
  [Repository Layer] (Encapsulate SQL queries & soft-delete filtering)
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

### 2.2 Domain Services Layer
- Located under `backend/src/services/*.ts`.
- Orchestrates multi-entity workflows, state validation, and service cross checks:
  - `OwnershipService`: Validates full 4-tier chain (`Family -> Member -> Entity -> Account`).
  - `AssetMasterService`: Executes 3-tier asset deduplication (ISIN -> Symbol+Type -> Name+Type).
  - `EntityService`: Enforces active PAN uniqueness checks.
  - `HoldingService`: Manages ownership links between accounts and master assets.
  - `TransactionService`: Manages transaction ingestion and holding linkage.

### 2.3 Computational Engine Layer (`backend/src/engines/`)
- Located under `backend/src/engines/*.ts`.
- Pure, stateless calculation modules responsible for financial math:
  - **Services orchestrate workflows.**
  - **Repositories access data.**
  - **Engines perform financial calculations.**
- Defined Engines:
  - `NetWorthEngine`: Dynamic multi-currency valuation & aggregation.
  - `XirrEngine`: Cashflow XIRR calculation per holding/account/entity.
  - `CapitalGainEngine`: FIFO lot matching & Short/Long-Term Tax P&L.
  - `DividendEngine`: Income & dividend yield attribution.
  - `AssetAllocationEngine`: Asset class, sector, and risk exposure aggregation.
  - `TaxEngine`: Advance tax & Form 26AS estimation.
  - `GoalEngine`: Financial goal progress tracking & Monte Carlo projections.

### 2.4 Repository Layer
- Located under `backend/src/repositories/*.ts`.
- Decouples SQL queries from Express handlers.
- Implements soft-delete filtering (`WHERE deleted_at IS NULL`).
- Supports atomic transaction blocks (`runInTransaction`).
- Provides aggregation points: `findByHoldingId`, `findByAccount`, `findByEntity`, `findByFamilyMember`.

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
│   │   │       ├── 002_asset_master_and_holdings.ts
│   │   │       └── 003_transaction_holding_link.ts
│   │   ├── engines/                     # Financial Computational Engines
│   │   │   ├── NetWorthEngine.ts
│   │   │   ├── XirrEngine.ts
│   │   │   ├── CapitalGainEngine.ts
│   │   │   ├── DividendEngine.ts
│   │   │   ├── AssetAllocationEngine.ts
│   │   │   ├── TaxEngine.ts
│   │   │   └── GoalEngine.ts
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
│   │   │   ├── IHoldingRepository.ts / SQLiteHoldingRepository.ts
│   │   │   └── ITransactionRepository.ts / SQLiteTransactionRepository.ts
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
│   ├── Architecture_v1.0.md
│   ├── DATA_MODEL.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── ER_DIAGRAM.md
│   ├── Transaction_Ownership_Design.md
│   └── AI_CHANGELOG.md
└── prompts/
    └── summary/
        ├── Sprint 1A - Implementation Summary.md
        ├── Sprint 1B - Implementation Summary.md
        ├── Sprint 1C - Implementation Summary.md
        └── Pre-Sprint 1D - Implementation Summary.md
```

---

## 4. System Roadmap

The system roadmap focuses on building business capabilities on top of Architecture v1.0:

- **Sprint 1D**: Transaction Engine Foundation (Transaction ingestion, normalization, and holding validation)
- **Sprint 2**: Price Engine (Historical NAV, Yahoo Finance, AMFI, and NPS market price synchronization)
- **Sprint 3**: Analytics Engine (Dynamic asset allocation, net worth aggregation, multi-member drilldowns)
- **Sprint 4**: Tax & Capital Gains Engine (FIFO P&L lot matching, STCG/LTCG tax estimation)
- **Sprint 5**: Goal Planning Engine (Goal tracking, SIP progress, asset liability matching)
