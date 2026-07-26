# 🆔 ASSET_IDENTITY_ARCHITECTURE.md — Global Asset Identity Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 2B (Provider Framework Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Multi-Tier Security Identification Model

To uniquely identify securities globally across disparate asset classes and market data providers, Family Wealth OS establishes a 5-tier identification hierarchy:

```
Tier 1: System Internal Asset ID (Primary Key integer in assets_master)
  └── Tier 2: FIGI (Financial Instrument Global Identifier e.g. BBG000B9XRY4)
        └── Tier 3: Global Standard Identifier (ISIN e.g. INE002A01018, US0378331005)
              └── Tier 4: Exchange Ticker + Market Code (e.g. RELIANCE:NSE, AAPL:NASDAQ)
                    └── Tier 5: Provider-Specific Symbols (e.g. Yahoo: RELIANCE.NS, AMFI: 120503)
```

---

## 2. Identifier Properties & Definitions

| Identifier Level | Format / Pattern | Example | Purpose & Scope |
| :--- | :--- | :--- | :--- |
| **Internal Asset ID** | `INTEGER` (Auto-inc) | `1042` | Primary key link across holdings and engines |
| **FIGI** | 12-char alphanumeric (`^BBG[A-Z0-9]{9}$`) | `BBG000B9XRY4` (Apple) | Global Bloomberg open financial identifier |
| **ISIN** | 12-char alphanumeric (`^[A-Z]{2}[A-Z0-9]{9}[0-9]$`) | `INE002A01018` (RIL)<br>`US0378331005` (Apple) | Global canonical security identification |
| **Local Symbol** | Exchange Ticker String | `RELIANCE`, `AAPL` | Display symbol on exchange |
| **Exchange Code** | ISO 10383 MIC / Code | `NSE`, `BSE`, `NASDAQ`, `NYSE` | Primary market venue |
| **CUSIP / SEDOL** | 9-char / 7-char string | `037833100` (Apple CUSIP) | US / UK local market identifiers |
| **AMFI Code** | 6-digit numeric string | `120503` | Indian Mutual Fund scheme code |
| **NPS Scheme Code** | Alphanumeric string | `NPS_TIER1_E` | National Pension System scheme ID |

---

## 3. Asset Classification vs. Asset Type

To prevent overloading the technical `asset_type` enum (e.g., `STOCK`, `MUTUAL_FUND`, `BOND`), **Asset Classification** is separated into an independent multi-level taxonomy:

```
Asset Type (Technical Engine Behavior):
  - STOCK
  - MUTUAL_FUND
  - BOND
  - REAL_ESTATE

Asset Classification (Financial Risk & Sector Taxonomy):
  - Equity:LargeCap:Technology
  - Equity:MidCap:Pharmaceuticals
  - Debt:Government:Sovereign
  - RealEstate:Residential:Urban
```

---

## 4. Resolution Priority Algorithm

When retrieving market price snapshots or deduplicating imported holdings:

1. **Priority 1 (FIGI)**: Match exact `FIGI` string (e.g. `BBG000B9XRY4`).
2. **Priority 2 (ISIN)**: Match exact `ISIN` string (e.g. `US0378331005`).
3. **Priority 3 (Exchange + Symbol)**: Match `symbol` + `exchange` + `asset_type` (e.g. `AAPL` + `NASDAQ` + `STOCK`).
4. **Priority 4 (Provider Identifier)**: Match provider-specific ID in asset `metadata` (e.g. `amfiCode: 120503` or `yahooSymbol: RELIANCE.NS`).
5. **Priority 5 (Normalized Name Fallback)**: Lowercase asset name + asset type matching.
