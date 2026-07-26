# Implementation Plan — Sprint 2B: Market Data Provider Framework

Design architecture updates and implement the **Market Data Provider Framework** (`backend/src/providers/` and `backend/src/markets/`) on top of the Global Market Foundation (Sprint 2A) and Architecture v1.0.

> [!IMPORTANT]
> **Sprint Scope Boundary**:
> - **Architecture Version 1.0 Frozen**: Core domain tables (`families`, `family_members`, `entities`, `accounts`, `holdings`, `assets_master`) and repositories remain 100% UNTOUCHED.
> - **In-Scope Providers**: `YahooFinanceProvider` (India + USA), `ManualProvider`, `MockProvider`, and `ReplayProvider`.
> - **Out-of-Scope Providers**: `AMFI`, `NPS`, `AlphaVantage`, `Polygon` (deferred to Sprint 2C).
> - **100% Backward Compatibility**: All 61 existing unit & regression tests continue passing cleanly.

---

## User Review Required

> [!NOTE]
> **Provider Simulation & Resilience Architecture**:
> `MockProvider` and `ReplayProvider` enable 100% offline, deterministic testing of market price updates without live API dependency or network flakiness. `CircuitBreaker` and `RetryPolicy` guarantee system stability during external network outages.

---

## Proposed Changes

### Phase 1 — Architecture Enhancements (`docs/`)

#### [MODIFY] [ASSET_IDENTITY_ARCHITECTURE.md](file:///c:/Users/prije/Downloads/MyWorth/docs/ASSET_IDENTITY_ARCHITECTURE.md)
- Add **FIGI** (Financial Instrument Global Identifier) e.g., `BBG000B9XRY4` to Asset Identity hierarchy.
- Document **Asset Classification** as distinct from Asset Type (e.g. Asset Type = `STOCK`, Asset Classification = `Equity:LargeCap:Technology`).

#### [MODIFY] [EXCHANGE_MODEL.md](file:///c:/Users/prije/Downloads/MyWorth/docs/EXCHANGE_MODEL.md)
- Extend `ExchangeDefinition` interface with `settlementCycle` (`T+1`, `T+2`), `lotSize` (number), and `fractionalShareSupport` (boolean).
- Extend `MarketCalendar` contract to support **partial trading days** (`isPartialTradingDay`, `getTradingHours`).

#### [NEW] [CORPORATE_ACTION_REGISTRY.md](file:///c:/Users/prije/Downloads/MyWorth/docs/CORPORATE_ACTION_REGISTRY.md)
- Create architecture specification for corporate actions (`SPLIT`, `BONUS`, `DIVIDEND`, `RIGHTS_ISSUE`, `MERGER`).

---

### Phase 2 — Market Data Provider Framework (`backend/src/providers/` and `backend/src/markets/`)

#### [NEW] [IMarketDataProvider.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/providers/IMarketDataProvider.ts)
Core provider interface extending `IPriceProvider` with global capability metadata:
```ts
export interface IMarketDataProvider {
  readonly id: string;
  readonly name: string;
  readonly supportedExchanges: string[]; // e.g. ['NSE', 'BSE', 'NASDAQ', 'NYSE']
  fetchLatestPrice(querySymbol: string, exchange: string): Promise<PriceSnapshot | null>;
  fetchHistoricalPrices(querySymbol: string, exchange: string, startDate: string, endDate: string): Promise<PriceSnapshot[]>;
}
```

#### [NEW] [RetryPolicy.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/providers/resilience/RetryPolicy.ts)
Exponential backoff retry utility with configurable max retries and jitter.

#### [NEW] [CircuitBreaker.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/providers/resilience/CircuitBreaker.ts)
Circuit breaker state machine (`CLOSED`, `OPEN`, `HALF_OPEN`) preventing cascading failures.

#### [NEW] [ProviderHealthService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/providers/resilience/ProviderHealthService.ts)
Tracks failure rates, average latency, and health state transitions (`ONLINE`, `DEGRADED`, `OFFLINE`).

#### [NEW] [ProviderCache.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/providers/cache/ProviderCache.ts)
2-tier in-memory LRU price snapshot cache manager with TTL support.

