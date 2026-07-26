# 📋 SPRINT_2_IMPLEMENTATION_PLAN.md — Sprint 2 Code Execution Plan

**System Name**: Family Wealth OS  
**Phase**: Sprint 2 (Provider Framework Implementation)  
**Date**: July 26, 2026  
**Status**: DRAFT FOR REVIEW  

---

## 1. Goal & Scope

Implement the market price infrastructure classes and provider abstraction layer in `backend/src/providers/` and `backend/src/services/` based on the approved architecture specifications (`PRICE_INFRASTRUCTURE_ARCHITECTURE.md`).

> [!IMPORTANT]
> - **Architecture v1.0 Frozen**: Core database tables (`families`, `family_members`, `entities`, `accounts`, `holdings`, `assets_master`, `asset_prices`) remain 100% UNTOUCHED.
> - **Backward Compatibility**: All 61 existing regression unit tests must continue passing cleanly.

---

## 2. Proposed Implementation Components

### Component 1 — Provider Framework Contracts (`backend/src/providers/`)
- `IPriceProvider.ts`: Interface specification & provider health types.
- `BasePriceProvider.ts`: Abstract base provider implementing rate limiting & retry handling.
- `YahooFinanceProvider.ts`: Stock & ETF provider implementation.
- `AMFIProvider.ts`: Indian Mutual Fund NAV provider implementation.
- `NPSProvider.ts`: NPS Tier NAV provider implementation.
- `ManualPriceProvider.ts`: Manual override & unlisted asset provider.
- `ProviderRegistry.ts`: Singleton provider manager.

### Component 2 — Normalization & Synchronization Services (`backend/src/services/`)
- `PriceNormalizationService.ts`: Raw data transformer, spike detector, & quality scorer.
- `PriceSyncService.ts`: Orchestrates scheduled batch price updates across providers into `SQLitePriceRepository`.

---

## 3. Verification Plan

### Automated Tests
- Unit tests in `runTests.ts` covering provider mocking, normalization rules, quality scoring, rate limiting, and fallback behavior.
- Run `npm test` in `backend` (61 existing + new provider tests).
- Run `npm run build` in `backend` and `frontend`.
