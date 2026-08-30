# Sprint 8C.4 – Implementation Plan Review & Required Revisions (Combined)

## Review Status

**Decision: REVISE BEFORE APPROVAL**

The proposed plan has the right high-level scope and correctly preserves several important fiduciary invariants. However, it is **not yet detailed or evidence-based enough to approve implementation**.

The main issue is that the plan reads like a proposed file list rather than the implementation plan requested for Sprint 8C.4. Several API paths and implementation assumptions appear to be stated without demonstrating inspection of the actual backend/frontend code.

**No production code should be modified yet.**

---

# 1. What Is Good in the Current Plan

The following principles should be retained:

- UI is treated as a presentation/integration layer.
- Financial calculations remain backend-authoritative.
- Missing values must not be coerced to financial zeroes.
- What-If scenarios remain isolated from authoritative family data.
- No hard-coded `familyId = 1`.
- The scope correctly includes:
  - Family Financial Health
  - Family Timeline
  - Financial Time Machine
  - What-If Simulation
  - AI Mission Control
- The plan recognizes scheduled vs historical timeline events.
- The plan recognizes assumption provenance.
- The plan includes backend regression testing and TypeScript/build validation.
- The Agent correctly stopped before implementation.

---

# 2. Blocking Review Comments

## BLOCKER 1 – The Plan Does Not Demonstrate Actual Codebase Inspection

The original Sprint 8C.4 instructions explicitly required inspection of:

- frontend routing;
- navigation/sidebar;
- Dashboard;
- Portfolio;
- Protection;
- Goals;
- existing AI components;
- API client/service patterns;
- state management;
- design system/component library;
- chart dependencies;
- relevant backend controllers/routes/contracts.

The submitted plan does not provide an **actual findings section**.

### Required revision

Add:

## Current UI Architecture Assessment

Document the actual current implementation, including:

| Area | Actual Current File(s) | Current Pattern | Reuse Decision |
|---|---|---|---|
| Routing | ... | ... | ... |
| Navigation | ... | ... | ... |
| API client | ... | ... | ... |
| State management | ... | ... | ... |
| Dashboard | ... | ... | ... |
| AI UI | ... | ... | ... |
| Charts | ... | ... | ... |

Do not use generic descriptions. Use evidence from the repository.

---

## BLOCKER 2 – API Endpoints Must Not Be Guessed

The plan currently proposes paths such as:

- `/family-office/timeline`
- `/sync`
- `/family-office/time-machine`
- `/what-if`
- `/family-office/proactive/triggers`

These may be correct, but the plan does not prove that they were read from the actual route registrations.

### Required revision

Add an authoritative API mapping table:

| UI Capability | Actual HTTP Method | Exact Route | Request Contract | Response Contract | Auth/Scope | Idempotency |
|---|---|---|---|---|---|---|

The Agent must inspect actual route/controller files.

**Do not invent or simplify endpoint paths.**

Also explicitly distinguish:

- read-only endpoints;
- synchronization endpoints that write only derived projections;
- action endpoints;
- idempotent POST endpoints.

---

## BLOCKER 3 – `familyOffice.ts` Must Not Become an Independent Copy of Backend Contracts Without a Drift Strategy

The plan proposes frontend interfaces “mirroring backend Zod schemas.”

This can create contract drift.

### Required revision

The plan must explain which approach the repository currently uses:

1. shared contract package;
2. generated types;
3. manually maintained frontend types.

If manual types are unavoidable:

- document the source contract;
- limit duplication;
- add contract-focused tests where practical;
- do not silently redefine status enums.

The frontend must preserve authoritative semantics for:

- `null`;
- `UNKNOWN`;
- `INSUFFICIENT_DATA`;
- `PARTIAL`;
- `KNOWN_ZERO`;
- `NOT_APPLICABLE`;
- `STALE`;
- valuation type;
- provenance;
- simulation status.

---

## BLOCKER 4 – “Zero Database Writes in Simulation” Must Not Be Claimed as a Frontend Property

The current plan describes the frontend as an “Authoritative in-memory What-If scenario executor.”

That wording is misleading.

The frontend must **call the backend What-If simulation API**. The backend owns the zero-write invariant.

### Required revision

Replace the architectural wording with:

> The frontend is a scenario input and result presentation layer. The authoritative backend What-If engine performs the simulation and guarantees zero domain-data writes.

The frontend must not independently calculate scenario outcomes.

---

## BLOCKER 5 – Timeline Sync Requires Explicit UX and Mutation Rules

