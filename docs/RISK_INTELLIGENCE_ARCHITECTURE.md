# 🏛 RISK_INTELLIGENCE_ARCHITECTURE.md — Risk Engine Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 5B (Risk Intelligence Engine - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Executive Summary & Role in Architecture v1.0

The `RiskEngine` is the **quantitative risk & analytics module** of Family Wealth OS. It is a stateless, pure calculation engine responsible for measuring risk-adjusted returns (Sharpe Ratio, Sortino Ratio), downside deviation, volatility, maximum drawdown, portfolio beta, benchmark correlation, and tracking error against major market indices (`Nifty 50`, `Sensex`, `Nifty 500`, `Nasdaq 100`, `S&P 500`).

```
+-----------------------------------------------------------------------------------+
|                              UPSTREAM ENGINE OUTPUTS                              |
|   [Valuation Engine]   [NetWorth Engine]   [Perf Engine]   [PortfolioAnalytics]   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                             RISK INTELLIGENCE ENGINE                              |
|   • Stateless Pure Engine (backend/src/engines/RiskEngine.ts)                     |
|   • Risk Metric Solvers (Sharpe, Sortino, Volatility, Max Drawdown, Beta, TE)     |
|   • Benchmark Series Matcher (Nifty 50, Sensex, Nifty 500, Nasdaq 100, S&P 500)   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                                  RISK SNAPSHOT                                    |
|   • RiskSummary (Sharpe, Sortino, Volatility, Max Drawdown, Beta, Correlation)    |
|   • BenchmarkComparison & RiskRecommendations                                     |
|   • Shared CalculationManifest & Full Audit Trail                                 |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Directives

1. **Zero Database or Provider Coupling**: The `RiskEngine` accepts an `EngineContext<RiskInputPayload>` and returns an `EngineResult<RiskSnapshot>`. It does NOT execute SQL queries or make HTTP provider calls directly.
2. **Pure Upstream Consumption**: Consumes historical price/value time series from `NetWorthEngine`, return streams from `PerformanceEngine`, asset allocations from `PortfolioAnalyticsEngine`, and benchmark return series supplied in payload context.
3. **Quantitative Metric Taxonomy**:
   - `RISK-001`: Sharpe Ratio
   - `RISK-002`: Sortino Ratio
   - `RISK-003`: Annualized Volatility
   - `RISK-004`: Maximum Drawdown
   - `RISK-005`: Portfolio Beta
   - `RISK-006`: Benchmark Correlation
   - `RISK-007`: Tracking Error
4. **Benchmark Model Architecture**: Decoupled benchmark index model handling Indian and US equity benchmarks (`Nifty 50`, `Sensex`, `Nifty 500`, `Nasdaq 100`, `S&P 500`).
