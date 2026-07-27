# 🎨 UI_UX_DESIGN_GUIDE.md — UI/UX Design Guide & User Flows

**System Name**: Family Wealth OS  
**Phase**: Phase 5A  
**Date**: July 27, 2026  
**Status**: APPROVED DESIGN GUIDE  

---

## 1. UX Principles & User Psychology

Family Wealth OS is built for high-net-worth families, financial advisors, and individual asset owners. The UI/UX adheres to 4 core principles:

1. **Clarity Over Complexity**: Present total wealth and asset allocation prominently without overwhelming users.
2. **Instant Visual Hierarchy**: High-contrast KPI metric cards at the top, followed by multi-dimensional visual charts, and detailed data tables at the bottom.
3. **Local Currency Localization**: Formatted Indian numbering system (`₹1,03,50,000.50`) for INR and standard international formatting (`$10,000.50`) for USD.
4. **Verifiable Audit Confidence**: Display calculation manifest SHA-256 hashes and snapshot IDs in subtle tooltips for financial transparency.

---

## 2. 9 Platform Pages & User Flows

```
                                  [FAMILY WEALTH OS NAV BAR]
                                              │
      ┌──────────────┬──────────────┬─────────┴────┬──────────────┬──────────────┐
      ▼              ▼              ▼              ▼              ▼              ▼
[1. Dashboard] [2. Portfolio] [3. Holdings] [4. Asset Details] [5. Performance] [6. Analytics]
      │              │              │              │              │              │
      └──────────────┴──────────────┼──────────────┴──────────────┴──────────────┘
                                    │
                            ┌───────┴───────┐
                            ▼               ▼
                        [7. Risk]      [8. Reports] ➔ [9. Settings]
```

### Page 1: Dashboard (`/dashboard`)
- **Primary Goal**: Immediate executive wealth overview.
- **Components**: Consolidated Wealth MetricCard, Family Member Net Worth Breakdown Cards, Top Holdings Tile, Recent Activity Timeline.

### Page 2: Portfolio (`/portfolio`)
- **Primary Goal**: Deep-dive into 4-level domain tree rollup (**Family -> Member -> Entity -> Account**).
- **Components**: Hierarchical Tree Accordion, Net Worth Rollup MetricCards, Currency Breakdown Doughnut.

### Page 3: Holdings (`/holdings`)
- **Primary Goal**: Comprehensive table of all active asset holdings across accounts.
- **Components**: Filterable/Sortable `HoldingTable`, Asset Search Bar, Category Filters.

### Page 4: Asset Details (`/asset/:assetId`)
- **Primary Goal**: Granular single-asset historical price chart, transaction log, and cost basis analytics.
- **Components**: Asset Header Tile, Price History Chart, Transaction History Table.

### Page 5: Performance (`/performance`)
- **Primary Goal**: Measure investment returns across multiple horizons.
- **Components**: XIRR MetricCard, CAGR MetricCard, Absolute Return Tile, Historical Net Worth Line Chart.

### Page 6: Analytics (`/analytics`)
- **Primary Goal**: Asset allocation, sector breakdown, and portfolio health metrics.
- **Components**: 5D Allocation Donut & Treemap Charts, Herfindahl-Hirschman Index (HHI) Score Meter.

### Page 7: Risk (`/risk`)
- **Primary Goal**: Volatility, drawdown, Sharpe ratio, and benchmark comparison (Nifty 50).
- **Components**: RiskGauge Meters, Sharpe & Sortino Cards, Benchmark Comparison Bar Chart.

### Page 8: Reports (`/reports`)
- **Primary Goal**: Generate and download PDF & CSV wealth statements.
- **Components**: Report Configurator Form, Download Trigger Button, Generated Reports History Table.

### Page 9: Settings (`/settings`)
- **Primary Goal**: Configure family entities, member profiles, market data provider credentials, and theme settings.
- **Components**: Family Entity Form, Credential Manager Table, Dark Mode Toggle.
