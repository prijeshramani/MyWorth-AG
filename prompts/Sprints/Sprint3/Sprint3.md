# Sprint 3 – Net Worth Engine (Architecture & Design Phase)

Objective

Design the first Business Engine of Family Wealth OS.

Do NOT implement production code.

The Net Worth Engine will consume:

- Holdings
- Valuation Results
- Price Snapshots

It must NOT communicate directly with repositories or market providers.

--------------------------------------------------

Read first:

1. .ai/SESSION_CONTEXT.md
2. Architecture v1.0
3. Transaction Engine documentation
4. Valuation Engine documentation
5. Market Data Provider Framework
6. AI_CHANGELOG.md

--------------------------------------------------

Produce:

1. NET_WORTH_ENGINE_ARCHITECTURE.md
2. NET_WORTH_DOMAIN_MODEL.md
3. NET_WORTH_CALCULATION_RULES.md
4. NET_WORTH_SEQUENCE_DIAGRAMS.md
5. NET_WORTH_AUDIT_MODEL.md
6. SPRINT_3_IMPLEMENTATION_PLAN.md

--------------------------------------------------

Design:

- INetWorthEngine
- NetWorthSnapshot
- PortfolioSummary
- AssetAllocation
- DailyChange
- UnrealizedGainLoss
- CurrencyAggregation
- AuditTrail
- Engine Contracts

Requirements

- Consume only ValuationResults.
- Be deterministic.
- Be idempotent.
- Be fully auditable.
- Support multiple currencies.
- Support Family, Entity and Account aggregation.
- Preserve Architecture v1.0.

Update:

- SESSION_CONTEXT.md
- AI_CHANGELOG.md

Provide exactly ONE recommendation before implementation begins.