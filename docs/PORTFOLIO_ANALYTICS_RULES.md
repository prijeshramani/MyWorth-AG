# 📐 PORTFOLIO_ANALYTICS_RULES.md — Analytics Algorithms & Calculation Rules

**System Name**: Family Wealth OS  
**Phase**: Sprint 5A (Portfolio Analytics Engine - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Herfindahl-Hirschman Index (HHI) & Diversification Score

The Herfindahl-Hirschman Index (HHI) measures portfolio concentration across $N$ holdings:

$$\text{HHI} = \sum_{i=1}^{N} s_i^2 \quad \left(\text{where } s_i = \frac{V_i}{V_{\text{total}}} \in [0, 1]\right)$$

- **Perfect Diversification ($N \to \infty$)**: $HHI \to 0$.
- **Single Holding ($N = 1$)**: $HHI = 1.0$.

### Normalized Diversification Score Formula (0 to 100)
$$\text{DiversificationScore} = \text{FinancialMath.roundMoney}\big( (1 - \text{HHI}) \times 100 \big)$$

| Score Range | Rating | Concentration Level |
| :--- | :--- | :--- |
| **80 – 100** | `EXCELLENT` | Well diversified across holdings and sectors |
| **60 – 79** | `GOOD` | Moderate diversification |
| **40 – 59** | `MODERATE` | Mild concentration in top holdings |
| **20 – 39** | `POOR` | High concentration risk |
| **0 – 19** | `HIGHLY_CONCENTRATED` | Severe single-asset/sector vulnerability |

---

## 2. Concentration Risk Criteria

$$\text{Top1Ratio} = \frac{V_{\text{max}}}{V_{\text{total}}} \times 100$$
$$\text{Top3Ratio} = \frac{\sum_{i=1}^{3} V_i}{V_{\text{total}}} \times 100$$
$$\text{Top5Ratio} = \frac{\sum_{i=1}^{5} V_i}{V_{\text{total}}} \times 100$$

- **Concentration Warning Trigger**: Triggered if $\text{Top1Ratio} > 25\%$, $\text{Top3Ratio} > 50\%$, or $\text{TopSectorRatio} > 40\%$.

---

## 3. Cash Liquidity Assessment Rules

$$\text{CashPercentage} = \frac{V_{\text{liquid\_cash}}}{V_{\text{total}}} \times 100$$

- `LOW_LIQUIDITY`: Cash $< 5\%$ of portfolio (insufficient emergency buffer).
- `OPTIMAL`: Cash between $5\%$ and $20\%$.
- `EXCESS_CASH`: Cash $> 20\%$ (cash drag risk).
