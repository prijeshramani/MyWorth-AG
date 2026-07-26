# 📸 SNAPSHOT_COORDINATION_MODEL.md — Snapshot Alignment & Lineage

**System Name**: Family Wealth OS  
**Phase**: Architecture v2 Review  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Executive Summary & Coordination Role

The `SnapshotCoordinator` manages the persistent lifecycle and cross-engine lineage alignment of financial snapshots (`ValuationSnapshot`, `NetWorthSnapshot`, `PerformanceSnapshot`, `PortfolioAnalyticsSnapshot`, `RiskSnapshot`).

```
+-----------------------------------------------------------------------------------+
|                            CONSOLIDATED PORTFOLIO ENVELOPE                        |
|   • Snapshot ID: portfolio_snap_20260726_9901                                    |
|   • Valuation Snapshot ID: val_snap_102                                          |
|   • Net Worth Snapshot ID: nw_snap_8812                                           |
|   • Performance Snapshot ID: perf_snap_505                                        |
|   • Cryptographic Master Checksum: a8f910b2...                                    |
+-----------------------------------------------------------------------------------+
```

---

## 2. Lineage Alignment Model

Every consolidated snapshot references the exact immutable IDs of upstream calculation outputs to guarantee 100% auditability and historical calculation replayability.
