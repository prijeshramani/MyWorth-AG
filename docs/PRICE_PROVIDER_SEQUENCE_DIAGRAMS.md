# 🔄 PRICE_PROVIDER_SEQUENCE_DIAGRAMS.md — Sequence Diagrams

**System Name**: Family Wealth OS  
**Phase**: Sprint 2 (Architecture & Provider Framework)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Sequence 1: Valuation Request with Cache Hit

```mermaid
sequenceDiagram
    autonumber
    participant VE as ValuationEngine
    participant LRU as In-Memory LRU Cache
    participant Repo as SQLite Price Repository

    VE->>LRU: getPrice(assetId, date)
    alt Cache Hit
        LRU-->>VE: PriceSnapshot (0.01ms)
    else Cache Miss
        LRU->>Repo: findPriceByDate(assetId, date)
        Repo-->>LRU: Price Record
        LRU-->>VE: PriceSnapshot (0.5ms)
    end
```

---

## 2. Sequence 2: Scheduled Market Price Sync Flow

```mermaid
sequenceDiagram
    autonumber
    participant PS as PriceScheduler
    participant PF as PriceProviderFramework
    participant Prov as YahooFinanceProvider / AMFIProvider
    participant Norm as PriceNormalizationService
    participant Repo as SQLite Price Repository

    PS->>PF: syncMarketPrices(activeAssets)
    loop Each Asset Master
        PF->>Prov: fetchLatestPrice(symbol/isin)
        alt Success
            Prov-->>PF: Raw Response JSON
            PF->>Norm: normalize(rawJson, source)
            Norm-->>PF: PriceSnapshot (HIGH quality)
            PF->>Repo: upsertPrice(assetId, date, price, source)
        else API Failure / Timeout
            Prov-->>PF: Error
            PF->>Repo: findLatestCachedPrice(assetId)
            Repo-->>PF: Stale Price Snapshot (STALE quality)
        end
    end
```

---

## 3. Sequence 3: Provider Failover Sequence

```mermaid
sequenceDiagram
    autonumber
    participant PF as PriceProviderFramework
    participant P1 as Primary Provider (Yahoo/AMFI)
    participant P2 as Fallback Provider / Cached DB

    PF->>P1: fetchLatestPrice(symbol)
    P1-->>PF: HTTP 503 / Timeout (Attempt 1-3)
    PF->>P1: Check Health -> Mark DEGRADED / OFFLINE
    PF->>P2: fetchFallbackPrice(symbol)
    P2-->>PF: PriceSnapshot (MEDIUM/STALE quality)
```
