# FamilyWealthOS – Sprint 8C.4

# Family Office UI Experience & Financial Intelligence Visualization

## AGENT INSTRUCTIONS – PLANNING PHASE ONLY

## 1. Sprint Objective

Sprint 8C.4 will deliver the frontend/UI experience for the Family Office intelligence capabilities implemented during Phase 8B and Phase 8C.

The objective is to expose the existing backend capabilities through a modern, intuitive, fiduciary-safe FamilyWealthOS experience.

This sprint must focus on **presentation, interaction, and frontend integration**.

---

# 🚨 CRITICAL STOP RULE

## DO NOT MODIFY PRODUCTION CODE YET

Before making any production code changes:

1. Inspect the existing frontend architecture.
2. Inspect the current navigation and page structure.
3. Inspect existing API client/service patterns.
4. Inspect the existing design system and UI components.
5. Inspect the Phase 8B and Phase 8C backend contracts and endpoints.
6. Inspect existing Portfolio, Protection, Goals, Dashboard, and AI-related UI.
7. Identify reusable components.
8. Identify integration risks.

Then create a detailed implementation plan.

### STOP after creating the plan.

Do not begin implementation until the plan has been reviewed and explicitly approved.

---

# 2. Architectural Principle

The UI must remain a presentation layer.

The architecture must preserve:

```text
Authoritative Domain Data
        ↓
Existing Domain Services / Engines
        ↓
Phase 8B / 8C APIs
        ↓
Frontend API Layer
        ↓
UI Presentation
```

## The frontend must NOT:

* duplicate financial calculations;
* calculate Family Financial Health independently;
* reconstruct historical portfolios locally;
* perform What-If financial calculations locally;
* infer missing values;
* replace `null` with ₹0;
* infer family authorization;
* bypass backend family scoping;
* mutate domain data during simulations.

All financial intelligence must remain backend-authoritative.

---

# 3. Sprint 8C.4 Proposed UI Areas

The Agent must inspect the existing application before finalizing the component structure.

The implementation plan should cover the following areas.

---

## A. Family Financial Health Experience

Integrate the Sprint 8C.1 Family Financial Health API.

### UI capabilities

Display:

* Overall Family Financial Health score
* Overall status
* Completeness score
* Life stage
* Five pillar scores:

  * Protection
  * Liquidity
  * Goals & Planning
  * Estate
  * Tax & Data
* Effective pillar weights
* Historical trend where snapshots exist
* Score comparison/delta where meaningful

### Critical fiduciary UX rules

The UI must clearly distinguish:

```text
COMPLETE
PARTIAL
INSUFFICIENT_DATA
UNKNOWN
KNOWN_ZERO
NOT_APPLICABLE
STALE
```

Do not visually present:

```text
INSUFFICIENT_DATA = 0 score
UNKNOWN = 0 value
```

unless the backend explicitly returns an evaluated numeric zero.

### Missing-data UX

Where data is incomplete:

* explain which pillar is affected;
* explain that the score may have limited completeness;
* provide navigation/action paths to the relevant domain where appropriate.

Do not fabricate improvement recommendations.

---

## B. Family Timeline Experience

Integrate Sprint 8C.2 Timeline APIs.

### Required capabilities

Provide:

* chronological timeline;
* domain filtering;
* importance filtering;
* scheduled event handling;
* historical event handling;
* deterministic narrative display;
* event metadata where appropriate.

### Supported domains

The UI should support the existing seven-domain model:

* Portfolio
* Protection
* Goals
* Life Events
* Estate
* Tax
* AI Decisions

### Scheduled events

Scheduled events must be visually distinguishable from historical events.

They must not be misleadingly displayed as events that have already occurred.

---

## C. Financial Time Machine

Integrate Sprint 8C.3 reconstruction capability.

### Required experience

The user should be able to:

1. Select an `as-of` date.
2. Request reconstruction.
3. View the reconstructed financial state.
4. Understand data completeness.
5. Compare with current state where supported.

### Reconstruction display must include

* reconstruction date;
* completeness/status;
* gross assets;
* liabilities;
* net worth;
* asset holdings;
* Protection Shield where returned;
* unavailable values;
* valuation provenance where relevant;
* reconstruction limitations.

### 🚨 Non-fabrication UX rule

If backend returns:

```text
value = null
status = INSUFFICIENT_DATA
```

the UI must never display:

```text
₹0
```

Instead clearly display something equivalent to:

```text
Historical value unavailable
```

or the existing application terminology.

---

## D. What-If Simulation Sandbox

Integrate the Sprint 8C.3 What-If API.

### Required scenarios

The Agent must inspect the actual backend-supported scenarios and use the authoritative contract.

