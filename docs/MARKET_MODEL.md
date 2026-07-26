# 🏛 MARKET_MODEL.md — Market Jurisdiction Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 2A (Global Market Foundation - Architecture Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Jurisdiction Architecture

Family Wealth OS structures markets by **Country / Jurisdiction Code** (ISO 3166-1 alpha-2), containing exchanges, asset categories, tax rules, and local regulatory bodies:

```typescript
export interface MarketJurisdiction {
  code: string;             // ISO 3166-1 alpha-2 (e.g. 'IN', 'US')
  name: string;             // 'India', 'United States'
  defaultCurrency: string;  // 'INR', 'USD'
  exchanges: string[];      // ['NSE', 'BSE'] or ['NASDAQ', 'NYSE']
  supportedAssetTypes: string[];
  timezone: string;         // 'Asia/Kolkata', 'America/New_York'
}
```

---

## 2. Initial Market Specifications

### A. India Jurisdiction (`IN`)
- **Country Code**: `IN`
- **Default Currency**: `INR`
- **Primary Exchanges**: `NSE` (National Stock Exchange), `BSE` (Bombay Stock Exchange)
- **Special Registries**: AMFI (Mutual Funds), PFRDA (NPS), EPFO (EPF), India Post (PPF/SSA)
- **Supported Asset Types**: `STOCK`, `MUTUAL_FUND`, `ETF`, `GOLD`, `BOND`, `FD`, `EPF`, `PPF`, `NPS`, `SSA`, `BANK`, `REAL_ESTATE`, `OTHER`
- **Timezone**: `Asia/Kolkata` (UTC+05:30)

### B. United States Jurisdiction (`US`)
- **Country Code**: `US`
- **Default Currency**: `USD`
- **Primary Exchanges**: `NASDAQ`, `NYSE` (New York Stock Exchange)
- **Supported Asset Types**: `STOCK`, `ETF`, `MUTUAL_FUND`, `BOND`, `BANK`, `REAL_ESTATE`, `CRYPTO`, `OTHER`
- **Timezone**: `America/New_York` (UTC-05:00 / UTC-04:00 DST)

---

## 3. Extensibility Model for Future Jurisdictions

New jurisdictions (e.g., `GB` - United Kingdom, `JP` - Japan, `SG` - Singapore, `EU` - European Union) are registered via `MarketRegistry.registerJurisdiction(jurisdictionConfig)` without modifying existing database schemas or engine code.
