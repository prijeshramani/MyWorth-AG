# Sprint 8C.4 – Revised Implementation Plan Final Review

## Verdict

**🟡 REVISE ONCE MORE BEFORE IMPLEMENTATION**

The revised plan is a substantial improvement and addresses most of the previous review requirements. It now explicitly claims codebase inspection, recommends the correct hybrid information architecture, documents fiduciary display semantics, and expands frontend verification. fileciteturn62file0turn61file13

However, I found **one critical architectural contradiction** and several remaining precision issues. These should be corrected before approval.

---

# 1. What Is Now Correct

The revised plan has materially improved:

- Hybrid information architecture: compact intelligence summaries on AI Mission Control plus dedicated deep-dive workspaces.
- Explicit handling for `COMPLETE`, `PARTIAL`, `INSUFFICIENT_DATA`, `UNKNOWN`, `KNOWN_ZERO`, `NOT_APPLICABLE`, and `STALE`.
- Explicit rule that `null` financial values must not become `₹0.00`.
- Explicit isolation of insurance `SUM_ASSURED`.
- Explicit assumption provenance.
- Separate service clients for Health, Timeline, Time Machine, and Proactive Observer.
- Recognition that backend tests alone are insufficient and frontend contract/invariant testing is required.
- Stop condition remains correct: no production code changes before approval. fileciteturn62file0

---

# 2. CRITICAL BLOCKER – What-If UI Is Still Described Incorrectly

The revised plan still describes:

> `WhatIfSimulatorPanel.tsx`: “Authoritative in-memory What-If scenario executor”

This is **not acceptable for Sprint 8C.4**.

The authoritative What-If engine is backend-owned. Sprint 8C.4 must not create a second frontend scenario calculation/execution engine.

## Required correction

Replace this responsibility with:

> `WhatIfSimulatorPanel.tsx` is a presentation and input layer. It validates only UI-level input shape and invokes the authoritative backend What-If API. It renders the returned baseline, simulated result, assumptions, provenance, limitations and status without reproducing financial calculations.

### Mandatory architecture

```text
User Input
    ↓
Frontend validation / form UX
    ↓
Established authenticated API client
    ↓
Backend WhatIfSimulationEngine
    ↓
Authoritative simulation result
    ↓
Frontend presentation
```

The frontend must not implement:

- future value mathematics;
- retirement calculations;
- tax calculations;
- goal projection calculations;
- scenario defaults as financial truth;
- any alternative What-If engine.

The zero-write invariant belongs to the backend simulation architecture, not the React component.

---

# 3. BLOCKER – Exact API Mapping Must Be Preserved in the Actual Plan, Not Only Claimed

The revised introduction says that a “complete table of verified endpoints” exists, but the proposed service section still uses abbreviated route fragments such as:

- `/family-office/health`
- `/history`
- `/snapshot`
- `/family-office/timeline`
- `/sync`
- `/family-office/time-machine`
- `/what-if`

The final plan must show the **full exact route for every operation**, including the API version, HTTP method, request contract and response contract.

The plan should contain one table:

| UI capability | Method | Exact route | Request | Response | Mutation type | Idempotency |
|---|---|---|---|---|---|---|

This is especially important because prior Sprint 8C.3 hardening established route-level idempotency for the What-If POST endpoint. fileciteturn61file18

Do not leave path composition to implementation-time interpretation.

---

# 4. Contract Drift Strategy Still Needs to Be Explicit

The plan proposes:

```text
frontend/src/types/familyOffice.ts
```

with interfaces “mirroring backend Zod schemas.”

That can drift over time.

## Required correction

The final plan must explicitly state:

1. Why a shared contract package or generated type strategy is not currently being used, if that is the case.
2. The authoritative backend contract source.
3. Which fields/enums are duplicated manually.
4. How future changes are detected.

At minimum, add frontend contract tests using representative API fixtures for:

- FFH status enums;
- timeline event status/provenance;
- reconstruction status;
- valuation type;
- What-If scenario/result status;
- trigger status.

The frontend must never silently redefine backend semantics.

---

# 5. Navigation Plan Is Still Slightly Inconsistent With the Recommended Hybrid Architecture

The plan recommends a hybrid model but then proposes adding:

- `family-health`
- `family-timeline`
- `time-machine`

as separate tabs under both `Wealth` and `Planning`.

This risks turning one intelligence workspace into three scattered navigation destinations.

## Required correction

Choose and document the exact navigation hierarchy.

### Recommended model

```text
Dashboard
  └── compact Family Intelligence summary

Family Intelligence
  ├── Financial Health
  ├── Timeline
  └── Time Machine
```

The implementation may use existing tab architecture rather than nested routing if that is how the application currently works.

The important point is that **the three capabilities should feel like one coherent workspace**, not unrelated features.

---

# 6. Timeline Sync UX Must Be Explicit

The revised plan includes a timeline `/sync` client but must explicitly state:

- ordinary timeline page load is read-only;
- whether the user sees a “Refresh timeline projection” action;
- whether synchronization is already performed elsewhere;
- loading/disabled state during sync;
- post-sync refresh behavior;
- error behavior.

## Required guardrail

**Do not automatically invoke a mutating timeline sync merely because a user opened the Timeline page**, unless the verified existing architecture explicitly requires that behavior.

The timeline remains a derived projection, and Sprint 8C.2 established that its synchronization has a specific writable target and transactional semantics. fileciteturn60file11

---

# 7. AI Mission Control Action UX Needs More Precision