#### [NEW] [YahooFinanceProvider.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/providers/implementations/YahooFinanceProvider.ts)
Provider supporting Indian stocks/ETFs (`.NS`, `.BO`) and US stocks/ETFs (`AAPL`, `VOO`).

#### [NEW] [ManualProvider.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/providers/implementations/ManualProvider.ts)
Manual price input provider for unlisted and custom assets.

#### [NEW] [MockProvider.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/providers/simulation/MockProvider.ts)
Simulation provider generating deterministic synthetic prices for testing.

#### [NEW] [ReplayProvider.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/providers/simulation/ReplayProvider.ts)
Simulation provider replaying historical price series.

#### [NEW] [index.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/providers/index.ts)
Exports all provider interfaces, implementations, and resilience classes.

---

### Phase 3 — Verification & Deliverables

#### [MODIFY] [runTests.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/runTests.ts)
Add section 12 testing:
- Provider framework registration & capabilities
- `YahooFinanceProvider` ticker resolution (India + USA)
- Simulation framework (`MockProvider`, `ReplayProvider`)
- `ProviderCache` LRU caching and TTL eviction
- `CircuitBreaker` and `RetryPolicy` error handling
- All 61 existing unit tests continue passing cleanly

#### [NEW] [Sprint_2B_Retrospective.md](file:///c:/Users/prije/Downloads/MyWorth/docs/Sprint_2B_Retrospective.md)

#### [NEW] [Sprint 2B - Implementation Summary.md](file:///c:/Users/prije/Downloads/MyWorth/prompts/summary/Sprint%202B%20-%20Implementation%20Summary.md)

#### [MODIFY] [AI_CHANGELOG.md](file:///c:/Users/prije/Downloads/MyWorth/docs/AI_CHANGELOG.md) & [.ai/SESSION_CONTEXT.md](file:///c:/Users/prije/Downloads/MyWorth/.ai/SESSION_CONTEXT.md)

---

## Verification Plan

### Automated Tests
1. `npm test` in `backend` (Provider framework, resilience policies, simulation tests, & regression suite).
2. `npm run build` in `backend` (`tsc`).
3. `npm run build` in `frontend` (`vite build`).

---

# 🏛 Architecture Review Board (ARB) Review — Sprint 2B

**Reviewer:** ChatGPT (Chief Software Architect / Product Owner)

**Status:** ✅ APPROVED WITH ENHANCEMENTS

The implementation plan aligns with Architecture v1.0, Sprint 2A deliverables and ADR-022. Scope is disciplined and preserves the frozen domain model.

## Recommendation 1 — Immutable PriceSnapshot
Ensure `PriceSnapshot` is immutable after creation. Historical market data must never be modified.

## Recommendation 2 — Provider Capability Metadata
Extend `IMarketDataProvider` with:
- supportedAssetTypes
- supportsHistoricalData
- supportsIntraday
- supportsCorporateActions
- supportsFX
- rateLimits

## Recommendation 3 — ProviderRequestContext
Introduce a request context containing:
- correlationId
- requestTimestamp
- timeout
- preferredCurrency
- retryAttempt

## Recommendation 4 — Independent Cache Policies
Define separate TTL policies for:
- Live Quotes
- Historical Prices
- FX Rates

## Recommendation 5 — Provider Error Model
Standardize:
- NetworkError
- AuthenticationError
- RateLimitError
- ProviderUnavailableError
- InvalidSymbolError
- DataIntegrityError

## Recommendation 6 — Replay Provider
Support replay modes:
- Real-time
- Accelerated
- Step-by-step

## Recommendation 7 — Provider Metrics
Expose:
- averageLatency
- successRate
- errorRate
- lastSuccessfulSync
- lastFailure

## Recommendation 8 — Corporate Action Readiness
Keep extension points for:
- Splits
- Dividends
- Symbol Changes

Do not implement them in this sprint.

## Recommendation 9 — Identifier Resolution
YahooFinanceProvider must resolve identifiers only through ProviderIdentifierMapper.

## Recommendation 10 — Expanded Test Matrix
Include tests for:
- Invalid ticker
- Missing market
- Timeout
- Circuit breaker recovery
- Cache expiry
- Replay determinism
- Multi-currency requests

# Final ARB Decision

✅ Architecture Approved

✅ Sprint Scope Approved

Ready for implementation after incorporating these recommendations where appropriate while keeping Sprint 2B focused.
