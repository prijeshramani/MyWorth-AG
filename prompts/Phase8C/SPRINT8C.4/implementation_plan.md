# Sprint 8C.4: Family Office UI Experience & Financial Intelligence Visualization

## Overview
Sprint 8C.4 delivers the frontend/UI experience for the Family Office intelligence capabilities developed during Phase 8B and Phase 8C.
This includes:
1. **Family Financial Health (FFH)** composite index, 5-pillar breakdown, life-stage weighting, and historical trend charts.
2. **Family Timeline Ledger** 7-domain chronological stream with scheduled vs historical separation and currency-formatted narratives.
3. **Financial Time Machine** point-in-time balance sheet reconstruction with 5-level valuation hierarchy and null-safe unpriced asset handling.
4. **What-If Simulation Sandbox** zero-write in-memory scenario workbench with assumption provenance (`USER_PROVIDED`, `FAMILY_PROFILE`, `SYSTEM_ASSUMPTION`).
5. **AI Mission Control** consolidated proactive fiduciary trigger stream with interactive acknowledgement, snooze, and dismissal controls.

---

## User Review Required

> [!IMPORTANT]
> **Strict Fiduciary UX & Security Invariants**:
> - **Zero Frontend Calculations**: All financial intelligence, scores, valuations, and projections are computed strictly by backend engines.
> - **No False Zeroes**: Missing historical valuations or unverified income fields strictly display as `Historical value unavailable` or `INSUFFICIENT_DATA`, never coerced to `₹0.00`.
> - **Zero Database Writes in Simulation**: What-If simulation is in-memory only and clearly demarcated from authoritative family data.
> - **No Hardcoded `familyId = 1`**: All API requests leverage authenticated session context (`CorrelationContext.getFamilyId()`).

---

## Proposed Changes

### 1. Types & Services Layer
- **[NEW] [`frontend/src/types/familyOffice.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/types/familyOffice.ts)**: Frontend TypeScript interfaces mirroring backend Zod schemas (`FamilyFinancialHealth`, `TimelineEvent`, `TimeMachineReconstruction`, `WhatIfSimulationResult`, `ProactiveTrigger`).
- **[NEW] [`frontend/src/services/familyHealthService.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/familyHealthService.ts)**: API calls for `/family-office/health`, `/history`, `/snapshot`.
- **[NEW] [`frontend/src/services/familyTimelineService.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/familyTimelineService.ts)**: API calls for `/family-office/timeline` and `/sync`.
- **[NEW] [`frontend/src/services/timeMachineService.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/timeMachineService.ts)**: API calls for `/family-office/time-machine` and `/what-if`.
- **[NEW] [`frontend/src/services/proactiveObserverService.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/proactiveObserverService.ts)**: API calls for `/family-office/proactive/triggers` and trigger actions.

### 2. Navigation & Store Updates
- **[MODIFY] [`frontend/src/store/useUiStore.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/store/useUiStore.ts)**: Add `family-health`, `family-timeline`, and `time-machine` to tab definitions.
- **[MODIFY] [`frontend/src/components/layout/NavigationDrawer.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/NavigationDrawer.tsx)**: Add navigation items under `Core` and `Planning`.
- **[MODIFY] [`frontend/src/App.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/App.tsx)**: Mount the new views under their respective tab routing.

### 3. Family Financial Health UI
- **[NEW] [`frontend/src/components/health/FamilyHealthDashboard.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/health/FamilyHealthDashboard.tsx)**: 5-pillar overview, life-stage weighting badge, completeness score, and snapshot trigger.
- **[NEW] [`frontend/src/components/health/PillarScoreCard.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/health/PillarScoreCard.tsx)**: Individual pillar score display with status indicator, metrics breakdown, and weight contribution.
- **[NEW] [`frontend/src/components/health/HealthHistoryChart.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/health/HealthHistoryChart.tsx)**: Recharts historical snapshot trend visualization.
- **[NEW] [`frontend/src/components/dashboard/FFHHealthWidget.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/dashboard/FFHHealthWidget.tsx)**: Compact dashboard card for AI Mission Control.

### 4. Family Timeline Ledger UI
- **[NEW] [`frontend/src/components/timeline/FamilyTimelineView.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/timeline/FamilyTimelineView.tsx)**: Chronological timeline stream across 7 domains.
- **[NEW] [`frontend/src/components/timeline/TimelineEventCard.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/timeline/TimelineEventCard.tsx)**: Event narrative card with currency formatting and masked identifiers.
- **[NEW] [`frontend/src/components/timeline/TimelineFilterBar.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/timeline/TimelineFilterBar.tsx)**: Filter pills by domain, importance, and scheduled status.

### 5. Financial Time Machine & What-If Sandbox UI
- **[NEW] [`frontend/src/components/timeMachine/TimeMachineView.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/timeMachine/TimeMachineView.tsx)**: Point-in-time reconstruction and What-If sandbox workspace.
- **[NEW] [`frontend/src/components/timeMachine/HistoricalBalanceSheet.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/timeMachine/HistoricalBalanceSheet.tsx)**: Reconstructed net worth, assets, liabilities, and isolated protection shield.
- **[NEW] [`frontend/src/components/timeMachine/ReconstructedHoldingsTable.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/timeMachine/ReconstructedHoldingsTable.tsx)**: 5-level valuation holdings list with null-safe unavailable display.
- **[NEW] [`frontend/src/components/timeMachine/WhatIfSimulatorPanel.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/timeMachine/WhatIfSimulatorPanel.tsx)**: Authoritative in-memory What-If scenario executor with assumption provenance breakdown.
- **[MODIFY] [`frontend/src/components/advisor/WhatIfSimulator.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/advisor/WhatIfSimulator.tsx)**: Wrap and delegate to `WhatIfSimulatorPanel` to eliminate legacy hardcoded calls.

### 6. AI Mission Control Integration
- **[MODIFY] [`frontend/src/components/dashboard/AIMissionControl.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/dashboard/AIMissionControl.tsx)**: Incorporate live Proactive AI trigger cards with ack/snooze/dismiss actions and FFH widget.

---

## Verification Plan

### Automated Checks
- `npx tsc --noEmit` in `backend/`
- `npx tsc --noEmit` in `frontend/`
- `npm run build` in `frontend/`
- `npm test` in `backend/` (all 387 tests)

### Manual Browser Verification
- Verify Family Financial Health displays score, life stage, 5 pillars, and history.
- Verify Family Timeline filters work smoothly across 7 domains and scheduled events.
- Verify Financial Time Machine reconstructs past dates with correct null-safety.
- Verify What-If Sandbox executes simulations with assumption provenance tags and 0 database writes.
- Verify Proactive AI triggers in AI Mission Control can be acknowledged, snoozed, and dismissed.

---

## 🚨 STOP CONDITION

In accordance with Sprint 8C.4 instructions, work is **STOPPED** at the completion of this implementation plan. No production code has been modified. Awaiting review and explicit user approval before beginning implementation.
