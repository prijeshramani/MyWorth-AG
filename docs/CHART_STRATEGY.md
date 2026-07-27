# 📈 CHART_STRATEGY.md — Financial Chart Visualization Strategy

**System Name**: Family Wealth OS  
**Phase**: Phase 5A  
**Date**: July 27, 2026  
**Status**: APPROVED CHART STRATEGY  

---

## 1. Charting Engine Selection: Recharts

Family Wealth OS selects **Recharts** (`^2.12.0`) as its core charting library due to its native React SVG rendering, responsive container support, smooth animations, and high customization via custom tooltips.

---

## 2. 6 Financial Chart Types & Mapping

| Chart Name | Chart Type | Data Source | Primary Visual Metric |
| :--- | :--- | :--- | :--- |
| **1. Net Worth Growth** | Area Chart (`<AreaChart>`) | `NetWorthEngine` time-series | Portfolio market value over time with gradient fill |
| **2. Asset Allocation** | Donut Chart (`<PieChart innerRadius={60}>`) | `PortfolioAnalyticsEngine` breakdown | Allocation % by asset type (Stock, Mutual Fund, Real Estate) |
| **3. Sector Allocation** | Treemap Chart (`<Treemap>`) | `PortfolioAnalyticsEngine` sector list | Relative size of sector holdings (Tech, Finance, Energy) |
| **4. Performance XIRR** | Line Chart (`<LineChart>`) | `PerformanceEngine` timeline | Portfolio XIRR return trajectory vs benchmark |
| **5. Risk Profile** | Radial Bar / Gauge (`<RadialBarChart>`) | `RiskEngine` metrics | Volatility, Sharpe ratio, and Max Drawdown meters |
| **6. Cash Flow Activity** | Bar Chart (`<BarChart>`) | `TransactionEngine` inflows/outflows | Monthly net buy, sell, and dividend cash flows |

---

## 3. Custom Glassmorphism Tooltip Component

All charts render custom glassmorphic SVG tooltips displaying monetary values formatted according to currency preference:

```typescript
// frontend/src/components/charts/CustomTooltip.tsx
export const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 border border-slate-700/50 p-3 rounded-lg shadow-xl backdrop-blur-md text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="font-semibold">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
```
