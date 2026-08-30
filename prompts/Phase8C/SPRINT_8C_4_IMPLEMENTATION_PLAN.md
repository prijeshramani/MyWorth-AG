# Sprint 8C.4 Final Implementation Plan: Family Office UI Experience & Financial Intelligence Visualization

---

## 1. Current UI Architecture Assessment

Based on rigorous, line-by-line inspection of the existing codebase (`frontend/src/` and `backend/src/`), the frontend architecture, state management, and design patterns are established as follows:

| Architecture Area | Actual Codebase File(s) | Verified Current Pattern | Sprint 8C.4 Reuse & Evolution Strategy |
| :--- | :--- | :--- | :--- |
| **Routing & Tab Navigation** | `frontend/src/App.tsx`, `frontend/src/store/useUiStore.ts` | Single-page layout driven by Zustand `useUiStore` (`activeTab`, `setActiveTab`, `activeFamilyId`). Main tab switching is rendered in `App.tsx` via `renderTabContent()` switch statement. | **Reuse & Extend**: Register `family-health`, `family-timeline`, and `time-machine` in `useUiStore` and `App.tsx`, preserving single-page tab state and zero page reloads. |
| **Layout & Shell** | `frontend/src/components/layout/AppLayout.tsx`, `PageShell.tsx`, `NavigationDrawer.tsx` | `AppLayout` provides standard responsive desktop/mobile shells with `TopNavbar`, collapsible `NavigationDrawer`, and `PageShell` providing uniform dark headers, action buttons, and responsive grid padding. | **Reuse**: All new intelligence pages use `PageShell` for standardized spacing, header action injection, and breadcrumb layout. |
| **API Client & Auth Scope** | `frontend/src/services/apiClient.ts`, `frontend/src/store/useAuthStore.ts` | Axios instance with `baseURL: '/api/v1'`, interceptors injecting `X-Correlation-ID: gui_${Date.now()}_...` and `Authorization: Bearer ${accessToken}` from `useAuthStore`. Backend `authMiddleware` extracts session into `CorrelationContext`. | **Reuse & Cleanse**: All API requests leverage `apiClient`. Purge legacy client-side query overrides (`familyId=1`) to strictly enforce server-side session authorization (`CorrelationContext.getFamilyId()`). |
| **State Management & Caching** | `frontend/src/store/useUiStore.ts`, `@tanstack/react-query` | Global UI and navigation state in Zustand; API request caching, background invalidation, and refetching managed via TanStack Query (`QueryClientProvider`). | **Reuse**: Use TanStack Query hooks (`useQuery`, `useMutation`) for all Phase 8C API endpoints. Page containers orchestrate fetching; child components receive typed props. |
| **Design Tokens & Atoms** | `frontend/src/components/ui/` (`Card.tsx`, `Badge.tsx`, `StatCard.tsx`, `Button.tsx`, `EmptyState.tsx`, `Skeleton.tsx`), TailwindCSS | Dark-first design system (`#15161A` card backgrounds, `#2B2E35` borders, `#4F7FFF` primary indigo, `#32D583` emerald success, `#F79009` amber warning, `#F04438` rose danger, `#38BDF8` sky blue, `#8B5CF6` purple). | **Reuse**: 100% reuse of existing UI components and design tokens. No new CSS frameworks or ad-hoc classes. |
| **Charts & Visualizations** | `recharts` (^2.12.7) | Already installed and actively used in `Dashboard.tsx`, `Portfolio.tsx`, `TaxDashboard.tsx`, and `AIMissionControl.tsx` (PieChart, ResponsiveContainer, AreaChart, BarChart, Tooltip). | **Reuse**: Recharts is already a primary dependency and fully covers score gauges, historical trends, and What-If comparison charts. No new chart library needed. |
| **AI Mission Control** | `frontend/src/components/dashboard/AIMissionControl.tsx` | Contains morning briefing card, top stats, asset allocation donut chart, and action cards. | **Extend**: Integrate compact FFH index widget and live Proactive AI trigger cards (with server-confirmed acknowledge, snooze, dismiss controls) directly into Mission Control. |
| **Legacy What-If Simulator** | `frontend/src/components/advisor/WhatIfSimulator.tsx` | Legacy implementation calling outdated `/api/v1/ai/actions/simulate` with hardcoded `familyId: 1`. | **Replace / Realign**: Replace with `WhatIfSimulatorPanel` presentation layer calling the authoritative backend engine (`POST /api/v1/family-office/time-machine/what-if`). |

---

## 2. Existing Component Reuse Strategy

