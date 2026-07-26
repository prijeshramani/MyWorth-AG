# 🏛 NET_WORTH_ENGINE_ARCHITECTURE.md — Net Worth Engine Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 3 (Final ARB Review Integration)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE (ARB ENHANCED)  

---

## 1. Executive Summary & Role in Architecture v1.0

The `NetWorthEngine` is the **first high-level Business Engine** of Family Wealth OS. It is a stateless, pure computational engine responsible for aggregating holding positions, valuation results (`ValuationResult`), and currency conversion rates to compute real-time and historical net worth snapshots across the 4-level domain hierarchy (**Family -> Member -> Entity -> Account**).

```
+-----------------------------------------------------------------------------------+
|                              UPSTREAM DATA PROVIDERS                              |
|   [Holdings List]       [ValuationResult Envelopes]      [FX Rate Snapshots]      |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                                 NET WORTH ENGINE                                  |
|   • Stateless Pure Calculation Engine (backend/src/engines/NetWorthEngine.ts)     |
|   • Shared CalculationManifest Generator & Checksum Verification                 |
|   • Multi-Level Aggregation (Account ──► Entity ──► Member ──► Family)            |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                           ENHANCED NET WORTH SNAPSHOT                             |
|   • PortfolioSummary & AssetAllocation Breakdown                                  |
|   • CalculationManifest & Snapshot Lineage (Valuation / FX / Provider Versions)   |
|   • CurrencyAggregation & Full Step-by-Step Audit Trail                           |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Directives & ARB Enhancements

1. **Zero Database or Provider Coupling**: The `NetWorthEngine` accepts a pure `EngineContext<NetWorthInputPayload>` and returns an `EngineResult<NetWorthSnapshot>`. It does NOT query SQLite repositories or call APIs directly.
2. **Pure Valuation Consumption**: Consumes pre-calculated `ValuationResult` objects from the `ValuationEngine` (Sprint 1E).
3. **Calculation Manifest Integration**: Every engine execution generates a shared `CalculationManifest` providing cryptographic checksums, execution timing, and component versions for auditability.
4. **Snapshot Lineage & Versioning**: Net worth snapshots maintain explicit lineage tracing back to the input valuation snapshot ID, FX rate snapshot ID, and provider schema versions.
5. **Future Time Model**: Differentiates between:
   - `effectiveDate`: Date transaction took economic effect.
   - `valuationDate`: Target market valuation date.
   - `calculationDate`: Execution timestamp when calculation ran.
6. **Engine & Business Rule Metadata**: Exposes both `engineVersion` (code binary version) and `businessRuleVersion` (tax/accounting rule version).
7. **Future Extensions Readiness**: Designed to support downstream extensions (`DiversificationScore`, `ConcentrationRisk`, `CurrencyExposure`, `LiquidityScore`) without structural refactoring.
