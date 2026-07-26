# 🏢 EXCHANGE_MODEL.md — Exchange & Calendar Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 2A (Global Market Foundation - Architecture Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Exchange Contract Model

Every trading venue is represented by a standardized `ExchangeDefinition`:

```typescript
export interface ExchangeDefinition {
  micCode: string;          // ISO 10383 Market Identifier Code (e.g. 'XNSE', 'XNAS')
  code: string;             // Short code ('NSE', 'BSE', 'NASDAQ', 'NYSE')
  name: string;             // Full exchange name
  country: string;          // Jurisdiction code ('IN', 'US')
  currency: string;         // Exchange trading currency ('INR', 'USD')
  timezone: string;         // Exchange IANA timezone
  regularHours: {
    open: string;           // Local time '09:15'
    close: string;          // Local time '15:30'
  };
  marketCalendar: IMarketCalendar;
}
```

---

## 2. Initial Supported Exchanges

| Exchange Code | MIC Code | Jurisdiction | Currency | Timezone | Regular Trading Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NSE** | `XNSE` | `IN` (India) | `INR` | `Asia/Kolkata` | 09:15 – 15:30 IST |
| **BSE** | `XBOM` | `IN` (India) | `INR` | `Asia/Kolkata` | 09:15 – 15:30 IST |
| **NASDAQ** | `XNAS` | `US` (USA) | `USD` | `America/New_York` | 09:30 – 16:00 EST/EDT |
| **NYSE** | `XNYS` | `US` (USA) | `USD` | `America/New_York` | 09:30 – 16:00 EST/EDT |

---

## 3. Exchange-Specific Calendar Interfaces

Extends `MarketCalendar` (Sprint 1E) with exchange-specific implementations:

- `NSEMarketCalendar`: Evaluates Indian NSE trading days, weekends (Sat/Sun), and NSE market holidays (e.g., Diwali, Independence Day).
- `NYSEMarketCalendar`: Evaluates US NYSE/NASDAQ trading days, weekends, and US market holidays (e.g., Thanksgiving, July 4th, MLK Day).
- `AMFIMarketCalendar`: Evaluates NAV publishing schedules (daily post 21:00 IST on business days).
- `DefaultMarketCalendar`: Fallback excluding Saturday and Sunday.
