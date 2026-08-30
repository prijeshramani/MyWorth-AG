# Sprint 8C.4 Final Implementation Plan – Review & Approval Decision

## Overall Verdict

# 🟡 REVISE ONE FINAL TIME BEFORE IMPLEMENTATION

This revision is materially better and correctly addresses the most important architectural blocker from the previous review: **the frontend is no longer described as an authoritative What-If calculation engine**. The plan explicitly positions `WhatIfSimulatorPanel.tsx` as an input/presentation layer and keeps the backend `WhatIfSimulationEngine` authoritative. fileciteturn64file0

However, the plan **still does not fully contain several items it claims are addressed**. These are primarily precision and implementation-readiness issues, not a need for another redesign.

The Agent should make one final documentation-only revision. **No production code should be modified yet.**

---

# 1. What Is Approved in Principle

The following directions are correct:

## 1.1 What-If authority

The revised plan correctly states that the frontend collects scenario inputs and renders backend simulation output rather than performing financial mathematics itself.

**This must remain unchanged.**

The frontend must not implement:

- tax calculations;
- retirement mathematics;
- investment return calculations;
- goal projection mathematics;
- fabricated income defaults;
- independent scenario assumptions treated as financial truth.

fileciteturn64file0

---

## 1.2 Explicit Timeline sync

The plan correctly states that standard timeline viewing is read-only and synchronization is an explicit action.

This is aligned with the Timeline Ledger architecture.

---

## 1.3 Fiduciary display separation

The proposed UI structure correctly includes:

- null-safe unavailable values;
- separate Protection Shield;
- reconstructed holdings;
- assumption provenance;
- status indicators;
- scheduled-event filtering.

The implementation must preserve these semantics.

---

## 1.4 Explicit snapshot action

The plan correctly proposes a snapshot trigger rather than automatic snapshot creation during normal health-page viewing.

This distinction must remain explicit during implementation.

---

# 2. BLOCKER – The Claimed Full API Mapping Table Is Missing From the Actual Plan

The opening section states:

> “Full Exact API Paths: Preserved the complete table of full endpoint paths, methods, request/response contracts, and idempotency guarantees in the plan body.”

But the actual plan body only contains abbreviated service descriptions such as:

- `/api/v1/family-office/health`, `/history`, `/snapshot`
- `/api/v1/family-office/timeline` and `/sync`
- `/api/v1/family-office/time-machine` and `/what-if`

There is **no actual endpoint mapping table** in the supplied plan. fileciteturn64file0

## Required correction

Add this exact section before implementation:

| UI Capability | Method | Exact Backend Route | Request Contract | Response Contract | Read/Write | Idempotency |
|---|---|---|---|---|---|---|

Populate it from the **actual existing backend routes and contracts**, not assumptions.

### Mandatory entries

At minimum include:

- Family Health live evaluation
- Family Health history
- Family Health snapshot
- Timeline query
- Timeline synchronization
- Time Machine reconstruction
- What-If simulation
- Proactive trigger list
- Acknowledge
- Snooze
- Dismiss
- Resolve, if surfaced by the UI

### Important

Do not use shorthand such as:

```text
/history
/snapshot
/sync
/what-if
```

The implementation plan must contain the complete verified route.

---

# 3. BLOCKER – Navigation Hierarchy Is Still Internally Inconsistent

The plan claims a:

> “Coherent Navigation Hierarchy”

but then says:

- add navigation items under `Wealth` **and** `Planning`;
- add three independent tab definitions;
- mount views under their “respective tab routing.”

This can still result in the three Family Intelligence capabilities being scattered across unrelated areas. fileciteturn64file0

## Required correction

Document the **exact final navigation tree**.

### Recommended architecture

```text
Dashboard
  └── Family Intelligence summary

Family Intelligence
  ├── Financial Health
  ├── Timeline Ledger
  └── Time Machine
       └── What-If Sandbox
```

If the current application cannot introduce a new top-level workspace without unnecessary structural change, document the closest equivalent using the existing tab architecture.

### The key invariant

The three Sprint 8C intelligence capabilities must feel like **one coherent Family Intelligence experience**, not unrelated pages duplicated across Wealth and Planning.

---

# 4. BLOCKER – Contract Drift Strategy Is Declared but Not Fully Defined

The plan says:

> `familyOfficeContracts.ts` is the single source of truth.

and proposes:

> `frontend/src/types/familyOffice.ts` as a 1:1 mapping.

This is directionally correct, but the implementation plan does not define **how the mapping is actually verified**. fileciteturn64file0

