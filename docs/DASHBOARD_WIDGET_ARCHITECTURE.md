# 🧩 DASHBOARD_WIDGET_ARCHITECTURE.md — Modular Dashboard Widget Architecture

**System Name**: Family Wealth OS  
**Phase**: Phase 5B-1 (Documentation Enhancement)  
**Date**: July 27, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Executive Widget Concept

Family Wealth OS Dashboard is built around a decoupled, plugin-style **Modular Widget Architecture**. Each dashboard panel is a self-contained React widget component implementing a unified contract interface (`IWidget`):

```typescript
export interface WidgetProps<T = any> {
  id: string;
  title: string;
  data?: T;
  loading?: boolean;
  error?: Error | null;
  settings?: Record<string, any>;
  onRefresh?: () => void;
}
```

---

## 2. Standard Widget Inventory

1. **`NetWorthHeroWidget`**: Total consolidated family net worth display.
2. **`MemberBreakdownWidget`**: Net worth distribution per family member.
3. **`AssetAllocationWidget`**: Donut chart breakdown by asset category.
4. **`TopHoldingsWidget`**: Table tile of top 5 asset holdings by market value.
5. **`RecentTransactionsWidget`**: Feed of latest trade buys, sells, and dividends.
6. **`RiskAlertsWidget`**: High concentration and volatility warning cards.