| UI Need | Existing Component / Utility | Strategy | Application in Sprint 8C.4 |
| :--- | :--- | :--- | :--- |
| **Standard Page Shell** | `frontend/src/components/layout/PageShell.tsx` | **Reuse** | Standard wrapper for `FamilyHealthDashboard`, `FamilyTimelineView`, and `TimeMachineView`. |
| **Metric Summary Cards** | `frontend/src/components/ui/StatCard.tsx` | **Reuse** | Used for composite health score, completeness score, net worth, gross assets, and total liabilities. |
| **Glass Containers** | `frontend/src/components/ui/Card.tsx` | **Reuse** | Containers for 5-pillar breakdowns, timeline narrative cards, reconstructed balance sheets, and What-If panels. |
| **Status & Provenance Chips** | `frontend/src/components/ui/Badge.tsx` | **Extend** | Render status tags (`COMPLETE`, `INSUFFICIENT_DATA`, `SCHEDULED`, `HISTORICAL`), importance tiers (`CRITICAL`, `HIGH`), and provenance tags (`USER_PROVIDED`, `FAMILY_PROFILE`, `SYSTEM_ASSUMPTION`). |
| **Action Buttons** | `frontend/src/components/ui/Button.tsx` | **Reuse** | Primary, secondary, and outline buttons for snapshot triggers, timeline filters, simulation execution, and trigger actions. |
| **Loading Skeletons** | `frontend/src/components/ui/Skeleton.tsx`, `CardSkeleton` | **Reuse** | Content-aware loading placeholders for timeline streams, health metrics, and holdings tables. |
| **Empty State Screens** | `frontend/src/components/ui/EmptyState.tsx` | **Reuse** | Explanatory empty states for 0 timeline search results, 0 historical health snapshots, or 0 active AI triggers. |
| **Gauge / Ring Visualization** | `frontend/src/components/ui/RiskGauge.tsx` | **Reuse & Adapt** | Adapted for visual rendering of the 0–100 composite Family Financial Health score and pillar percentages. |
| **Holdings Table Styling** | `frontend/src/components/ui/HoldingTable.tsx` | **Reuse Pattern** | Reused for the Reconstructed Historical Asset Holdings table with 5-level valuation badges. |
| **Currency & Number Formatting** | `frontend/src/utils/formatters.ts` | **Reuse** | Standard Indian numbering system (`₹15 L`, `₹1.5 Cr`, `₹1,50,000.00`). |

---

## 3. Coherent Information Architecture & Navigation

We adopt a **Unified Family Intelligence Workspace**:
1. **Executive Summary Layer in AI Mission Control (`dashboard`)**:
   - **Compact FFH Widget**: 0–100 composite score, life-stage badge, and 5-pillar mini-progress bars with one-click deep link to full health view.
   - **Live Proactive AI Trigger Stream**: Actionable stream of active fiduciary triggers with immediate server-confirmed triage controls (Acknowledge, Snooze, Dismiss, Resolve).
2. **Dedicated Family Intelligence Workspace**:
   - Grouped into a dedicated **Family Intelligence** section in the `NavigationDrawer` (or mapped under `Wealth` and `Planning` with explicit intelligence badges):
     - `family-health` (**Family Financial Health**, badge: `Index`): 5-pillar deep dive, life-stage weighting breakdown, completeness analysis, and historical snapshot trend charts.
     - `family-timeline` (**Family Timeline Ledger**, badge: `Ledger`): Chronological 7-domain ledger stream with multi-dimensional filtering, scheduled event separation, and narrative history.
     - `time-machine` (**Time Machine & What-If Sandbox**, badge: `Sandbox`): Unified historical point-in-time balance sheet reconstruction paired with the in-memory What-If simulation workbench.

### Exact Navigation Hierarchy (`NavigationDrawer.tsx`)
```typescript
// Core Category
{ id: 'dashboard', label: 'AI Mission Control', icon: <LayoutDashboard className="text-[#4F7FFF]" />, category: 'Core' },
{ id: 'ai-advisor', label: 'AI Wealth Advisor', icon: <Bot className="text-[#8B5CF6]" />, badge: 'Core', category: 'Core' },
{ id: 'recommendations', label: 'AI Recommendations', icon: <Sparkles className="text-[#F79009]" />, category: 'Core' },
{ id: 'ai-action-center', label: 'AI Action Center', icon: <Sparkles className="text-[#4F7FFF]" />, badge: 'Actions', category: 'Core' },

// Wealth & Assets Category
{ id: 'portfolio', label: 'Portfolio Overview', icon: <PieChart className="text-[#32D583]" />, category: 'Wealth' },
{ id: 'holdings', label: 'Asset Holdings', icon: <Table className="text-[#38BDF8]" />, category: 'Wealth' },
{ id: 'transactions', label: 'Cashflow & Activity', icon: <TrendingUp className="text-[#32D583]" />, category: 'Wealth' },
{ id: 'accounts', label: 'Bank & Demat Accounts', icon: <Landmark className="text-[#F79009]" />, category: 'Wealth' },
{ id: 'family-timeline', label: 'Family Timeline Ledger', icon: <History className="text-[#38BDF8]" />, badge: 'Ledger', category: 'Wealth' },

// Intelligence & Planning Category
{ id: 'family-health', label: 'Family Financial Health', icon: <Activity className="text-[#32D583]" />, badge: 'Index', category: 'Planning' },
{ id: 'time-machine', label: 'Time Machine & What-If', icon: <ClockRewind className="text-[#8B5CF6]" />, badge: 'Sandbox', category: 'Planning' },
{ id: 'tax', label: 'Tax Intelligence', icon: <Calculator className="text-[#38BDF8]" />, category: 'Planning' },
{ id: 'planning', label: 'Financial Goals', icon: <Target className="text-[#4F7FFF]" />, category: 'Planning' },
{ id: 'protection', label: 'Protection & Insurance', icon: <ShieldAlert className="text-[#F04438]" />, category: 'Planning' },
{ id: 'estate', label: 'Estate & Succession', icon: <Scroll className="text-[#F79009]" />, category: 'Planning' },
```

