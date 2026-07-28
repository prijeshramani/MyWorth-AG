# Phase 6C Implementation Plan — Financial Goals, Retirement & Life Planning

**Goal**: Build an enterprise-grade **Financial Planning Intelligence Layer & Unified Projection Engine** for FamilyWealthOS. Powers Goal Planning (Education, House, Vehicle, Vacation, Emergency Fund), Retirement Planning, Cash Flow Forecasting, Goal Health Scoring ($S_{\text{Goal}}$), Scenario Comparison, and AI-ready Planning Recommendations without modifying existing calculation engines.

---

## Architecture Rules & Principles
1. **Single Projection Engine**: All goal planners (Retirement, Education, House, Vehicle, Emergency Fund, Cashflow) MUST consume the unified `ProjectionEngineService`. Zero duplicate math logic.
2. **Zero Engine Modifications**: Core calculation engines (Investments, Portfolio, XIRR, Net Worth, Protection, Tax, Knowledge Graph, Estate) remain 100% UNTOUCHED.
3. **Strict Multi-Tenancy & Explainability**: Enforce `family_id` filtering on all planning tables. Provide clear mathematical explanations for every recommendation.
4. **AI & Advisor Readiness**: Expose clean, reusable query services (`getGoalHealth`, `projectNetWorth`, `estimateRetirementReadiness`, `estimateEducationFunding`, `generatePlanningRecommendations`).

---

## Proposed Changes

### 1. Database Migration `009_financial_planning.ts`
#### [NEW] [009_financial_planning.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db/migrations/009_financial_planning.ts)
Create SQLite tables:
- `financial_goals`: `id`, `family_id`, `goal_type` ('RETIREMENT' | 'EDUCATION' | 'HOUSE' | 'VEHICLE' | 'VACATION' | 'EMERGENCY'), `title`, `target_amount`, `target_year`, `current_allocated_amount`, `monthly_sip_amount`, `expected_return_pct`, `inflation_pct`, `priority` ('HIGH' | 'MEDIUM' | 'LOW'), `status`.
- `goal_allocations`: `id`, `goal_id`, `holding_id`, `allocated_pct`, `created_at`.
- `projection_assumptions`: `id`, `family_id`, `default_inflation_pct`, `equity_return_pct`, `debt_return_pct`, `sip_step_up_pct`, `retirement_age`, `life_expectancy`.
- `projection_scenarios`: `id`, `family_id`, `scenario_name`, `inflation_override_pct`, `return_override_pct`, `step_up_override_pct`, `is_baseline`.
- `retirement_profiles`: `id`, `family_id`, `current_age`, `retirement_age`, `life_expectancy`, `monthly_expenses_current`, `expected_post_retirement_expense_ratio`, `corpus_required`, `corpus_projected`, `readiness_pct`.
- `cashflow_profiles`: `id`, `family_id`, `monthly_inflow`, `monthly_outflow`, `monthly_surplus`, `annual_growth_pct`.
- `goal_recommendations`: `id`, `family_id`, `goal_id`, `recommendation_type`, `title`, `description`, `action_impact_json`, `status`.
- `projection_results`: Cached simulation results.

#### [MODIFY] [db.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db.ts)
- Register `migration009` in migration runner array.

---

### 2. Backend Repositories, Core Engine & Services
#### [NEW] [SQLiteGoalRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteGoalRepository.ts)
- Data access repository for financial goals, allocations, assumptions, scenarios, retirement profiles, and recommendations.

#### [NEW] [SQLiteProjectionRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteProjectionRepository.ts)
- Data access repository for projection caching and scenario comparisons.

#### [NEW] [ProjectionEngineService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/ProjectionEngineService.ts)
- Unified compound interest & cash-flow simulation engine supporting inflation, return rates, monthly SIP step-up, one-time lump-sum injections, and withdrawal modeling.

#### [NEW] [GoalPlanningService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/GoalPlanningService.ts)
- Serves Goal Planner (Education, House, Vehicle, Vacation, Emergency Fund), computes Goal Health Score ($S_{\text{Goal}}$), and probability of achievement.

#### [NEW] [RetirementPlanningService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/RetirementPlanningService.ts)
- Calculates inflation-adjusted retirement corpus requirements, retirement readiness percentage, and monthly SIP gap.

#### [NEW] [CashflowProjectionService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/CashflowProjectionService.ts)
- Projects 10-year / 30-year cash flows, monthly surpluses, and liquidity reserves.

#### [NEW] [PlanningRecommendationService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/PlanningRecommendationService.ts)
- Explainable AI-ready recommendation engine generating actionable step-up, rebalancing, and goal prioritization suggestions.

#### [NEW] [PlanningController.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/controllers/PlanningController.ts) & [planningRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/planningRoutes.ts)
- REST endpoints mounted at `/api/v1/planning`:
  - `GET /api/v1/planning/dashboard`
  - `GET /api/v1/planning/goals`
  - `GET /api/v1/planning/retirement`
  - `GET /api/v1/planning/projections`
  - `POST /api/v1/planning/goal`
  - `POST /api/v1/planning/scenario`

---

### 3. Backend Unit Tests
#### [MODIFY] [runTests.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/runTests.ts)
- Add Section 26 tests: ProjectionEngine math (SIP step-up, inflation), Goal creation, Retirement readiness calculation, Cashflow forecasting, and REST APIs. (Target: **186+ tests passing**).

---

### 4. Frontend Financial Planning Module
#### [NEW] [planningService.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/planningService.ts) & [usePlanningDashboard.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/hooks/usePlanningDashboard.ts)
- Typed API client and TanStack Query hooks.

#### [NEW] [PlanningDashboard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/planning/PlanningDashboard.tsx)
- Complete Financial Planning Dashboard featuring:
  - Goal Health Score ($S_{\text{Goal}}$ Risk Gauge & KPI Cards)
  - Goal Manager Panel (Retirement, Education, House, Vehicle, Emergency Fund)
  - Retirement Readiness Calculator (Corpus required vs projected, monthly SIP gap)
  - Interactive Cashflow Forecast Chart & Projection Engine Controls
  - Scenario Comparison Tool (Baseline vs Optimistic vs Conservative)
  - Actionable Planning Recommendations Feed

#### [MODIFY] [NavigationDrawer.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/NavigationDrawer.tsx) & [App.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/App.tsx)
- Add **Financial Planning & Goals** to navigation drawer menu tabs and route active tab in `App.tsx`.

---

## Verification Plan

### Automated Build & Unit Tests
- Backend Unit Tests: `npm test` in `backend` (Target: 186+ tests passing).
- Frontend Production Build: `npm run build` in `frontend` (`tsc -b && vite build` completes in ~20s with 0 errors).

### Manual UX Verification
- Navigation to `/planning` tab.
- Creating a new goal (e.g. Child Education or Retirement).
- Adjusting inflation & SIP step-up in Scenario Comparison.
- Checking Retirement Readiness percentage.
