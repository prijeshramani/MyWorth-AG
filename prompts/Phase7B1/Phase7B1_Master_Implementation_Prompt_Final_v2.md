# Phase7B1_Master_Implementation_Prompt_Final_v2.md

# FamilyWealthOS – Phase 7B.1
## AI Wealth Advisor Core

## Mandatory Architecture
- AI consumes Context, Memory, Evidence and Recommendation layers only.
- AI never queries raw tables.
- AI never performs financial calculations.
- Every answer must be evidence-backed and permission-aware.

---

## AI Skill Registry (Mandatory)

Create a registry for:
- Portfolio Analysis
- Tax Assistant
- Estate Advisor
- Retirement Coach
- Goal Planner
- Recommendation Explainer
- Insurance Advisor

Each skill declares:
- Supported intents
- Context providers
- Evidence providers
- Permissions
- Prompt template
- Response template
- Follow-up suggestions
- Safety policy

---

## Permanent Product Management Repository (Mandatory)

Create:

product/
├── UX_BACKLOG.md
├── BETA_BUGS.md
├── FEATURE_REQUESTS.md
├── AI_BACKLOG.md
├── RELEASE_NOTES.md
├── KNOWN_LIMITATIONS.md

Rules:
- Log every UX issue, bug and enhancement before implementation.
- Record Priority, Status, Sprint and timestamps.
- Never delete completed items; preserve history.

---

## Permanent Roadmap (NEW – Mandatory)

Create a root-level file:

ROADMAP.md

Maintain it throughout the life of the project.

It must contain:

### 1. Current Release
- Current Version
- Current Sprint
- Current Phase
- Release Status

### 2. Completed Phases
List every completed phase with:
- Objective
- Completion date
- Key deliverables
- Major architectural decisions
- Links to implementation summaries

### 3. Active Phase
Track:
- Scope
- Progress
- Risks
- Pending work
- Blockers

### 4. Upcoming Roadmap
Include planned phases with priorities.

### 5. Deferred Features
Capture consciously postponed ideas with reasons.

### 6. Architectural Decision Record (ADR)
Maintain lightweight ADRs for significant decisions such as:
- Knowledge Graph
- Rule Engine
- Projection Engine
- Recommendation Engine
- AI Context Layer
- AI Skill Registry

### 7. Product Metrics
Track:
- Backend test count
- Frontend build status
- API health
- Documentation coverage
- Beta readiness
- Current application version

### 8. Change Governance
Every completed sprint must update:
- ROADMAP.md
- RELEASE_NOTES.md
- AI_CHANGELOG.md
- SESSION_CONTEXT.md

ROADMAP.md becomes the project's single source of truth for progress.

---

## Documentation
Generate:
- AI_WEALTH_ADVISOR_ARCHITECTURE.md
- AI_SKILL_REGISTRY.md
- PRODUCT_MANAGEMENT_WORKFLOW.md
- ROADMAP.md
- AI_CHANGELOG.md
- SESSION_CONTEXT.md
- Phase 7B1 - Implementation Summary.md

---

## Definition of Done
- AI Skill Registry complete
- Product repository created
- ROADMAP.md created and maintained
- AI Advisor evidence-backed
- Existing engines untouched
- Clean production build
