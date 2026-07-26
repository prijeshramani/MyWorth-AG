# 🏛 PERFORMANCE_ENGINE_ARCHITECTURE.md — Performance Engine Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 4 (Performance Engine - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Executive Summary & Role in Architecture v1.0

The `PerformanceEngine` is the **second high-level Business Engine** of Family Wealth OS. It is a stateless, pure calculation engine responsible for measuring investment performance, time-weighted returns (TWR), money-weighted returns (XIRR), compound annual growth rates (CAGR), and absolute returns across all 4 domain scopes (**Holding -> Account -> Entity -> Family**).

```
+-----------------------------------------------------------------------------------+
|                              UPSTREAM ENGINE OUTPUTS                              |
|   [Transaction Engine]          [Valuation Engine]          [NetWorth Engine]     |
|   (Cash Flows / Cost Basis)    (ValuationResult Envelopes)  (NetWorthSnapshot)    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                                PERFORMANCE ENGINE                                 |
|   • Stateless Pure Calculation Engine (backend/src/engines/PerformanceEngine.ts)  |
|   • Newton-Raphson XIRR Solver & Multi-Subperiod TWR Chain Engine                 |
|   • Multi-Level Performance Rollup (Holding ──► Account ──► Entity ──► Family)    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                               PERFORMANCE SNAPSHOT                                |
|   • PerformanceSummary (Absolute, Realized, Unrealized, CAGR, XIRR, TWR, MWR)     |
|   • Hierarchical Performance Tree & Multi-Period Returns                          |
|   • Shared CalculationManifest & Full Audit Lineage                               |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Directives

1. **Zero Database or Provider Coupling**: The `PerformanceEngine` accepts an `EngineContext<PerformanceInputPayload>` and returns an `EngineResult<PerformanceSnapshot>`. It does NOT query SQLite repositories or external market APIs directly.
2. **Pure Upstream Consumption**: Consumes cash flows from `TransactionEngine`, valuation envelopes from `ValuationEngine`, and historical portfolio snapshots from `NetWorthEngine`.
3. **Dual Return Methodology**:
   - **Money-Weighted Return (XIRR / MWR)**: Reflects investor return considering timing and magnitude of cash inflows/outflows. Solved using Newton-Raphson iterative root finding.
   - **Time-Weighted Return (TWR)**: Reflects pure asset manager performance by eliminating the impact of external capital flows across valuation subperiods.
4. **Hierarchical Rollup**: Computes performance metrics dynamically at Holding, Account, Entity, and Family member levels.
5. **Future Analytics Extension Readiness**: Architected with extension points for downstream analytics (Sharpe Ratio, Alpha/Beta, Drawdown, Benchmark comparison) without requiring structural changes.
