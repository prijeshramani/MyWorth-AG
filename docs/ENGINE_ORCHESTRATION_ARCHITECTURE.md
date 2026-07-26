# 🔄 ENGINE_ORCHESTRATION_ARCHITECTURE.md — Engine Pipeline & Orchestration

**System Name**: Family Wealth OS  
**Phase**: Architecture v2 Review  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Multi-Engine Pipeline Execution Pipeline

```mermaid
sequenceDiagram
    autonumber
    participant App as PortfolioApplicationService
    participant Reg as EngineRegistry
    participant TE as TransactionEngine
    participant VE as ValuationEngine
    participant NWE as NetWorthEngine
    participant PE as PerformanceEngine
    participant PAE as PortfolioAnalyticsEngine
    participant RE as RiskEngine

    App->>Reg: getEngine('TRANSACTION_ENGINE')
    Reg-->>App: transactionEngine
    App->>TE: execute(TransactionContext)
    TE-->>App: HoldingSummaries

    App->>Reg: getEngine('VALUATION_ENGINE')
    Reg-->>App: valuationEngine
    App->>VE: execute(ValuationContext)
    VE-->>App: ValuationResults

    App->>Reg: getEngine('NET_WORTH_ENGINE')
    Reg-->>App: netWorthEngine
    App->>NWE: execute(NetWorthContext)
    NWE-->>App: NetWorthSnapshot

    App->>Reg: getEngine('PERFORMANCE_ENGINE')
    Reg-->>App: performanceEngine
    App->>PE: execute(PerformanceContext)
    PE-->>App: PerformanceSnapshot

    App->>Reg: getEngine('PORTFOLIO_ANALYTICS_ENGINE')
    Reg-->>App: portfolioAnalyticsEngine
    App->>PAE: execute(AnalyticsContext)
    PAE-->>App: PortfolioAnalyticsSnapshot

    App->>Reg: getEngine('RISK_ENGINE')
    Reg-->>App: riskEngine
    App->>RE: execute(RiskContext)
    RE-->>App: RiskSnapshot
```

---

## 2. Pipeline Error Propagation & Fallback Policy

1. **Transaction Engine Failure**: Fails entire pipeline execution (`CRITICAL`).
2. **Valuation Engine Warning**: Continues execution; flags stale price warning in `CalculationManifest`.
3. **Risk Solver Failure**: Falls back to Bisection Search solver; sets `quality: ESTIMATED`.