The plan includes an API call for `/sync`, but does not explain:

- whether sync is user-triggered;
- whether timeline loading automatically invokes synchronization;
- whether sync is already performed elsewhere;
- how duplicate clicks are handled;
- what loading/error state is shown.

### Required revision

Inspect the backend behavior and define:

1. Is sync explicit or automatic?
2. Which UI control triggers it?
3. Does ordinary timeline viewing mutate the derived projection?
4. What confirmation/loading state exists?
5. Does the operation require idempotency?
6. What happens if sync partially fails?

**Default preference:** ordinary timeline viewing should not unexpectedly trigger a mutation unless the existing architecture explicitly requires it.

---

# 3. Major Required Revisions

## 3.1 Information Architecture Is Missing

The prompt specifically asked the Agent to evaluate:

- Dashboard integration;
- a new Family Office / Financial Intelligence workspace;
- a hybrid model.

The plan immediately adds three navigation tabs without rationale.

### Required revision

Add:

## Information Architecture Options

Evaluate at least:

### Option A – Dashboard-first
### Option B – Dedicated Financial Intelligence workspace
### Option C – Hybrid

For each provide:

- advantages;
- disadvantages;
- navigation impact;
- duplication risk;
- mobile impact.

Then provide one explicit recommendation.

### My provisional preference

A **hybrid model** is likely strongest:

- Dashboard: compact health summary + top proactive items + key intelligence entry points.
- Dedicated Financial Intelligence workspace: deeper Health, Timeline and Time Machine experiences.

However, the final recommendation must follow inspection of the existing UI/navigation.

---

## 3.2 Navigation Placement Is Inconsistent

The plan says navigation items will be added under both `Core` and `Planning`, but does not specify which feature belongs where or why.

### Required revision

Provide the exact proposed navigation hierarchy.

Avoid adding too many top-level destinations.

The Agent should consider whether:

- Family Health
- Timeline
- Time Machine

should live beneath one parent workspace instead of becoming three unrelated navigation items.

---

## 3.3 Existing Component Reuse Strategy Is Missing

The plan creates many new components but does not explain what existing components can be reused.

### Required revision

Add:

## Existing Component Reuse Strategy

For every major UI need, identify:

| Need | Existing Component/Pattern | Reuse | Extend | New |
|---|---|---|---|---|

Inspect existing:

- cards;
- badges/status chips;
- tables;
- filters;
- modals/drawers;
- skeletons;
- empty states;
- error states;
- charts;
- number/currency formatting utilities.

Do not recreate patterns already available in the application.

---

## 3.4 Chart Library Assumption Needs Verification

The plan explicitly proposes `Recharts`.

The original instructions required inspecting existing dependencies before adding or assuming a chart library.

### Required revision

State:

- whether Recharts already exists;
- where it is currently used;
- whether the existing library satisfies the needs.

If a new dependency is proposed, provide justification and bundle/maintenance impact.

Do not add a new visualization dependency unless necessary.

---

## 3.5 The Family Health UX Needs More Data Semantics

The plan lists scores but not enough behavior for important backend states.

### Required revision

Define exactly how the UI renders:

| Backend State | Score Display | Visual Treatment | Explanation |
|---|---|---|---|
| COMPLETE | ... | ... | ... |
| PARTIAL | ... | ... | ... |
| INSUFFICIENT_DATA | ... | ... | ... |
| UNKNOWN | ... | ... | ... |
| KNOWN_ZERO | ... | ... | ... |
| NOT_APPLICABLE | ... | ... | ... |
| STALE | ... | ... | ... |

### Additional guardrail

`completenessScore` must not be visually represented as financial confidence unless that is explicitly its backend semantic.

Use the backend terminology accurately.

---

## 3.6 Snapshot UX Requires Clarification

The plan includes a “snapshot trigger” but does not define the user experience.

Because `GET /health` is non-mutating and snapshot persistence is explicit, the UI must preserve that distinction.

### Required revision

Define:

- who can trigger a snapshot;
- when the button is visible;
- whether a confirmation is required;
- duplicate snapshot response behavior;
- success feedback;
- failure behavior.

Do not automatically create snapshots on page load.

---

## 3.7 Timeline Event Card Must Not Recalculate or Reformat Authoritative Narratives Incorrectly

The backend already provides deterministic narrative history and identifier masking.

### Required revision

Clarify that the frontend:

- displays backend narrative text as authoritative;
- does not reconstruct facts from raw event metadata;
- does not unmask identifiers;
- does not generate alternate AI narratives.

