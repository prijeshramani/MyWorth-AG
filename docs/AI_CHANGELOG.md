# AI Changelog

All changes executed by AI Coding Assistant are logged in reverse chronological order.

---

## [Sprint 2 - Architecture Phase] - Market Price Infrastructure Design (2026-07-26)

### Summary
Designed the provider-agnostic Market Price Infrastructure and Provider Framework (Architecture Phase) for Sprint 2 on top of frozen Architecture v1.0. Created 6 comprehensive design specifications covering system architecture, provider interfaces (`IPriceProvider`, `YahooFinanceProvider`, `AMFIProvider`, `NPSProvider`, `ManualPriceProvider`), price normalization & quality scoring (`PriceNormalizationService`), 2-tier storage & caching strategy (`PriceStorageStrategy`), sequence diagrams, and execution plan. Zero code modified or written during this architecture phase.

### Added Architecture Specifications
- `docs/PRICE_INFRASTRUCTURE_ARCHITECTURE.md`: High-level system architecture and engine integration.
- `docs/PRICE_PROVIDER_MODEL.md`: Provider framework contracts, capabilities, and resilience policies (`RetryPolicy`, `RateLimitStrategy`, `ProviderHealthMonitoring`).
- `docs/PRICE_NORMALIZATION_DESIGN.md`: Normalization pipeline, quality scoring (HIGH/MEDIUM/LOW/STALE), and 50% single-day spike detection.
- `docs/PRICE_STORAGE_STRATEGY.md`: Storage strategy on frozen `asset_prices` table and 2-tier LRU cache architecture.
- `docs/PRICE_PROVIDER_SEQUENCE_DIAGRAMS.md`: Mermaid sequence diagrams for cache hit, sync flow, and failover.
- `docs/SPRINT_2_IMPLEMENTATION_PLAN.md`: Phase-by-phase implementation plan for code execution.

---

## [Sprint 1E] - Asset Valuation Foundation (2026-07-26)

### Summary
Designed and implemented the provider-agnostic Asset Valuation Architecture (`backend/src/engines/valuation/`) supporting all 14 financial asset classes on top of stable Architecture v1.0, fully incorporating all 10 ARB recommendations. Created `PriceSnapshot.ts`, `ValuationContext.ts` with typed `AssetMetadata`, `ValuationResult.ts`, `IValuationStrategy.ts` interface contract, `CurrencyPrecision.ts`, `MarketCalendar.ts` trading calendar helper, `AssetTypeValuationRegistry.ts` dynamic registry, and valuation strategies for `STOCK`, `MUTUAL_FUND`, `ETF`, `GOLD`, `BOND`, `FD`, `EPF`/`PPF`/`SSA`, `NPS`, `REAL_ESTATE`, `CRYPTO`, `BANK`, and `OTHER`. Expanded unit test suite from 47 to 61 passing tests.

---

## [Sprint 1D] - Transaction Engine Foundation (2026-07-26)

### Summary
Introduced the first Financial Engine (`TransactionEngine`) and shared computational engine infrastructure (`backend/src/engines/common/`) on top of stable Architecture v1.0, fully incorporating all 10 ARB recommendations.
