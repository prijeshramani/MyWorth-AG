# Sprint 8C.4 Final Implementation Plan – Final Review

## Overall Verdict

# 🟢 APPROVED WITH TWO IMPLEMENTATION-TIME GUARDRAILS

The revised plan has addressed the major blockers from the previous reviews:

- the frontend What-If experience is explicitly presentation/input only;
- full backend route paths are documented;
- mutation versus read-only behavior is identified;
- timeline synchronization is explicitly separated from timeline viewing;
- server-confirmed AI trigger actions are defined;
- frontend test commands are now named;
- the scope is clearly limited to the Sprint 8C.4 UI experience.

The plan is sufficiently mature to begin implementation.

No further plan-revision cycle is required before coding.

---

# 1. APPROVED: Backend-Authoritative What-If Architecture

The plan explicitly states that `WhatIfSimulatorPanel.tsx` only:

1. collects scenario inputs; and
2. renders the backend simulation result.

The backend `WhatIfSimulationEngine` remains authoritative for financial mathematics and the zero-write invariant.

## Implementation invariant

The frontend must not implement or duplicate:

- tax calculations;
- investment return calculations;
- retirement mathematics;
- goal projection mathematics;
- fabricated income defaults;
- financial fallback assumptions treated as facts.

Frontend validation may validate input shape and basic UX constraints, but the backend remains authoritative for computability, assumptions, provenance, missing-data status, and results.

---

# 2. APPROVED: API Mapping

The plan now contains a useful full-path API mapping table.

The implementation team must treat the actual backend controller/route contracts as authoritative at coding time.

## Guardrail A – Verify, do not assume

Before wiring each service method, verify:

- exact route;
- HTTP method;
- query parameter names;
- request body schema;
- response envelope;
- error envelope;
- idempotency requirement.

If an implementation differs from the table, **do not silently change backend or frontend behavior**. Record the discrepancy and resolve it against the authoritative existing backend contract.

This is especially important for:

- optional `asOfDate`;
- timeline query response shape;
- proactive trigger status values;
- `snoozeDays` validation;
- optional dismiss/resolve reason payloads.

---

# 3. REQUIRED IMPLEMENTATION GUARDRAIL: Navigation Must Remain Coherent

The plan still says navigation items will be added under both `Wealth` and `Planning`, while the broader goal is a unified Family Intelligence experience.

## Approved implementation direction

Before modifying `NavigationDrawer.tsx`, inspect the existing navigation architecture and implement **one coherent hierarchy**, without duplicate destinations.

Preferred conceptual hierarchy:

```text
Family Intelligence
  ├── Financial Health
  ├── Timeline Ledger
  └── Time Machine
       └── What-If
```

However, the implementation should adapt this to the existing application navigation structure rather than introducing a disruptive new navigation system.

## Acceptance criterion

A user must be able to understand that Financial Health, Timeline, and Time Machine belong to the same financial-intelligence capability.

Do not create duplicate navigation entries pointing to the same view merely to place one item under both `Wealth` and `Planning`.

---

# 4. REQUIRED IMPLEMENTATION GUARDRAIL: Contract Drift Prevention

The plan correctly identifies:

- backend `familyOfficeContracts.ts` as authoritative;
- `frontend/src/types/familyOffice.ts` as the frontend representation.

## Required rule

`familyOffice.ts` must remain a **presentation-facing mirror**, not an independent source of business semantics.

The implementation must:

1. preserve backend enum and status meanings;
2. use representative backend-shaped fixtures in frontend tests;
3. avoid reinterpreting provenance/status values;
4. update frontend types whenever an authoritative backend contract changes.

The frontend must never redefine what:

- `KNOWN_ZERO`;
- `UNKNOWN`;
- `INSUFFICIENT_DATA`;
- `PARTIAL`;
- `STALE`;
- `NOT_APPLICABLE`

mean.

---

