# FamilyWealthOS – Phase 7D Design System & UI Style Guide

This document defines the official design system, visual token guidelines, component patterns, and motion standards for **FamilyWealthOS**.

---

## 1. Visual Identity & Inspiration
Inspired by **Apple Intelligence, Linear, Arc Browser, Raycast, and Bloomberg Terminal**, FamilyWealthOS combines high-density financial data with modern AI interaction primitives.

- **Obsidian Dark Palette**: Pure `#0B0B0C` background, `#15161A` secondary surface, `#1E2025` cards, and `#2B2E35` border hierarchy.
- **Glassmorphism**: Backdrop blur filters (`backdrop-blur-xl`), subtle borders, and glow effects.
- **Typography**: `Inter` for crisp UI copy, `Geist Mono` / `JetBrains Mono` for currency values, IDs, and financial metrics.

---

## 2. Design Tokens (`frontend/src/styles/tokens.ts`)

| Token Category | Token Variable | Hex / Value | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `bg.primary` | `#0B0B0C` | Page background |
| **Background** | `bg.secondary` | `#15161A` | Navbar, drawer, side panels |
| **Background** | `bg.card` | `#1E2025` | Bento cards, popovers, modals |
| **Border** | `border.default` | `#2B2E35` | Card borders, dividers |
| **Accent** | `accent.primary` | `#4F7FFF` | Primary buttons, active tabs, glows |
| **Status Gain** | `status.success` | `#32D583` | Positive returns, operational status |
| **Status Loss** | `status.danger` | `#F04438` | Negative returns, warnings, emergency mode |
| **Status Warning**| `status.warning` | `#F79009` | Alerts, tax opportunities |

---

## 3. UI Component Primitives (`frontend/src/components/ui/`)

### `Button`
Supports `primary`, `secondary`, `ghost`, `danger`, `outline` variants with Framer Motion click micro-animations and loading spinners.

### `Card`
Bento grid containers supporting `default`, `glass`, `bordered`, `ghost` variants with `#2B2E35` borders and hover glow states.

### `Badge`
Compact status indicators for skills, engine status, and category tags (`primary`, `success`, `warning`, `danger`, `neutral`, `info`).

### `StatCard`
Financial KPI card with large numerical values, trend badges (`+₹84,000`), icons, and optional sparklines.

### `CommandPalette`
Global keyboard-driven menu (`⌘K` / `Ctrl+K`) for rapid navigation, searching assets, and submitting AI queries directly.

### `PageShell`
Uniform layout container standardizing titles, subtitles, action slots, and background ambiance across all screens.

---

## 4. UI/UX Rules & Guidelines

1. **Presentation / Container Separation**: Styling layers consume state and hooks without altering calculation logic or backend API schemas.
2. **Deterministic Data**: Numerical values, tax calculations, and net worth figures are formatted cleanly without altering underlying calculation engines.
3. **Motion**: Micro-animations are kept under 250ms for instant responsiveness.
