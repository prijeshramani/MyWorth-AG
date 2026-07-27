import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useProtectionSummary } from '../../hooks/useProtectionSummary';
import { RiskGauge } from '../ui/RiskGauge';
import { MetricCard } from '../ui/MetricCard';
import { Timeline, type TimelineEvent } from '../ui/Timeline';
import { HoldingTable, type HoldingRow } from '../ui/HoldingTable';
import { InsightCard } from '../ui/InsightCard';
import { PageSkeleton } from '../common/PageSkeleton';
import { ShieldCheck, HeartPulse, ShieldAlert, Award } from 'lucide-react';

const mockTimelineEvents: TimelineEvent[] = [
  { id: '1', title: 'Premium Due — Max Life Term Insurance', timestamp: 'Due in 15 days', amount: '₹15,000.00', type: 'VALUATION' },
  { id: '2', title: 'Health Policy Renewal — Star Health', timestamp: 'Due in 45 days', amount: '₹22,500.00', type: 'VALUATION' }
];

export const ProtectionDashboard: React.FC = () => {
  const { activeFamilyId } = useUiStore();
  const { data: response, isLoading, error } = useProtectionSummary(activeFamilyId);

  if (isLoading) {
    return <PageSkeleton />;
  }

  const protectionData = response?.data;

  const holdingRows: HoldingRow[] = (protectionData?.policies || []).map((p) => ({
    holdingId: p.policyId,
    assetName: `${p.insurerName} (${p.policyNumber})`,
    symbol: p.policyType,
    assetType: p.policyType,
    quantity: 1,
    unitPrice: p.sumAssured,
    formattedMarketValue: p.formattedSumAssured,
    unrealizedGainPercent: 0
  }));

  return (
    <div className="space-y-8">
      {/* View Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Protection & Insurance Domain</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Independent risk mitigation & family insurance coverage governance dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            Rating: {protectionData?.protectionRating || 'OPTIMAL'}
          </span>
        </div>
      </div>

      {/* 1. Header Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RiskGauge
          label="Protection Score"
          value={protectionData?.protectionScore || 85}
          minValue={0}
          maxValue={100}
          ratingLabel={protectionData?.protectionRating || 'OPTIMAL'}
          statusColor="#10b981"
        />

        <MetricCard
          title="Total Life Cover"
          value={protectionData?.lifeCover.formattedTotalSumAssured || '₹1,00,00,000.00'}
          subtext={`Target: ${protectionData?.lifeCover.formattedTargetCoverage || '₹2.50 Cr'}`}
          changePercent={10.0}
          trend="UP"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
        />

        <MetricCard
          title="Total Health Cover"
          value={protectionData?.healthCover.formattedTotalSumAssured || '₹35,00,000.00'}
          subtext="Family Floater Coverage"
          changePercent={5.0}
          trend="UP"
          icon={<HeartPulse className="w-4 h-4 text-sky-400" />}
        />
      </div>

      {/* 2. Insights & Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightCard
          type="INFO"
          title="Nominee Verification Status"
          message="100% of active insurance policies have designated primary nominees."
        />
        <InsightCard
          type="WARNING"
          title="Life Cover Gap Assessment"
          message="Current life sum assured is 40% of recommended 10x annual income target."
          actionText="Explore Term Cover Options"
        />
      </div>

      {/* 3. Family Protection Heat Map Matrix */}
      <div className="card-glass p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Family Protection Heat Map Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="pb-3 px-2">Family Member</th>
                <th className="pb-3 px-2">Role</th>
                <th className="pb-3 px-2">Life Cover</th>
                <th className="pb-3 px-2">Health Cover</th>
                <th className="pb-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              <tr>
                <td className="py-3 px-2 font-semibold text-slate-200">Rajesh Sharma</td>
                <td className="py-3 px-2 text-slate-400">Primary Earner</td>
                <td className="py-3 px-2 font-mono text-emerald-400">₹1,00,00,000</td>
                <td className="py-3 px-2 font-mono text-sky-400">₹35,00,000</td>
                <td className="py-3 px-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    OPTIMAL
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-2 font-semibold text-slate-200">Priya Sharma</td>
                <td className="py-3 px-2 text-slate-400">Spouse</td>
                <td className="py-3 px-2 font-mono text-slate-400">₹50,00,000</td>
                <td className="py-3 px-2 font-mono text-sky-400">₹35,00,000 (Floater)</td>
                <td className="py-3 px-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    MODERATE
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Active Policies Table */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Active Insurance Policies
        </h3>
        <HoldingTable data={holdingRows} />
      </div>

      {/* 5. Premium Activity Feed */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Upcoming Premium Activity Feed
        </h3>
        <Timeline events={mockTimelineEvents} />
      </div>
    </div>
  );
};