# 5. REQUIRED IMPLEMENTATION GUARDRAIL: Health UI Data Semantics

The UI must faithfully distinguish backend data states.

| Backend semantic | Required UI behavior |
|---|---|
| `null` value | Show `Unavailable` / `Not available`; never silently render as ₹0 |
| `KNOWN_ZERO` | Display an explicit zero where the backend established a true zero |
| `UNKNOWN` | Clearly identify as unknown |
| `INSUFFICIENT_DATA` | Explain that available data is insufficient |
| `PARTIAL` | Show partial status/completeness |
| `STALE` | Show stale state |
| `NOT_APPLICABLE` | Do not imply failure or missing data |

No component may infer that a missing numeric value means zero.

---

# 6. REQUIRED IMPLEMENTATION GUARDRAIL: Historical Net Worth

`HistoricalBalanceSheet.tsx` must preserve the Financial Time Machine valuation semantics.

## Mandatory invariant

```text
Net Worth
=
Eligible reconstructed assets
-
Eligible reconstructed liabilities

Protection Shield
=
Displayed separately

SUM_ASSURED
≠
Net Worth
```

The frontend should display backend-authoritative aggregate values wherever they are available.

It must not independently include unavailable valuations as zero merely to produce a client-side total.

---

# 7. APPROVED: Timeline Read/Write Separation

The plan correctly distinguishes:

- `GET /api/v1/family-office/timeline` → read-only;
- `POST /api/v1/family-office/timeline/sync` → explicit projection synchronization.

## Required interaction flow

```text
Open Timeline
    ↓
GET timeline
    ↓
Filter/search locally or through GET query parameters
    ↓
No automatic synchronization write
    ↓
User explicitly chooses Refresh / Sync
    ↓
POST timeline sync
    ↓
Show loading state and prevent duplicate action
    ↓
Server confirms completion
    ↓
Refresh GET timeline
    ↓
Show success or actionable error feedback
```

The UI must not invoke the sync endpoint merely because the Timeline page mounts.

---

# 8. APPROVED: What-If UX Boundary

`WhatIfSimulatorPanel.tsx` may own local UI state such as:

- selected scenario type;
- input fields;
- form validation state;
- loading state;
- selected comparison display.

The backend remains responsible for:

- scenario computation;
- missing-data determination;
- assumptions;
- provenance;
- baseline limitations;
- confidence/status;
- financial results.

If the backend returns `INSUFFICIENT_DATA`, the frontend must display that result faithfully.

It must not invent a substitute assumption to force a result.

---

# 9. APPROVED: AI Mission Control Integration

The server remains authoritative for trigger transitions.

For acknowledge, snooze, dismiss and resolve:

1. show a local action loading state;
2. prevent duplicate clicks for the affected card;
3. submit the verified backend payload;
4. wait for server confirmation;
5. update/refresh from the confirmed response;
6. display actionable error feedback on failure.

Do not remove a trigger card optimistically unless the existing application has a safe, established rollback mechanism.

---

# 10. Data Fetching and Component Ownership

Use the existing application pattern, but maintain this separation:

```text
Page / Workspace
    ↓
Owns data orchestration

Service layer
    ↓
Owns API communication

Presentational components
    ↓
Receive typed props

Local component state
    ↓
Filters, expansion, selected dates,
form fields and transient UI state
```

Avoid several child components independently fetching the same authoritative dataset.

---

# 11. Test Verification Requirements

The plan documents these commands:

```bash
npx tsc -b
npm run build
npx ts-node src/__tests__/runTests.ts
npm test
```

Before implementation begins, the Agent should confirm the frontend contract-test command is executable from the documented working directory.

## Minimum new frontend coverage

Add tests for:

1. representative Family Financial Health contract parsing/usage;
2. null versus `KNOWN_ZERO` display behavior;
3. status display semantics;
4. `SUM_ASSURED` isolation from net worth presentation;
5. What-If input/result separation;
6. Timeline view does not automatically call sync;
7. explicit sync refresh behavior;
8. trigger action loading/error behavior;
9. frontend type compatibility with representative backend responses.

