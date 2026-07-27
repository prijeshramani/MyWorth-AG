# 📸 SNAPSHOT_ORCHESTRATION.md — Snapshot Lifecycle & Orchestration

**System Name**: Family Wealth OS  
**Phase**: Sprint 6A (Application Service Layer - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Snapshot Life Cycle Management

The `SnapshotCoordinator` service coordinates snapshot persistence, alignment, and retrieval across the 5 engine snapshot types:

1. **`ValuationSnapshot`**: Granular asset-level market values and pricing sources.
2. **`NetWorthSnapshot`**: Consolidated portfolio values and 4-level domain tree.
3. **`PerformanceSnapshot`**: Holding and portfolio return metrics (XIRR, CAGR, Absolute).
4. **`PortfolioAnalyticsSnapshot`**: Multi-dimensional allocations and HHI health scores.
5. **`RiskSnapshot`**: Quantitative risk metrics and benchmark comparisons.

---

## 2. Cross-Engine Snapshot Lineage Pointer Alignment

```typescript
export interface SnapshotLineageEnvelope {
  masterSnapshotId: string;
  valuationSnapshotId: string;
  netWorthSnapshotId: string;
  performanceSnapshotId: string;
  analyticsSnapshotId: string;
  riskSnapshotId: string;
  masterChecksum: string; // Combined SHA-256 calculation hash
  asOfDate: string;
  createdAt: string;
}
```
