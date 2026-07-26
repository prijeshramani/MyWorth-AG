# 🏛 PORTFOLIO_ANALYTICS_ARCHITECTURE.md — Analytics Engine Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 5A (Portfolio Analytics Engine - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Executive Summary & Role in Architecture v1.0

The `PortfolioAnalyticsEngine` is the **first Analytics Engine** of Family Wealth OS (Phase 3). It is a stateless, pure calculation engine responsible for evaluating multi-dimensional portfolio allocations (Asset, Sector, Market, Currency, Geography), liquidity/cash ratios, diversification indices (Herfindahl-Hirschman Index), concentration risks, and overall portfolio health scores.

```
+-----------------------------------------------------------------------------------+
|                              UPSTREAM ENGINE OUTPUTS                              |
|   [Transaction Engine]     [Valuation Engine]     [NetWorth Engine]    [Perf Engine] |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                            PORTFOLIO ANALYTICS ENGINE                             |
|   • Stateless Pure Engine (backend/src/engines/PortfolioAnalyticsEngine.ts)       |
|   • Multi-Dimensional Allocations (Asset, Sector, Market, Currency, Geography)    |
|   • Herfindahl-Hirschman Index (HHI) & Concentration Health Scoring               |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        PORTFOLIO ANALYTICS SNAPSHOT                               |
|   • DiversificationScore & Concentration Ratios (Top 1, Top 3, Top 5)            |
|   • PortfolioHealth (Liquid Cash Ratio, Health Rating, Warnings)                  |
|   • Shared CalculationManifest & Full Audit Trail                                 |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Directives

1. **Zero Database or Provider Coupling**: The `PortfolioAnalyticsEngine` accepts an `EngineContext<PortfolioAnalyticsInputPayload>` and returns an `EngineResult<PortfolioAnalyticsSnapshot>`. It does NOT execute SQL or make HTTP provider queries directly.
2. **Pure Upstream Consumption**: Consumes outputs from `ValuationEngine`, `NetWorthEngine`, `PerformanceEngine`, and `TransactionEngine`.
3. **Multi-Dimensional Decomposition**:
   - **Asset Allocation**: Breakdown across 14 asset types (`STOCK`, `MUTUAL_FUND`, `FD`, `EPF`, `GOLD`, etc.).
   - **Sector Allocation**: Breakdown across industry sectors (`Technology`, `Financial Services`, `Energy`, `Healthcare`, `Real Estate`, etc.).
   - **Market Allocation**: Breakdown across exchanges/countries (`IN_NSE`, `IN_BSE`, `US_NASDAQ`, `US_NYSE`).
   - **Currency Allocation**: Breakdown across reporting and native currencies (`INR`, `USD`, `EUR`).
   - **Geographic Allocation**: Domestic vs International asset distribution (`India`, `United States`, `Global`).
4. **Health & Diversification Scoring**: Uses the HHI index ($HHI = \sum s_i^2$) to calculate a normalized 0–100 `DiversificationScore` and flags high asset/sector concentration risks.
