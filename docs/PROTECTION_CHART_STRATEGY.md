# 📊 PROTECTION_CHART_STRATEGY.md — Protection Domain Chart Strategy

**System Name**: Family Wealth OS  
**Phase**: Phase 5C  
**Date**: July 27, 2026  
**Status**: APPROVED CHART STRATEGY  

---

## 1. Chart Visualization Inventory

All Protection & Insurance charts reuse the existing **Chart Design System (`CHART_DESIGN_SYSTEM.md`)** without creating secondary chart engines:

| Chart Name | Recharts Component Type | Target Metric | Palette Tokens |
| :--- | :--- | :--- | :--- |
| **Coverage Distribution** | `PieChart` / `Donut` | Sum Assured breakdown by Policy Type | Emerald, Sky, Purple, Amber |
| **Premium Timeline** | `BarChart` (Stacked) | Monthly recurring premium outflow schedule | Slate Blue, Teal |
| **Policy Maturity Timeline** | `ComposedChart` | Maturity payouts timeline (LIC, ULIP) | Gold, Emerald |
| **Protection Score Trend** | `AreaChart` | Historical Protection Score (12-month) | Emerald-to-transparent gradient |
