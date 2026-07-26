# Sprint 2A – Global Market Foundation (Architecture & Design)

## Context

Architecture Version 1.0 is frozen.

The project is adopting a new architectural principle:

"Global by Design, Local by Implementation."

The application will initially implement India and USA markets only, but the architecture must support future global expansion without redesign.

Do NOT implement production code.

Produce architecture and implementation planning documents only.

--------------------------------------------------

Read first:

1. .ai/SESSION_CONTEXT.md
2. docs/Architecture_v1.0.md
3. docs/PRICE_INFRASTRUCTURE_ARCHITECTURE.md
4. docs/PRICE_PROVIDER_MODEL.md
5. docs/DOMAIN_MODEL.md
6. docs/ARCHITECTURE_DECISIONS.md
7. docs/SYSTEM_ARCHITECTURE.md

--------------------------------------------------

Produce:

1. GLOBAL_MARKET_ARCHITECTURE.md
2. ASSET_IDENTITY_ARCHITECTURE.md
3. MARKET_MODEL.md
4. EXCHANGE_MODEL.md
5. CURRENCY_MODEL.md
6. PROVIDER_IDENTIFIER_MAPPING.md
7. GLOBAL_READINESS_ASSESSMENT.md
8. ADR-022-GLOBAL_BY_DESIGN.md
9. SPRINT_2A_IMPLEMENTATION_PLAN.md

--------------------------------------------------

Design the following:

### Asset Identity

Support:

- Internal Asset ID
- ISIN
- Ticker
- Exchange Symbol
- Provider-specific identifiers

### Markets

Initially support:

- NSE
- BSE
- NASDAQ
- NYSE

Architecture should support future exchanges without redesign.

### Currency

Support:

- INR
- USD

Design should allow future currencies.

### Market Calendar

Design exchange-specific calendars.

### Provider Mapping

Map providers to identifiers.

Examples:

Yahoo Finance

AMFI

NPS

Manual

Future providers

--------------------------------------------------

Rules

- No production code.
- No database implementation.
- No external API integration.
- Preserve Architecture v1.0.
- Preserve backward compatibility.
- Keep implementation limited to India + USA.
- Design for future global expansion.

Update:

- SESSION_CONTEXT.md
- AI_CHANGELOG.md

Provide exactly ONE recommendation before implementation begins.