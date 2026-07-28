# 📈 PROJECTION_ENGINE_GUIDE.md — Projection Engine Guide

**System Name**: Family Wealth OS  
**Phase**: Phase 6C  
**Date**: July 28, 2026  
**Status**: APPROVED PROJECTION ENGINE GUIDE  

---

## 1. Mathematical Formulas & Step-Up Compound Interest

The `ProjectionEngineService` provides unified projection math across all planners:

$$FV = \text{LumpSum} \times (1 + r)^n + \sum_{y=1}^{n} \left[ \text{SIP} \times (1 + s)^{y-1} \times \sum_{m=1}^{12} \left(1 + \frac{r}{12}\right)^{13-m} \right]$$

Where:
- $r$ = Expected annual return rate (e.g. 12% = 0.12)
- $s$ = Annual SIP step-up percentage (e.g. 10% = 0.10)
- $n$ = Investment duration in years

---

## 2. Inflation Adjustment

Future value cost is computed as:

$$\text{Cost}_{\text{Future}} = \text{Cost}_{\text{Present}} \times (1 + i)^n$$

Where $i$ is the target inflation rate (e.g. 6% general inflation, 10% education inflation).
