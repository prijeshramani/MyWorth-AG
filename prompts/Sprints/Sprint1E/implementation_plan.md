# Implementation Plan — Sprint 1E: Asset Valuation Foundation

Design and implement the **Asset Valuation Architecture** (`backend/src/engines/valuation/`) to establish a extensible valuation strategy pattern across all financial asset classes on top of stable Architecture v1.0.

> [!IMPORTANT]
> **Sprint Scope Boundary**:
> - **Architecture Version 1.0 Frozen**: Core domain tables (`families`, `family_members`, `entities`, `accounts`, `holdings`, `assets_master`) and repositories remain 100% UNTOUCHED.
> - **NO Market Price Downloads**: Does NOT download live prices from Yahoo Finance, AMFI, NPS, or external APIs.
> - **Engine Isolation**: Strategies consume `ValuationContext` (pure data) and return `ValuationResult`. No direct database queries or repository calls inside valuation strategies.
> - **100% Backward Compatibility**: All 47 existing unit & regression tests continue passing cleanly.

---

## User Review Required

> [!NOTE]
> **Valuation Strategy Pattern**:
> Valuation logic differs fundamentally by asset class (e.g. Stock closing price vs. Mutual Fund NAV vs. Fixed Deposit quarterly compounding vs. EPF/PPF annual interest accumulation). The `AssetTypeValuationRegistry` decouples price evaluation from calculation algorithms, allowing external market importers (Sprint 2) to supply prices into the valuation engine seamlessly.

---

## Proposed Changes

### Phase 1 — Valuation Engine Core Infrastructure (`backend/src/engines/valuation/`)

#### [NEW] [IValuationStrategy.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/engines/valuation/IValuationStrategy.ts)
Generic strategy contract interface:
```ts
export interface IValuationStrategy {
  readonly assetType: string;
  readonly name: string;
  value(context: ValuationContext): ValuationResult;
}
```

#### [NEW] [ValuationContext.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/engines/valuation/ValuationContext.ts)
Standardized input context wrapper for valuation:
```ts
export interface ValuationContext {
  assetId?: number;
  assetType: string;
  quantity: number;
  costBasis: number;
  price?: number;
  priceDate?: string;
  valuationDate: string;
  currency?: string;
  metadata?: Record<string, any> | null;
  options?: Record<string, any>;
}
```

#### [NEW] [ValuationResult.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/engines/valuation/ValuationResult.ts)
Standardized valuation result envelope:
```ts
export interface ValuationResult {
  success: boolean;
  assetId?: number;
  assetType: string;
  quantity: number;
  unitPrice: number;
  priceDate?: string;
  valuationDate: string;
  marketValue: number;
  costBasis: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  currency: string;
  warnings: string[];
  errors: string[];
  auditTrail: string[];
}
```

#### [NEW] [CurrencyPrecision.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/engines/valuation/CurrencyPrecision.ts)
Currency precision helper providing `formatCurrency`, `roundMoney`, `roundUnits`, `roundPercent`.

#### [NEW] [MarketCalendar.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/engines/valuation/MarketCalendar.ts)
Trading calendar helper evaluating weekend/holiday rules, latest trading day resolution, and stale price detection (`isStalePrice`).

#### [NEW] [AssetTypeValuationRegistry.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/engines/valuation/AssetTypeValuationRegistry.ts)
Strategy registry manager singleton registering and executing valuation strategies by `asset_type`.

---

### Phase 2 — Asset Valuation Strategies (`backend/src/engines/valuation/strategies/`)

#### [NEW] Valuation Strategies
1. `EquityValuationStrategy.ts`: Equity closing price valuation (`marketValue = qty * price`).
2. `MutualFundValuationStrategy.ts`: Mutual Fund NAV valuation (`marketValue = qty * nav`).
3. `ETFValuationStrategy.ts`: ETF market closing price valuation (`marketValue = qty * price`).
4. `GoldValuationStrategy.ts`: Gold per-gram price valuation.
5. `BondValuationStrategy.ts`: Bond face value / market price + accrued interest.
6. `FixedDepositValuationStrategy.ts`: Fixed Deposit compounding interest formula ($A = P (1 + r/n)^{nt}$).
7. `ProvidentFundValuationStrategy.ts`: EPF / PPF annual interest accumulation formula ($A = P + P \cdot r \cdot t$).
8. `NPSValuationStrategy.ts`: NPS NAV tier valuation.
9. `RealEstateValuationStrategy.ts`: Real estate property area/appraisal valuation.
10. `CryptoValuationStrategy.ts`: Cryptocurrency market token price valuation.
11. `GenericValuationStrategy.ts`: Fallback valuation for `BANK`, `OTHER`.

---

### Phase 3 — Tests & Deliverables

#### [MODIFY] [runTests.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/runTests.ts)
Add dedicated test suite section for `Valuation Engine`:
- Market price valuation for Equity, Mutual Funds, ETFs, Gold, NPS
- Compound interest valuation for Fixed Deposits (FDs)
- Interest accumulation valuation for EPF / PPF
- Stale price detection & trading calendar resolution (`MarketCalendar`)
- AssetTypeValuationRegistry registration and strategy resolution
- All 47 existing Sprint 1A, 1B, 1C, Pre-1D & 1D unit tests continue passing cleanly

#### [NEW] [Sprint_1E_Retrospective.md](file:///c:/Users/prije/Downloads/MyWorth/docs/Sprint_1E_Retrospective.md)

#### [NEW] [Sprint 1E - Implementation Summary.md](file:///c:/Users/prije/Downloads/MyWorth/prompts/summary/Sprint%201E%20-%20Implementation%20Summary.md)

#### [MODIFY] [AI_CHANGELOG.md](file:///c:/Users/prije/Downloads/MyWorth/docs/AI_CHANGELOG.md) & [.ai/SESSION_CONTEXT.md](file:///c:/Users/prije/Downloads/MyWorth/.ai/SESSION_CONTEXT.md)

---

## Verification Plan

### Automated Tests
1. `npm test` in `backend` (Valuation infrastructure, strategy algorithms, & regression suite).
2. `npm run build` in `backend` (`tsc`).
3. `npm run build` in `frontend` (`vite build`).

### Manual Verification
- Verify valuation calculations for complex compound interest FDs and stale price warnings.
