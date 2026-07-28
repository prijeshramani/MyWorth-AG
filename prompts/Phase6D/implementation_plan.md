# Phase 6D Implementation Plan — Intelligent Recommendation & Insight Engine

**Goal**: Build an enterprise-grade **Intelligent Recommendation & Insight Engine** for FamilyWealthOS. Orchestrates and consumes all 7 domain engines (Investment, Tax, Estate, Financial Planning, Protection, Security, Knowledge Graph) to generate explainable, prioritized, actionable wealth insights without modifying existing calculation engines.

---

## Architecture Rules & Principles
1. **Orchestration First**: The Recommendation Orchestrator consumes existing domain services (`TaxCalculationEngine`, `EstateHealthService`, `ProtectionEngineService`, `GoalPlanningService`, `KnowledgeGraphQueryService`). Zero duplicate calculation math.
2. **Configurable Rule Engine**: Zero hardcoded recommendation logic. Configurable `recommendation_rules` with category, thresholds, priorities, and versioning.
3. **100% Explainability**: Every recommendation stores and displays: Why Generated, Source Engines, Inputs Used, Rule Triggered, Expected Financial Benefit, and Next Action.
4. **Strict Multi-Tenancy & Audit**: Enforce `family_id` filtering and log recommendation status events (`GENERATED`, `VIEWED`, `ACCEPTED`, `DISMISSED`, `COMPLETED`).
5. **AI Advisor Readiness**: Expose clean API interfaces (`getTopRecommendations`, `getRecommendationContext`, `explainRecommendation`, `getRecommendationHistory`, `getOpenRisks`) for Phase 7 AI Advisor consumption.

---

## Proposed Changes

### 1. Database Migration `010_recommendation_engine.ts`
#### [NEW] [010_recommendation_engine.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db/migrations/010_recommendation_engine.ts)
Create SQLite tables:
- `recommendation_rules`: `id`, `rule_code`, `category` ('INVESTMENT' | 'TAX' | 'ESTATE' | 'PROTECTION' | 'PLANNING'), `title_template`, `description_template`, `threshold_config_json`, `priority_default`, `is_active`, `version`, `created_at`.
- `recommendations`: `id`, `family_id`, `rule_id`, `rule_code`, `category`, `title`, `description`, `priority` ('CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'), `confidence_pct`, `financial_impact_amount`, `urgency`, `status` ('ACTIVE' | 'ACCEPTED' | 'DISMISSED' | 'COMPLETED' | 'EXPIRED'), `source_engines_json`, `supporting_evidence_json`, `next_action_json`, `created_at`.
- `recommendation_actions`: `id`, `recommendation_id`, `action_type`, `action_label`, `action_payload_json`, `created_at`.
- `recommendation_history`: `id`, `recommendation_id`, `family_id`, `status_from`, `status_to`, `changed_by`, `reason`, `created_at`.
- `recommendation_scores`: `id`, `recommendation_id`, `priority_score`, `impact_score`, `urgency_score`, `overall_rank_score`, `created_at`.

#### [MODIFY] [db.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db.ts)
- Register `migration010` in migration runner array. Seed baseline rules.

---

### 2. Backend Repositories, Orchestrator & Engine Services
#### [NEW] [SQLiteRecommendationRuleRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteRecommendationRuleRepository.ts)
- Data access repository for configurable recommendation rules and baseline seeds.

#### [NEW] [SQLiteRecommendationRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteRecommendationRepository.ts)
- Data access repository for generated recommendations, actions, history audit logs, and scores.

#### [NEW] [InsightScoringService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/InsightScoringService.ts)
- Multi-dimensional ranking engine evaluating Priority, Financial Impact, Confidence, Urgency, and Overall Rank.

#### [NEW] [RecommendationOrchestrator.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/RecommendationOrchestrator.ts)
- Domain orchestrator invoking Investment, Tax, Estate, Protection, Planning, and Knowledge Graph services to evaluate rules.

#### [NEW] [RecommendationEngineService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/RecommendationEngineService.ts)
- Core service managing recommendation refresh, status transitions (`accept`, `dismiss`, `complete`), AI readiness context helpers, and history.

#### [NEW] [RecommendationController.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/controllers/RecommendationController.ts) & [recommendationRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/recommendationRoutes.ts)
- REST endpoints mounted at `/api/v1/recommendations`:
  - `GET /api/v1/recommendations`
  - `GET /api/v1/recommendations/dashboard`
  - `GET /api/v1/recommendations/:id`
  - `POST /api/v1/recommendations/refresh`
  - `POST /api/v1/recommendations/:id/accept`
  - `POST /api/v1/recommendations/:id/dismiss`
  - `POST /api/v1/recommendations/:id/complete`

---

### 3. Backend Unit Tests
#### [MODIFY] [runTests.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/runTests.ts)
- Add Section 27 tests: Rule Seeding, Orchestrator execution across 5 categories (Investment, Tax, Estate, Protection, Planning), Explainability metadata, Status transitions (`accept`/`dismiss`), and REST APIs. (Target: **196+ tests passing**).

---

### 4. Frontend Recommendation Module
#### [NEW] [recommendationService.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/recommendationService.ts) & [useRecommendationsDashboard.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/hooks/useRecommendationsDashboard.ts)
- Typed API client and TanStack Query hooks.

#### [NEW] [RecommendationsDashboard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/recommendations/RecommendationsDashboard.tsx)
- Complete Intelligent Recommendations Dashboard featuring:
  - Open Wealth Risks & Financial Impact KPI Cards
  - Priority Queue (Critical, High, Medium, Low filters)
  - Category Filters (Investment, Tax, Estate, Protection, Planning)
  - Explainability Drawer ("Why Generated", Source Engines, Expected Impact)
  - Action Controls (Accept, Dismiss, Mark Complete)
  - Recommendation History & Audit Trail

#### [MODIFY] [NavigationDrawer.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/NavigationDrawer.tsx) & [App.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/App.tsx)
- Add **AI Insights & Recommendations** to navigation drawer menu tabs and route active tab in `App.tsx`.

---

## Verification Plan

### Automated Build & Unit Tests
- Backend Unit Tests: `npm test` in `backend` (Target: 196+ tests passing).
- Frontend Production Build: `npm run build` in `frontend` (`tsc -b && vite build` completes in ~20s with 0 errors).

### Manual UX Verification
- Navigation to `/recommendations` tab.
- Filter recommendations by category (e.g. Tax or Estate).
- Open Explainability Drawer to view source engines and mathematical proof.
- Accept or dismiss a recommendation and verify status update in audit history.