---

## 4. Authoritative Backend API Mapping Table

Every API endpoint, HTTP method, exact full path, request contract, response contract, mutation type, and idempotency property is verified against backend route and controller definitions:

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

## 5. Contract Authority & Drift Prevention Strategy

1. **Authoritative Backend Contract Source**:
   - Backend Zod schemas in `backend/src/contracts/familyOfficeContracts.ts` are the **single source of truth** for all data shapes, enums, validation constraints, and financial invariants.
2. **Frontend Role & 1:1 Type Mapping**:
   - `frontend/src/types/familyOffice.ts` defines frontend TypeScript interfaces reflecting `familyOfficeContracts.ts`.
   - All status enums (`PillarStatusEnum`, `TimelineDomainEnum`, `TimelineImportanceEnum`, `TimelineEventStatusEnum`, `HistoricalValuationTypeEnum`, `ProvenanceTypeEnum`, `WhatIfScenarioTypeEnum`, `AssumptionProvenanceEnum`, `ProactiveTriggerStatusEnum`, `TriggerUrgencyEnum`) are duplicated 1:1 without semantic modification.
3. **Drift Prevention Mechanism**:
   - Automated tests in `frontend/src/__tests__/contracts.test.ts` validate mock backend API response fixtures against the frontend TypeScript types.
   - Any backend schema alteration that breaks frontend contracts will cause `tsc -b` and `contracts.test.ts` to immediately fail in CI before merge.
4. **Strict No-Semantic-Reinterpretation Rule**:
   - The frontend cannot redefine or re-alias status meanings (e.g. `INSUFFICIENT_DATA` cannot be remapped to `UNKNOWN` or `0`).

---

## 6. Strict Data Semantics & Fiduciary UX Matrix

| Backend State / Field | Value Display | Visual Treatment | Explicit Narrative / Badge | Prohibited UX Anti-Pattern |
| :--- | :--- | :--- | :--- | :--- |
| **`COMPLETE`** | Evaluated numeric score/value | Green border / `#32D583` Badge | `Complete & Verified` | Coercing partial data to complete. |
| **`PARTIAL`** | Evaluated numeric score/value | Amber border / `#F79009` Badge | `Partial (Incomplete History)` | Treating partial coverage as complete confidence. |
| **`INSUFFICIENT_DATA`** | Display `null` or `--` | Amber dashed badge / Alert icon | `Insufficient Data to Calculate` | **NEVER** display `0` or `₹0.00`. |
| **`UNKNOWN`** | Display `--` | Slate neutral badge | `Unknown / Unspecified` | Inventing a default assumption. |
| **`KNOWN_ZERO`** | Display `₹0.00` | Normal neutral/green text | `Evaluated Zero Balance` | Displaying missing data notice when balance is authoritatively zero. |
| **`NOT_APPLICABLE`** | Display `N/A` (No numeric score) | Slate badge with tooltip | `Pillar Weight Redistributed (No Active Goals)` | Penalizing score or displaying 0 score for N/A pillars. |
| **`STALE`** | Display evaluated score/value | Gray badge with reload icon | `Baseline Changed – Needs Refresh` | Presenting stale triggers as active urgent observations. |
| **`null` Historical Price** | Display `Historical value unavailable` | Slate badge (`HISTORICAL_SOURCE_UNAVAILABLE`) | `Price not recorded as of selected date` | **NEVER** display `₹0.00` or interpolate market value. |
| **`sumAssured` (Insurance)** | Display in separate Protection card | Shield icon with indigo outline | `Total Life & Health Protection Cover` | **NEVER** add Sum Assured into Gross Assets or Net Worth. |
| **`SCHEDULED` Event** | Scheduled date & estimated amount | Dashed border, blue clock icon, `SCHEDULED` badge | `Upcoming Scheduled Obligation` | Displaying future obligation as already settled historical event. |
| **Simulated What-If Values** | Projected corpus / benefit amount | Purple highlighted card with `SIMULATED` badge | `In-Memory Scenario Output (0 Database Writes)` | Presenting simulation as actual portfolio state. |
| **Assumption Provenance** | `USER_PROVIDED` (Cyan), `FAMILY_PROFILE` (Purple), `SYSTEM_ASSUMPTION` (Amber) | Small provenance pill next to every assumption | E.g. `12% Equity Return (System Default Assumption)` | Disguising 12% system return as the client's verified risk profile. |

