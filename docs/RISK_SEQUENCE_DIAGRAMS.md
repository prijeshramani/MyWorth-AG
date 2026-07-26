# 🔄 RISK_SEQUENCE_DIAGRAMS.md — Sequence Diagrams

**System Name**: Family Wealth OS  
**Phase**: Sprint 5B (Risk Intelligence Engine - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Sequence 1: Quantitative Risk & Benchmark Comparison Flow

```mermaid
sequenceDiagram
    autonumber
    participant App as RiskAnalyticsService
    participant NWE as NetWorthEngine
    participant RE as RiskEngine

    App->>NWE: getHistoricalSnapshots(portfolioId)
    NWE-->>App: PortfolioTimePoint[]
    App->>RE: execute(EngineContext<RiskInputPayload>)
    RE->>RE: Calculate Volatility, Downside Dev, Max Drawdown
    RE->>RE: Solve Sharpe Ratio & Sortino Ratio
    RE->>RE: Match Benchmark Series (Nifty 50, S&P 500) & solve Beta/Correlation
    RE->>RE: Generate RiskRecommendations & CalculationManifest
    RE-->>App: EngineResult<RiskSnapshot>
```
