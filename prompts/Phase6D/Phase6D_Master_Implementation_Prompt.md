# Phase6D_Master_Implementation_Prompt.md

# FamilyWealthOS -- Phase 6D

## Intelligent Recommendation & Insight Engine

> **Mission** Build the explainable intelligence layer that consumes
> existing engines (Investment, Tax, Estate, Financial Planning,
> Protection and Knowledge Graph) and produces actionable
> recommendations. This phase does **not** implement conversational AI.

------------------------------------------------------------------------

# Context

Completed:

-   Investments & Portfolio
-   Net Worth
-   Protection
-   Indian Tax Intelligence
-   Product Integration
-   Knowledge Graph
-   Estate Planning
-   Financial Planning

Reuse every completed engine.

------------------------------------------------------------------------

# Architecture Principles

-   No duplicate calculations.
-   Recommendation Engine orchestrates existing engines.
-   Never bypass domain services.
-   Every recommendation must be explainable.
-   Enforce family_id isolation.
-   Respect RBAC and audit logging.

------------------------------------------------------------------------

# Core Components

## Recommendation Orchestrator

Consumes:

-   Investment Engine
-   Tax Engine
-   Estate Engine
-   Projection Engine
-   Protection Engine
-   Knowledge Graph

Aggregates outputs into unified insights.

------------------------------------------------------------------------

## Recommendation Rule Engine

Never hardcode recommendation logic.

Create configurable rules:

-   recommendation_rules
-   recommendation_categories
-   recommendation_priorities
-   recommendation_templates
-   recommendation_actions
-   recommendation_thresholds

Support: - Versioning - Effective dates - Enable/disable - Rule metadata

------------------------------------------------------------------------

## Recommendation Types

Implement:

### Investment

-   Portfolio concentration
-   Asset allocation drift
-   Idle cash
-   Rebalancing
-   SIP increase/decrease

### Tax

-   80C optimisation
-   NPS opportunity
-   Tax-loss harvesting
-   Regime comparison reminder

### Estate

-   Missing nominee
-   Missing will
-   Missing executor
-   Estate review reminder

### Protection

-   Underinsured
-   Expiring policy
-   Missing critical cover

### Planning

-   Retirement gap
-   Goal funding gap
-   Emergency fund shortfall
-   Cashflow stress

------------------------------------------------------------------------

## Insight Scoring

Each recommendation stores:

-   Priority
-   Confidence
-   Impact
-   Risk
-   Urgency
-   Estimated financial benefit
-   Source engines
-   Supporting evidence

------------------------------------------------------------------------

## Recommendation Timeline

Track:

-   Generated
-   Viewed
-   Accepted
-   Dismissed
-   Completed
-   Expired

------------------------------------------------------------------------

## Notification Readiness

Publish domain events:

-   RecommendationGenerated
-   RecommendationAccepted
-   RecommendationDismissed
-   RecommendationCompleted

No notification implementation yet.

------------------------------------------------------------------------

# Database

Migration: 010_recommendation_engine.ts

Tables:

-   recommendations
-   recommendation_rules
-   recommendation_actions
-   recommendation_history
-   recommendation_feedback
-   recommendation_scores

------------------------------------------------------------------------

# Backend

Create:

-   RecommendationRepository
-   RecommendationRuleRepository
-   RecommendationEngineService
-   RecommendationOrchestrator
-   InsightScoringService
-   RecommendationController

------------------------------------------------------------------------

# APIs

GET /api/v1/recommendations GET /api/v1/recommendations/dashboard GET
/api/v1/recommendations/{id} POST /api/v1/recommendations/refresh POST
/api/v1/recommendations/{id}/accept POST
/api/v1/recommendations/{id}/dismiss POST
/api/v1/recommendations/{id}/complete

------------------------------------------------------------------------

# Frontend

Create:

-   Recommendations Dashboard
-   Insight Cards
-   Priority Queue
-   Recommendation Detail
-   Recommendation History
-   Recommendation Filters

Reuse existing design system.

------------------------------------------------------------------------

# Explainability

Every recommendation must display:

-   Why generated
-   Source engines
-   Inputs used
-   Rule triggered
-   Expected benefit
-   Next action

No opaque scoring.

------------------------------------------------------------------------

# AI Readiness

Expose reusable methods:

-   getTopRecommendations()
-   getRecommendationContext()
-   explainRecommendation()
-   getRecommendationHistory()
-   getOpenRisks()

These APIs will be consumed by Phase 7 AI Advisor.

------------------------------------------------------------------------

# Testing

Target:

-   196+ backend tests
-   Existing 188 tests remain green
-   Rule engine tests
-   Orchestrator tests
-   Explainability tests
-   API tests

------------------------------------------------------------------------

# Documentation

Generate:

-   RECOMMENDATION_ENGINE_ARCHITECTURE.md
-   RECOMMENDATION_RULE_ENGINE.md
-   INSIGHT_SCORING_MODEL.md
-   RECOMMENDATION_EXPLAINABILITY.md
-   Sprint_6D_Retrospective.md
-   AI_CHANGELOG.md
-   SESSION_CONTEXT.md
-   Phase 6D - Implementation Summary.md

------------------------------------------------------------------------

# Definition of Done

-   Recommendation Orchestrator complete
-   Rule Engine complete
-   Explainable recommendations
-   Unified recommendation dashboard
-   Existing engines unchanged
-   Existing tests pass
-   196+ tests passing
-   Clean production build

------------------------------------------------------------------------

# Final Instruction

The Recommendation Engine is the intelligence hub of FamilyWealthOS. It
must **consume** existing engines rather than replacing them. Phase 7 AI
Wealth Advisor will converse with users using this engine's structured,
explainable outputs instead of generating financial advice
independently.