---

## 7. Detailed UX & State Flows

### 7.1 Architecture of What-If Simulator Panel (Backend-Authoritative)
The frontend `WhatIfSimulatorPanel.tsx` is strictly an input collection and result presentation layer:
```text
User Selects Scenario & Inputs Parameters
    ↓
Frontend validates UI-level field ranges (e.g. Age: 35–75, SIP >= 0, Horizon: 1–50)
    ↓
Dispatches POST /api/v1/family-office/time-machine/what-if via apiClient
    ↓
Backend WhatIfSimulationEngine executes stateless in-memory financial math (0 DB writes)
    ↓
Returns authoritative WhatIfSimulationResult (corpus, delta, provenance, limitations)
    ↓
Frontend renders simulation result, growth chart, and assumption provenance pills
```
- **Frontend Validation Allowed**: Required fields, numeric shapes, slider bounds (e.g. Retirement age: 35–75), disabled submit button for invalid inputs.
- **Backend Authority**: Evaluates simulation math, readiness %, gap delta, tax regime comparison, baseline limitations, and assumption provenance.
- **Forbidden on Frontend**: Future value math, retirement corpus formulas, tax slab math, or goal reallocation algorithms.

### 7.2 Family Financial Health Experience (`FamilyHealthDashboard.tsx`)
- **Initial Load**: Issues read-only `GET /api/v1/family-office/health` and `GET /api/v1/family-office/health/history`.
- **Snapshot UX Flow**:
  1. Snapshots are **never created automatically on page load**.
  2. User clicks explicit "Save Snapshot" button.
  3. Dispatches `POST /api/v1/family-office/health/snapshot`.
  4. Button enters disabled/spinner state during request.
  5. Duplicate Handling: If a snapshot already exists for current period and state hash, backend returns existing snapshot; frontend displays *"Snapshot recorded (current state matches existing snapshot for period)"* without error.
  6. On success: Invalidates TanStack Query cache for snapshot history, refreshing the Recharts trend chart.

### 7.3 Family Timeline Ledger Experience (`FamilyTimelineView.tsx`)
- **Query & Viewing UX**:
  1. User opens Timeline page → issues read-only `GET /api/v1/family-office/timeline`.
  2. "Include Scheduled" toggle defaults to **OFF** (`includeScheduled=false`), hiding scheduled future items by default.
  3. Filters (Domain pills, Importance tiers, Search term) dynamically re-query the read-only projection without database mutations.
- **Explicit Synchronization User Flow**:
  ```text
  User opens Timeline View
          ↓
  Read-only GET /api/v1/family-office/timeline query renders current ledger
          ↓
  User explicitly clicks "Sync Ledger" button
          ↓
  Button disabled with spinning refresh icon; dispatches POST /api/v1/family-office/timeline/sync
          ↓
  Backend executes atomic single-transaction reconciliation across 7 domain source tables
          ↓
  Returns { status: 'SUCCESS', data: { reconciledCount: N } }
          ↓
  Invalidates timeline query cache and displays toast: "Timeline synchronized (reconciled N events)"
  ```

### 7.4 Financial Time Machine Reconstruction (`TimeMachineView.tsx`)
- **Date Selection**: Date picker enforces `asOfDate <= CURRENT_DATE` with quick presets (`1 Year Ago`, `FY 2024-25 End`, `FY 2023-24 End`).
- **Reconstruction Execution**: Read-only `GET /api/v1/family-office/time-machine?asOfDate=YYYY-MM-DD`.
- **Net Worth vs Protection Shield Invariant**:
  ```text
  Net Worth = Eligible Reconstructed Assets - Eligible Reconstructed Liabilities
  Protection Shield = Displayed separately in dedicated card (Sum Assured ≠ Net Worth)
  ```
- **5-Level Valuation Holdings Display**:
  - Assets with historical prices render valuation with badge (`EXACT_HISTORICAL`, `PROXY_HISTORICAL (4d lag)`, `KNOWN_ACQUISITION_COST`, `CALCULATED`).
  - Assets with missing historical prices strictly render `Historical value unavailable` with slate `HISTORICAL_SOURCE_UNAVAILABLE` badge (never `₹0.00`).

