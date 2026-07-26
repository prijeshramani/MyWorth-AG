# 🏛 CORPORATE_ACTION_REGISTRY.md — Corporate Action Registry Architecture

**System Name**: Family Wealth OS  
**Phase**: Sprint 2B (Architecture Enhancement)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. System Overview

The **Corporate Action Registry** provides a standardized representation for corporate events that impact security quantities, cost basis, or asset symbols without requiring manual user transactions.

```
+-----------------------------------------------------------------------------------+
|                           CORPORATE ACTION DATA PROVIDERS                         |
|  [NSE Corporate Announcements]  [Yahoo Corporate Actions]  [Manual Corporate Event]|
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                             CORPORATE ACTION REGISTRY                             |
|  • CorporateActionRecord (SPLIT, BONUS, DIVIDEND, RIGHTS_ISSUE, MERGER)            |
|  • Ex-Date & Record-Date Validation                                               |
|  • Adjustment Factor Calculator                                                   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                               CONSUMING ENGINES                                   |
|  • TransactionEngine (Sprint 1D)                                                  |
|  • ValuationEngine (Sprint 1E)                                                    |
+-----------------------------------------------------------------------------------+
```

---

## 2. Event Types & Definitions

```typescript
export type CorporateActionType = 
  | 'SPLIT'           // Stock split e.g., 2:1 ratio (doubles quantity, halves avg cost)
  | 'BONUS'           // Bonus issue e.g., 1:1 bonus (adds units without cost basis change)
  | 'DIVIDEND'        // Cash dividend per share (income transaction)
  | 'RIGHTS_ISSUE'    // Rights offer to purchase additional shares
  | 'MERGER'          // Company merger / stock swap (e.g. HDFC Ltd -> HDFC Bank)
  | 'SYMBOL_CHANGE';  // Ticker renames / ISIN updates

export interface CorporateActionRecord {
  id: string;
  assetId: number;
  isin?: string;
  actionType: CorporateActionType;
  exDate: string;           // YYYY-MM-DD
  recordDate?: string;      // YYYY-MM-DD
  ratio?: number;           // e.g. 2 for 2-for-1 split
  cashAmount?: number;      // e.g. ₹18.50 dividend per share
  targetAssetId?: number;   // For mergers / stock swaps
  source: string;           // Provider label
  status: 'PENDING' | 'APPLIED' | 'REJECTED';
}
```

---

## 3. Engine Readiness

The `TransactionEngine` (Sprint 1D) already possesses built-in handling for `SPLIT` and `BONUS` types. The `CorporateActionRegistry` will serve as the provider feeder pipeline when corporate actions are automated in future sprints.
