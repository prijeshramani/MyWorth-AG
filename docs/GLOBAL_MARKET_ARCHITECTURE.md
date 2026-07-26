# 🌐 GLOBAL_MARKET_ARCHITECTURE.md — Global Market Foundation Architecture

**System Name**: Family Wealth OS  
**Phase**: Sprint 2A (Global Market Foundation - Architecture Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Architectural Philosophy: "Global by Design, Local by Implementation"

Family Wealth OS adopts the principle of **"Global by Design, Local by Implementation"**. 

While initial functional support targets **India (IN)** and **United States (US)** financial markets, all underlying data contracts, exchange models, currency structures, asset identification strategies, and provider mapping layers are built globally extensible. Adding support for future jurisdictions (e.g., United Kingdom, Japan, Singapore, European Union) will require zero structural refactoring of core domain schemas or financial engines.

```
+-----------------------------------------------------------------------------------+
|                            GLOBAL MARKET FOUNDATION LAYER                         |
+-----------------------------------------------------------------------------------+
|  Jurisdictions:       [ IN (India) ]               [ US (United States) ]         |
|  Exchanges:           [ NSE | BSE ]                [ NASDAQ | NYSE ]              |
|  Currencies:          [ INR ]                      [ USD ]                        |
|  Identifiers:         [ ISIN | Symbol | AMFI Code ] [ ISIN | CUSIP | Ticker ]    |
|  Market Calendars:    [ NSE / BSE Calendar ]       [ NYSE / NASDAQ Calendar ]    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        PROVIDER IDENTIFIER MAPPING LAYER                          |
|  Asset Master ID ──► Exchange Symbol ──► Provider Symbol (e.g., RELIANCE.NS / AAPL)|
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        STABLE DOMAIN ENGINE LAYER (Frozen v1.0)                    |
|  TransactionEngine | ValuationEngine | PriceEngine | NetWorthEngine | TaxEngine    |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Pillars

1. **Multi-Jurisdictional Asset Identity**: Multi-tiered security resolution using standard international identifiers (ISIN, FIGI, CUSIP/SEDOL) paired with provider-specific ticker mappings.
2. **Exchange-Centric Operating Model**: Every traded asset is associated with a primary exchange (`NSE`, `BSE`, `NASDAQ`, `NYSE`) which governs trading hours, weekend rules, and holiday calendars.
3. **Currency & FX Decoupling**: Holding cost basis and market values preserve the asset's native transaction currency (`INR`, `USD`). Multi-currency portfolio consolidation converts native values into the user's preferred reporting currency without mutating underlying position balances.
4. **Frozen Architecture v1.0 Compliance**: Extends metadata and engine contexts without modifying frozen database schemas (`families`, `entities`, `accounts`, `holdings`, `assets_master`).
