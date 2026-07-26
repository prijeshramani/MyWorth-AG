# Sprint 2B – Market Data Provider Framework (Architecture & Implementation Plan)

## Objective

Implement the Global Market Foundation architecture approved in Sprint 2A.

This sprint establishes the provider framework, not the complete market data ecosystem.

--------------------------------------------------

Read first:

1. .ai/SESSION_CONTEXT.md
2. GLOBAL_MARKET_ARCHITECTURE.md
3. ASSET_IDENTITY_ARCHITECTURE.md
4. MARKET_MODEL.md
5. EXCHANGE_MODEL.md
6. CURRENCY_MODEL.md
7. PROVIDER_IDENTIFIER_MAPPING.md
8. ADR-022-GLOBAL_BY_DESIGN.md
9. SPRINT_2A_IMPLEMENTATION_PLAN.md

--------------------------------------------------

Architecture updates before implementation

Incorporate the following ARB recommendations:

1. Add support for FIGI in the Asset Identity architecture (architecture only; implementation optional).
2. Introduce Asset Classification as a separate concept from Asset Type.
3. Extend ExchangeDefinition to support:
   - Settlement Cycle
   - Lot Size
   - Fractional Share Support
4. Add architecture documentation for Corporate Action Registry.
5. Extend Market Calendar to support partial trading days.
6. Introduce Provider Simulation Framework:
   - MockProvider
   - ReplayProvider
7. Ensure providers remain market-agnostic (e.g., YahooProvider supports multiple exchanges).

--------------------------------------------------

Implementation scope

Implement:

- IMarketDataProvider
- YahooFinanceProvider (India + USA support)
- ManualProvider
- MockProvider
- ReplayProvider
- ProviderHealthService
- ProviderCache
- RetryPolicy
- CircuitBreaker

Do not implement:

- AMFI
- NPS
- Alpha Vantage
- Polygon
- Other providers

--------------------------------------------------

Quality requirements

- Preserve Architecture v1.0.
- Preserve backward compatibility.
- Keep deterministic behaviour.
- Ensure all tests pass.
- Update:
  - SESSION_CONTEXT.md
  - AI_CHANGELOG.md
  - Sprint 2B Retrospective
  - Sprint 2B Implementation Summary

Provide exactly ONE recommendation for Sprint 3.