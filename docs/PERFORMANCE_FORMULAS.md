# 🧮 PERFORMANCE_FORMULAS.md — Mathematical Return Formulas

**System Name**: Family Wealth OS  
**Phase**: Sprint 4 (Final ARB Integration)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Formula Taxonomy & Identifiers

| Formula ID | Name | Mathematical Method | Scope |
| :--- | :--- | :--- | :--- |
| **PERF-001** | Absolute Return | Simple Gain / Net Invested Capital | All Holdings & Portfolios |
| **PERF-002** | Compound Annual Growth Rate (CAGR) | Geometric Annualization | Holdings > 365 Days |
| **PERF-003** | Money-Weighted Return (XIRR) | Newton-Raphson Root Solver | Irregular Cash Flow Series |
| **PERF-004** | Time-Weighted Return (TWR) | Linked Subperiod Returns | Portfolios with External Capital Flows |
| **PERF-005** | Money-Weighted Return (MWR) | Internal Rate of Return (IRR) | Cash Flow Stream Evaluation |

---

## 2. Detailed Mathematical Definitions

### A. PERF-001: Absolute Return
$$\text{Total Gain/Loss } G_{\text{total}} = V_{\text{ending}} - V_{\text{beginning}} + C_{\text{net}}$$
$$\text{Absolute Return } R_{\text{abs}} = \begin{cases} \frac{G_{\text{total}}}{V_{\text{beginning}} + |C_{\text{inflows}}|} \times 100 & \text{if } (V_{\text{beginning}} + |C_{\text{inflows}}|) > 0 \\ 0 & \text{otherwise} \end{cases}$$

### B. PERF-002: Compound Annual Growth Rate (CAGR)
$$\text{CAGR} = \left[ \left( \frac{V_{\text{ending}}}{V_{\text{beginning}}} \right)^{\frac{365}{d}} - 1 \right] \times 100 \quad (\text{for } d > 365 \text{ days})$$

### C. PERF-003: Money-Weighted Return (XIRR) — Newton-Raphson Solver
$$f(r) = \sum_{i=1}^{N} \frac{C_i}{(1 + r)^{\frac{t_i - t_0}{365}}} + \frac{V_{\text{ending}}}{(1 + r)^{\frac{t_N - t_0}{365}}} = 0$$

Newton-Raphson Iteration:
$$r_{k+1} = r_k - \frac{f(r_k)}{f'(r_k)}$$
$$f'(r) = -\sum_{i=1}^{N} \frac{t_i - t_0}{365} \cdot \frac{C_i}{(1 + r)^{\frac{t_i - t_0}{365} + 1}} - \frac{t_N - t_0}{365} \cdot \frac{V_{\text{ending}}}{(1 + r)^{\frac{t_N - t_0}{365} + 1}}$$

### D. PERF-004: Time-Weighted Return (TWR)
$$R_{\text{subperiod}, j} = \frac{V_{\text{end}, j} - (V_{\text{start}, j} + C_j)}{V_{\text{start}, j} + C_j}$$
$$\text{TWR} = \left[ \prod_{j=1}^{M} (1 + R_{\text{subperiod}, j}) - 1 \right] \times 100$$