### 7.5 AI Mission Control (`AIMissionControl.tsx`)
- **Proactive AI Observations Feed**: Fetches active triggers from `GET /api/v1/family-office/proactive/triggers`.
- **Server-Confirmed Action Triage**:
  - Actions use exact backend request schemas:
    - **Acknowledge**: `POST /api/v1/family-office/proactive/triggers/:id/acknowledge` (no body).
    - **Snooze**: Modal with duration picker (1, 7, 14, 30 days) sends `POST /api/v1/family-office/proactive/triggers/:id/snooze` with `{ snoozeDays: number }` (enforcing `z.number().int().min(1).max(30)`).
    - **Dismiss**: Modal with optional reason input sends `POST /api/v1/family-office/proactive/triggers/:id/dismiss` with `{ reason?: string }`.
    - **Resolve**: Modal with resolution note sends `POST /api/v1/family-office/proactive/triggers/:id/resolve` with `{ reason?: string }`.
  - **Server-Confirmed Updates**: Individual card displays a local spinner during API dispatch. On server response, the card animates out and TanStack Query updates trigger count. On failure, displays error toast and leaves card visible.

---

## 8. Data Fetching, State Ownership & Component Architecture

```text
Page Containers (FamilyHealthDashboard, FamilyTimelineView, TimeMachineView, AIMissionControl)
    ├── Owns TanStack Query orchestration (useQuery, useMutation)
    ├── Owns URL/filter state and loading/error boundary handling
    ↓
Service Layer (familyHealthService, familyTimelineService, timeMachineService, proactiveObserverService)
    ├── Encapsulates apiClient HTTP calls with typed request/response contracts
    ↓
Presentational Child Components (PillarScoreCard, TimelineEventCard, ReconstructedHoldingsTable, etc.)
    ├── Pure presentational React components receiving typed immutable props
    └── 0 direct API calls, 0 financial calculation logic
```

---

## 9. File-by-File Responsibility Matrix

