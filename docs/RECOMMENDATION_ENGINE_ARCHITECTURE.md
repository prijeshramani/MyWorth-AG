# 💡 RECOMMENDATION_ENGINE_ARCHITECTURE.md — Recommendation Engine Architecture

**System Name**: Family Wealth OS  
**Phase**: Phase 6D (Intelligent Recommendation & Insight Engine)  
**Date**: July 28, 2026  
**Status**: APPROVED RECOMMENDATION ENGINE ARCHITECTURE  

---

## 1. Overview & Architecture Blueprint

Phase 6D implements the **Intelligent Recommendation & Insight Engine**, the explainable intelligence hub of FamilyWealthOS that orchestrates all 7 domain calculation engines (Investment, Tax, Estate, Financial Planning, Protection, Security, Knowledge Graph).

```
+-----------------------------------------------------------------------------------+
|               INTELLIGENT RECOMMENDATION & INSIGHT ENGINE LAYER                   |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
                [ Configurable Rule Engine (recommendation_rules) ]
            Investment | Tax | Estate | Protection | Planning Rules & Thresholds
                                          │
                                          ▼
             [ Recommendation Orchestrator (RecommendationOrchestrator) ]
          Invokes TaxEngine, EstateHealthService, ProtectionEngine, GoalService
                                          │
       ┌─────────────────────┬────────────┴──────────┬───────────────────┐
       ▼                     ▼                       ▼                   ▼
[ Priority Queue ]    [ Recommendation Journeys] [ Explainability Proof ] [ AI Context ]
  • Critical/High      • Tax Optimisation         • Why Generated         • Structured JSON
  • Financial Impact   • Wealth Shield            • Source Engines        • Follow-Up Qs
  • Accept / Dismiss   • Multi-Step Progress      • Supporting Proof      • Next Actions
       │                     │                       │                   │
       └─────────────────────┴───────────────────────┴───────────────────┘
                                          │
                                          ▼
                 [ Insight Ranking Engine (InsightScoringService) ]
        RankScore = 0.35 * Impact + 0.30 * Priority + 0.20 * Urgency + 0.15 * Confidence
```

---

## 2. Key Architecture Rules Enforced

1. **Orchestration First**: Consumes existing domain services (`TaxCalculationEngine`, `EstateHealthService`, `ProtectionEngineService`, `GoalPlanningService`, `KnowledgeGraphQueryService`). Zero duplicate math.
2. **Configurable Rule Engine**: Zero hardcoded recommendation logic. Configurable `recommendation_rules` with category, thresholds, priorities, and versioning.
3. **100% Explainability**: Every recommendation stores: Why Generated, Source Engines, Inputs Used, Rule Triggered, Financial Impact (₹), Urgency, and Next Action.
4. **Recommendation Journeys**: Groups related recommendations into multi-step guided plans (`TAX_OPTIMISATION`, `WEALTH_PROTECTION`, `RETIREMENT_READINESS`).
5. **AI Advisor Readiness**: Exposes structured API context helpers (`getTopRecommendations`, `explainRecommendation`, `getRecommendationHistory`) for Phase 7 AI Advisor consumption.