Currency display should use backend-provided semantic fields where available. The UI may format display values but must not change the meaning or provenance.

---

## 3.8 Timeline Filters and Pagination Are Underspecified

The plan needs:

- pagination/infinite scrolling strategy;
- filter state behavior;
- URL persistence if the application uses routing/query state;
- loading transitions;
- empty result handling;
- scheduled inclusion behavior.

### Required revision

Explicitly define default query behavior.

In particular:

- scheduled events must remain excluded by default if that matches the backend contract;
- the UI must provide a deliberate way to include them;
- scheduled events must be visually distinct.

---

## 3.9 Time Machine Needs a Proper UX Flow

The current plan simply says “point-in-time reconstruction.”

### Required revision

Define the flow:

1. User selects date.
2. UI validates only presentation-level constraints.
3. Request is sent to backend.
4. Loading state appears.
5. Reconstruction result displays:
   - as-of date;
   - status;
   - completeness;
   - limitations;
   - valuation provenance;
   - assets;
   - liabilities;
   - net worth;
   - Protection Shield separately.
6. Unsupported/insufficient historical reconstruction is clearly explained.

### Critical invariant

`SUM_ASSURED` must never be aggregated or visually implied to be net worth.

---

## 3.10 What-If UI Must Use Actual Supported Scenario Contracts

The plan does not identify the actual scenario types implemented in Sprint 8C.3.

### Required revision

Inspect the authoritative What-If contract and list:

- all supported scenario types;
- required inputs;
- optional inputs;
- validation errors;
- insufficient-data responses.

Do not create frontend scenario controls for unsupported scenarios.

---

## 3.11 Actual vs Simulated State Must Be Strongly Separated

Add explicit UX requirements:

- simulation results must have a persistent “Simulated” label;
- baseline and scenario must be visually distinguishable;
- leaving the sandbox must not alter actual dashboard/portfolio state;
- simulation inputs/results must not overwrite authoritative domain state;
- “System Assumption” values must not look like user-entered facts.

---

## 3.12 AI Mission Control Scope Is Too Thin

The plan only says to add trigger cards and actions.

### Required revision

Inspect actual trigger contracts and define:

- statuses to display;
- active vs historical/resolved views;
- priority/materiality treatment;
- cooldown/suppression behavior exposed to users, if applicable;
- acknowledgement;
- snooze duration/input requirements;
- dismiss;
- error handling;
- optimistic vs confirmed updates;
- navigation from trigger to relevant domain.

Do not assume all actions can use the same request pattern.

---

# 4. File-by-File Plan Is Insufficient

The submitted plan is a file list, not a detailed implementation plan.

For every file, provide:

| File | Create/Modify | Responsibility | APIs/Contracts | Reused Components | Forbidden Business Logic |
|---|---|---|---|---|---|

This must include existing files discovered during inspection, not only the initially proposed files.

---

# 5. Required Component Architecture

Add the proposed structure, based on actual repository conventions:

```text
pages/
components/
hooks/
services/
types/
utils/
```

Do not create folders merely because they were listed in the original prompt.

Explain:

- where data fetching lives;
- where request state lives;
- where presentation-only state lives;
- where shared formatting utilities live.

Avoid duplicating API calls inside multiple components.

---

# 6. API Error and State Handling Matrix

Add:

| Feature | Loading | Empty | Insufficient Data | Error | Retry |
|---|---|---|---|---|---|
| Family Health | | | | | |
| Health History | | | | | |
| Timeline | | | | | |
| Time Machine | | | | | |
| What-If | | | | | |
| AI Mission Control | | | | | |

“Empty” and “Insufficient Data” must remain separate concepts.

---

# 7. Testing Plan Is Not Adequate

The current plan mostly lists manual verification plus backend tests.

Sprint 8C.4 is primarily a frontend sprint and therefore requires frontend-focused automated testing.

## Required revision

Define actual tests based on the existing test framework.

At minimum cover:

### Family Health
- status semantics;
- null handling;
- NOT_APPLICABLE handling;
- snapshot is not triggered on page load;
- duplicate snapshot response.

### Timeline
- domain filtering;
- scheduled events hidden by default where contract requires;
- includeScheduled behavior;
- deterministic narrative display;
- masked identifiers remain masked.

### Time Machine
- null historical values do not display as ₹0;
- valuation provenance is displayed where required;
- SUM_ASSURED is separated from net worth;
- insufficient reconstruction state.

### What-If
- supported scenarios only;
- actual and simulated results separated;
- provenance labels;
- insufficient income/data result;
- simulation completion does not alter displayed actual state.

