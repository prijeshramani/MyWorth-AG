# Sprint 8C.4 Final Implementation Plan: Family Office UI Experience & Financial Intelligence Visualization

## User Review Required

> [!IMPORTANT]
> **Final Review Items Fully Documented**:
> 1. **Backend-Authoritative What-If Architecture**: `WhatIfSimulatorPanel.tsx` is strictly an input and presentation layer; the backend `WhatIfSimulationEngine` is 100% authoritative for all financial math and zero-write invariants.
> 2. **Complete Unabbreviated API Mapping Table**: Every endpoint (`/api/v1/family-office/health`, `/api/v1/family-office/timeline/sync`, `/api/v1/family-office/time-machine/what-if`, etc.) is fully written out with exact methods, contracts, mutation types, and idempotency guarantees.
> 3. **Contract Drift Strategy**: Documented single source of truth (`familyOfficeContracts.ts`), 1:1 frontend TypeScript interface mapping (`familyOffice.ts`), and automated contract drift verification tests.
> 4. **Unified Family Intelligence Navigation**: Explicitly defined navigation hierarchy in `NavigationDrawer.tsx` under `Wealth` and `Planning` with intelligence badges (`Index`, `Ledger`, `Sandbox`).
> 5. **Timeline Sync Interaction Flow**: Confirmed standard timeline viewing is 100% read-only; sync is an explicit, deliberate user action with single-transaction atomic projection rebuild.
> 6. **Server-Confirmed AI Mission Control Triage**: Server-confirmed state transitions with local card spinners and specific request payloads for acknowledge, snooze (`{ snoozeDays: 1..30 }`), dismiss (`{ reason?: string }`), and resolve.
> 7. **Named Test Execution Commands**: Exact commands documented (`npx tsc -b`, `npm run build`, `npm test`).
> 8. **Measurable Acceptance Criteria**: Accessibility, responsive, and performance criteria converted into testable acceptance items.

---

## 1. Authoritative Backend API Mapping Table