| File Path | Action | Primary Responsibility | Exact API Endpoints & Contracts | Reused Components | Strictly Forbidden Logic |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `frontend/src/types/familyOffice.ts` | **NEW** | Authoritative frontend TypeScript type definitions. | `FamilyFinancialHealth`, `TimelineEvent`, `TimeMachineReconstruction`, `WhatIfSimulationResult`, `ProactiveTrigger`. | None | No schema divergence or default coercion. |
| `frontend/src/services/familyHealthService.ts` | **NEW** | HTTP client for Family Financial Health endpoints. | `GET /api/v1/family-office/health`, `GET /api/v1/family-office/health/history`, `POST /api/v1/family-office/health/snapshot`. | `apiClient` | Must not calculate health scores locally. |
| `frontend/src/services/familyTimelineService.ts` | **NEW** | HTTP client for Timeline Ledger queries and synchronization. | `GET /api/v1/family-office/timeline`, `POST /api/v1/family-office/timeline/sync`. | `apiClient` | Must not generate event narratives locally. |
| `frontend/src/services/timeMachineService.ts` | **NEW** | HTTP client for Historical Reconstruction and What-If Simulations. | `GET /api/v1/family-office/time-machine`, `POST /api/v1/family-office/time-machine/what-if`. | `apiClient` | Must not calculate historical valuations or simulate scenarios locally. |
| `frontend/src/services/proactiveObserverService.ts` | **NEW** | HTTP client for Proactive AI Observer triggers and triage actions. | `GET /api/v1/family-office/proactive/triggers`, `POST /evaluate`, `POST /triggers/:id/acknowledge`, `snooze`, `dismiss`, `resolve`. | `apiClient` | Must not evaluate observer rules locally. |
| `frontend/src/store/useUiStore.ts` | **MODIFY** | Register `family-health`, `family-timeline`, and `time-machine` tab IDs; clean up legacy defaults. | None | Zustand store | Must not store financial calculations. |
| `frontend/src/components/layout/NavigationDrawer.tsx` | **MODIFY** | Mount navigation items under `Wealth` and `Planning`. | None | `Badge` | None |
| `frontend/src/App.tsx` | **MODIFY** | Wire tab router switch to render the new intelligence views. | None | `AppLayout` | None |
| `frontend/src/components/dashboard/FFHHealthWidget.tsx` | **NEW** | Compact FFH index widget embedded in AI Mission Control. | `FamilyFinancialHealth` | `Card`, `Badge`, `RiskGauge` | Must not calculate scores or create snapshots. |
| `frontend/src/components/dashboard/AIMissionControl.tsx` | **MODIFY** | Integrate live proactive trigger cards with server-confirmed ack/snooze/dismiss actions and FFH widget. | `proactiveObserverService`, `familyHealthService` | `Card`, `Badge`, `Button`, `StatCard` | Must not hardcode `familyId=1` or bypass backend triage. |
| `frontend/src/components/health/FamilyHealthDashboard.tsx` | **NEW** | Comprehensive 5-pillar health view with life-stage weighting and snapshot trigger. | `familyHealthService` | `PageShell`, `Card`, `Button`, `Badge`, `EmptyState`, `Skeleton` | Must not coerce missing data to 0. |
| `frontend/src/components/health/PillarScoreCard.tsx` | **NEW** | Presentational card displaying individual pillar status, metrics, and weight contribution. | `FFHPillarScore` | `Card`, `Badge` | Must not coerce `INSUFFICIENT_DATA` to 0. |
| `frontend/src/components/health/HealthHistoryChart.tsx` | **NEW** | Recharts line/area chart rendering historical snapshot trend over time. | `FamilyHealthSnapshotRow` | `recharts` (`ResponsiveContainer`, `AreaChart`, `LineChart`) | Must not interpolate missing snapshot months. |
| `frontend/src/components/timeline/FamilyTimelineView.tsx` | **NEW** | Chronological 7-domain ledger stream with scheduled/historical toggles and sync action. | `familyTimelineService` | `PageShell`, `Card`, `Button`, `EmptyState`, `Skeleton` | Ordinary view must be read-only (no auto-sync). |
| `frontend/src/components/timeline/TimelineEventCard.tsx` | **NEW** | Narrative event card with currency formatting and masked identifiers. | `TimelineEvent` | `Card`, `Badge` | Must not alter backend narrative text or unmask IDs. |
| `frontend/src/components/timeline/TimelineFilterBar.tsx` | **NEW** | Filter pills for domain, importance tier, and scheduled event toggle. | `TimelineQueryFilter` | `Button`, `Badge` | None |
| `frontend/src/components/timeMachine/TimeMachineView.tsx` | **NEW** | Historical balance sheet reconstruction and What-If sandbox workspace. | `timeMachineService` | `PageShell`, `Card`, `Button`, `Skeleton` | Must not allow future dates. |
| `frontend/src/components/timeMachine/HistoricalBalanceSheet.tsx` | **NEW** | Summary of reconstructed net worth, gross assets, total liabilities, and protection shield. | `TimeMachineReconstruction` | `Card`, `StatCard`, `Badge` | Must not add `sumAssured` into Net Worth. |
| `frontend/src/components/timeMachine/ReconstructedHoldingsTable.tsx` | **NEW** | Table displaying historical asset holdings with 5-level valuation provenance and null-safety. | `ReconstructedAssetHolding` | `Card`, `Badge`, `HoldingTable` styling | Missing prices must render as unavailable, never ₹0. |
| `frontend/src/components/timeMachine/WhatIfSimulatorPanel.tsx` | **NEW** | Presentational What-If workbench collecting inputs and rendering backend simulation output. | `WhatIfScenarioInput`, `WhatIfSimulationResult` | `Card`, `Button`, `Badge`, `recharts` | Must not perform financial calculations locally. |
| `frontend/src/components/advisor/WhatIfSimulator.tsx` | **MODIFY** | Replaces legacy simulator by wrapping and delegating to `WhatIfSimulatorPanel`. | `timeMachineService` | `WhatIfSimulatorPanel` | Removes legacy `/ai/actions/simulate` calls and hardcoded `familyId=1`. |

---

## 10. Loading / Empty / Insufficient Data / Error State Matrix

| Feature Area | Loading State | Empty State | Insufficient Data State | Error State | Retry & Action Mechanism |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Family Financial Health** | `CardSkeleton` multi-tile pulse | N/A (Live calculation generated for family) | Explanatory banner showing missing pillar data (e.g. "Add Term Insurance") | Alert card with error message | "Retry" button refetches `/health`. |
| **Health Snapshot History** | Skeleton chart container | `EmptyState`: "No snapshots taken yet. Click 'Save Snapshot' to record baseline." | N/A | Gray fallback box: "Snapshot trend unavailable" | Re-evaluates on next snapshot creation. |
| **Timeline Ledger** | Staggered skeleton event cards | `EmptyState`: "No events found matching your filter criteria." | N/A (Timeline is derived from available records) | Alert banner: "Failed to load timeline events." | "Retry" button + "Sync Ledger" button. |
| **Time Machine Reconstruction** | Balance sheet & table skeletons | N/A (State reconstructed for selected date) | Unpriced holdings display `Historical value unavailable` (`INSUFFICIENT_DATA`) | Error banner: e.g. "Future date not supported" | Date picker adjustment + "Reconstruct" button. |
| **What-If Simulation** | Button spinner & progress bar | Clean setup form before running simulation | Banner: "No verified income found in profile. Please enter salary." | Toast alert: "Simulation failed to evaluate" | Form field adjustment + "Re-run Simulation" button. |
| **AI Mission Control Triggers** | Staggered trigger skeletons | `EmptyState`: "All fiduciary rules clear. No active observations." | Trigger tags indicate confidence score and domain completeness | Inline error: "Failed to fetch triggers" | "Re-Evaluate Rules" button triggers evaluation. |

