# 📊 GOAL_HEALTH_SCORE.md — Goal Health Scoring Model Specification

**System Name**: Family Wealth OS  
**Phase**: Phase 6C  
**Date**: July 28, 2026  
**Status**: APPROVED GOAL HEALTH SCORE MODEL  

---

## 1. Goal Health Score Formula ($S_{\text{Goal}}$)

$$S_{\text{Goal}} = 0.40 C_{\text{Coverage}} + 0.30 P_{\text{Probability}} + 0.20 S_{\text{StepUp}} + 0.10 A_{\text{Allocation}}$$

| Sub-Metric | Weight | Max Points | Evaluation Criteria |
| :--- | :--- | :--- | :--- |
| **Corpus Coverage ($C$)** | 40% | 40 | Ratio of Projected Corpus to Target Amount |
| **Probability of Success ($P$)**| 30% | 30 | Monte-Carlo style variance assessment |
| **SIP Step-Up Ratio ($S$)** | 20% | 20 | Annual step-up adherence |
| **Asset Allocation ($A$)** | 10% | 10 | Equity vs Debt allocation fit to time horizon |
