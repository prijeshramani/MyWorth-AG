# 📐 PERFORMANCE_CALCULATION_RULES.md — Calculation Rules & Algorithms

**System Name**: Family Wealth OS  
**Phase**: Sprint 4 (Performance Engine - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Annualization Rules

1. **Short-Term Holdings ($d \le 365$ days)**: Returns are presented as **Absolute Return** (not annualized) to prevent extreme distortion (e.g. 5% gain in 5 days annualizing to over 3,000%).
2. **Long-Term Holdings ($d > 365$ days)**: Returns are presented as **CAGR** or **Annualized XIRR**.

---

## 2. Multi-Currency Performance Rollup

When aggregating performance across holdings/accounts in different currencies:

1. **Cash Flow Conversion**: Convert each historical cash flow $C_i$ on date $t_i$ to the reporting currency using the FX conversion rate active on date $t_i$:
   $$C_{i, \text{reporting}} = C_{i, \text{native}} \times R_{\text{FX}}(t_i)$$
2. **Terminal Value Conversion**: Convert current valuation $V_{\text{ending}}$ using the current FX rate $R_{\text{FX}}(t_N)$.
3. **Execute Solver**: Execute Newton-Raphson XIRR on converted reporting currency cash flows to ensure accurate investor currency return measurement.

---

## 3. Solver Failure & Fallback Policy

If Newton-Raphson fails to converge within 100 iterations (e.g. non-standard cash flows or extreme multiples):
1. Log an `EngineWarning` (`XIRR_NEWTON_RAPHSON_NON_CONVERGENCE`).
2. Trigger Bisection Search root-finding solver bounded between $-99.99\%$ and $+1,000\%$.
3. If bisection also fails, set `xirrPercent: 0` and emit `XIRR_CALCULATION_FAILED` warning.
