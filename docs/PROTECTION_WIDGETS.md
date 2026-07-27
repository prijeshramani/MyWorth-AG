# 🧩 PROTECTION_WIDGETS.md — Protection Dashboard Widget Inventory

**System Name**: Family Wealth OS  
**Phase**: Phase 5C  
**Date**: July 27, 2026  
**Status**: APPROVED WIDGET SPECIFICATION  

---

## 1. Protection Widget Inventory (8 Modular Widgets)

```
1. Protection Score Widget     5. Policy Maturity Widget
2. Total Life Cover Widget     6. Missing Nominee Alert Widget
3. Total Health Cover Widget   7. Policy Distribution Widget
4. Upcoming Premiums Widget    8. Premium Calendar Widget
```

---

## 2. Detailed Widget Specifications

### 1. `ProtectionScoreWidget`
- **Purpose**: Displays overall Protection Score gauge meter (0-100) and rating badge (`OPTIMAL`, `MODERATE`, `AT_RISK`, `CRITICAL_GAP`).
- **Component Reuse**: Reuses `RiskGauge.tsx`.

### 2. `LifeCoverWidget`
- **Purpose**: Displays aggregate active life insurance sum assured vs recommended target cover.
- **Component Reuse**: Reuses `MetricCard.tsx`.

### 3. `HealthCoverWidget`
- **Purpose**: Displays aggregate active health insurance sum assured vs medical emergency target.
- **Component Reuse**: Reuses `MetricCard.tsx`.

### 4. `UpcomingPremiumsWidget`
- **Purpose**: Displays chronological list of premium payments due within the next 30/60 days.
- **Component Reuse**: Reuses `Timeline.tsx`.

### 5. `PolicyMaturityWidget`
- **Purpose**: Tracks endowment/ULIP policies nearing maturity date over the next 1-5 years.
- **Component Reuse**: Reuses `MetricCard.tsx`.

### 6. `MissingNomineeAlertWidget`
- **Purpose**: Highlights active policies with unassigned or unverified nominee details.
- **Component Reuse**: Reuses `InsightCard.tsx`.

### 7. `PolicyDistributionWidget`
- **Purpose**: Visualizes percentage distribution of coverage sum assured across insurers.
- **Component Reuse**: Reuses `Recharts PieChart`.

### 8. `PremiumCalendarWidget`
- **Purpose**: Interactive calendar view highlighting monthly premium payment due dates.
- **Component Reuse**: Reuses `ResponsiveGrid.tsx`.