Do not invent frontend scenario types.

### Required UI characteristics

The experience must clearly separate:

```text
ACTUAL FAMILY DATA
```

from:

```text
SIMULATED SCENARIO
```

### Display

* scenario inputs;
* scenario results;
* baseline;
* projected impact;
* assumptions used;
* assumption provenance;
* baseline limitations;
* insufficient-data states.

### Assumption provenance

The UI must distinguish:

```text
USER_PROVIDED
FAMILY_PROFILE
SYSTEM_ASSUMPTION
```

System assumptions must never be visually presented as personal financial facts.

### Simulation safety

The UI must clearly indicate that:

> Simulations do not modify the family's actual financial records.

The frontend must not attempt local persistence of simulation results into authoritative portfolio/domain records.

---

## E. AI Mission Control

Inspect the Phase 8B.3 Proactive Observer APIs and existing AI UI.

The plan should propose a consolidated but non-overwhelming experience for:

* active fiduciary observations;
* materiality/priority;
* acknowledgement;
* snooze;
* dismissal;
* resolved observations;
* relevant domain navigation.

### Important

Do not redesign the existing AI capability blindly.

First inspect:

* existing AI pages/components;
* current trigger contracts;
* cooldown model;
* existing notification UX.

Reuse existing patterns wherever practical.

---

# 4. Navigation and Information Architecture

The Agent must inspect the current navigation before proposing changes.

The plan should recommend whether Phase 8C intelligence capabilities should be:

### Option A

Integrated into the existing Dashboard

### Option B

Presented through a new:

```text
Family Office
```

or:

```text
Financial Intelligence
```

workspace

### Option C

A hybrid approach.

The recommendation must include:

* rationale;
* impact on current navigation;
* mobile/responsive considerations;
* avoidance of navigation duplication.

Do not change navigation until the plan is approved.

---

# 5. Modern UI Requirements

The UI should feel like a modern premium financial application.

However:

## Do not perform a wholesale redesign.

Reuse the design system introduced during previous UI modernization work.

The Agent must first identify:

* current component library;
* color tokens;
* typography;
* card patterns;
* chart libraries;
* responsive patterns;
* dark/light theme behaviour if applicable.

### Desired characteristics

* clean hierarchy;
* progressive disclosure;
* minimal cognitive overload;
* strong data readability;
* premium financial dashboard feel;
* meaningful empty states;
* accessible interaction patterns.

---

# 6. Charts and Visualizations

Before adding any new visualization library, inspect what already exists.

Prefer existing dependencies.

Potential visualizations to evaluate:

### Family Financial Health

* composite score visualization;
* pillar distribution;
* historical trend.

### Timeline

* chronological event stream;
* filters rather than unnecessary complex charts.

### Time Machine

* historical vs current comparison;
* asset composition comparison.

### What-If

* baseline vs scenario comparison;
* assumption disclosure;
* projected impact visualization.

## Chart guardrails

Charts must:

* clearly label unavailable data;
* avoid interpolating missing historical values;
* distinguish actual from simulated values;
* remain understandable on smaller screens.

---

# 7. API Integration Requirements

The Agent must inspect the actual API contracts.

The implementation plan must identify:

## Family Financial Health

* endpoint(s);
* request parameters;
* response contracts;
* loading/error states.

## Timeline

* endpoint(s);
* pagination;
* filters;
* scheduled event handling.

## Time Machine

* reconstruction endpoint;
* date parameters;
* error responses;
* historical data limitations.

## What-If

* supported scenario types;
* input schema;
* idempotency requirements;
* result schema.

## Proactive Observer

* trigger endpoints;
* action endpoints;
* status transitions.

Do not guess endpoint contracts.

Use the actual backend implementation.

---

# 8. Family Scope Security

The frontend must not establish family authorization using:

* hard-coded family IDs;
* arbitrary headers;
* client-side assumptions.

The UI should use the application's existing authenticated/session integration.

If a request requires family context, follow the established API client pattern.

The implementation plan must explicitly verify that no new frontend code introduces:

```text
familyId = 1
```

or equivalent hard-coded family assumptions.

---

# 9. Backward Compatibility

Sprint 8C.4 must not break existing functionality.

The plan must explicitly list regression areas:

* Dashboard
* Portfolio
* Family member views
* Asset views
* Protection / Insurance
* Goals
* AI features
* Search
* Existing Phase 7 UI

No existing business logic should be moved into frontend components.

---

# 10. Required Loading, Empty and Error States

Every new UI area must define:

### Loading state

Use existing skeleton/loading patterns where available.

### Empty state

Examples:

* no health history;
* no timeline events;
* no reconstruction data;
* no proactive observations.

### Insufficient data state