## Required correction

Add a subsection:

## Contract Authority and Drift Prevention

It must explicitly define:

1. **Authoritative source**
   - backend `familyOfficeContracts.ts`

2. **Frontend role**
   - presentation-facing TypeScript representation only

3. **Drift prevention mechanism**
   - representative backend-shaped fixtures
   - enum/status compatibility tests
   - compile-time checks where possible

4. **Change rule**
   - backend contract changes must update frontend types and fixtures in the same change

5. **No semantic reinterpretation**
   - frontend cannot redefine status or provenance meanings

---

# 5. IMPORTANT – The Test Harness Is Still Not Actually Named

The plan says the validation includes:

- `npx tsc -b`
- `vite build`
- backend `npm test`
- frontend tests in `frontend/src/__tests__/contracts.test.ts`

But a test **file path is not a test harness**. The plan does not explicitly state what command runs that frontend test and which framework executes it. fileciteturn64file0

## Required correction

The Agent must inspect the current frontend project and document:

- package manager command;
- actual test runner;
- actual component/DOM testing library, if present;
- test environment;
- exact command for frontend tests.

### Example structure only

```text
Frontend type check:
<actual command>

Frontend unit/contract tests:
<actual command>

Frontend production build:
<actual command>
```

Do not introduce a new framework unless the codebase genuinely lacks the capability and there is a documented justification.

---

# 6. IMPORTANT – AI Mission Control Payloads Must Be Verified Against Backend Contracts

The plan specifies:

- snooze: `{ snoozeDays: 1..30 }`
- dismiss: `{ reason?: string }`

These payload shapes and ranges must be verified against the actual backend controller/route schemas before implementation.

The supplied plan states them as facts but does not show the authoritative contract reference. fileciteturn64file0

## Required correction

In the endpoint mapping table, include exact request schemas.

### Also define

For each action:

- loading state;
- disabled state;
- success refresh behavior;
- error behavior;
- server-confirmed versus optimistic update.

### Required default

Use **server-confirmed updates** unless the existing frontend architecture has an established optimistic-update pattern with safe rollback.

---

# 7. IMPORTANT – Timeline Sync UX Needs a Concrete User Flow

The plan correctly states sync is explicit, but it does not describe the complete interaction.

Add:

```text
User opens Timeline
        ↓
Read-only GET timeline query
        ↓
User explicitly chooses Refresh / Sync
        ↓
POST sync endpoint
        ↓
Button disabled + progress/loading state
        ↓
Server response
        ↓
Refresh timeline query
        ↓
Show success or failure feedback
```

## Required invariant

**Opening or filtering the Timeline page must not automatically invoke the mutating sync endpoint**, unless verified existing architecture explicitly requires it.

---

# 8. IMPORTANT – Data Fetching and State Ownership Must Be Defined

The current plan lists services and components but does not clearly define ownership.

## Required architecture

Use the existing project pattern, but the plan must document the equivalent of:

```text
Workspace / Page
    ↓
Owns data orchestration

Service or existing data-access layer
    ↓
Owns API calls

Presentational components
    ↓
Receive typed props

Local UI state
    ↓
Filters, expanded cards, selected date,
scenario form inputs
```

Avoid multiple child components independently fetching the same authoritative data.

---

# 9. IMPORTANT – What-If UX Must Clearly Distinguish Validation Layers

The corrected architecture should distinguish:

## Frontend validation

Allowed:

- required fields;
- numeric input shape;
- valid ranges when those ranges are UI safety rules;
- date/input formatting;
- disabled submit for obviously invalid input.

## Backend authority

Only backend determines:

- whether the scenario is financially computable;
- whether data is insufficient;
- assumptions used;
- provenance;
- calculation confidence;
- baseline limitations;
- simulation result.

The frontend must render backend `INSUFFICIENT_DATA` or other status results faithfully rather than attempting to “fix” them.

---

# 10. IMPORTANT – Family Health Display Acceptance Rules Need to Be Explicit

Add these UI rules:

| Backend semantic | Required UI behavior |
|---|---|
| `null` amount | `Unavailable` / `Not available`, not `₹0` |
| `KNOWN_ZERO` | Explicit zero where the backend has established a true zero |
| `UNKNOWN` | Unknown state |
| `INSUFFICIENT_DATA` | Explain data is insufficient |
| `PARTIAL` | Show partial confidence/completeness |
| `STALE` | Show stale indicator |
| `NOT_APPLICABLE` | Do not imply failure or missing data |

The UI must never infer a semantic meaning merely from the absence of a number.

