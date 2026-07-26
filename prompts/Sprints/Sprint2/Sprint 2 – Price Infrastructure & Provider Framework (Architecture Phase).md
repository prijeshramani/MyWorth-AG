# Sprint 2 – Price Infrastructure & Provider Framework (Architecture Phase)

## Objective

Do NOT implement code.

Produce the architecture and implementation plan for the Market Price Infrastructure.

The goal is to create a provider-agnostic market data platform that integrates seamlessly with the existing Transaction Engine and Valuation Engine.

--------------------------------------------------

Read first:

1. .ai/SESSION_CONTEXT.md
2. docs/Architecture_v1.0.md
3. docs/SYSTEM_ARCHITECTURE.md
4. docs/AI_CHANGELOG.md
5. Sprint 1D documentation
6. Sprint 1E documentation

--------------------------------------------------

Design only.

Do NOT write production code.

Produce the following documents:

1. PRICE_INFRASTRUCTURE_ARCHITECTURE.md
2. PRICE_PROVIDER_MODEL.md
3. PRICE_NORMALIZATION_DESIGN.md
4. PRICE_STORAGE_STRATEGY.md
5. PRICE_PROVIDER_SEQUENCE_DIAGRAMS.md
6. SPRINT_2_IMPLEMENTATION_PLAN.md

--------------------------------------------------

Design interfaces for:

- IPriceProvider
- YahooFinanceProvider
- AMFIProvider
- NPSProvider
- ManualPriceProvider

Design:

- PriceNormalizationService
- PriceRepository
- PriceScheduler
- PriceRefreshPolicy
- RetryPolicy
- RateLimitStrategy
- ProviderHealthMonitoring

--------------------------------------------------

Rules

- No market API integration yet.
- No database implementation.
- No UI.
- No repository changes unless justified.
- Preserve Architecture v1.0.
- Preserve backward compatibility.

Update:

- SESSION_CONTEXT.md
- AI_CHANGELOG.md

Provide exactly ONE recommendation before implementation begins.