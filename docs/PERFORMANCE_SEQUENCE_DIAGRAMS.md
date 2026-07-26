# 🔄 PERFORMANCE_SEQUENCE_DIAGRAMS.md — Sequence Diagrams

**System Name**: Family Wealth OS  
**Phase**: Sprint 4 (Performance Engine - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Sequence 1: XIRR & Performance Calculation Flow

```mermaid
sequenceDiagram
    autonumber
    participant App as PortfolioAnalyticsService
    participant TE as TransactionEngine
    participant VE as ValuationEngine
    participant PE as PerformanceEngine

    App->>TE: getHoldingTransactions(holdingId)
    TE-->>App: RawTransactionInput[] / CashFlowEvents
    App->>VE: evaluateHoldings([holding])
    VE-->>App: ValuationResult
    App->>PE: execute(EngineContext<PerformanceInputPayload>)
    PE->>PE: Sort cash flows & check time horizon
    PE->>PE: Solve Newton-Raphson XIRR iterative root
    PE->>PE: Compute TWR subperiods & CAGR
    PE->>PE: Generate CalculationManifest & Checksum
    PE-->>App: EngineResult<PerformanceSnapshot>
```

---

## 2. Sequence 2: Multi-Currency Family Performance Rollup

```mermaid
sequenceDiagram
    autonumber
    participant App as PerformanceService
    participant PE as PerformanceEngine

    App->>PE: execute(EngineContext for Family Portfolio)
    PE->>PE: Convert historical cash flows at historical FX rates
    PE->>PE: Solve portfolio-level XIRR & TWR
    PE->>PE: Build 4-level performance tree (Family -> Member -> Entity -> Account)
    PE-->>App: Family-Level PerformanceSnapshot Node
```