---

# 11. IMPORTANT – Historical Balance Sheet Must Have Explicit Net Worth Rules

The plan mentions assets, liabilities and Protection Shield.

Add an explicit acceptance criterion:

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

Also ensure unavailable valuations are not silently included as zero in aggregate totals unless the backend reconstruction explicitly provides that aggregate.

The frontend should preferably render backend-authoritative aggregate values rather than recomputing financial totals.

---

# 12. IMPORTANT – Accessibility and Responsive Criteria Should Be More Concrete

The plan says measurable criteria exist, but they are not shown in the supplied implementation details.

Add:

## Accessibility

- all interactive controls keyboard accessible;
- visible focus indicators;
- buttons have semantic labels;
- status is not conveyed by color alone;
- charts have accessible labels or equivalent textual summaries;
- loading/error states are announced through appropriate accessible patterns already used by the application.

## Responsive

- Family Health cards stack cleanly;
- Timeline filters do not clip horizontally without an intentional scroll strategy;
- reconstructed holdings remain usable on narrow screens;
- What-If comparison layout stacks vertically on mobile;
- Mission Control actions remain reachable without hover-only interactions.

---

# 13. IMPORTANT – Performance Acceptance Criteria Should Avoid Premature Optimization

Add:

- timeline queries use existing pagination/filter contracts where available;
- avoid duplicate requests caused by local UI state changes;
- do not load unbounded history when pagination is available;
- avoid unnecessary recalculation in React render paths;
- evaluate virtualization only if measured data volume requires it;
- do not compromise financial correctness for rendering performance.

---

# 14. Required File-by-File Matrix

Before implementation, add a final matrix:

| File | New/Modify | Responsibility | API/Contract | Reuse | Must Not Do |
|---|---|---|---|---|---|

### Critical “Must Not Do” examples

**familyOffice.ts**
- Must not become an independent business-rules source.

**WhatIfSimulatorPanel.tsx**
- Must not perform financial calculations.

**FamilyTimelineView.tsx**
- Must not generate deterministic narratives independently.

**HistoricalBalanceSheet.tsx**
- Must not add `SUM_ASSURED` to net worth.

**FFHHealthWidget.tsx**
- Must not create snapshots automatically.

**AI Mission Control**
- Must not make family-scope authorization decisions.

---

# 15. Final Implementation Guardrails

The implementation must preserve all of the following:

1. Backend engines remain authoritative for financial calculations.
2. No duplicate frontend financial calculation engine.
3. No fabricated values or default income.
4. `null` must never silently render as `₹0`.
5. `KNOWN_ZERO` remains distinct from missing data.
6. `SUM_ASSURED` never becomes net worth.
7. Protection Shield remains isolated where applicable.
8. Actual and simulated values remain visually distinct.
9. Assumptions display provenance.
10. No hard-coded `familyId`.
11. No client-controlled family scope header.
12. Frontend does not make authorization decisions.
13. Timeline remains a derived projection.
14. Timeline viewing is read-only.
15. Timeline synchronization is explicit.
16. Snapshot persistence is explicit.
17. Backend response statuses are rendered faithfully.
18. Existing Phase 7 UI and business behavior must not regress.
19. Reuse existing UI primitives and dependencies where practical.
20. No wholesale redesign outside Sprint 8C.4 scope.

---

# Final Decision

## 🟡 FINAL DOCUMENTATION REVISION REQUIRED

The plan is **very close to approval**.

The Agent does not need another architectural redesign.

It must make one final revision to correct the mismatch between the claimed plan completeness and the actual plan body.

## Mandatory final corrections

1. Add the complete verified API mapping table.
2. Finalize one explicit navigation hierarchy.
3. Define contract drift prevention concretely.
4. Name the actual frontend test harness and commands.
5. Verify AI trigger action payloads against actual backend schemas.
6. Add complete Timeline sync user flow.
7. Define data-fetching/state ownership.
8. Add explicit UI semantics for all health statuses.
9. Add explicit net-worth versus Protection Shield rules.
10. Add the file-by-file responsibility matrix.
11. Include the measurable accessibility, responsive and performance criteria in the plan body.

---

# Required Agent Response

1. Update `prompts/Phase8C/SPRINT_8C_4_IMPLEMENTATION_PLAN.md`.
2. Return the final revised implementation plan.
3. Confirm every mandatory correction above is addressed.
4. Confirm **no production code has been modified**.
5. **STOP and wait for approval. Do not start implementation.**

Once those items are visibly incorporated into the plan itself, the plan should be ready for implementation approval.
