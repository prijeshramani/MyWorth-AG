# 🏢 EXCHANGE_MODEL.md — Exchange & Calendar Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 2B (Provider Framework Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Exchange Contract Model

Every trading venue is represented by an expanded `ExchangeDefinition`:

```typescript
export interface ExchangeDefinition {
  micCode: string;                  // ISO 10383 Market Identifier Code (e.g. 'XNSE', 'XNAS')
  code: string;                     // Short code ('NSE', 'BSE', 'NASDAQ', 'NYSE')
  name: string;                     // Full exchange name
  country: string;                  // Jurisdiction code ('IN', 'US')
  currency: string;                 // Exchange trading currency ('INR', 'USD')
  timezone: string;                 // Exchange IANA timezone
  settlementCycle: 'T+0' | 'T+1' | 'T+2'; // Trade settlement cycle ('T+1' standard in IN & US)
  lotSize: number;                  // Minimum trade lot size (1 for stocks, 100 for contracts)
  fractionalShareSupport: boolean;  // True for US brokers (NASDAQ/NYSE), False for Indian exchanges
  regularHours: {
    open: string;                   // Local time '09:15'
    close: string;                  // Local time '15:30'
  };
  marketCalendar: IMarketCalendar;
}
```

---

## 2. Initial Supported Exchanges

| Exchange Code | MIC Code | Jurisdiction | Currency | Settlement | Lot Size | Fractional Shares | Regular Hours |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NSE** | `XNSE` | `IN` (India) | `INR` | `T+1` | `1` | `False` | 09:15 – 15:30 IST |
| **BSE** | `XBOM` | `IN` (India) | `INR` | `T+1` | `1` | `False` | 09:15 – 15:30 IST |
| **NASDAQ** | `XNAS` | `US` (USA) | `USD` | `T+1` | `1` | `True` | 09:30 – 16:00 EST/EDT |
| **NYSE** | `XNYS` | `US` (USA) | `USD` | `T+1` | `1` | `True` | 09:30 – 16:00 EST/EDT |

---

## 3. Exchange-Specific Calendar Interfaces & Partial Trading Days

Extends `MarketCalendar` (Sprint 1E) with partial trading day support:

```typescript
export interface PartialTradingDaySession {
  date: string;                     // YYYY-MM-DD
  reason: string;                   // e.g. 'Diwali Muhurat Trading', 'Christmas Eve Early Close'
  openTime: string;                 // '18:15'
  closeTime: string;                // '19:15'
}

export interface IMarketCalendar {
  isTradingDay(date: string, exchange?: string): boolean;
  isPartialTradingDay(date: string, exchange?: string): boolean;
  getPartialSession(date: string, exchange?: string): PartialTradingDaySession | null;
  getLatestTradingDay(asOfDate: string, exchange?: string): string;
  isStalePrice(priceDate: string, valuationDate: string, maxDays?: number): boolean;
}
```

### Partial Trading Day Examples
- **NSE / BSE**: Diwali Muhurat Trading (1-hour evening session e.g. 18:15 – 19:15 IST).
- **NYSE / NASDAQ**: Christmas Eve (December 24th) early close at 13:00 EST / Black Friday early close.
