# 🎯 FINANCIAL_PLANNING_ARCHITECTURE.md — Financial Planning Architecture

**System Name**: Family Wealth OS  
**Phase**: Phase 6C (Financial Goals, Retirement & Life Planning)  
**Date**: July 28, 2026  
**Status**: APPROVED FINANCIAL PLANNING ARCHITECTURE  

---

## 1. Overview & Architecture Blueprint

Phase 6C implements a unified, reusable **Financial Planning Intelligence Layer & Unified Projection Engine** that powers future AI wealth recommendations.

```
+-----------------------------------------------------------------------------------+
|                  FINANCIAL PLANNING INTELLIGENCE LAYER                            |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
                   [ Central Assumptions Registry (projection_assumptions) ]
               Inflation: 6% | Equity: 12% | Debt: 7% | Edu Inflation: 10%
                                          │
                                          ▼
                   [ Unified Projection Engine (ProjectionEngineService) ]
                       Compound Interest + Annual SIP Step-up Math
                                          │
       ┌─────────────────────┬────────────┴──────────┬───────────────────┐
       ▼                     ▼                       ▼                   ▼
[ Goal Planner ]    [ Retirement Planner ]  [ Cashflow Forecast ]  [ Recommendations ]
  • Education          • Inflation Corpus      • 10-Yr Surplus       • Step-Up SIP
  • House & Vehicle    • 4% SWR Rule           • 30-Yr Surplus       • Emergency Fund
  • Emergency Fund     • Readiness Score       • Growth & Inflation  • Priority & Impact
       │                     │                       │                   │
       └─────────────────────┴───────────────────────┴───────────────────┘
                                          │
                                          ▼
                     [ Goal Health Engine: S_Goal ]
              0.40 C_Coverage + 0.30 P_Probability + 0.20 S_StepUp + 0.10 A_Allocation
```

---

## 2. Key Architecture Rules Enforced

1. **Unified Projection Engine**: All planners (Retirement, Education, House, Vehicle, Emergency, Cashflow) consume `ProjectionEngineService.ts`. Zero duplicate math.
2. **Central Assumption Registry**: Shared assumptions for inflation (6%), equity (12%), debt (7%), education inflation (10%), safe withdrawal rate (4%), and annual SIP step-up (10%).
3. **Zero Calculation Engine Modifications**: Core calculation engines (Investments, Portfolio, XIRR, Net Worth, Protection, Tax, Knowledge Graph, Estate) remain 100% UNTOUCHED.
4. **Explainable AI Readiness**: Exposes step-by-step intermediate calculations, inputs used, formulas, confidence scores, and action impact JSON.
