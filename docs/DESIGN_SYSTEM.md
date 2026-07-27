# 🎨 DESIGN_SYSTEM.md — Design System & Visual Tokens

**System Name**: Family Wealth OS  
**Phase**: Phase 5A  
**Date**: July 27, 2026  
**Status**: APPROVED DESIGN SYSTEM  

---

## 1. Dark Mode Color Tokens (HSL Palette)

Family Wealth OS uses a dark slate color system with glassmorphism overlays and vibrant financial indicator accents.

```css
:root {
  /* Background & Surfaces */
  --bg-dark-base: hsl(222, 47%, 7%);        /* #0b0f19 - Deep Navy Slate */
  --bg-dark-surface: hsl(217, 33%, 12%);   /* #141c2e - Card Surface */
  --bg-dark-glass: rgba(20, 28, 46, 0.7);   /* Glassmorphism Surface */
  --border-dark-subtle: rgba(255, 255, 255, 0.08);

  /* Primary Brand & Accents */
  --brand-primary: hsl(200, 98%, 48%);     /* #0284c7 - Electric Sapphire */
  --brand-accent: hsl(262, 83%, 58%);      /* #8b5cf6 - Deep Amethyst */

  /* Financial Status Colors */
  --color-gain: hsl(158, 64%, 52%);        /* #10b981 - Emerald Green */
  --color-loss: hsl(350, 89%, 60%);        /* #f43f5e - Crimson Rose */
  --color-warning: hsl(38, 92%, 50%);      /* #f59e0b - Amber Gold */
  --color-info: hsl(217, 91%, 60%);       /* #3b82f6 - Royal Blue */

  /* Typography Colors */
  --text-primary: hsl(210, 40%, 98%);     /* #f8fafc - Bright Crisp White */
  --text-secondary: hsl(215, 20%, 65%);   /* #94a3b8 - Muted Steel */
  --text-tertiary: hsl(215, 16%, 47%);    /* #64748b - Subtle Slate */
}
```

---

## 2. Typography Scale

- **Primary Font**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, sans-serif.
- **Monospace Font (Numbers & Financial Values)**: `JetBrains Mono`, `Fira Code`, monospace.

| Scale Token | Font Size | Line Height | Font Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `display-1` | 36px (2.25rem) | 1.2 | 700 (Bold) | Main Net Worth Hero Figures |
| `heading-1` | 24px (1.50rem) | 1.3 | 600 (SemiBold) | Page Titles |
| `heading-2` | 18px (1.125rem) | 1.4 | 600 (SemiBold) | Section Headers & Card Titles |
| `body-large` | 16px (1.00rem) | 1.5 | 400 (Regular) | Primary Table Rows & Inputs |
| `body-small` | 14px (0.875rem) | 1.5 | 400 (Regular) | Secondary Labels & Captions |
| `caption` | 12px (0.75rem) | 1.4 | 500 (Medium) | Tooltips & SHA-256 Manifest Hashes |

---

## 3. Spacing Grid (8pt System)

`4px` (xs), `8px` (sm), `16px` (md), `24px` (lg), `32px` (xl), `48px` (xxl).

---

## 4. Accessibility & WCAG AA Compliance

1. **Contrast Ratio**: Minimum contrast ratio of `4.5:1` for normal text and `3:1` for large headings against dark background surfaces.
2. **Focus Indicators**: Distinct `2px` focus outline (`--brand-primary`) on all interactive buttons and table rows.
3. **Screen Reader ARIA**: Explicit `aria-label`, `aria-expanded`, and `role="table"` attributes across all UI components.