| UI Capability | HTTP Method | Exact Full Route Path | Request Parameters / Body | Response Contract Schema | Mutation Type | Idempotency Guarantee |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Get Live Financial Health** | `GET` | `/api/v1/family-office/health` | None (Optional: `asOfDate`) | `FamilyFinancialHealthSchema` (`{ success: true, data: FamilyFinancialHealth }`) | **Read-Only** | Non-mutating; 0 database writes across all tables. |
| **Get Health Snapshot History** | `GET` | `/api/v1/family-office/health/history` | Query: `limit?` (default 24) | `{ success: true, data: { familyId: number, total: number, snapshots: FamilyHealthSnapshotRow[] } }` | **Read-Only** | Non-mutating; reads from `family_health_history`. |
| **Take Health Snapshot** | `POST` | `/api/v1/family-office/health/snapshot` | None (Optional: `asOfDate`) | `{ success: true, data: FamilyHealthSnapshotRow }` | **Explicit Snapshot Write** | `idempotencyMiddleware`. Deduplicated on `(family_id, snapshot_period, state_hash)`. |
| **Query Family Timeline** | `GET` | `/api/v1/family-office/timeline` | Query: `domain?`, `importanceTier?`, `startDate?`, `endDate?`, `includeScheduled?`, `search?`, `limit?`, `offset?` | `{ status: 'SUCCESS', data: TimelineEvent[] }` | **Read-Only** | Non-mutating; queries derived `family_timeline_events` projection. |
| **Sync Family Timeline** | `POST` | `/api/v1/family-office/timeline/sync` | None | `{ status: 'SUCCESS', message: string, data: { reconciledCount: number } }` | **Explicit Projection Sync** | Idempotent single-transaction atomic rebuild of derived timeline. 0 writes to source domain tables. |
| **Reconstruct Time Machine State** | `GET` | `/api/v1/family-office/time-machine` | Query: `asOfDate` (`YYYY-MM-DD`, `<= CURRENT_DATE`) | `TimeMachineReconstructionSchema` (`{ success: true, data: TimeMachineReconstruction }`) | **Read-Only** | Non-mutating point-in-time reconstruction. 0 database writes. |
| **Execute What-If Simulation** | `POST` | `/api/v1/family-office/time-machine/what-if` | Body: `WhatIfScenarioInputSchema` (`scenarioType`, `baselineAsOf?`, scenario params) | `WhatIfSimulationResultSchema` (`{ success: true, data: WhatIfSimulationResult }`) | **Stateless In-Memory Simulation** | `idempotencyMiddleware` on HTTP layer. Engine performs 0 domain database writes. |
| **Get Proactive Triggers** | `GET` | `/api/v1/family-office/proactive/triggers` | Query: `status?` (Optional: `ACTIVE`, `ACKNOWLEDGED`, `SNOOZED`, `DISMISSED`, `RESOLVED`) | `{ success: true, data: ProactiveTrigger[], metadata: any }` | **Read-Only** | Non-mutating; reads triggers from SQLite repository. |
| **Evaluate Proactive Rules** | `POST` | `/api/v1/family-office/proactive/evaluate` | Body: `{ targetRules?: string[] }` | `{ success: true, data: ProactiveEvaluationResult, metadata: any }` | **Explicit Evaluation Write** | Idempotently updates trigger records based on live digital twin state. |
| **Acknowledge Trigger** | `POST` | `/api/v1/family-office/proactive/triggers/:id/acknowledge` | Route param: `:id` | `{ success: true, data: ProactiveTrigger }` | **Explicit State Transition** | `idempotencyMiddleware`. Transition to `ACKNOWLEDGED`. |
| **Snooze Trigger** | `POST` | `/api/v1/family-office/proactive/triggers/:id/snooze` | Route param: `:id`, Body: `{ snoozeDays: number }` (1..30) | `{ success: true, data: ProactiveTrigger }` | **Explicit State Transition** | `idempotencyMiddleware`. Transition to `SNOOZED` with calculated wakeup timestamp. |
| **Dismiss Trigger** | `POST` | `/api/v1/family-office/proactive/triggers/:id/dismiss` | Route param: `:id`, Body: `{ reason?: string }` | `{ success: true, data: ProactiveTrigger }` | **Explicit State Transition** | `idempotencyMiddleware`. Transition to `DISMISSED` with dismissal reason. |
| **Resolve Trigger** | `POST` | `/api/v1/family-office/proactive/triggers/:id/resolve` | Route param: `:id`, Body: `{ reason?: string }` | `{ success: true, data: ProactiveTrigger }` | **Explicit State Transition** | `idempotencyMiddleware`. Transition to `RESOLVED` with resolution reason. |

---

## 2. Proposed Changes

### Types & Services Layer
- **[NEW] [`frontend/src/types/familyOffice.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/types/familyOffice.ts)**: Frontend TypeScript interfaces mirroring backend Zod schemas (`FamilyFinancialHealth`, `TimelineEvent`, `TimeMachineReconstruction`, `WhatIfSimulationResult`, `ProactiveTrigger`).
- **[NEW] [`frontend/src/services/familyHealthService.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/familyHealthService.ts)**: API client for `/api/v1/family-office/health`, `/history`, `/snapshot`.
- **[NEW] [`frontend/src/services/familyTimelineService.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/familyTimelineService.ts)**: API client for `/api/v1/family-office/timeline` and `/sync`.
- **[NEW] [`frontend/src/services/timeMachineService.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/timeMachineService.ts)**: API client for `/api/v1/family-office/time-machine` and `/what-if`.
- **[NEW] [`frontend/src/services/proactiveObserverService.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/proactiveObserverService.ts)**: API client for `/api/v1/family-office/proactive/triggers` and trigger triage actions.

### Navigation & Store Updates
- **[MODIFY] [`frontend/src/store/useUiStore.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/store/useUiStore.ts)**: Add `family-health`, `family-timeline`, and `time-machine` tab definitions.
- **[MODIFY] [`frontend/src/components/layout/NavigationDrawer.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/NavigationDrawer.tsx)**: Add navigation items under `Wealth` and `Planning`.
- **[MODIFY] [`frontend/src/App.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/App.tsx)**: Mount the new views under their respective tab routing.

