# 🎯 PRICE_NORMALIZATION_DESIGN.md — Price Normalization & Quality Scoring

**System Name**: Family Wealth OS  
**Phase**: Sprint 2 (Architecture & Provider Framework)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Normalization Pipeline

The `PriceNormalizationService` transforms heterogeneous raw JSON/CSV data from various providers into standardized, validated `PriceSnapshot` models.

```
Raw Response (JSON/CSV) ──► Validation ──► Spike Detection ──► Quality Scoring ──► Standardized PriceSnapshot
```

---

## 2. Standardized Output Schema (`PriceSnapshot`)

```typescript
export interface PriceSnapshot {
  value: number;            // Normalized closing price / NAV
  currency: string;         // ISO 4217 Currency Code (e.g., 'INR', 'USD')
  source: string;           // Provider label ('YAHOO_FINANCE', 'AMFI_INDIA', etc.)
  timestamp: string;        // Date of price record (YYYY-MM-DD)
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  stale: boolean;           // True if age > 5 days
  adjusted: boolean;        // True if corporate action adjusted
}
```

---

## 3. Data Quality & Outlier Detection

### A. Quality Scoring Rules
- **HIGH**: Fresh market price fetched directly from primary exchange API (age $\le 1$ day).
- **MEDIUM**: Secondary provider price or manual user entry.
- **LOW**: Interpolated or fallback price.
- **STALE**: Market price older than 5 calendar days relative to target valuation date.

### B. Outlier Spike Detection Policy
- **Rule**: If $| P_{\text{new}} - P_{\text{prev}} | / P_{\text{prev}} > 0.50$ (50% single-day price variation):
  - Mark `confidence` as `LOW`.
  - Log warning alert in `PriceNormalizationService` audit log.
  - Require manual verification for multi-million rupee portfolio adjustments.