This is distinct from empty.

The UI must communicate:

```text
We cannot calculate/reconstruct this reliably with available data.
```

without implying the value is zero.

### Error state

Use the existing application error handling conventions.

---

# 11. Accessibility and Responsive Design

The plan must address:

* keyboard navigation;
* semantic controls;
* chart accessibility;
* sufficient contrast;
* responsive layouts;
* mobile/tablet behaviour.

Do not create desktop-only intelligence dashboards.

---

# 12. Required File and Component Inspection

Before planning implementation, inspect and document:

## Frontend

* application entry structure;
* routing;
* navigation/sidebar;
* Dashboard;
* Portfolio;
* Protection;
* Goals;
* AI components;
* API client/services;
* state management;
* component library/design system;
* chart dependencies.

## Backend contracts

Inspect:

* `FamilyFinancialHealthService`
* `FamilyHealthController`
* Timeline service/controller/routes
* `FinancialTimeMachineService`
* `WhatIfSimulationEngine`
* `TimeMachineController`
* `timeMachineRoutes`
* Proactive Observer contracts/services/controllers
* relevant Zod contracts in `familyOfficeContracts.ts`

Use actual code evidence.

---

# 13. Implementation Plan Requirements

The plan must contain the following sections.

## 1. Current UI Architecture Assessment

Include actual findings.

## 2. Existing Component Reuse Strategy

Identify reusable components before proposing new ones.

## 3. Proposed Information Architecture

Include a navigation recommendation and rationale.

## 4. Detailed UX Flows

Cover:

* Family Health;
* Timeline;
* Time Machine;
* What-If;
* AI Mission Control.

## 5. Component Architecture

Provide proposed:

```text
pages/
components/
hooks/
services/
types/
```

structure.

Do not create unnecessary abstraction layers.

## 6. API Mapping Table

For every UI capability:

| UI Capability | Backend Endpoint | Contract | Loading | Error | Empty/Insufficient |
| ------------- | ---------------- | -------- | ------- | ----- | ------------------ |

## 7. Data Semantics Matrix

Explicitly define frontend treatment for:

* numeric zero;
* null;
* UNKNOWN;
* INSUFFICIENT_DATA;
* PARTIAL;
* NOT_APPLICABLE;
* STALE;
* simulated values;
* system assumptions.

## 8. Detailed File-by-File Plan

For every proposed file:

* file path;
* create/modify;
* responsibility;
* APIs used;
* business logic restrictions.

## 9. Security Review

Explicitly verify:

* no hard-coded family IDs;
* no client authorization assumptions;
* no frontend financial calculations;
* no simulation mutation paths.

## 10. Test Plan

Include:

### Component tests

### API integration tests

### Data semantics tests

### Regression tests

### Responsive tests

### Critical invariants

At minimum test:

1. `null` historical value never displays as ₹0.
2. `SUM_ASSURED` is not displayed as net worth.
3. scheduled timeline events are visually distinct.
4. simulated values are visually distinct from actual values.
5. system assumptions expose provenance.
6. insufficient data is not presented as a zero score/value.
7. no hard-coded `familyId = 1`.
8. UI actions use authoritative backend endpoints.
9. What-If execution does not alter displayed actual portfolio state.
10. existing Portfolio/Protection/Goals functionality remains operational.

## 11. Performance Plan

Define acceptable targets for:

* initial page load;
* timeline rendering;
* chart rendering;
* Time Machine interaction;
* What-If result rendering.

Avoid premature optimization but identify likely heavy UI paths.

## 12. Implementation Sequence

Provide incremental steps that allow testing after each group of changes.

---

# 14. Explicit Non-Goals

Unless the codebase inspection reveals an approved dependency, Sprint 8C.4 must NOT:

* redesign the entire application;
* rewrite existing business logic;
* move backend calculations into the frontend;
* add an LLM to calculate financial health;
* invent financial recommendations;
* modify authoritative financial records through What-If;
* replace the existing authentication architecture;
* introduce a new chart library without justification;
* begin Phase 8C.5 or another sprint.

---

# 15. Documentation

The implementation plan must propose updates to:

* `SESSION_CONTEXT.md`
* `AI_CHANGELOG.md`
* Phase 8 roadmap
* relevant UI architecture documentation.

Do not update completion status until implementation and verification are complete.

---

# 16. Final Deliverable for This Step

Create:

```text
prompts/Phase8C/SPRINT_8C_4_IMPLEMENTATION_PLAN.md
```

The plan must be evidence-based and detailed.

## 🚨 STOP CONDITION

After creating the implementation plan:

**STOP.**

Do not modify production code.

Do not begin Sprint 8C.4 implementation.

Wait for review and approval.