### AI Mission Control
- actions use actual backend contracts;
- success/failure states;
- trigger status refresh behavior.

### Regression
- Portfolio;
- Protection;
- Goals;
- Family member views;
- asset views;
- existing AI features;
- Dashboard;
- Search.

Do not merely run the backend's 387 tests as evidence that the frontend integration works.

---

# 8. Accessibility and Responsive Design Are Missing

Add explicit requirements for:

- keyboard operation;
- semantic buttons and filters;
- focus states;
- status information not communicated by color alone;
- chart alternatives/tooltips/labels;
- mobile filter behavior;
- responsive holdings tables;
- small-screen Time Machine comparison layouts.

---

# 9. Performance Plan Is Missing

The original prompt requested performance targets.

Add reasonable targets and identify likely heavy paths:

- initial intelligence view rendering;
- timeline pagination/rendering;
- chart rendering;
- Time Machine request-to-render;
- What-If result rendering.

Do not introduce premature virtualization unless inspection shows it is needed.

---

# 10. Security Review Needs More Precision

The plan says API requests leverage `CorrelationContext.getFamilyId()`.

That is a backend mechanism, not something the frontend directly calls.

### Required correction

State instead:

> The frontend must use the established authenticated API client/session pattern. The backend resolves and authorizes family scope through server-side context. The frontend must not send arbitrary family scope headers or use hard-coded family IDs.

Add explicit checks for:

- `familyId = 1`;
- `x-family-id`;
- equivalent arbitrary family headers;
- client-side authorization decisions.

---

# 11. Recommended Implementation Sequence

The revised plan should use incremental delivery.

## Step 0 – Discovery and Contract Verification
No production changes.

## Step 1 – Shared UI Integration Foundation
Types/contract strategy, API services, status formatting utilities, common loading/error handling.

## Step 2 – Family Financial Health
Dashboard/detail experience, history, snapshot UX, tests.

## Step 3 – Timeline Ledger
Read/query/filter UX first. Add explicit sync only if required by verified backend architecture.

## Step 4 – Financial Time Machine
Historical reconstruction and data limitation UX.

## Step 5 – What-If Sandbox
Only verified supported scenarios and authoritative API integration.

## Step 6 – AI Mission Control
Proactive trigger integration and actions.

## Step 7 – Navigation and Dashboard Consolidation
Apply the approved information architecture.

## Step 8 – Regression, Accessibility and Responsive Hardening
Complete automated/manual verification.

The Agent may adjust ordering after repository inspection, but the rationale must be documented.

---

# 12. Explicit Non-Negotiable Guardrails

The revised plan must retain all of the following:

1. **No frontend financial calculations.**
2. **No fabricated values.**
3. **`null` is never silently displayed as ₹0.**
4. **`SUM_ASSURED` is never net worth.**
5. **Protection Shield remains isolated from net-worth aggregation where required by the backend contract.**
6. **Actual and simulated values are clearly separated.**
7. **System assumptions are clearly labeled with provenance.**
8. **No What-If result may mutate authoritative family records.**
9. **No hard-coded family ID.**
10. **No arbitrary family-scope header for authorization.**
11. **The frontend does not independently authorize family access.**
12. **Scheduled timeline events are distinct from historical events.**
13. **The timeline remains a derived projection, never an authoritative source.**
14. **Backend narrative facts are not regenerated or invented by the UI.**
15. **Existing business logic must not be moved from backend to frontend.**
16. **Existing Phase 7 UI functionality must remain operational.**
17. **No wholesale application redesign.**
18. **Reuse the existing design system and dependencies where possible.**

---

# 13. Required Revised Deliverable

Update:

```text
prompts/Phase8C/SPRINT_8C_4_IMPLEMENTATION_PLAN.md
```

The revised plan must include:

1. Current UI Architecture Assessment
2. Existing Component Reuse Strategy
3. Information Architecture Options and Recommendation
4. Verified Backend API Mapping
5. Data Semantics Matrix
6. Detailed UX Flows
7. Component Architecture
8. Detailed File-by-File Plan
9. Loading / Empty / Insufficient Data / Error Matrix
10. Security Review
11. Accessibility and Responsive Plan
12. Performance Plan
13. Frontend and Backend Test Plan
14. Incremental Implementation Sequence
15. Regression Scope

---

# 🚨 STOP CONDITION

After revising the implementation plan:

**STOP.**

Do not modify production code.

Do not begin Sprint 8C.4 implementation.

Wait for review and explicit approval.
