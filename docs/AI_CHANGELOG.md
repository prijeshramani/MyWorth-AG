# AI Changelog

All changes executed by AI Coding Assistant are logged in reverse chronological order.

---

## [Sprint 2B] - Market Data Provider Framework (2026-07-26)

### Summary
Implemented the **Market Data Provider Framework** (`backend/src/providers/`) on top of Global Market Foundation (Sprint 2A) and Architecture v1.0, fully incorporating all 10 ARB recommendations. Created `IMarketDataProvider.ts` with capability metadata & `ProviderRequestContext`, `ProviderErrors.ts` error hierarchy, `YahooFinanceProvider.ts` (supporting Indian `.NS`/`.BO` and US `AAPL`/`VOO` tickers), `ManualProvider.ts`, `MockProvider.ts`, `ReplayProvider.ts` (supporting `REALTIME`, `ACCELERATED`, `STEP_BY_STEP` modes), `RetryPolicy.ts`, `CircuitBreaker.ts`, `ProviderHealthService.ts`, `ProviderCache.ts` (independent TTLs for Quotes, Historical, FX), and `ProviderIdentifierMapper.ts`. Updated architecture docs for FIGI, Asset Classification, settlement cycles (`T+1`), lot sizes, fractional shares, partial trading days, and created `CORPORATE_ACTION_REGISTRY.md`.

### Added & Updated
- `backend/src/providers/IMarketDataProvider.ts`: Unified provider interface with `ProviderCapabilities`, `ProviderRequestContext`, and `ProviderMetrics`.
- `backend/src/providers/types/ProviderErrors.ts`: Standardized error hierarchy (`ProviderError`, `NetworkError`, `RateLimitError`, etc.).
- `backend/src/providers/mappers/ProviderIdentifierMapper.ts`: Identifier resolution mapper mapping standard symbols to provider queries.
- `backend/src/providers/resilience/RetryPolicy.ts`: Exponential backoff retry utility with jitter.
- `backend/src/providers/resilience/CircuitBreaker.ts`: Circuit breaker state machine (`CLOSED`, `OPEN`, `HALF_OPEN`).
- `backend/src/providers/resilience/ProviderHealthService.ts`: Provider latency, error rate, and health tracking.
- `backend/src/providers/cache/ProviderCache.ts`: 2-tier LRU cache with independent TTL policies.
- `backend/src/providers/implementations/YahooFinanceProvider.ts`: Provider for Indian & US stocks and ETFs.
- `backend/src/providers/implementations/ManualProvider.ts`: Manual override provider.
- `backend/src/providers/simulation/MockProvider.ts`: Deterministic synthetic price provider.
- `backend/src/providers/simulation/ReplayProvider.ts`: Historic price series replay provider.
- `backend/src/providers/index.ts`: Re-export index file.
- `docs/CORPORATE_ACTION_REGISTRY.md`: Corporate Action Registry Architecture specification.
- `docs/ASSET_IDENTITY_ARCHITECTURE.md`: Updated with FIGI and Asset Classification taxonomy.
- `docs/EXCHANGE_MODEL.md`: Updated with settlement cycles, lot sizes, fractional share support, and partial trading days.
- `docs/Sprint_2B_Retrospective.md`: Retrospective report for Sprint 2B.
- `prompts/summary/Sprint 2B - Implementation Summary.md`: Comprehensive summary report for Sprint 2B.

---

## [Sprint 2A - Architecture Phase] - Global Market Foundation Architecture (2026-07-26)

### Summary
Designed the **Global Market Foundation Architecture** ("Global by Design, Local by Implementation") for Sprint 2A on top of stable Architecture v1.0. Created 9 architecture design documents specifying multi-tier asset identification, initial market jurisdictions (`IN`, `US`), exchanges, currencies, market calendars, provider identifier mapping, global readiness assessment, ADR-022, and implementation plan.
