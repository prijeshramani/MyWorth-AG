# 📊 INSIGHT_SCORING_MODEL.md — Insight Scoring & Ranking Model Specification

**System Name**: Family Wealth OS  
**Phase**: Phase 6D  
**Date**: July 28, 2026  
**Status**: APPROVED INSIGHT SCORING SPECIFICATION  

---

## 1. Multi-Dimensional Ranking Algorithm

Every recommendation is assigned an Overall Rank Score ($S_{\text{Rank}}$):

$$S_{\text{Rank}} = 0.35 \times S_{\text{Impact}} + 0.30 \times S_{\text{Priority}} + 0.20 \times S_{\text{Urgency}} + 0.15 \times S_{\text{Confidence}}$$

| Dimension | Weight | Normalization / Formula |
| :--- | :--- | :--- |
| **Financial Impact ($S_{\text{Impact}}$)** | 35% | Logarithmic normalization: $\min(100, \log_{10}(\text{Impact}) \times 16.6)$ |
| **Priority ($S_{\text{Priority}}$)** | 30% | Critical = 100, High = 80, Medium = 60, Low = 40 |
| **Urgency ($S_{\text{Urgency}}$)** | 20% | Immediate = 100, High = 80, Medium = 60, Low = 40 |
| **Confidence ($S_{\text{Confidence}}$)** | 15% | Rule evaluation confidence percentage (0-100%) |
