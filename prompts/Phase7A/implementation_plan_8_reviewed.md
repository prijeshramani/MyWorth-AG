# Phase 7A Implementation Plan --- AI Context, Memory & Evidence Layer

**Goal**: Build an enterprise-grade **AI Context, Memory & Evidence
Layer** for FamilyWealthOS. Synthesizes structured, explainable context,
multi-session memory, and mathematical evidence from all 8 domain
engines (Investment, Tax, Estate, Financial Planning, Protection,
Security, Recommendation Engine, Knowledge Graph) for future Phase 7B AI
Wealth Advisor consumption without raw database queries.

------------------------------------------------------------------------

## Architecture Rules & Principles

1.  **No Raw Queries**: AI services never query raw tables directly.
    They consume Domain Context Providers (`InvestmentContextProvider`,
    `TaxContextProvider`, `EstateContextProvider`,
    `PlanningContextProvider`, `RecommendationContextProvider`,
    `FamilyContextProvider`, `DocumentContextProvider`).
2.  **Every Context Element Has Evidence**: Every summary or metric
    includes attached source proof (`ai_evidence` table linking source
    engines, correlation IDs, raw calculation inputs/outputs).
3.  **Multi-Session Memory & Safety**: Persist short-term session state
    and long-term user preferences/decisions in `ai_memory`. Enforce
    guardrails in `AISafetyService`.
4.  **Strict Multi-Tenancy & RBAC**: Enforce `family_id` filtering and
    user permission validation on all AI context payloads.

------------------------------------------------------------------------

## Proposed Changes

### 1. Database Migration `011_ai_context.ts`

#### \[NEW\] [011_ai_context.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db/migrations/011_ai_context.ts)

Create SQLite tables: - `ai_sessions`: `id`, `family_id`, `user_id`,
`session_token`, `status`, `last_active_at`, `created_at`. -
`ai_memory`: `id`, `family_id`, `memory_type` ('PREFERENCE' \|
'DECISION' \| 'FACT' \| 'SNOOZE' \| 'CONVERSATION_SUMMARY'), `key`,
`value_json`, `confidence_score`, `expires_at`, `created_at`. -
`ai_context_cache`: `id`, `family_id`, `context_type`, `payload_json`,
`version`, `updated_at`. - `ai_evidence`: `id`, `family_id`,
`evidence_code`, `source_engine`, `proof_data_json`, `created_at`. -
`ai_prompt_templates`: `id`, `template_code`, `system_prompt_template`,
`user_prompt_template`, `version`, `created_at`. -
`ai_conversation_state`: `id`, `session_id`, `family_id`,
`current_intent`, `active_entity_type`, `active_entity_id`,
`context_summary`, `created_at`.

#### \[MODIFY\] [db.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db.ts)

-   Register `migration011` in migration runner array. Seed baseline
    prompt templates.

------------------------------------------------------------------------

### 2. Backend Repositories & AI Services

#### \[NEW\] [SQLiteAIContextRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteAIContextRepository.ts)

-   Data access repository for AI sessions, memory records, context
    caches, evidence items, and prompt templates.

#### \[NEW\] [EvidenceService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/EvidenceService.ts)

-   Generates and stores immutable proof items linking domain engine
    outputs with mathematical justifications.

#### \[NEW\] [AIMemoryService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/AIMemoryService.ts)

-   Manages short-term conversation state and long-term user
    preferences, decisions, and facts.

#### \[NEW\] [AISafetyService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/AISafetyService.ts)

-   Enforces guardrails (PII redaction, financial disclaimer injection,
    out-of-bounds query rejection).

#### \[NEW\] [PromptBuilderService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/PromptBuilderService.ts)

-   Compiles structured system and user prompts using configurable
    templates and context payloads.

#### \[NEW\] [AIContextService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/AIContextService.ts)

-   Aggregates domain contexts from Investment, Tax, Estate, Protection,
    Planning, Recommendation, and Knowledge Graph engines into unified
    AI readiness payloads.

