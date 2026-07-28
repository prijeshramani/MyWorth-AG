# 📊 ESTATE_HEALTH_SCORE.md — Estate Health Scoring Model Guide

**System Name**: Family Wealth OS  
**Phase**: Phase 6B  
**Date**: July 27, 2026  
**Status**: APPROVED HEALTH SCORE GUIDE  

---

## 1. Configurable Formula

The Estate Health Score $S_{\text{Estate}}$ evaluates estate readiness:

$$S_{\text{Estate}} = 0.25 W_{\text{Will}} + 0.25 N_{\text{Nominee}} + 0.20 T_{\text{Trust}} + 0.15 D_{\text{Doc}} + 0.15 L_{\text{Liquidity}}$$

| Sub-Metric | Weight | Max Points | Evaluation Criteria |
| :--- | :--- | :--- | :--- |
| **Will Score ($W$)** | 25% | 25 | Draft (10), Active (20), Registered (25) |
| **Nominee Score ($N$)**| 25% | 25 | Percentage of holdings with assigned nominees |
| **Trust Score ($T$)** | 20% | 20 | Presence of Family/Private Trust structures |
| **Document Score ($D$)**| 15% | 15 | Identity & deed upload completeness in Vault |
| **Liquidity Score ($L$)**| 15% | 15 | Ratio of liquid cash/FDs to total net estate value |
