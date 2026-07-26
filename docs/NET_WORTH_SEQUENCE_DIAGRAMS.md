# 🔄 NET_WORTH_SEQUENCE_DIAGRAMS.md — Sequence Diagrams

**System Name**: Family Wealth OS  
**Phase**: Sprint 3 (Net Worth Engine - Architecture Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Sequence 1: Consolidated Family Net Worth Calculation

```mermaid
sequenceDiagram
    autonumber
    participant App as PortfolioService
    participant VE as ValuationEngine
    participant FX as FXConversionService
    participant NWE as NetWorthEngine

    App->>VE: evaluateHoldings(familyHoldings)
    VE-->>App: ValuationResult[]
    App->>FX: getLatestFXRates(['USD_INR', 'INR_INR'])
    FX-->>App: FXRateMap
    App->>NWE: execute(EngineContext<NetWorthInputPayload>)
    NWE->>NWE: Convert currencies & sum Market Values
    NWE->>NWE: Compute Asset Allocation & Gain/Loss
    NWE->>NWE: Build Hierarchical Family Tree
    NWE-->>App: EngineResult<NetWorthSnapshot>
```

---

## 2. Sequence 2: Multi-Currency Account Aggregation Flow

```mermaid
sequenceDiagram
    autonumber
    participant App as OwnershipService
    participant NWE as NetWorthEngine

    App->>NWE: execute(EngineContext for Account #101)
    NWE->>NWE: Filter ValuationResults matching Account #101
    NWE->>NWE: Aggregate Account Market Value & Cost Basis
    NWE-->>App: Account-Level NetWorthSnapshot Node
```
