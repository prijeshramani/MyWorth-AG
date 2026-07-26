# 📐 NET_WORTH_CALCULATION_RULES.md — Calculation Rules & Algorithms

**System Name**: Family Wealth OS  
**Phase**: Sprint 3 (Net Worth Engine - Architecture Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Multi-Currency Conversion Algorithm

For each `ValuationResult` item in `context.data.valuationResults`:

1. **Identify Native Currency**: $C_{\text{native}} = \text{result.currency} \text{ (default 'INR')}$.
2. **Lookup FX Conversion Rate**: Look up rate $R_{\text{FX}}$ for pair $C_{\text{native}}\_\text{ReportingCurrency}$ in `context.data.fxRates`. If native currency equals reporting currency, $R_{\text{FX}} = 1.0$.
3. **Convert Monetary Values**:
   $$\text{Converted Market Value} = \text{FinancialMath.roundMoney}(\text{result.marketValue} \times R_{\text{FX}})$$
   $$\text{Converted Cost Basis} = \text{FinancialMath.roundMoney}(\text{result.costBasis} \times R_{\text{FX}})$$
   $$\text{Converted Unrealized Gain} = \text{Converted Market Value} - \text{Converted Cost Basis}$$

---

## 2. Portfolio Aggregation Formulas

1. **Total Portfolio Market Value**:
   $$V_{\text{total}} = \sum_{i=1}^{N} \text{Converted Market Value}_i$$

2. **Total Portfolio Cost Basis**:
   $$B_{\text{total}} = \sum_{i=1}^{N} \text{Converted Cost Basis}_i$$

3. **Total Unrealized Gain & Percentage**:
   $$G_{\text{total}} = V_{\text{total}} - B_{\text{total}}$$
   $$P_{\text{gain}} = \begin{cases} \text{FinancialMath.roundPercent}\left(\frac{G_{\text{total}}}{B_{\text{total}}} \times 100\right) & \text{if } B_{\text{total}} > 0 \\ 0 & \text{otherwise} \end{cases}$$

---

## 3. Asset Allocation Percentage Formula

For each distinct asset type $T \in \{\text{STOCK}, \text{MUTUAL\_FUND}, \text{ETF}, \text{FD}, \text{EPF}, \text{GOLD}, \dots\}$:
$$\text{Asset Type Value}_T = \sum_{i \in T} \text{Converted Market Value}_i$$
$$\text{Percentage of Total}_T = \begin{cases} \text{FinancialMath.roundPercent}\left(\frac{\text{Asset Type Value}_T}{V_{\text{total}}} \times 100\right) & \text{if } V_{\text{total}} > 0 \\ 0 & \text{otherwise} \end{cases}$$

---

## 4. Daily Change Evaluation

If `context.data.previousSnapshot` is provided:
$$\Delta_{\text{abs}} = \text{FinancialMath.roundMoney}(V_{\text{total}} - V_{\text{previous}})$$
$$\Delta_{\text{percent}} = \begin{cases} \text{FinancialMath.roundPercent}\left(\frac{\Delta_{\text{abs}}}{V_{\text{previous}}} \times 100\right) & \text{if } V_{\text{previous}} > 0 \\ 0 & \text{otherwise} \end{cases}$$
