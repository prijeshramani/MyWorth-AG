# 📈 CAPITAL_GAINS_ENGINE.md — Capital Gains Engine Specification

**System Name**: Family Wealth OS  
**Phase**: Phase 6A  
**Date**: July 27, 2026  
**Status**: APPROVED ENGINE SPECIFICATION  

---

## 1. Holding Period & Tax Rate Matrix (Finance Act 2024 Amendments)

| Asset Class | STCG Holding Period | LTCG Threshold | STCG Tax Rate | LTCG Tax Rate | Exemption Threshold |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Equity & Equity MFs** | `< 12 Months` | `>= 12 Months` | `20.0%` | `12.5%` | ₹1.25 Lakhs per FY |
| **Real Estate Property**| `< 24 Months` | `>= 24 Months` | Applicable Slab | `12.5%` | Section 54 / 54EC Rollback |
| **Physical Gold & SGB** | `< 24 Months` | `>= 24 Months` | Applicable Slab | `12.5%` | Indexation Removed |
| **Debt Funds & Bonds** | `< 36 Months` | `>= 36 Months` | Applicable Slab | `20.0%` | Indexation |
