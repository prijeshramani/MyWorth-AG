# 📱 RESPONSIVE_LAYOUT.md — Responsive Layout & Breakpoint System

**System Name**: Family Wealth OS  
**Phase**: Phase 5A  
**Date**: July 27, 2026  
**Status**: APPROVED RESPONSIVE SPECIFICATION  

---

## 1. Breakpoint Grid Matrix

Family Wealth OS adapts seamlessly across 3 main device tiers:

| Breakpoint Tier | Target Width | Navigation Pattern | Layout Strategy |
| :--- | :--- | :--- | :--- |
| **Desktop** | `1440px+` | Persistent Left Navigation Drawer (260px) | 3-Column Grid (`repeat(3, 1fr)`), Inline Data Tables |
| **Tablet** | `768px - 1439px` | Collapsible Left Drawer (Icon rail 70px) | 2-Column Grid (`repeat(2, 1fr)`), Horizontal Scroll Tables |
| **Mobile** | `375px - 767px` | Bottom Navigation Bar / Slide-out Drawer | 1-Column Stacked Cards, Card-Based Table Alternative |

---

## 2. Layout Grid Specifications

```css
/* Responsive Grid Container */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
  padding: 1.5rem;
}

@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1440px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 3. Mobile Table Strategy

On mobile screens (`<768px`), complex multi-column data tables (`HoldingTable`) automatically transform into touch-friendly stacked cards:

```
+--------------------------------------------------+
| Reliance Industries Ltd              ₹2,85,000.00|
| STOCK • NSE                         +33.33% Gain |
+--------------------------------------------------+
```
