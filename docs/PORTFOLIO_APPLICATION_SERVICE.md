# 🏢 PORTFOLIO_APPLICATION_SERVICE.md — Portfolio Application Service Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 6A (Application Service Layer - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Responsibilities & Pipeline Workflow

`PortfolioApplicationService` is the primary application service responsible for producing consolidated family wealth views by coordinating repositories, market data providers, and financial calculation engines.

```
+-----------------------------------------------------------------------------------+
|                     PORTFOLIO APPLICATION SERVICE WORKFLOW                        |
|                                                                                   |
|  1. RESOLVE DOMAIN BOUNDARY (Family -> Member -> Entity -> Account -> Holdings)  |
|  2. FETCH MARKET QUOTES & FX RATES (Market Data Providers / ProviderCache)        |
|  3. EXECUTE TRANSACTION ENGINE (Track FIFO cost basis & unit positions)          |
|  4. EXECUTE VALUATION ENGINE (Evaluate market values across 14 asset classes)    |
|  5. EXECUTE NET WORTH ENGINE (Consolidate portfolio & build 4-level tree)         |
|  6. EXECUTE PERFORMANCE ENGINE (Solve Newton-Raphson XIRR & CAGR returns)         |
|  7. EXECUTE PORTFOLIO ANALYTICS ENGINE (Decompose 5D allocations & HHI health)    |
|  8. EXECUTE RISK ENGINE (Solve Sharpe, Sortino, Volatility, Drawdown & Beta)      |
|  9. COORDINATE SNAPSHOT PERSISTENCE (Persist snapshot envelope via Coordinator)  |
| 10. MAP RESPONSE DTOs (Transform internal snapshots into API-ready DTOs)        |
+-----------------------------------------------------------------------------------+
```

---

## 2. Transaction Boundary & Audit Trail Propagation

- **Read Operations**: Executed within read-only isolation boundaries; repository queries fetch active (non-soft-deleted) entities.
- **Audit Propagation**: Aggregates engine `auditTrail` arrays and combines them into a master execution log attached to `PortfolioSummaryResponseDTO`.
