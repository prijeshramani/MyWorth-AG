# 📋 SPRINT_2A_IMPLEMENTATION_PLAN.md — Sprint 2A Implementation Plan

**System Name**: Family Wealth OS  
**Phase**: Sprint 2A (Global Market Foundation)  
**Date**: July 26, 2026  
**Status**: APPROVED IMPLEMENTATION PLAN  

---

## 1. Goal & Scope

Implement the global market foundation abstractions, exchange definition registry, multi-currency conversion contract, and provider identifier mapping layer under `backend/src/markets/` and `backend/src/providers/`.

> [!IMPORTANT]
> - **Architecture Version 1.0 Frozen**: Core database tables (`families`, `family_members`, `entities`, `accounts`, `holdings`, `assets_master`, `asset_prices`) remain 100% UNTOUCHED.
> - **Zero External Live API Calls**: Mock implementations for tests; live API integrations deferred to Sprint 2B.
> - **100% Backward Compatibility**: All 61 existing unit tests must pass cleanly.

---

## 2. Proposed Implementation Components

### Phase 1 — Global Market Infrastructure (`backend/src/markets/`)
- `MarketRegistry.ts`: Central registry for market jurisdictions (`IN`, `US`) and exchange definitions (`NSE`, `BSE`, `NASDAQ`, `NYSE`).
- `ExchangeDefinition.ts`: Exchange hours, country, currency, and `IMarketCalendar` definitions.
- `NSEMarketCalendar.ts` & `NYSEMarketCalendar.ts`: Exchange-specific trading calendar implementations.
- `FXConversionService.ts`: Currency conversion contract and mock conversion service (`USD/INR`).

### Phase 2 — Provider Identifier Mapper (`backend/src/providers/`)
- `ProviderIdentifierMapper.ts`: Resolves standardized asset identifiers (ISIN, Symbol, AMFI Code) to provider query parameters (`RELIANCE.NS`, `AAPL`, `120503`).

### Phase 3 — Tests & Verification (`backend/src/__tests__/runTests.ts`)
- Unit tests verifying global market registry, exchange calendar logic, FX conversion calculations, and provider mapping resolution.

---

## 3. Verification Plan

### Automated Tests
1. `npm test` in `backend` (61 existing + new global market tests).
2. `npm run build` in `backend` (`tsc`).
3. `npm run build` in `frontend` (`vite build`).
