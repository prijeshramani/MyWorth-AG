# 💱 CURRENCY_MODEL.md — Currency & FX Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 2A (Global Market Foundation - Architecture Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Multi-Currency Architectural Principle

Every asset, transaction, and price record maintains its **Native Currency** (ISO 4217 code). 

Financial engines perform calculation in the asset's native currency first, then convert values into the user's **Portfolio Base Reporting Currency** (default `INR` or `USD`) using an explicit `IFXConversionService`. This guarantees zero distortion of raw transaction costs or historical asset performance.

```
Native Holding Value (e.g. $10,000 USD) ──► IFXConversionService (USD/INR Rate) ──► Reporting Portfolio Value (e.g. ₹8,35,000 INR)
```

---

## 2. Currency Specification & Formatting Rules

```typescript
export interface CurrencyDefinition {
  code: string;             // ISO 4217 (e.g. 'INR', 'USD')
  symbol: string;           // '₹', '$'
  name: string;             // 'Indian Rupee', 'US Dollar'
  decimalDigits: number;    // 2
  formatLocale: string;     // 'en-IN', 'en-US'
}
```

### Initial Currencies
1. **INR (`Indian Rupee`)**: Symbol `₹`, Locale `en-IN` (Lakh / Crore number formatting: `1,00,000`).
2. **USD (`US Dollar`)**: Symbol `$`, Locale `en-US` (Thousands / Millions formatting: `100,000`).

---

## 3. FX Rate Conversion Contract (`IFXConversionService`)

```typescript
export interface FXRateSnapshot {
  baseCurrency: string;     // e.g. 'USD'
  targetCurrency: string;   // e.g. 'INR'
  rate: number;             // e.g. 83.50
  rateDate: string;         // YYYY-MM-DD
  source: string;           // 'RBI', 'FED', 'YAHOO_FINANCE'
}

export interface IFXConversionService {
  getExchangeRate(base: string, target: string, date: string): Promise<FXRateSnapshot>;
  convert(amount: number, base: string, target: string, date: string): Promise<number>;
}
```
