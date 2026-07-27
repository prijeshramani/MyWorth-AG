# 📥 IMPORT_CENTER_ARCHITECTURE.md — Import Center Architecture

**System Name**: Family Wealth OS  
**Phase**: Phase 6UX  
**Date**: July 27, 2026  
**Status**: APPROVED IMPORT ARCHITECTURE  

---

## 1. Import Processing Pipeline

The Import Center reuses existing parsers and broker APIs without code duplication:

```
[ Data Source ] ──> [ Parser Engine ] ──> [ Validation Engine ] ──> [ Preview & Review ] ──> [ Duplicate Detection ] ──> [ Approval ] ──> [ SQLite ]
  • CAMS CAS          • PDF Parser          • Date / ISIN Check         • User Corrections      • Merge / Skip / Overwrite    • Transaction    • Holdings
  • NSDL/CDSL         • Excel Parser        • Price Validation                                  • Batch History Entry       • Audit Log      • Accounts
  • Zerodha Kite      • CSV Parser
  • AngelOne          • OCR Engine
  • INDMoney
```

---

## 2. Supported Import Formats

| Format / API | Engine / Parser | Supported Entities |
| :--- | :--- | :--- |
| **CAMS / KFintech CAS** | `pdfParser.ts` | Mutual Fund Transactions, NAV, Folios, Units |
| **Zerodha Kite Connect**| `kiteService.ts` | Equities, Mutual Funds, Trades, Holdings |
| **AngelOne SmartAPI**   | `angeloneService.ts` | Demat Holdings, Positions, Tradebook |
| **INDMoney Sync**       | `indmoneyService.ts` | US Stocks, Indian Stocks, Bank Balances |
| **CSV / Excel Raw**     | `csvParser.ts` / `excelParser.ts` | Custom Holdings, Bank Statements |
