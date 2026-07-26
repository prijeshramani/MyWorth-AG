# 📜 NET_WORTH_AUDIT_MODEL.md — Audit Trail & Quality Model

**System Name**: Family Wealth OS  
**Phase**: Sprint 3 (Final ARB Review Integration)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE (ARB ENHANCED)  

---

## 1. Shared Calculation Manifest Audit Model

Every `NetWorthEngine` execution generates a `CalculationManifest` attached directly to the `NetWorthSnapshot`.

```typescript
export interface CalculationManifest {
  engine: string;                 // 'NET_WORTH_ENGINE'
  engineVersion: string;          // '1.0.0'
  businessRuleVersion: string;    // '2026.1'
  algorithmVersion: string;       // 'ALGO_V1_LINEAR'
  calculationVersion: string;     // 'CALC_V1'
  valuationSnapshotId?: string;   // Lineage pointer to valuation snapshot
  fxSnapshotId?: string;          // Lineage pointer to FX rate snapshot
  executionTimeMs: number;
  processedHoldings: number;      // Total holdings processed
  processedValuations: number;    // Total valuation results aggregated
  warningCount: number;
  checksum: string;               // Deterministic SHA-256 calculation payload hash
}
```

---

## 2. Sample Auditable Output Log

```text
[NetWorthEngine v1.0.0 | Rules: 2026.1] Execution started at 2026-07-26T21:10:00.000Z
[Context] Correlation ID: nw_calc_9981 | Scope: FAMILY (Sharma Family)
[Manifest] Calculation ID: snap_8812 | Checksum: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
[Lineage] Valuation Snapshot: val_snap_102 | FX Snapshot: fx_snap_404
[Input] Received 14 ValuationResult envelopes and 2 FX rate pairs
[CurrencyConversion] Converted 12 INR items at rate 1.00 -> ₹45,00,000.00
[CurrencyConversion] Converted 2 USD items at rate 83.50 -> $10,000 ($8,35,000.00 INR)
[Aggregation] Total Market Value: ₹53,35,000.00 | Total Cost Basis: ₹40,00,000.00 | Total Gain: ₹13,35,000.00 (33.38%)
[AssetAllocation] STOCK: 45.50% | MUTUAL_FUND: 25.00% | FD: 15.00% | EPF: 14.50%
[Hierarchy] Built 4-level tree with SUM aggregation (Family -> Member -> Entity -> Account)
[Summary] Net worth snapshot generated in 1.4ms
```
