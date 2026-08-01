# Phase 7B.2 Implementation Plan -- AI Actions & Interactive Simulations

Transform the **AI Wealth Advisor** into a safe, decision-support
assistant using interactive simulations, user-confirmed action execution
workflows, an **Action Registry**, **AI Action Center**, **AI Audit
Trail**, and a comprehensive **Governance Repository (`governance/`)**.

## User Review Required

> \[!IMPORTANT\] - **Architecture Constraint**: AI never performs custom
> financial calculations or queries raw database tables directly. Every
> action is preview-first with explicit user confirmation before
> execution. - **Governance Repository**: Establishes `governance/`
> directory containing ADRs, Security policies, Privacy guidelines, Data
> retention policies, API standards, and Coding guidelines.

## Open Questions

None. All requirements are explicitly defined in
`prompts/Phase7B2/Phase7B2_Master_Implementation_Prompt.md`.

------------------------------------------------------------------------

## Proposed Changes

### 1. Governance & Product Repository

#### \[NEW\] [governance/DECISIONS.md](file:///c:/Users/prije/Downloads/MyWorth/governance/DECISIONS.md)

#### \[NEW\] [governance/SECURITY.md](file:///c:/Users/prije/Downloads/MyWorth/governance/SECURITY.md)

#### \[NEW\] [governance/PRIVACY.md](file:///c:/Users/prije/Downloads/MyWorth/governance/PRIVACY.md)

#### \[NEW\] [governance/DATA_RETENTION.md](file:///c:/Users/prije/Downloads/MyWorth/governance/DATA_RETENTION.md)

#### \[NEW\] [governance/VERSIONING.md](file:///c:/Users/prije/Downloads/MyWorth/governance/VERSIONING.md)

#### \[NEW\] [governance/API_GUIDELINES.md](file:///c:/Users/prije/Downloads/MyWorth/governance/API_GUIDELINES.md)

#### \[NEW\] [governance/CODING_STANDARDS.md](file:///c:/Users/prije/Downloads/MyWorth/governance/CODING_STANDARDS.md)

#### \[NEW\] [governance/ADR/ADR_007_AI_Action_Registry.md](file:///c:/Users/prije/Downloads/MyWorth/governance/ADR/ADR_007_AI_Action_Registry.md)

#### \[NEW\] [governance/ADR/ADR_008_What_If_Simulation_Engine.md](file:///c:/Users/prije/Downloads/MyWorth/governance/ADR/ADR_008_What_If_Simulation_Engine.md)

-   Complete governance framework enforcing security, privacy, data
    retention, versioning, API standards, and architectural decisions.

#### \[MODIFY\] [ROADMAP.md](file:///c:/Users/prije/Downloads/MyWorth/ROADMAP.md)

-   Updates release version to `v1.9.0`, Phase 7B.2 Active status, and
    ADR entries.

#### \[MODIFY\] [product/UX_BACKLOG.md](file:///c:/Users/prije/Downloads/MyWorth/product/UX_BACKLOG.md)

#### \[MODIFY\] [product/BETA_BUGS.md](file:///c:/Users/prije/Downloads/MyWorth/product/BETA_BUGS.md)

#### \[MODIFY\] [product/FEATURE_REQUESTS.md](file:///c:/Users/prije/Downloads/MyWorth/product/FEATURE_REQUESTS.md)

#### \[MODIFY\] [product/AI_BACKLOG.md](file:///c:/Users/prije/Downloads/MyWorth/product/AI_BACKLOG.md)

#### \[MODIFY\] [product/RELEASE_NOTES.md](file:///c:/Users/prije/Downloads/MyWorth/product/RELEASE_NOTES.md)

#### \[MODIFY\] [product/KNOWN_LIMITATIONS.md](file:///c:/Users/prije/Downloads/MyWorth/product/KNOWN_LIMITATIONS.md)

------------------------------------------------------------------------

### 2. AI Action Registry & What-If Simulation Engine (Backend)

#### \[NEW\] [backend/src/services/ai/AIActionRegistry.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/ai/AIActionRegistry.ts)

-   Action Registry registering executable actions:
    -   `REFRESH_PORTFOLIO`
    -   `RECALCULATE_TAX`
    -   `REFRESH_GRAPH`
    -   `GENERATE_ITR_JSON`
    -   `REFRESH_AI_CONTEXT`
    -   `RUN_RETIREMENT_SIMULATION`
    -   `REFRESH_RECOMMENDATIONS`
    -   `APPLY_REBALANCING_PLAN`
    -   `AUDIT_UNASSIGNED_ASSETS`