#### \[NEW\] [AIContextController.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/controllers/AIContextController.ts) & [aiContextRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/aiContextRoutes.ts)

-   REST endpoints mounted at `/api/v1/ai`:
    -   `GET /api/v1/ai/context`
    -   `GET /api/v1/ai/evidence/:id`
    -   `GET /api/v1/ai/memory`
    -   `POST /api/v1/ai/context/refresh`
    -   `POST /api/v1/ai/memory`

------------------------------------------------------------------------

### 3. Backend Unit Tests

#### \[MODIFY\] [runTests.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/runTests.ts)

-   Add Section 28 tests: AI Context aggregation across 7 domain
    engines, Memory persistence, Evidence proof verification, Prompt
    template compilation, Safety guardrails, and REST APIs. (Target:
    **205+ tests passing**).

------------------------------------------------------------------------

### 4. Frontend AI Readiness Module

#### \[NEW\] [aiContextService.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/aiContextService.ts) & [useAIContextDashboard.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/hooks/useAIContextDashboard.ts)

-   Typed API client and TanStack Query hooks.

#### \[NEW\] [AIReadinessDashboard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ai/AIReadinessDashboard.tsx)

-   Complete AI Readiness & Context Inspection Dashboard featuring:
    -   Context Health & Engine Connectivity KPI Cards
    -   Domain Context Inspector (Investment, Tax, Estate, Protection,
        Planning, Recommendations)
    -   Evidence & Calculation Proof Viewer
    -   Memory & Preferences Timeline
    -   Prompt Builder & Safety Preview (Developer Console integration)

#### \[MODIFY\] [NavigationDrawer.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/NavigationDrawer.tsx) & [App.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/App.tsx)

-   Add **AI Readiness & Context** to navigation drawer menu tabs and
    route active tab in `App.tsx`.

------------------------------------------------------------------------

## Verification Plan

### Automated Build & Unit Tests

-   Backend Unit Tests: `npm test` in `backend` (Target: 205+ tests
    passing).
-   Frontend Production Build: `npm run build` in `frontend`
    (`tsc -b && vite build` completes in \~20s with 0 errors).

### Manual UX Verification

-   Navigation to `/ai-context` tab.
-   Inspect domain context payloads (Tax, Estate, Portfolio,
    Recommendations).
-   Open Evidence Viewer to inspect calculation proofs.
-   Add long-term memory preference and verify persistence.

------------------------------------------------------------------------

# ChatGPT Architecture Enhancements (Mandatory Before Implementation)

**Overall Rating: 10/10 -- Approved**

## Mandatory additions

### 1. AI Capability Registry

Create a registry describing AI capabilities (Portfolio Analysis, Tax
Explanation, Retirement Coaching, Estate Review, Recommendation
Explanation, Goal Planning). Each capability must declare required
context providers, evidence providers, permissions, prompt template,
follow-up actions and safety policy.

### 2. Evidence Provenance

Every evidence item must store: - Correlation ID - Source Engine
Version - Rule Version - Timestamp - Calculation Hash

### 3. Context Freshness

Expose: - Generated timestamp - Cache status - Freshness indicator
Automatically refresh stale context.

### 4. Memory Governance

Support: - Permanent memory - Session memory - Expiring memory - User
removable memory

### 5. Prompt Versioning

Support version history, rollback and future A/B testing.

### 6. Explainability Bundle

Attach supporting evidence, related recommendations, related goals,
related estate entities and related documents.

### 7. AI Context Health Score

Measure: - Context completeness - Evidence completeness - Memory
quality - Freshness - Permission validation

### 8. Domain Events

Publish: - AIContextBuilt - EvidenceGenerated - MemoryCreated -
MemoryExpired - PromptCompiled

### 9. Additional Acceptance Criteria

-   AI never queries raw tables.
-   Capability Registry implemented.
-   All responses evidence-backed.
-   Memory governance available.
-   Existing 195 tests remain green.
-   Target 205+ tests achieved.
-   Clean production build.

**Recommendation:** Approved after incorporating these enhancements.