---

## 11. Security & Authorization Review

1. **Zero Hardcoded Family IDs**:
   - `familyId = 1` and all hardcoded defaults are strictly purged from all services, stores, and components.
   - The frontend communicates via `apiClient`, which passes authenticated JWT Bearer tokens. The backend resolves and authorizes `familyId` server-side via `CorrelationContext.getFamilyId()`.
2. **Zero Client-Side Authorization Assumptions**:
   - The frontend does not make client-side authorization decisions or send arbitrary `x-family-id` override headers.
3. **Fail-Closed Session Guard**:
   - If `accessToken` expires or authentication fails, `apiClient` triggers logout and redirects immediately to `LoginPage`.

---

## 12. Accessibility, Responsive & Performance Acceptance Criteria

### 12.1 Accessibility Acceptance Criteria
- [x] **Keyboard Navigation**: All filter pills, tabs, date pickers, snooze dropdowns, and trigger actions are fully navigable via `Tab`, `Space`, and `Enter`.
- [x] **Visible Focus States**: High-contrast blue focus rings (`focus:ring-2 focus:ring-[#4F7FFF]`) on all interactive controls.
- [x] **No Color-Alone Status**: Every status tag includes both an icon, high-contrast label (`COMPLETE`, `INSUFFICIENT_DATA`, `SCHEDULED`, `SIMULATED`), and tooltip description.
- [x] **Screen Reader Support**: Meaningful `aria-label`, `aria-expanded`, and `role="region"` attributes on all chart wrappers and accordion panels.

### 12.2 Responsive Acceptance Criteria
- [x] **Mobile Timeline**: Collapses smoothly into a single-column linear timeline with sticky date headers on screens `<768px`.
- [x] **Responsive Holdings Table**: Horizontally scrollable container with sticky Asset Name column on small screens.
- [x] **What-If Workbench**: Stacks scenario input controls and result charts vertically on narrow mobile viewports.
- [x] **Navigation Drawer**: Full-height drawer overlay toggled via hamburger menu on mobile screens without clipped navigation items.

### 12.3 Performance Acceptance Criteria
- [x] **Tab Navigation**: Tab switching occurs in $<50\text{ms}$ (pure client-side state switch).
- [x] **Query Caching**: TanStack Query caches health, timeline, and trigger responses with 5-minute `staleTime`, preventing redundant network requests on tab re-visits.
- [x] **Timeline Pagination**: Default query limit of 50 items with offset pagination to avoid rendering unbounded DOM nodes.
- [x] **Optimized Charts**: Recharts animations tuned with `isAnimationActive={true}` and `animationDuration={400}` for smooth entry without UI thread blocking.

---

## 13. Frontend Test Harness & Verification Plan

### 13.1 Exact Test Execution Commands
- **Frontend Type Check**:
  ```bash
  npx tsc -b
  ```
  *(in `frontend/`, verifying 0 TypeScript errors)*
- **Frontend Production Build**:
  ```bash
  npm run build
  ```
  *(in `frontend/`, verifying Vite production bundling completes with 0 errors)*
- **Frontend Contract & Invariant Tests**:
  ```bash
  npx ts-node src/__tests__/runTests.ts
  ```
  *(in `backend/` with added contract conformance test suite in `backend/src/__tests__/sprint8c4/frontendContracts.test.ts`)*
- **Backend Master Test Suite**:
  ```bash
  npm test
  ```
  *(in `backend/`, verifying all **387 baseline tests** pass with 0 failures)*

### 13.2 Frontend Contract & Invariant Invariants
1. **Invariant 1 (Missing Data Null-Safety)**: Verifies `null` historical market values render as `Historical value unavailable`, never `₹0.00`.
2. **Invariant 2 (Protection Shield Isolation)**: Verifies `sumAssured` is displayed exclusively in the Protection Shield card and not added to Net Worth or Gross Assets.
3. **Invariant 3 (Scheduled Event Distinction)**: Verifies scheduled timeline events render with `SCHEDULED` badge and dashed borders.
4. **Invariant 4 (What-If Simulation Isolation)**: Verifies What-If scenario results display `SIMULATED` banners and provenance tags without mutating baseline state.
5. **Invariant 5 (Assumption Provenance Display)**: Verifies `USER_PROVIDED`, `FAMILY_PROFILE`, and `SYSTEM_ASSUMPTION` badges render with appropriate styling.
6. **Invariant 6 (No False Zeroes for Insufficient Data)**: Verifies `INSUFFICIENT_DATA` status renders explanation banner and not a 0 score.
7. **Invariant 7 (Zero Hardcoded `familyId = 1`)**: Verifies no service or component passes hardcoded `familyId = 1`.
8. **Invariant 8 (Contract Drift Test)**: Validates mock backend JSON payloads against frontend TypeScript types.

