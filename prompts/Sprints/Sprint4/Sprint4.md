# Sprint 4 – Performance Engine (Architecture & Design)

## Objective

Design the Performance Engine for Family Wealth OS.

This sprint is Architecture & Design ONLY.

Do NOT implement production code.

The Performance Engine is the first engine responsible for measuring investment performance.

It consumes outputs from:

- Transaction Engine
- Valuation Engine
- NetWorth Engine

It must NEVER communicate directly with:

- SQLite repositories
- Market Providers
- External APIs

Maintain Architecture v1.0.

--------------------------------------------------

Read before starting:

1. .ai/SESSION_CONTEXT.md
2. docs/AI_CHANGELOG.md
3. Architecture v1.0
4. Transaction Engine documentation
5. Valuation Engine documentation
6. Net Worth Engine documentation
7. Sprint 3 Retrospective
8. Sprint 3 Implementation Summary

--------------------------------------------------

Architecture Deliverables

Create the following documents:

1. PERFORMANCE_ENGINE_ARCHITECTURE.md
2. PERFORMANCE_DOMAIN_MODEL.md
3. PERFORMANCE_CALCULATION_RULES.md
4. PERFORMANCE_SEQUENCE_DIAGRAMS.md
5. PERFORMANCE_AUDIT_MODEL.md
6. PERFORMANCE_FORMULAS.md
7. SPRINT_4_IMPLEMENTATION_PLAN.md

--------------------------------------------------

Design the following components:

Core

- IPerformanceEngine
- PerformanceSnapshot
- PerformanceManifest
- PerformanceSummary

Calculations

- Absolute Return
- Unrealized Return
- Realized Return
- CAGR
- XIRR
- Time Weighted Return (TWR)
- Money Weighted Return (MWR)

Portfolio Metrics

- Total Gain/Loss
- Annualized Return
- Holding Performance
- Account Performance
- Entity Performance
- Family Performance

Audit

- Calculation lineage
- Formula version
- Input snapshot references
- Manifest integration

--------------------------------------------------

Architecture Requirements

The Performance Engine must:

- Be deterministic
- Be idempotent
- Be auditable
- Consume only engine outputs
- Preserve EngineRegistry usage
- Support multi-currency
- Support hierarchy aggregation
- Preserve Architecture v1.0

--------------------------------------------------

Future Extensions (Documentation Only)

Document future support for:

- Benchmark Comparison
- Alpha/Beta
- Sharpe Ratio
- Sortino Ratio
- Volatility
- Drawdown
- Rolling Returns
- Attribution Analysis

Do NOT design implementation.

--------------------------------------------------

Rules

Do NOT:

- Write production code
- Modify database schema
- Change repositories
- Add provider integrations
- Change frozen architecture

--------------------------------------------------

Update

- SESSION_CONTEXT.md
- AI_CHANGELOG.md

--------------------------------------------------

Deliverables

Provide:

1. Architecture Summary
2. Domain Model
3. Calculation Rules
4. Sequence Diagrams
5. Audit Model
6. Implementation Plan
7. Exactly ONE recommendation before implementation begins.