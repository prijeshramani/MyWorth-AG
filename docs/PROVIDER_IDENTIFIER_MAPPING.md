# 🗺 PROVIDER_IDENTIFIER_MAPPING.md — Provider Identifier Mapping Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 2A (Global Market Foundation - Architecture Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Provider Symbol Mapping Engine (`ProviderIdentifierMapper`)

Different market data providers use distinct symbol conventions for the exact same underlying asset master security. The `ProviderIdentifierMapper` decouples standard asset identities (`ISIN`, `exchange:symbol`) from provider API query parameters.

```
+-----------------------------------------------------------------------------------+
|                        CANONICAL ASSET MASTER RECORD                              |
|  Asset ID: 101 | Name: Reliance Industries Ltd | Symbol: RELIANCE | ISIN: INE002A01018  |
+-----------------------------------------------------------------------------------+
                                         │
               ┌─────────────────────────┼─────────────────────────┐
               ▼                         ▼                         ▼
   [YahooFinanceProvider]        [AMFIProvider]           [ManualProvider]
   Mapped Query: "RELIANCE.NS"   Mapped Query: N/A        Mapped Query: Asset ID 101
```

---

## 2. Provider Mapping Matrix

| Asset Class | Primary Exchange | Local Symbol | Yahoo Finance Symbol | AMFI Scheme Code | NPS Scheme ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Indian Stock (NSE)** | `NSE` | `RELIANCE` | `RELIANCE.NS` | N/A | N/A |
| **Indian Stock (BSE)** | `BSE` | `500325` | `RELIANCE.BO` | N/A | N/A |
| **US Stock (NASDAQ)** | `NASDAQ` | `AAPL` | `AAPL` | N/A | N/A |
| **US Stock (NYSE)** | `NYSE` | `BRK.B` | `BRK-B` | N/A | N/A |
| **Indian Mutual Fund** | `AMFI` | `120503` | N/A | `120503` | N/A |
| **NPS Equity Tier 1** | `PFRDA` | `NPS_E_T1` | N/A | N/A | `NPS_TIER1_E` |

---

## 3. Mapping Interface Contract (`IProviderIdentifierMapper`)

```typescript
export interface ProviderQueryRequest {
  providerId: string;       // 'YAHOO_FINANCE', 'AMFI', 'NPS', 'MANUAL'
  assetId?: number;
  symbol?: string;
  exchange?: string;
  isin?: string;
  metadata?: Record<string, any>;
}

export interface IProviderIdentifierMapper {
  resolveProviderQuerySymbol(request: ProviderQueryRequest): string;
}
```