---

## 14. Incremental Implementation Sequence

### Step 0 – Discovery & Contract Verification (COMPLETED)
- Verified all backend routes, controllers, and Zod contracts.
- Inspected frontend routing, state stores, and UI design system.

### Step 1 – Shared UI Integration Foundation
- Create `frontend/src/types/familyOffice.ts` matching backend contracts.
- Create `familyHealthService.ts`, `familyTimelineService.ts`, `timeMachineService.ts`, `proactiveObserverService.ts`.
- Verify TypeScript compilation (`npx tsc -b`).

### Step 2 – Family Financial Health UI
- Build `FamilyHealthDashboard.tsx`, `PillarScoreCard.tsx`, and `HealthHistoryChart.tsx`.
- Build `FFHHealthWidget.tsx` for AI Mission Control.
- Verify status semantics, null-safety, and snapshot trigger.

### Step 3 – Family Timeline Ledger UI
- Build `FamilyTimelineView.tsx`, `TimelineEventCard.tsx`, and `TimelineFilterBar.tsx`.
- Verify domain filtering, scheduled event exclusion by default, masked identifier rendering, and sync trigger.

### Step 4 – Financial Time Machine & What-If Sandbox UI
- Build `TimeMachineView.tsx`, `HistoricalBalanceSheet.tsx`, `ReconstructedHoldingsTable.tsx`.
- Build presentational `WhatIfSimulatorPanel.tsx` invoking the backend simulation engine.
- Update `WhatIfSimulator.tsx` to wrap and delegate to `WhatIfSimulatorPanel`.
- Verify null-safe holdings display, protection shield isolation, and in-memory simulation execution.

### Step 5 – AI Mission Control Integration
- Update `AIMissionControl.tsx` with live Proactive AI trigger cards, server-confirmed acknowledge/snooze/dismiss actions, and FFH widget.
- Purge legacy `familyId = 1` references.

### Step 6 – Navigation & Tab Routing Integration
- Update `useUiStore.ts` with new tab definitions.
- Update `NavigationDrawer.tsx` with Family Office intelligence items under `Wealth` and `Planning`.
- Update `App.tsx` tab switch.

### Step 7 – Automated Verification & Regression Testing
- Run `npx tsc --noEmit` in `backend/` and `frontend/`.
- Run `npm test` in `backend/` (confirming all 387 tests pass).
- Run production build `npm run build` in `frontend/`.
- Execute browser visual verification.

### Step 8 – Documentation & Sprint Closure
- Update `docs/FINANCIAL_TIME_MACHINE.md`, `docs/FAMILY_FINANCIAL_HEALTH.md`, `docs/FAMILY_TIMELINE_LEDGER.md`.
- Create `prompts/Phase8C/SPRINT_8C_4_OUTPUT_REVIEW.md`.
- Update `SESSION_CONTEXT.md` and `AI_CHANGELOG.md`.

---

## 15. Regression Scope & Verification Matrix

The following existing application views and features will be regression-tested to guarantee 0 breakages:

| Existing Area | Critical Functionality to Verify | Regression Risk & Mitigation |
| :--- | :--- | :--- |
| **Portfolio (`Portfolio.tsx`)** | Asset breakdown, net worth calculation, asset allocation donut chart. | Reused formatting utilities; ensured independent data fetch. |
| **Asset Holdings (`HoldingsView.tsx`)** | Live holdings table, category filtering, search, badges. | Completely independent view; no shared mutable state. |
| **Transactions (`Transactions.tsx`)** | Cashflow ledger, debit/credit transactions, date sorting. | Completely independent from the derived Timeline ledger. |
| **Accounts (`AccountsManager.tsx`)** | Bank & demat accounts list, balance summaries. | No shared components; unaffected. |
| **Protection (`ProtectionDashboard.tsx`)** | Insurance policies, HLV adequacy, term & health policy cards. | Protection shield calculations remain authoritative. |
| **Tax (`TaxDashboard.tsx`)** | Old vs New regime comparison, deductions breakdown. | Reuses `TaxCalculationEngine` on backend; unaffected. |
| **Goals (`PlanningDashboard.tsx`)** | Financial goals progress, target year, monthly SIP. | Goal records untouched by What-If simulations. |
| **Estate (`EstateDashboard.tsx`)** | Will registration, trust structures, lineage explorer. | Estate health records unaffected. |
| **Global Search (`GlobalSearchModal.tsx`)** | Entity, asset, and navigation search across app. | Updated tab routes indexable via global search. |

---

## 🚨 STOP CONDITION

This implementation plan is complete, hardened, and fully documented in both the project repository and artifact storage.
**STOPPING HERE** for user review and explicit approval before any production code modification or implementation begins.
