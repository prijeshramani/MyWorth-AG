# Phase6C_Master_Implementation_Prompt.md

# FamilyWealthOS -- Phase 6C

## Financial Goals, Retirement & Life Planning

**Mission:** Build the reusable Financial Planning Intelligence layer
that powers future AI recommendations.

## Context

Reuse all completed modules: - Investments - Portfolio - Net Worth -
Protection - Indian Tax Engine - Product Integration - Knowledge Graph -
Estate Planning

## Architecture Rules

-   Do not modify existing engines.
-   Reuse Knowledge Graph.
-   All projections use one Projection Engine.
-   Enforce family_id isolation.
-   Explain every recommendation.

## Core Projection Engine

Support: - Inflation - Expected returns - SIP step-up - One-time
investments - Cash-flow forecasting - Withdrawal modelling - Goal
probability - Scenario comparison

## Modules

-   Goal Planner
-   Retirement Planner
-   Education Planner
-   House Planner
-   Vehicle Planner
-   Vacation Planner
-   Emergency Fund Planner
-   Cashflow Forecast
-   Goal Health Score
-   Planning Recommendation Engine

## Database

Migration: 009_financial_planning.ts

Tables: - financial_goals - goal_allocations - projection_assumptions -
projection_scenarios - retirement_profiles - cashflow_profiles -
goal_recommendations - projection_results

## Backend

Create: - ProjectionEngineService - GoalPlanningService -
RetirementPlanningService - EducationPlanningService -
CashflowProjectionService - PlanningRecommendationService -
GoalRepository - ProjectionRepository - PlanningController

## APIs

GET /api/v1/planning/dashboard GET /api/v1/planning/goals GET
/api/v1/planning/retirement GET /api/v1/planning/projections POST
/api/v1/planning/goal POST /api/v1/planning/scenario

## Frontend

Create: - Planning Dashboard - Goal Manager - Retirement Planner -
Education Planner - Cashflow Forecast - Scenario Comparison - Goal
Timeline - Goal Health Dashboard

Reuse existing UI.

## AI Ready Services

-   getGoalHealth()
-   projectNetWorth()
-   estimateRetirementReadiness()
-   estimateEducationFunding()
-   generatePlanningRecommendations()

## Testing

Target: - 186+ backend tests - Existing 177 tests remain passing -
Projection engine tests - Scenario tests - Recommendation tests

## Documentation

Generate: - FINANCIAL_PLANNING_ARCHITECTURE.md -
PROJECTION_ENGINE_GUIDE.md - RETIREMENT_PLANNER_GUIDE.md -
GOAL_PLANNING_GUIDE.md - CASHFLOW_FORECAST_ENGINE.md -
GOAL_HEALTH_SCORE.md - Sprint_6C_Retrospective.md - AI_CHANGELOG.md -
SESSION_CONTEXT.md - Phase 6C - Implementation Summary.md

## Definition of Done

-   Projection Engine complete
-   Goal Planner complete
-   Retirement Planner complete
-   Education Planner complete
-   Cashflow Forecast complete
-   Goal Health Score operational
-   Planning Recommendation Engine operational
-   Existing engines untouched
-   Existing tests pass
-   New tests pass
-   Clean production build

## Final Instruction

Every planner must consume the Projection Engine. Never duplicate
projection logic. This phase becomes the financial intelligence
foundation for the future AI Wealth Advisor.