-   Each action declares ID, owner engine, required
    context/evidence/permissions, confirmation flags, undo support,
    audit event, risk level, and duration.

#### \[NEW\] [backend/src/services/ai/WhatIfSimulationEngine.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/ai/WhatIfSimulationEngine.ts)

-   Ephemeral what-if simulation engine (zero database mutations).
-   Evaluates scenarios (Base, Optimistic +2%, Conservative -2%, Custom)
    across SIP variations, lump-sum investments, retirement age tweaks,
    goal targets, and inflation rates.
-   Computes side-by-side impact metrics (financial benefit, risk delta,
    goal impact, tax impact, timeline).

#### \[NEW\] [backend/src/repositories/SQLiteAIAuditTrailRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteAIAuditTrailRepository.ts)

-   Database repository tracking AI actions, proposed recommendations,
    user confirmation decisions, evidence snapshots, and execution
    results in table `ai_audit_trail`.

#### \[NEW\] [backend/src/routes/aiActionRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/aiActionRoutes.ts)

-   Mounts `/api/v1/ai/actions/registry`, `/api/v1/ai/actions/simulate`,
    `/api/v1/ai/actions/execute`, `/api/v1/ai/actions/audit-trail`,
    `/api/v1/ai/actions/action-center`.

#### \[MODIFY\] [backend/src/routes/index.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/index.ts)

-   Mounts `aiActionRoutes` under `/ai/actions`.

------------------------------------------------------------------------

### 3. AI Action Center & Simulation Interface (Frontend)

#### \[NEW\] [frontend/src/components/advisor/AIActionCenter.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/advisor/AIActionCenter.tsx)

-   Glassmorphism AI Action Center featuring action categories
    (`Pending`, `Draft`, `Recommended`, `Completed`, `Scheduled`,
    `Dismissed`).
-   Safe execution workflow modal with Impact Analysis, Financial
    Benefit Preview, and 1-Click Confirmation/Undo buttons.

#### \[NEW\] [frontend/src/components/advisor/WhatIfSimulator.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/advisor/WhatIfSimulator.tsx)

-   Interactive what-if simulation studio with real-time sliders for SIP
    changes, lump sum investment, retirement target age, and inflation
    assumptions.
-   Side-by-side scenario comparison table (Base vs. Optimistic
    vs. Conservative vs. Custom).

#### \[MODIFY\] [frontend/src/App.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/App.tsx)

-   Adds tab routes for `ai-action-center` and `what-if-simulator`.

#### \[MODIFY\] [frontend/src/components/layout/NavigationDrawer.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/NavigationDrawer.tsx)

-   Adds navigation items for `AI Action Center` and
    `What-If Simulator`.

------------------------------------------------------------------------

### 4. Documentation & Verification

#### \[NEW\] [docs/ACTION_REGISTRY.md](file:///c:/Users/prije/Downloads/MyWorth/docs/ACTION_REGISTRY.md)

#### \[NEW\] [docs/AI_ACTION_CENTER.md](file:///c:/Users/prije/Downloads/MyWorth/docs/AI_ACTION_CENTER.md)

#### \[NEW\] [docs/WHAT_IF_ENGINE.md](file:///c:/Users/prije/Downloads/MyWorth/docs/WHAT_IF_ENGINE.md)

#### \[NEW\] [docs/SIMULATION_ENGINE.md](file:///c:/Users/prije/Downloads/MyWorth/docs/SIMULATION_ENGINE.md)

#### \[NEW\] [docs/AI_AUDIT_TRAIL.md](file:///c:/Users/prije/Downloads/MyWorth/docs/AI_AUDIT_TRAIL.md)

#### \[NEW\] [docs/GOVERNANCE_GUIDE.md](file:///c:/Users/prije/Downloads/MyWorth/docs/GOVERNANCE_GUIDE.md)

#### \[NEW\] [docs/Sprint_7B2_Retrospective.md](file:///c:/Users/prije/Downloads/MyWorth/docs/Sprint_7B2_Retrospective.md)

#### \[NEW\] [Phase 7B2 - Implementation Summary.md](file:///c:/Users/prije/Downloads/MyWorth/Phase%207B2%20-%20Implementation%20Summary.md)

