# AI Changelog

All changes executed by AI Coding Assistant are logged in reverse chronological order.

---

## [Sprint 1D] - Transaction Engine Foundation (2026-07-26)

### Summary
Introduced the first Financial Engine (`TransactionEngine`) and shared computational engine infrastructure (`backend/src/engines/common/`) on top of stable Architecture v1.0, fully incorporating all 10 ARB recommendations. Created `FinancialMath.ts` precision helper, `IFinancialEngine.ts` contract with `EngineMetadata`, `EngineContext.ts`, `EngineResult.ts`, `EngineErrors.ts`, `EngineRegistry.ts` singleton, `TransactionValidator.ts`, `TransactionEngineConfig.ts`, and `TransactionEngine.ts`. Added quality gate tests verifying determinism, idempotency, sequence stability, and oversell detection (expanded test suite to 47 passing tests).

### Added
- `backend/src/engines/common/FinancialMath.ts`: Financial precision helper providing `roundMoney`, `roundUnits`, `safeDiv`.
- `backend/src/engines/common/IFinancialEngine.ts`: Shared engine contract interface with `EngineMetadata`.
- `backend/src/engines/common/EngineContext.ts`: Standardized context wrapper with `correlationId`, `executionDate`, `userContext`, `featureFlags`.
- `backend/src/engines/common/EngineResult.ts`: Standardized result envelope with `auditTrail`, `metrics`, `warnings`, `errors`.
- `backend/src/engines/common/EngineErrors.ts`: Custom engine error classes (`FinancialEngineError`, `OversellError`, `InvalidSequenceError`).
- `backend/src/engines/common/EngineRegistry.ts`: Central engine registry manager (`engineRegistry`).
- `backend/src/engines/validators/TransactionValidator.ts`: Transaction sequence chronology and holding ownership validator.
- `backend/src/engines/config/TransactionEngineConfig.ts`: Configurable business policy constants.
- `backend/src/engines/TransactionEngine.ts`: Core $O(N)$ stateless computational engine computing running quantity, average cost basis, oversell detection, and corporate actions (`SPLIT`, `BONUS`).
- `docs/Sprint_1D_Retrospective.md`: Retrospective report for Sprint 1D.
- `prompts/summary/Sprint 1D - Implementation Summary.md`: Comprehensive summary report for Sprint 1D.

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
