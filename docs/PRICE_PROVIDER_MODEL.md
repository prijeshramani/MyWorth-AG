# 🔌 PRICE_PROVIDER_MODEL.md — Price Provider Framework & Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 2 (Architecture & Provider Framework)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Provider Interface Contract (`IPriceProvider`)

All market price data providers implement the `IPriceProvider` interface contract:

```typescript
export interface ProviderCapabilities {
  supportedAssetTypes: string[]; // e.g. ['STOCK', 'ETF'] or ['MUTUAL_FUND']
  supportsHistorical: boolean;
  supportsRealtime: boolean;
  rateLimitPerMinute: number;
}

export interface ProviderHealth {
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastSuccessTimestamp?: string;
  consecutiveFailures: number;
  averageResponseTimeMs: number;
}

export interface IPriceProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: ProviderCapabilities;
  getHealth(): ProviderHealth;
  fetchLatestPrice(identifier: string, assetType: string): Promise<PriceSnapshot | null>;
  fetchHistoricalPrices(identifier: string, assetType: string, startDate: string, endDate: string): Promise<PriceSnapshot[]>;
}
```

---

## 2. Target Provider Specifications

### A. `YahooFinanceProvider`
- **Target Assets**: `STOCK`, `ETF`
- **Identifier**: Symbol / Ticker (e.g., `RELIANCE.NS`, `INFY.BO`, `VOO`)
- **Source Label**: `YAHOO_FINANCE`
- **Rate Limit**: 60 requests / min

### B. `AMFIProvider`
- **Target Assets**: `MUTUAL_FUND`
- **Identifier**: AMFI Scheme Code / ISIN (e.g., `120503` for HDFC Top 100)
- **Source Label**: `AMFI_INDIA`
- **Rate Limit**: 120 requests / min

### C. `NPSProvider`
- **Target Assets**: `NPS`
- **Identifier**: PFRDA Scheme Code / CRA Scheme ID
- **Source Label**: `NPS_CRA`
- **Rate Limit**: 30 requests / min

### D. `ManualPriceProvider`
- **Target Assets**: `GOLD`, `REAL_ESTATE`, `BOND`, `FD`, `OTHER`
- **Identifier**: Asset Master ID / Symbol
- **Source Label**: `MANUAL_OVERRIDE`
- **Rate Limit**: Unlimited (Local DB)

---

## 3. Resilience Policies

### A. `RetryPolicy`
- **Max Retries**: 3 attempts
- **Backoff Strategy**: Exponential backoff with jitter ($t = 1000 \times 2^{\text{attempt}} + \text{random}(0, 200)\text{ms}$)

### B. `RateLimitStrategy`
- **Bucket Leaky Token Bucket**: Enforces per-minute call quotas per provider to prevent API IP blocking.

### C. `ProviderHealthMonitoring`
- Circuit breaker trips to `DEGRADED` after 3 consecutive errors and `OFFLINE` after 5 errors. Re-evaluates status every 5 minutes.
