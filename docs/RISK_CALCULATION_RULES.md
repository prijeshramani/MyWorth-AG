# 🧮 RISK_CALCULATION_RULES.md — Risk Formulas & Algorithms

**System Name**: Family Wealth OS  
**Phase**: Sprint 5B (Risk Intelligence Engine - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Risk Metric Formulas & Algorithms

### A. RISK-001: Sharpe Ratio
$$\text{Sharpe Ratio} = \begin{cases} \frac{R_p - R_f}{\sigma_p} & \text{if } \sigma_p > 0 \\ 0 & \text{otherwise} \end{cases}$$
Where $R_p$ is the annualized portfolio return, $R_f$ is the risk-free rate (default 6.5%), and $\sigma_p$ is annualized portfolio volatility.

### B. RISK-002: Sortino Ratio
$$\text{Sortino Ratio} = \begin{cases} \frac{R_p - R_f}{\sigma_d} & \text{if } \sigma_d > 0 \\ 0 & \text{otherwise} \end{cases}$$
Where $\sigma_d$ is the **downside deviation** considering only negative return periods:
$$\sigma_d = \sqrt{ \frac{1}{N} \sum_{i=1}^{N} \min(0, R_{p, i} - R_f)^2 } \times \sqrt{252}$$

### C. RISK-003: Annualized Volatility
$$\sigma_p = \sqrt{ \frac{1}{N-1} \sum_{i=1}^{N} (R_{p, i} - \bar{R}_p)^2 } \times \sqrt{252}$$

### D. RISK-004: Maximum Drawdown
$$\text{Drawdown}_t = \frac{\text{Peak}_t - V_t}{\text{Peak}_t} \quad \left(\text{where } \text{Peak}_t = \max_{k \le t} V_k\right)$$
$$\text{MaxDrawdown} = \max_{t} (\text{Drawdown}_t) \times 100$$

### E. RISK-005: Portfolio Beta
$$\beta_p = \begin{cases} \frac{\text{Cov}(R_p, R_m)}{\text{Var}(R_m)} & \text{if } \text{Var}(R_m) > 0 \\ 1.0 & \text{otherwise} \end{cases}$$

### F. RISK-006: Benchmark Correlation
$$\rho_{p, m} = \frac{\text{Cov}(R_p, R_m)}{\sigma_p \cdot \sigma_m}$$

### G. RISK-007: Tracking Error
$$\text{Tracking Error} = \sqrt{ \frac{1}{N-1} \sum_{i=1}^{N} \big((R_{p, i} - R_{m, i}) - (\bar{R}_p - \bar{R}_m)\big)^2 } \times \sqrt{252}$$
