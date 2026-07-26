# 🔄 PORTFOLIO_ANALYTICS_SEQUENCE_DIAGRAMS.md — Sequence Diagrams

**System Name**: Family Wealth OS  
**Phase**: Sprint 5A (Portfolio Analytics Engine - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Sequence 1: Portfolio Analytics Execution Flow

```mermaid
sequenceDiagram
    autonumber
    participant App as AnalyticsService
    participant VE as ValuationEngine
    participant NWE as NetWorthEngine
    participant PAE as PortfolioAnalyticsEngine

    App->>VE: evaluateHoldings(holdings)
    VE-->>App: ValuationResult[]
    App->>NWE: execute(EngineContext<NetWorthInputPayload>)
    NWE-->>App: NetWorthSnapshot
    App->>PAE: execute(EngineContext<PortfolioAnalyticsInputPayload>)
    PAE->>PAE: Decompose 5-dimensional allocations (Asset, Sector, Market, Currency, Geo)
    PAE->>PAE: Compute HHI Index & DiversificationScore
    PAE->>PAE: Evaluate Concentration Risk & Cash Liquidity Ratios
    PAE->>PAE: Generate CalculationManifest & Checksum
    PAE-->>App: EngineResult<PortfolioAnalyticsSnapshot>
```
