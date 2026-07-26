# 📐 PORTFOLIO_ANALYTICS_RULES.md — Analytics Algorithms & Calculation Rules

**System Name**: Family Wealth OS  
**Phase**: Sprint 5A (Final ARB Integration)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE (ARB ENHANCED)  

---

## 1. Analytics Registry & Rule Taxonomy

| Analytics ID | Name | Mathematical Method | Scope |
| :--- | :--- | :--- | :--- |
| **ANL-001** | Asset Allocation | Value-Weighted Sum per Asset Type | Portfolio Decomposition |
| **ANL-002** | Sector Allocation | Value-Weighted Sum per Industry Sector | Portfolio Decomposition |
| **ANL-003** | Diversification (HHI) | Normalized Herfindahl-Hirschman Index | Portfolio Concentration |
| **ANL-004** | Portfolio Health | Weighted Composite Scoring (0–100) | Overall Health Rating |
| **ANL-005** | Cash Allocation | Liquid Cash / Total Portfolio Ratio | Liquidity Buffer Assessment |

---

## 2. Herfindahl-Hirschman Index (HHI) & Diversification Score (ANL-003)

The Herfindahl-Hirschman Index (HHI) measures portfolio concentration across $N$ holdings:

$$\text{HHI} = \sum_{i=1}^{N} s_i^2 \quad \left(\text{where } s_i = \frac{V_i}{V_{\text{total}}} \in [0, 1]\right)$$

- **Perfect Diversification ($N \to \infty$)**: $HHI \to 0$.
- **Single Holding ($N = 1$)**: $HHI = 1.0$.

### Normalized Diversification Score Formula (0 to 100)
$$\text{DiversificationScore} = \text{FinancialMath.roundMoney}\big( (1 - \text{HHI}) \times 100 \big)$$

---

## 3. Concentration Risk Criteria

$$\text{Top1Ratio} = \frac{V_{\text{max}}}{V_{\text{total}}} \times 100, \quad \text{Top3Ratio} = \frac{\sum_{i=1}^{3} V_i}{V_{\text{total}}} \times 100$$

- **Concentration Warning Trigger**: Triggered if $\text{Top1Ratio} > 25\%$, $\text{Top3Ratio} > 50\%$, or $\text{TopSectorRatio} > 40\%$.

---

## 4. Cash Liquidity Assessment Rules (ANL-005)

$$\text{CashPercentage} = \frac{V_{\text{liquid\_cash}}}{V_{\text{total}}} \times 100$$

- `LOW_LIQUIDITY`: Cash $< 5\%$ of portfolio (insufficient emergency buffer).
- `OPTIMAL`: Cash between $5\%$ and $20\%$.
- `EXCESS_CASH`: Cash $> 20\%$ (cash drag risk).
