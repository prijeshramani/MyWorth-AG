# AI Changelog

All changes executed by AI Coding Assistant are logged in reverse chronological order.

---

## [Sprint 1E] - Asset Valuation Foundation (2026-07-26)

### Summary
Designed and implemented the provider-agnostic Asset Valuation Architecture (`backend/src/engines/valuation/`) supporting all 14 financial asset classes on top of stable Architecture v1.0, fully incorporating all 10 ARB recommendations. Created `PriceSnapshot.ts`, `ValuationContext.ts` with typed `AssetMetadata`, `ValuationResult.ts`, `IValuationStrategy.ts` interface contract, `CurrencyPrecision.ts`, `MarketCalendar.ts` trading calendar helper, `AssetTypeValuationRegistry.ts` dynamic registry, and valuation strategies for `STOCK`, `MUTUAL_FUND`, `ETF`, `GOLD`, `BOND`, `FD`, `EPF`/`PPF`/`SSA`, `NPS`, `REAL_ESTATE`, `CRYPTO`, `BANK`, and `OTHER`. Expanded unit test suite from 47 to 61 passing tests.

### Added
- `backend/src/engines/valuation/PriceSnapshot.ts`: Immutable price model (`value`, `currency`, `source`, `timestamp`, `confidence`, `stale`, `adjusted`).
- `backend/src/engines/valuation/ValuationContext.ts`: Standardized valuation context with typed `AssetMetadata`.
- `backend/src/engines/valuation/ValuationResult.ts`: Standardized valuation result envelope (`valuationMethod`, `dataQuality`, `unrealizedGain`).
- `backend/src/engines/valuation/IValuationStrategy.ts`: Strategy pattern contract interface.
- `backend/src/engines/valuation/CurrencyPrecision.ts`: Financial precision & multi-currency formatting helper.
- `backend/src/engines/valuation/MarketCalendar.ts`: Trading calendar helper evaluating trading days and stale price conditions.
- `backend/src/engines/valuation/AssetTypeValuationRegistry.ts`: Strategy registry manager supporting dynamic runtime strategy registration.
- `backend/src/engines/valuation/strategies/EquityValuationStrategy.ts`: Equity closing market price valuation (`STOCK`).
- `backend/src/engines/valuation/strategies/MutualFundValuationStrategy.ts`: Mutual Fund NAV valuation (`MUTUAL_FUND`).
- `backend/src/engines/valuation/strategies/ETFValuationStrategy.ts`: ETF market closing price valuation (`ETF`).
- `backend/src/engines/valuation/strategies/GoldValuationStrategy.ts`: Gold per-gram bullion valuation (`GOLD`).
- `backend/src/engines/valuation/strategies/BondValuationStrategy.ts`: Bond face value & market price valuation (`BOND`).
- `backend/src/engines/valuation/strategies/FixedDepositValuationStrategy.ts`: Fixed Deposit compounding interest formula ($A = P (1 + r/n)^{nt}$).
- `backend/src/engines/valuation/strategies/ProvidentFundValuationStrategy.ts`: EPF / PPF / SSA annual interest accumulation formula ($A = P (1 + r)^t$).
- `backend/src/engines/valuation/strategies/NPSValuationStrategy.ts`: NPS Tier NAV valuation (`NPS`).
- `backend/src/engines/valuation/strategies/RealEstateValuationStrategy.ts`: Real estate property area & appraisal valuation (`REAL_ESTATE`).
- `backend/src/engines/valuation/strategies/CryptoValuationStrategy.ts`: Crypto token market valuation (`CRYPTO`).
- `backend/src/engines/valuation/strategies/GenericValuationStrategy.ts`: Fallback valuation (`BANK`, `OTHER`).
- `docs/Sprint_1E_Retrospective.md`: Retrospective report for Sprint 1E.
- `prompts/summary/Sprint 1E - Implementation Summary.md`: Comprehensive summary report for Sprint 1E.

---

## [Sprint 1D] - Transaction Engine Foundation (2026-07-26)

### Summary
Introduced the first Financial Engine (`TransactionEngine`) and shared computational engine infrastructure (`backend/src/engines/common/`) on top of stable Architecture v1.0, fully incorporating all 10 ARB recommendations. Created `FinancialMath.ts` precision helper, `IFinancialEngine.ts` contract with `EngineMetadata`, `EngineContext.ts`, `EngineResult.ts`, `EngineErrors.ts`, `EngineRegistry.ts` singleton, `TransactionValidator.ts`, `TransactionEngineConfig.ts`, and `TransactionEngine.ts`. Added quality gate tests verifying determinism, idempotency, sequence stability, and oversell detection (expanded test suite to 47 passing tests).

---

## [Architecture v1.0] - Domain Architecture Version 1.0 Stabilization & Engine Roadmap (2026-07-25)

### Summary
Finalized, approved, and froze the core domain architecture (`Family -> Family Member -> Entity -> Account -> Holding -> Asset Master / Transactions -> Price History`) as **Version 1.0 (Frozen)**. Created `docs/Architecture_v1.0.md`, updated `DATA_MODEL.md` with Asset Identifier Strategy and Asset Classification Strategy, updated `SYSTEM_ARCHITECTURE.md` with Engine Architecture specifications, and updated system roadmap.
