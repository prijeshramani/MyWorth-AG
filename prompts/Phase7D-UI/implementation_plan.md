# Phase 7D Implementation Plan – Premium UI/UX Modernization & Design System

Transform **FamilyWealthOS** into a world-class, AI-first Wealth Operating System with a complete design system inspired by **Apple Intelligence, Linear, Arc Browser, Raycast, and Bloomberg Terminal**.

## User Review Required

> [!IMPORTANT]
> - **Strict UI/UX Only Scope**: 100% of backend services, SQLite schema, database migrations, API contracts, routes, business rules, calculation engines, AI skill/action registries, and tests remain completely untouched.
> - **Design System Architecture**: Establishes reusable design tokens, component primitives (`Button`, `Card`, `Badge`, `Tabs`, `Table`, `Inputs`, `StatCard`, `Skeleton`, `EmptyState`), layout system (`PageShell`, `SectionHeader`, `Sidebar`, `CommandPalette`), and Framer Motion micro-interactions.

## Open Questions

None. All styling, color palettes, layout structures, and component rules are explicitly specified in `prompts/Phase7D-UI/Phase7D-UI-UX.md`.

---

## Proposed Changes

### 1. Design System & Design Tokens

#### [NEW] [frontend/src/styles/tokens.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/styles/tokens.ts)
- Design tokens defining color palette (`#0B0B0C` bg, `#15161A` secondary bg, `#1E2025` cards, `#2B2E35` borders, `#4F7FFF` primary accent, `#32D583` success, `#F79009` warning, `#F04438` danger), typography, spacing, border-radii, and shadows.

#### [MODIFY] [frontend/src/index.css](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/index.css)
- Integrates design token CSS variables, Inter/Geist font families, glassmorphism utilities, micro-animations, and sleek scrollbar styles.

---

### 2. UI Component Library (`frontend/src/components/ui/`)

#### [NEW] [frontend/src/components/ui/Button.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ui/Button.tsx)
- Reusable button primitive supporting primary (`#4F7FFF`), secondary, ghost, danger, sizes, icons, and click micro-animations.

#### [NEW] [frontend/src/components/ui/Card.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ui/Card.tsx)
- Premium card container with rounded radii (`rounded-2xl` / `rounded-3xl`), border `#2B2E35`, subtle hover glow, and backdrop blur.

#### [NEW] [frontend/src/components/ui/Badge.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ui/Badge.tsx)
- Status chips and badges supporting primary, success, warning, danger, and neutral variants.

#### [NEW] [frontend/src/components/ui/StatCard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ui/StatCard.tsx)
- Large-typography financial stat indicator with trend badges, subtitles, and sparkline support.

#### [NEW] [frontend/src/components/ui/EmptyState.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ui/EmptyState.tsx)
- Apple Intelligence style empty states with icon illustrations, helpful context, and quick action buttons.

#### [NEW] [frontend/src/components/ui/Skeleton.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ui/Skeleton.tsx)
- Shimmer skeleton loaders for cards, tables, and AI response streams.

#### [NEW] [frontend/src/components/ui/CommandPalette.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/ui/CommandPalette.tsx)
- Raycast / Linear style global command palette (`Ctrl+K` or `Cmd+K`) for instant navigation, AI query launch, and search.

---

### 3. Layout & Navigation Architecture

#### [NEW] [frontend/src/components/layout/PageShell.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/PageShell.tsx)
- Uniform page container shell providing consistent page headers, subtitles, action slots, and background ambiance.

#### [MODIFY] [frontend/src/components/layout/NavigationDrawer.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/NavigationDrawer.tsx)
- Modern collapsible sidebar with icon indicators, badge chips, and category groupings (`Home`, `AI Advisor`, `Portfolio`, `Accounts`, `Investments`, `Goals`, `Protection`, `Tax`, `Family`, `Estate`, `Documents`, `Platform`).

#### [MODIFY] [frontend/src/components/layout/TopNavbar.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/TopNavbar.tsx)
- Clean top navbar with Command Palette trigger (`⌘K`), quick search, family member selector, and AI status chip.

---

### 4. Screen Modernization & Bento Layouts

#### [NEW] [frontend/src/components/dashboard/AIMissionControl.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/dashboard/AIMissionControl.tsx)
- AI Mission Control dashboard featuring:
  - Greeting header & Net Worth hero value (`₹4.78 Cr`).
  - Today's Change indicator (`+₹84,000`).
  - AI Summary card highlighting opportunities, insurance gaps, and tax savings.
  - Bento Layout cards for Asset Allocation, Recent Activity, Goals Progress, and Quick AI Actions.

#### [MODIFY] [frontend/src/components/advisor/AIWealthAdvisor.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/advisor/AIWealthAdvisor.tsx)
- ChatGPT / Apple Intelligence style interface with suggested prompts, floating input bar, evidence cards, action cards, markdown rendering, and typing stream effects.

#### [MODIFY] [frontend/src/components/holdings/HoldingsView.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/holdings/HoldingsView.tsx)
- Bento grid portfolio overview with top gainers/losers, asset allocation breakdown, and clean filter tabs.

#### [MODIFY] [frontend/src/components/estate/EstateDashboard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/estate/EstateDashboard.tsx)
- Timeline style interface (`Will -> Trust -> Beneficiaries -> Distribution -> Simulation -> Execution`).

#### [MODIFY] [frontend/src/components/estate/KnowledgeGraphExplorer.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/estate/KnowledgeGraphExplorer.tsx)
- Modern interactive graph explorer with glowing nodes, animated edges, zoom controls, and category filters.

---

### 5. Documentation & Governance

#### [NEW] [docs/UI_STYLE_GUIDE.md](file:///c:/Users/prije/Downloads/MyWorth/docs/UI_STYLE_GUIDE.md)
#### [NEW] [docs/Sprint_7D_Retrospective.md](file:///c:/Users/prije/Downloads/MyWorth/docs/Sprint_7D_Retrospective.md)
#### [NEW] [Phase_7D_Implementation_Summary.md](file:///c:/Users/prije/Downloads/MyWorth/Phase_7D_Implementation_Summary.md)
#### [MODIFY] [ROADMAP.md](file:///c:/Users/prije/Downloads/MyWorth/ROADMAP.md)
#### [MODIFY] [CAPABILITIES.md](file:///c:/Users/prije/Downloads/MyWorth/CAPABILITIES.md)
#### [MODIFY] [AI_CHANGELOG.md](file:///c:/Users/prije/Downloads/MyWorth/AI_CHANGELOG.md)
#### [MODIFY] [SESSION_CONTEXT.md](file:///c:/Users/prije/Downloads/MyWorth/SESSION_CONTEXT.md)

---

## Verification Plan

### Automated Build Verification
- Execute `npm run build` across backend and frontend to verify 100% clean compilation (`0 TypeScript errors`).
- Execute test suite to confirm existing tests remain green.

### Manual Visual & UX Verification
- Verify Premium Dark color system (`#0B0B0C`, `#15161A`, `#1E2025`, `#2B2E35`, `#4F7FFF`).
- Verify Command Palette (`Ctrl+K` / `Cmd+K`) functionality.
- Verify responsive layout on mobile, tablet, and desktop screens.
- Verify zero business logic or API regressions.
