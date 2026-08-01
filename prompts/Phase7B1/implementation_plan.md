# Phase 7B.1 Implementation Plan – AI Wealth Advisor Core & Product Governance

Build the **AI Wealth Advisor Core** for FamilyWealthOS following strict architecture rules (AI consumes Context, Memory, Evidence & Recommendation layers only; no direct raw table queries or financial calculations). Establish the mandatory **AI Skill Registry**, permanent **Product Management Repository (`product/`)**, and permanent root-level **`ROADMAP.md`**.

## User Review Required

> [!IMPORTANT]
> - **Architecture Constraint**: The AI Wealth Advisor delegates all financial math, projections, tax computations, and graph queries to existing engines (`CapitalGainsCalculator`, `ProjectionEngine`, `RuleEngine`, `KnowledgeGraphRepository`).
> - **Product Management Repository**: Creates `product/` directory containing structured logs (`UX_BACKLOG.md`, `BETA_BUGS.md`, `FEATURE_REQUESTS.md`, `AI_BACKLOG.md`, `RELEASE_NOTES.md`, `KNOWN_LIMITATIONS.md`) and a permanent root-level `ROADMAP.md`.

## Open Questions

None. All requirements are explicitly detailed in `prompts/Phase7B1/Phase7B1_Master_Implementation_Prompt_Final_v2.md`.

---

## Proposed Changes

### Product Management & Governance Layer

#### [NEW] [ROADMAP.md](file:///c:/Users/prije/Downloads/MyWorth/ROADMAP.md)
- Root-level single source of truth for progress.
- Tracks Current Release, Completed Phases (Phases 1–7A), Active Phase (7B.1), Upcoming Roadmap, Deferred Features, Architectural Decision Records (ADRs for Graph, Rules, Projections, Recommendations, AI Context Layer, Skill Registry), Product Metrics (test count, build status, API health, beta readiness), and Change Governance rules.

#### [NEW] [product/UX_BACKLOG.md](file:///c:/Users/prije/Downloads/MyWorth/product/UX_BACKLOG.md)
#### [NEW] [product/BETA_BUGS.md](file:///c:/Users/prije/Downloads/MyWorth/product/BETA_BUGS.md)
#### [NEW] [product/FEATURE_REQUESTS.md](file:///c:/Users/prije/Downloads/MyWorth/product/FEATURE_REQUESTS.md)
#### [NEW] [product/AI_BACKLOG.md](file:///c:/Users/prije/Downloads/MyWorth/product/AI_BACKLOG.md)
#### [NEW] [product/RELEASE_NOTES.md](file:///c:/Users/prije/Downloads/MyWorth/product/RELEASE_NOTES.md)
#### [NEW] [product/KNOWN_LIMITATIONS.md](file:///c:/Users/prije/Downloads/MyWorth/product/KNOWN_LIMITATIONS.md)
- Complete Product Management Repository tracking all UX issues, bugs, feature requests, AI enhancements, release notes, and known limitations.

---

### AI Wealth Advisor Engine (Backend)

#### [NEW] [backend/src/services/ai/AISkillRegistry.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/ai/AISkillRegistry.ts)
- Mandatory AI Skill Registry implementation.
- Registers 7 core wealth skills:
  1. `Portfolio Analysis`
  2. `Tax Assistant`
  3. `Estate Advisor`
  4. `Retirement Coach`
  5. `Goal Planner`
  6. `Recommendation Explainer`
  7. `Insurance Advisor`
- Each skill defines supported intents, context providers, evidence providers, permissions, prompt templates, response templates, follow-up suggestions, and safety policies.

#### [NEW] [backend/src/services/ai/AIContextAggregator.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/ai/AIContextAggregator.ts)
- Assembles permission-aware context and evidence snapshots by pulling from recommendation engine outputs, tax summaries, projection outputs, asset metrics, and knowledge graph insights.
- Enforces strict zero-raw-query and zero-calculation constraints.

#### [NEW] [backend/src/services/ai/AIAdvisorService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/ai/AIAdvisorService.ts)
- Core AI Advisor orchestrator. Matches intent to registered skills, retrieves contextual evidence, applies safety policies, generates evidence-backed structured advice, and includes interactive follow-up prompt chips.

#### [NEW] [backend/src/routes/aiAdvisorRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/aiAdvisorRoutes.ts)
- Mounts `/api/v1/ai/advisor/chat`, `/api/v1/ai/advisor/skills`, `/api/v1/ai/advisor/context` endpoints.

#### [MODIFY] [backend/src/routes/index.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/index.ts)
- Mounts `aiAdvisorRoutes` under `/ai/advisor`.

---

### AI Wealth Advisor UI (Frontend)

#### [NEW] [frontend/src/components/advisor/AIWealthAdvisor.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/advisor/AIWealthAdvisor.tsx)
- Premium, glassmorphism interactive AI Wealth Advisor interface.
- Includes Skill Selector / Badge Filters, Interactive Chat Stream with Evidence Cards, Safety Policy Compliance Indicators, and 1-Click Follow-Up Action Chips.

#### [MODIFY] [frontend/src/App.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/App.tsx)
- Integrates `AI Wealth Advisor` tab in the top/side navigation header bar with quick key access.

---

### Documentation Deliverables

#### [NEW] [docs/AI_WEALTH_ADVISOR_ARCHITECTURE.md](file:///c:/Users/prije/Downloads/MyWorth/docs/AI_WEALTH_ADVISOR_ARCHITECTURE.md)
#### [NEW] [docs/AI_SKILL_REGISTRY.md](file:///c:/Users/prije/Downloads/MyWorth/docs/AI_SKILL_REGISTRY.md)
#### [NEW] [docs/PRODUCT_MANAGEMENT_WORKFLOW.md](file:///c:/Users/prije/Downloads/MyWorth/docs/PRODUCT_MANAGEMENT_WORKFLOW.md)
#### [NEW] [Phase 7B1 - Implementation Summary.md](file:///c:/Users/prije/Downloads/MyWorth/Phase%207B1%20-%20Implementation%20Summary.md)
#### [MODIFY] [AI_CHANGELOG.md](file:///c:/Users/prije/Downloads/MyWorth/AI_CHANGELOG.md)
#### [MODIFY] [SESSION_CONTEXT.md](file:///c:/Users/prije/Downloads/MyWorth/SESSION_CONTEXT.md)

---

## Verification Plan

### Automated Tests
- Run `npm run test` or backend tests to verify skill registry initialization and context aggregator output.
- Run `npm run build` across backend and frontend to verify 100% clean compilation.

### Manual Verification
- Launch local development server (`npm run dev`).
- Test interactive chat queries for all 7 skills (`Portfolio Analysis`, `Tax Assistant`, `Estate Advisor`, `Retirement Coach`, `Goal Planner`, `Recommendation Explainer`, `Insurance Advisor`).
- Verify evidence cards, permission badges, and follow-up prompt chips render smoothly.
