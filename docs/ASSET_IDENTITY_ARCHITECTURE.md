# 🆔 ASSET_IDENTITY_ARCHITECTURE.md — Global Asset Identity Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 2A (Global Market Foundation - Architecture Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Multi-Tier Security Identification Model

To uniquely identify securities globally across disparate asset classes and market data providers, Family Wealth OS establishes a 4-tier identification hierarchy:

```
Tier 1: System Internal Asset ID (Primary Key integer in assets_master)
  └── Tier 2: Global Standard Identifier (ISIN - International Securities Identification Number)
        └── Tier 3: Exchange Ticker + Market Code (e.g. RELIANCE:NSE, AAPL:NASDAQ)
              └── Tier 4: Provider-Specific Symbols (e.g. Yahoo: RELIANCE.NS, AMFI: 120503)
```

---

## 2. Identifier Properties & Definitions

| Identifier Level | Format / Pattern | Example | Purpose & Scope |
| :--- | :--- | :--- | :--- |
| **Internal Asset ID** | `INTEGER` (Auto-inc) | `1042` | Primary key link across holdings and engines |
| **ISIN** | 12-char alphanumeric (`^[A-Z]{2}[A-Z0-9]{9}[0-9]$`) | `INE002A01018` (RIL)<br>`US0378331005` (Apple) | Global canonical security identification |
| **Local Symbol** | Exchange Ticker String | `RELIANCE`, `AAPL` | Display symbol on exchange |
| **Exchange Code** | ISO 10383 MIC / Code | `NSE`, `BSE`, `NASDAQ`, `NYSE` | Primary market venue |
| **CUSIP / SEDOL** | 9-char / 7-char string | `037833100` (Apple CUSIP) | US / UK local market identifiers |
| **AMFI Code** | 6-digit numeric string | `120503` | Indian Mutual Fund scheme code |
| **NPS Scheme Code** | Alphanumeric string | `NPS_TIER1_E` | National Pension System scheme ID |

---

## 3. Resolution Priority Algorithm

When retrieving market price snapshots or deduplicating imported holdings:

1. **Priority 1 (Global Standard)**: Match exact `ISIN` string (e.g. `US0378331005`).
2. **Priority 2 (Exchange + Symbol)**: Match `symbol` + `exchange` + `asset_type` (e.g. `AAPL` + `NASDAQ` + `STOCK`).
3. **Priority 3 (Provider Identifier)**: Match provider-specific ID in asset `metadata` (e.g. `amfiCode: 120503` or `yahooSymbol: RELIANCE.NS`).
4. **Priority 4 (Normalized Name Fallback)**: Lowercase asset name + asset type matching.