## Regression requirement

The backend baseline must remain green.

The implementation must not reduce or weaken existing tests merely to obtain a passing result.

---

# 12. Accessibility and Responsive Acceptance Criteria

The implementation must satisfy:

## Accessibility

- keyboard-accessible interactive controls;
- visible focus behavior consistent with the existing design system;
- semantic labels for icon-only actions;
- status not communicated by color alone;
- accessible text equivalent for charts or critical visual-only information;
- accessible loading and error feedback.

## Responsive behavior

- Financial Health cards stack cleanly on narrow screens;
- Timeline filters remain usable without clipped controls;
- holdings tables have an intentional small-screen strategy;
- Time Machine comparison views stack or adapt cleanly;
- Mission Control actions do not depend on hover-only behavior.

---

# 13. Performance Acceptance Criteria

Do not introduce premature optimization.

The implementation must:

- respect backend pagination where available;
- avoid duplicate API requests from unnecessary rerenders;
- avoid loading unbounded historical datasets when pagination exists;
- avoid duplicating expensive transformations across components;
- only introduce virtualization if measured data volume requires it;
- never compromise financial correctness for rendering performance.

---

# 14. File-Level Responsibility Guardrails

| Area | Responsibility | Must Not Do |
|---|---|---|
| `familyOffice.ts` | Frontend contract representation | Become an independent business-rule source |
| Health service | API communication | Recalculate FFH |
| Timeline service | API communication | Generate authoritative timeline events |
| `FamilyTimelineView.tsx` | Display/query interaction | Automatically mutate source data |
| `WhatIfSimulatorPanel.tsx` | Input and result presentation | Perform financial mathematics |
| `HistoricalBalanceSheet.tsx` | Render reconstructed state | Add `SUM_ASSURED` into net worth |
| `FFHHealthWidget.tsx` | Display health summary | Automatically persist snapshots |
| Mission Control | Present and submit actions | Decide family authorization |

---

# 15. Implementation Sequence

Proceed in this order:

1. Inspect existing frontend architecture and verify exact backend contracts.
2. Create/align frontend contract types and service clients.
3. Add frontend contract fixtures/tests.
4. Establish the final non-duplicated navigation integration.
5. Implement Family Financial Health UI.
6. Implement Timeline Ledger UI.
7. Implement Time Machine and What-If UI.
8. Integrate FFH and proactive triggers into AI Mission Control.
9. Add responsive/accessibility refinements.
10. Run all documented verification commands.
11. Perform manual regression checks on existing Phase 7 UI.
12. Update output review documentation and stop.

---

# FINAL APPROVAL

## 🟢 APPROVED TO BEGIN SPRINT 8C.4 IMPLEMENTATION

The Agent may now begin coding Sprint 8C.4.

## Mandatory implementation constraints

- Do not change backend financial semantics merely to simplify the UI.
- Do not duplicate backend financial engines in the frontend.
- Do not fabricate unavailable financial data.
- Do not convert `null` into zero.
- Do not include `SUM_ASSURED` in net worth.
- Do not hard-code family scope.
- Do not let client navigation determine authorization.
- Do not auto-sync the Timeline on page load.
- Do not auto-create Health snapshots on page load.
- Preserve existing Phase 7 behavior unless a change is explicitly required by Sprint 8C.4.
- Reuse existing UI primitives and dependencies where practical.
- Keep changes within Sprint 8C.4 scope.

---

# Required Stop Condition

After implementation:

1. run all backend and frontend verification commands;
2. provide the complete Sprint 8C.4 output summary;
3. provide updated test counts and build results;
4. list all files created/modified;
5. document any deviations from the approved plan;
6. **STOP and wait for review before beginning Sprint 8C.5 or any subsequent work.**
