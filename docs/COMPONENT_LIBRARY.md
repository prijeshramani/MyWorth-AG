# 🧩 COMPONENT_LIBRARY.md — Component Library Specification

**System Name**: Family Wealth OS  
**Phase**: Phase 5A  
**Date**: July 27, 2026  
**Status**: APPROVED COMPONENT SPECIFICATION  

---

## 1. Atomic Component Inventory

| Component Name | Type | Key Props | Description |
| :--- | :--- | :--- | :--- |
| **`MetricCard`** | Card | `title`, `value`, `subtext`, `changePercent`, `trend` | High-impact KPI display for Total Wealth, XIRR, Volatility |
| **`PortfolioCard`** | Card | `familyId`, `familyName`, `netWorth`, `memberCount` | Summarizes top-level family entity performance |
| **`HoldingTable`** | Table | `holdings`, `onSort`, `onFilter`, `currency` | Filterable, sortable table displaying active holdings |
| **`AssetTile`** | Tile | `assetName`, `symbol`, `marketValue`, `unrealizedGain` | Compact asset card for dashboard top holdings list |
| **`AllocationChart`**| Chart | `data`, `type` ('ASSET', 'SECTOR', 'GEOGRAPHIC') | Donut & Treemap asset allocation renderer |
| **`PerformanceChart`**| Chart | `timeSeriesData`, `benchmarkData`, `timeframe` | Interactive line chart for net worth growth & XIRR |
| **`RiskGauge`** | Gauge | `score`, `rating`, `label` | Radial gauge meter for Sharpe Ratio, Volatility, HHI |
| **`InsightCard`** | Card | `type` ('WARNING', 'INFO', 'GAIN'), `message` | Highlights portfolio health warnings or rebalancing insights |
| **`Timeline`** | List | `events` (transactions, valuation updates) | Chronological event feed |

---

## 2. Component Specifications & Interfaces

### 1. `MetricCard`
```typescript
export interface MetricCardProps {
  title: string;
  value: string;
  subtext?: string;
  changePercent?: number;
  trend?: 'UP' | 'DOWN' | 'NEUTRAL';
  loading?: boolean;
  icon?: React.ReactNode;
}
```

### 2. `HoldingTable`
```typescript
export interface HoldingRow {
  holdingId: number;
  assetName: string;
  symbol?: string;
  assetType: string;
  quantity: number;
  unitPrice: number;
  formattedMarketValue: string;
  unrealizedGainPercent: number;
}

export interface HoldingTableProps {
  data: HoldingRow[];
  onRowClick?: (holdingId: number) => void;
  loading?: boolean;
}
```

### 3. `RiskGauge`
```typescript
export interface RiskGaugeProps {
  label: string;
  value: number;
  minValue: number;
  maxValue: number;
  ratingLabel: 'LOW' | 'MODERATE' | 'HIGH';
  statusColor: string;
}
```
