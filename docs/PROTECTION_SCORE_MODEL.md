# 📊 PROTECTION_SCORE_MODEL.md — Protection Adequacy Scoring Model

**System Name**: Family Wealth OS  
**Phase**: Phase 5C  
**Date**: July 27, 2026  
**Status**: APPROVED SCORING MODEL  

---

## 1. Executive Scoring Formula

The **Protection Score** is a quantitative index rated from `0` to `100` evaluating family financial risk protection adequacy across 3 primary pillars:

$$\text{Protection Score} = w_1 \cdot S_{\text{Life}} + w_2 \cdot S_{\text{Health}} + w_3 \cdot S_{\text{Governance}}$$

Where weights are defined as:
- $w_1 = 0.50$ (Life Cover Adequacy Weight)
- $w_2 = 0.35$ (Health Cover Adequacy Weight)
- $w_3 = 0.15$ (Policy Governance & Nominee Compliance Weight)

---

## 2. Pillar Sub-Score Calculations

### A. Life Cover Sub-Score ($S_{\text{Life}}$)
- **Target Coverage**: $10 \times \text{Annual Family Income} + \text{Total Liabilities/Debts}$.
- **Formula**:
  $$S_{\text{Life}} = \min\left(100, \frac{\text{Total Active Life Sum Assured}}{\text{Target Life Coverage}} \times 100\right)$$

### B. Health Cover Sub-Score ($S_{\text{Health}}$)
- **Target Coverage**: $\min(\text{₹25,00,000}, 5 \times \text{Annual Household Medical Expenses})$.
- **Formula**:
  $$S_{\text{Health}} = \min\left(100, \frac{\text{Total Active Health Sum Assured}}{\text{Target Health Coverage}} \times 100\right)$$

### C. Governance Sub-Score ($S_{\text{Governance}}$)
- Evaluates 3 compliance checks:
  1. Nominee registered on 100% of policies (+50 pts).
  2. Zero lapsed policies in grace period (+30 pts).
  3. Digital policy bonds attached (+20 pts).

---

## 3. Rating Threshold Scale

| Protection Score | Rating Category | Visual Badge Color | Action Required |
| :--- | :--- | :--- | :--- |
| **`85.0 – 100.0`** | `OPTIMAL` | Emerald (`#10b981`) | Fully protected against financial shocks. |
| **`65.0 – 84.9`** | `MODERATE` | Sky Blue (`#0284c7`) | Adequate, minor health coverage gap. |
| **`45.0 – 64.9`** | `AT_RISK` | Amber (`#f59e0b`) | Severe life cover deficiency. |
| **`0.0 – 44.9`** | `CRITICAL_GAP` | Rose (`#f43f5e`) | High vulnerability; immediate cover needed. |
