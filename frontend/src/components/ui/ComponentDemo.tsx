import React from 'react';
import { MetricCard } from './MetricCard';
import { PortfolioCard } from './PortfolioCard';
import { AssetTile } from './AssetTile';
import { HoldingTable, type HoldingRow } from './HoldingTable';
import { InsightCard } from './InsightCard';
import { RiskGauge } from './RiskGauge';
import { Timeline, type TimelineEvent } from './Timeline';
import { Wallet, TrendingUp, ShieldCheck } from 'lucide-react';

const mockHoldings: HoldingRow[] = [
  { holdingId: 1, assetName: 'Reliance Industries Ltd', symbol: 'RELIANCE', assetType: 'STOCK', quantity: 100, unitPrice: 2850, formattedMarketValue: '₹2,85,000.00', unrealizedGainPercent: 33.33 },
  { holdingId: 2, assetName: 'HDFC Bank Ltd', symbol: 'HDFCBANK', assetType: 'STOCK', quantity: 150, unitPrice: 1520, formattedMarketValue: '₹2,28,000.00', unrealizedGainPercent: 12.50 },
  { holdingId: 3, assetName: 'Apple Inc', symbol: 'AAPL', assetType: 'STOCK', quantity: 50, unitPrice: 180, formattedMarketValue: '₹7,51,500.00', unrealizedGainPercent: 25.00 },
  { holdingId: 4, assetName: 'Parag Parikh Flexi Cap Fund', symbol: 'PPFCF', assetType: 'MUTUAL_FUND', quantity: 5000, unitPrice: 65.4, formattedMarketValue: '₹3,27,000.00', unrealizedGainPercent: 18.20 }
];

const mockTimelineEvents: TimelineEvent[] = [
  { id: '1', title: 'Buy Trade — Reliance Industries', timestamp: '2026-07-25 14:30', amount: '₹2,85,000.00', type: 'BUY' },
  { id: '2', title: 'Dividend Received — HDFC Bank', timestamp: '2026-07-20 11:15', amount: '₹4,500.00', type: 'DIVIDEND' },
  { id: '3', title: 'Valuation Snapshot Generated', timestamp: '2026-07-15 09:00', amount: '₹1,03,50,000.50', type: 'VALUATION' }
];

export const ComponentDemo: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Demo Header */}
      <div className="border-b border-slate-800/80 pb-4">
        <h2 className="text-xl font-bold text-slate-100">Phase 5B-2 — Atomic Component Library Demo</h2>
        <p className="text-xs text-slate-400 mt-1">
          Interactive Story/Demo exhibiting reusable atomic UI components with mocked data.
        </p>
      </div>

      {/* 1. MetricCards */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. MetricCard Component</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard title="Total Wealth" value="₹1,03,50,000.50" subtext="Sharma Family Portfolio" changePercent={14.2} trend="UP" icon={<Wallet className="w-4 h-4" />} />
          <MetricCard title="Newton-Raphson XIRR" value="18.50%" subtext="Holding Horizon > 1 Yr" changePercent={2.4} trend="UP" icon={<TrendingUp className="w-4 h-4" />} />
          <MetricCard title="Annualized Volatility" value="14.50%" subtext="Risk Rating: Moderate" changePercent={-1.2} trend="DOWN" icon={<ShieldCheck className="w-4 h-4" />} />
        </div>
      </div>

      {/* 2. PortfolioCards */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">2. PortfolioCard Component</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PortfolioCard familyId={1} familyName="Sharma Family" formattedNetWorth="₹1,03,50,000.50" memberCount={3} entityCount={2} accountCount={4} dominantAssetType="STOCK" />
          <PortfolioCard familyId={2} familyName="Verma Family Trust" formattedNetWorth="₹45,20,000.00" memberCount={2} entityCount={1} accountCount={2} dominantAssetType="MUTUAL_FUND" />
        </div>
      </div>

      {/* 3. AssetTiles */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">3. AssetTile Component</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AssetTile name="Reliance Industries Ltd" symbol="RELIANCE" assetType="STOCK" formattedMarketValue="₹2,85,000.00" unrealizedGainPercent={33.33} />
          <AssetTile name="Apple Inc" symbol="AAPL" assetType="STOCK" formattedMarketValue="₹7,51,500.00" unrealizedGainPercent={25.00} />
        </div>
      </div>

      {/* 4. InsightCards */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">4. InsightCard Component</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InsightCard type="WARNING" title="High Sector Concentration" message="Technology sector constitutes over 45% of total portfolio value." actionText="Review Sector Allocations" />
          <InsightCard type="GAIN" title="XIRR Benchmark Outperformance" message="Portfolio return exceeds Nifty 50 benchmark by +4.20% over 1-year horizon." />
          <InsightCard type="INFO" title="System Valuation Sync Complete" message="All 14 asset class closing market valuations synced successfully." />
        </div>
      </div>

      {/* 5. RiskGauges */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">5. RiskGauge Component</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RiskGauge label="Diversification Score" value={85.5} minValue={0} maxValue={100} ratingLabel="LOW" statusColor="#10b981" />
          <RiskGauge label="Sharpe Ratio" value={1.82} minValue={0} maxValue={3} ratingLabel="MODERATE" statusColor="#0284c7" />
          <RiskGauge label="Herfindahl Index (HHI)" value={1420} minValue={0} maxValue={10000} ratingLabel="LOW" statusColor="#8b5cf6" />
        </div>
      </div>

      {/* 6. HoldingTable */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">6. HoldingTable Component (3-State Enabled)</h3>
        <HoldingTable data={mockHoldings} />
      </div>

      {/* 7. Timeline */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">7. Timeline Component</h3>
        <Timeline events={mockTimelineEvents} />
      </div>
    </div>
  );
};
