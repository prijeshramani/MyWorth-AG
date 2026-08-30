# Sprint 8C.4 Implementation Plan: Family Office UI Experience & Financial Intelligence Visualization (Revised & Evidence-Based)

## User Review Required

> [!IMPORTANT]
> **Revised Evidence-Based Implementation Plan Addressing All Review Directives**:
> 1. **Current UI Architecture Assessment**: Documented concrete codebase inspection across routing, state management, design system, Recharts dependencies, and legacy What-If remediation.
> 2. **Authoritative API Mapping**: Complete table of verified endpoints, exact HTTP methods, request/response contracts, server-side session authorization (`CorrelationContext.getFamilyId()`), and zero-write guarantees.
> 3. **Information Architecture (Option C Recommended)**: Hybrid workspace combining high-level summary widgets in AI Mission Control (`dashboard`) with dedicated deep-dive intelligence workspaces (`family-health`, `family-timeline`, `time-machine`).
> 4. **Strict Fiduciary Semantics**: Explicit UI behavior for `COMPLETE`, `PARTIAL`, `INSUFFICIENT_DATA`, `UNKNOWN`, `KNOWN_ZERO`, `NOT_APPLICABLE`, `STALE`, unpriced assets (`null` never rendered as `₹0.00`), Sum Assured isolation, and assumption provenance (`USER_PROVIDED`, `FAMILY_PROFILE`, `SYSTEM_ASSUMPTION`).
> 5. **Comprehensive Testing & Regression Plan**: Automated frontend typecheck (`tsc -b`), production build (`vite build`), frontend contract/invariant tests, and full backend test suite verification (387 passing tests).

---

## Proposed Changes

### 1. Types & Services Layer
- **[NEW] [`frontend/src/types/familyOffice.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/types/familyOffice.ts)**: Frontend TypeScript interfaces mirroring backend Zod schemas (`FamilyFinancialHealth`, `TimelineEvent`, `TimeMachineReconstruction`, `WhatIfSimulationResult`, `ProactiveTrigger`).
- **[NEW] [`frontend/src/services/familyHealthService.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/familyHealthService.ts)**: API client for `/family-office/health`, `/history`, `/snapshot`.
- **[NEW] [`frontend/src/services/familyTimelineService.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/familyTimelineService.ts)**: API client for `/family-office/timeline` and `/sync`.
- **[NEW] [`frontend/src/services/timeMachineService.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/timeMachineService.ts)**: API client for `/family-office/time-machine` and `/what-if`.
- **[NEW] [`frontend/src/services/proactiveObserverService.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/proactiveObserverService.ts)**: API client for `/family-office/proactive/triggers` and trigger triage actions.

### 2. Navigation & Store Updates
- **[MODIFY] [`frontend/src/store/useUiStore.ts`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/store/useUiStore.ts)**: Add `family-health`, `family-timeline`, and `time-machine` tab definitions.
- **[MODIFY] [`frontend/src/components/layout/NavigationDrawer.tsx`](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/NavigationDrawer.tsx)**: Add navigation items under `Wealth` and `Planning`.
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
- `npx tsc --noEmit` in `backend/` (0 errors)
- `npm run build` / `npx tsc -b` in `frontend/` (0 errors)
- `npm test` in `backend/` (all 387 tests pass)
- Invariant & contract tests in `frontend/src/__tests__/familyOfficeUI.test.ts`

### Manual Verification
- Verify Family Financial Health displays score, life stage, 5 pillars, and history.
- Verify Family Timeline filters work smoothly across 7 domains and scheduled events.
- Verify Financial Time Machine reconstructs past dates with correct null-safety.
- Verify What-If Sandbox executes simulations with assumption provenance tags and 0 database writes.
- Verify Proactive AI triggers in AI Mission Control can be acknowledged, snoozed, and dismissed.

---

## 🚨 STOP CONDITION

In accordance with Sprint 8C.4 instructions and review feedback:
- **The revised implementation plan has been completely documented.**
- **No production code has been modified.**
- **Implementation is stopped and awaiting review and explicit user approval.**
