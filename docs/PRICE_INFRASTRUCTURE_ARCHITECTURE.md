# 🏛 PRICE_INFRASTRUCTURE_ARCHITECTURE.md — Market Price Infrastructure Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 2 (Architecture & Provider Framework)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. System Overview

The **Market Price Infrastructure** is a provider-agnostic, local-first market data platform designed to feed accurate, standardized price snapshots into the `ValuationEngine` (Sprint 1E) and `TransactionEngine` (Sprint 1D) without altering the frozen Architecture v1.0 domain tables.

```
+-----------------------------------------------------------------------------------+
|                              EXTERNAL MARKET DATA SOURCES                          |
|  [Yahoo Finance API]     [AMFI NAV Portal]      [NPS CRA Service]    [Manual Input] |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                             PRICE PROVIDER FRAMEWORK                              |
|  • IPriceProvider Interface                                                       |
|  • YahooFinanceProvider | AMFIProvider | NPSProvider | ManualPriceProvider       |
|  • RateLimitStrategy    | RetryPolicy  | ProviderHealthMonitoring                 |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                            PRICE NORMALIZATION SERVICE                            |
|  • PriceNormalizationService                                                      |
|  • Raw Output -> PriceSnapshot Mapping                                            |
|  • Quality Scoring (HIGH/MEDIUM/LOW/STALE) & Outlier Spike Detection              |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                              STORAGE & CACHE LAYER                                |
|  • In-Memory Price LRU Cache                                                      |
|  • SQLite asset_prices Repository (Architecture v1.0 Frozen Schema)               |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                               CONSUMING ENGINES                                   |
|  • ValuationEngine (Sprint 1E)                                                    |
|  • TransactionEngine (Sprint 1D)                                                  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Key Architecture Principles

1. **Provider Agnosticism**: Consuming engines (`ValuationEngine`, `TransactionEngine`) depend exclusively on `PriceSnapshot` abstractions. They possess zero awareness of underlying API endpoints, HTTP protocols, or provider specifications.
2. **Local-First & Offline Resilience**: Historical market prices are cached in local SQLite database tables (`asset_prices`). Offline operations automatically use the latest cached price snapshot with a `STALE` quality flag if market APIs are unreachable.
3. **Resilience & Circuit Breaking**: Providers implement exponential backoff retry policies, rate limiting, and health status tracking (`ONLINE`, `DEGRADED`, `OFFLINE`).

---

## 3. Integration with Engine Architecture v1.0

- **TransactionEngine**: Uses historical closing prices to evaluate cash amounts when optional transaction amounts are omitted (`amount = qty * price`).
- **ValuationEngine**: Consumes `PriceSnapshot` objects passed inside `ValuationContext` to evaluate unrealized gains across all 14 asset classes.