#### \[MODIFY\] [AI_CHANGELOG.md](file:///c:/Users/prije/Downloads/MyWorth/AI_CHANGELOG.md)

#### \[MODIFY\] [SESSION_CONTEXT.md](file:///c:/Users/prije/Downloads/MyWorth/SESSION_CONTEXT.md)

------------------------------------------------------------------------

## Verification Plan

### Automated Tests

-   Run unit & integration tests (`npm run test` or test runner) to
    verify Action Registry registration, simulation calculations, and
    audit trail persistence.
-   Run `npm run build` across backend and frontend to verify 100% clean
    TypeScript compilation.

### Manual Verification

-   Launch local development server (`npm run dev`).
-   Test What-If Simulator with custom SIP and retirement age sliders.
-   Test Action Execution workflow in AI Action Center (Explain
    $\rightarrow$ Impact Analysis $\rightarrow$ Confirm $\rightarrow$
    Audit Log).

------------------------------------------------------------------------

# 🏗️ ChatGPT Architecture Enhancements (Mandatory Before Implementation)

## Overall Assessment

**Rating: 10/10 -- Approved for implementation**

The implementation plan is well aligned with the long-term architecture.
The AI remains an orchestration layer and the Action Registry cleanly
separates conversational intent from executable platform capabilities.

The following enhancements are mandatory before implementation.

------------------------------------------------------------------------

## 1. Simulation Snapshot Repository (Mandatory)

Do not discard simulation results after execution.

Create a lightweight repository for simulation snapshots.

Store:

-   Scenario inputs
-   Assumptions
-   Evidence bundle
-   Projection results
-   Recommendation impact
-   Timestamp

This enables historical comparisons without mutating production data.

------------------------------------------------------------------------

## 2. Action Preconditions

Every Action Registry entry must expose:

-   Preconditions
-   Blocking conditions
-   Required engines
-   Required permissions
-   Validation rules

Example:

Generate ITR JSON

Requires: - Tax profile complete - PAN available - Financial year
selected

------------------------------------------------------------------------

## 3. Action Rollback Strategy

For every executable action define:

-   Undo supported?
-   Rollback strategy
-   Recovery steps
-   Backup required
-   Estimated recovery time

Never execute irreversible actions without warning.

------------------------------------------------------------------------

## 4. Simulation Templates

Provide reusable templates:

-   Retirement Boost
-   Tax Saving
-   FIRE Planning
-   Child Education
-   Home Purchase
-   Emergency Fund

Templates should preload assumptions and improve user experience.

------------------------------------------------------------------------

## 5. Recommendation-to-Action Mapping

Each recommendation should optionally expose:

-   Suggested Action
-   Expected Improvement
-   Related Simulation
-   Estimated Completion Time

This links Recommendation Engine directly with Action Registry.

------------------------------------------------------------------------

## 6. AI Decision Journal

Maintain a searchable journal containing:

-   User question
-   AI explanation
-   Simulations executed
-   Decisions taken
-   Actions completed
-   Follow-up recommendations

This becomes a long-term advisory history.

------------------------------------------------------------------------

## 7. Governance Expansion

Extend governance with:

governance/ - OBSERVABILITY.md - DEPLOYMENT_GUIDE.md -
DISASTER_RECOVERY.md - PERFORMANCE_GUIDELINES.md

These become mandatory governance artefacts as the platform approaches
production.

------------------------------------------------------------------------

## 8. Platform Governance Rule

Every completed sprint must automatically update:

-   ROADMAP.md
-   CAPABILITIES.md
-   governance/DECISIONS.md
-   product/RELEASE_NOTES.md
-   AI_CHANGELOG.md
-   SESSION_CONTEXT.md

------------------------------------------------------------------------

## 9. Production Readiness Metrics

Health Dashboard should expose:

-   Simulation engine health
-   Action Registry count
-   Skill Registry count
-   Evidence freshness
-   ADR count
-   Documentation coverage
-   Backup status

------------------------------------------------------------------------

## 10. Additional Acceptance Criteria

-   Existing platform remains unchanged.
-   Action Registry operational.
-   Simulation snapshots retained.
-   Recommendation-to-Action mapping complete.
-   Governance updated.
-   Existing tests remain green.
-   Target 225+ tests achieved.
-   Clean production build.

## Final Recommendation

Proceed with implementation after incorporating these enhancements. This
phase should establish FamilyWealthOS as an explainable decision-support
platform where every recommendation can be simulated, reviewed, approved
and audited before execution.