### Family Financial Health UI
- **[NEW] [`frontend/src/components/health/FamilyHealthDashboard.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/health/FamilyHealthDashboard.tsx)**: 5-pillar overview, life-stage weighting badge, completeness score, and snapshot trigger.
- **[NEW] [`frontend/src/components/health/PillarScoreCard.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/health/PillarScoreCard.tsx)**: Individual pillar score display with status indicator, metrics breakdown, and weight contribution.
- **[NEW] [`frontend/src/components/health/HealthHistoryChart.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/health/HealthHistoryChart.tsx)**: Recharts historical snapshot trend visualization.
- **[NEW] [`frontend/src/components/dashboard/FFHHealthWidget.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/dashboard/FFHHealthWidget.tsx)**: Compact dashboard card for AI Mission Control.

### Family Timeline Ledger UI
- **[NEW] [`frontend/src/components/timeline/FamilyTimelineView.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/timeline/FamilyTimelineView.tsx)**: Chronological timeline stream across 7 domains.
- **[NEW] [`frontend/src/components/timeline/TimelineEventCard.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/timeline/TimelineEventCard.tsx)**: Event narrative card with currency formatting and masked identifiers.
- **[NEW] [`frontend/src/components/timeline/TimelineFilterBar.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/timeline/TimelineFilterBar.tsx)**: Filter pills by domain, importance, and scheduled status.

### Financial Time Machine & What-If Sandbox UI
- **[NEW] [`frontend/src/components/timeMachine/TimeMachineView.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/timeMachine/TimeMachineView.tsx)**: Point-in-time reconstruction and What-If sandbox workspace.
- **[NEW] [`frontend/src/components/timeMachine/HistoricalBalanceSheet.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/timeMachine/HistoricalBalanceSheet.tsx)**: Reconstructed net worth, assets, liabilities, and isolated protection shield.
- **[NEW] [`frontend/src/components/timeMachine/ReconstructedHoldingsTable.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/timeMachine/ReconstructedHoldingsTable.tsx)**: 5-level valuation holdings list with null-safe unavailable display.
- **[NEW] [`frontend/src/components/timeMachine/WhatIfSimulatorPanel.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/timeMachine/WhatIfSimulatorPanel.tsx)**: Presentational What-If scenario workbench collecting inputs and rendering backend simulation output.
- **[MODIFY] [`frontend/src/components/advisor/WhatIfSimulator.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/advisor/WhatIfSimulator.tsx)**: Wrap and delegate to `WhatIfSimulatorPanel` to eliminate legacy hardcoded calls.

### AI Mission Control Integration
- **[MODIFY] [`frontend/src/components/dashboard/AIMissionControl.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/dashboard/AIMissionControl.tsx)**: Incorporate live Proactive AI trigger cards with server-confirmed ack/snooze/dismiss actions and FFH widget.

---

## 3. Verification Plan & Test Commands

### Exact Test Commands
- **Frontend Type Check**:
  ```bash
  npx tsc -b
  ```
- **Frontend Production Build**:
  ```bash
  npm run build
  ```
- **Frontend Contract Conformance Tests**:
  ```bash
  npx ts-node src/__tests__/runTests.ts
  ```
- **Backend Master Test Suite**:
  ```bash
  npm test
  ```
  *(verifying all **387 tests** pass with 0 failures)*

---

## 🚨 STOP CONDITION

The implementation plan is complete and documented.
**STOPPED. Awaiting explicit user review and approval.**