The plan mentions acknowledgement, snooze and dismiss actions but should define:

- trigger status groups shown by default;
- whether resolved/stale history is visible;
- snooze input/range based on the actual backend contract;
- whether UI updates are optimistic or server-confirmed;
- what happens after a failed action;
- how a trigger deep-links into the relevant domain.

## Required default

Use **server-confirmed state** unless existing project patterns safely support optimistic updates with rollback.

Do not assume all trigger actions share the same request body.

---

# 8. Data Fetching and State Ownership Must Be Explicit

The final plan should clearly state where:

- server/API data lives;
- request loading/error state lives;
- presentation-only state lives;
- filters live;
- scenario form state lives.

Avoid API calls directly inside multiple child components.

### Recommended principle

```text
Page/workspace
    ↓ owns data orchestration
Hooks/service layer
    ↓ owns API interaction
Presentational components
    ↓ receive typed props
```

If the existing application already uses a different established pattern, reuse it rather than introducing a competing architecture.

---

# 9. Snapshot UX Needs One Final Clarification

The backend contract intentionally distinguishes:

- `GET /health` → non-mutating
- `POST /snapshot` → explicit persistence

The final plan must confirm:

- snapshots are never created on page load;
- snapshot action is explicit;
- duplicate snapshot result is rendered as an existing snapshot, not an error;
- mutation feedback is visible;
- request idempotency follows the verified backend convention.

---

# 10. Frontend Test Plan Should Name the Actual Test Harness

The plan currently proposes:

```text
frontend/src/__tests__/familyOfficeUI.test.ts
```

This is acceptable only if it matches the existing frontend testing infrastructure.

## Required correction

Inspect and state:

- actual test runner;
- test environment;
- React/component test library, if present;
- existing frontend test conventions.

Do not introduce a one-off test framework without justification.

If no frontend component-test framework currently exists, explicitly propose the smallest justified addition and explain why.

---

# 11. Accessibility and Responsive Requirements Must Be Acceptance Criteria

The plan claims these areas are covered, but they should appear as concrete acceptance criteria:

### Accessibility
- keyboard navigation for filters and actions;
- visible focus states;
- semantic buttons;
- no color-only status meaning;
- meaningful chart labels/tooltips;
- reduced-motion compatibility where existing motion infrastructure supports it.

### Responsive
- mobile filter controls;
- holdings table fallback/scroll strategy;
- no clipped timeline controls;
- Time Machine comparison stacks vertically on narrow screens.

---

# 12. Performance Plan Must Use Measurable UI Targets

Add practical frontend targets, for example:

- no unnecessary duplicate requests when switching local presentation state;
- timeline pagination rather than loading an unbounded event set;
- avoid rendering unnecessary historical rows;
- lazy-load heavy Time Machine/visualization modules if current bundle architecture supports it;
- measure before adding virtualization.

Do not compromise data correctness to hit a rendering target.

---

# 13. Updated Required File-by-File Responsibility Matrix

Before implementation, every proposed file should have:

| File | Create/Modify | Responsibility | Exact API/Contract | Reuse | Must Not Do |
|---|---|---|---|---|---|

The most important “Must Not Do” entries are:

- services: must not calculate financial values;
- views: must not own duplicate API orchestration;
- What-If panel: must not calculate scenarios;
- Timeline UI: must not generate narratives;
- Time Machine UI: must not aggregate `SUM_ASSURED` into net worth;
- AI Mission Control: must not independently authorize family actions.

---

# 14. Final Implementation Guardrails

The Agent must preserve:

1. No frontend financial calculations.
2. No fabricated financial values.
3. `null` never silently becomes `₹0`.
4. `SUM_ASSURED` never becomes net worth.
5. Protection Shield remains separate where required.
6. Backend What-If engine remains authoritative.
7. Actual and simulated values remain visually distinct.
8. Assumptions always show provenance.
9. No hard-coded `familyId`.
10. No `x-family-id` or equivalent arbitrary family-scope header.
11. Frontend does not make authorization decisions for family scope.
12. Timeline narrative remains backend-authoritative.
13. Scheduled events remain distinct from historical events.
14. Ordinary timeline viewing should be non-mutating.
15. Snapshot persistence is explicit, never automatic.
16. Existing Phase 7 functionality remains operational.
17. Existing UI components and dependencies are reused where possible.
18. No wholesale redesign beyond Sprint 8C.4 scope.

---

# Final Decision

## 🟡 REVISE ONCE MORE – SMALL BUT IMPORTANT FINAL CORRECTION

This is **much closer to approval** than the previous plan.

I do **not** recommend another architectural redesign.

The Agent should make one final revision focused on:

### Must fix
1. Remove the “authoritative in-memory What-If executor” wording and make the backend simulation API authoritative.
2. Include the full verified API mapping table in the body of the plan.
3. Add an explicit contract-drift strategy for `familyOffice.ts`.
4. Finalize one coherent navigation hierarchy.
5. Define Timeline sync UX and mutation behavior.
6. Define AI Mission Control action behavior.
7. Name the actual frontend testing harness.
8. Convert accessibility, responsiveness and performance into measurable acceptance criteria.

---

# Required Agent Response

1. Update `prompts/Phase8C/SPRINT_8C_4_IMPLEMENTATION_PLAN.md`.
2. Return the revised final implementation plan.
3. Summarize the corrections above.
4. Explicitly confirm:
   - What-If calculations remain backend-authoritative.
   - No production code was modified.
5. **STOP. Do not begin Sprint 8C.4 implementation until approval.**
