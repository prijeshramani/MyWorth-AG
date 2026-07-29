import React, { useEffect, useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useProtectionSummary } from '../../hooks/useProtectionSummary';
import { apiClient } from '../../services/apiClient';
import { RiskGauge } from '../ui/RiskGauge';
import { MetricCard } from '../ui/MetricCard';
import { Timeline, type TimelineEvent } from '../ui/Timeline';
import { HoldingTable, type HoldingRow } from '../ui/HoldingTable';
import { InsightCard } from '../ui/InsightCard';
import { PageSkeleton } from '../common/PageSkeleton';
import { ShieldCheck, HeartPulse, ShieldAlert, Award, UserCheck } from 'lucide-react';

const mockTimelineEvents: TimelineEvent[] = [
  { id: '1', title: 'Premium Due — Max Life Term Insurance', timestamp: 'Due in 15 days', amount: '₹15,000.00', type: 'VALUATION' },
  { id: '2', title: 'Health Policy Renewal — Star Health', timestamp: 'Due in 45 days', amount: '₹22,500.00', type: 'VALUATION' }
];

interface MatrixMember {
  id: number;
  name: string;
  relationship: string;
  lifeCover: string;
  healthCover: string;
  status: string;
  statusColor: 'emerald' | 'sky' | 'amber';
}

const DEMO_MATRIX_MEMBERS: MatrixMember[] = [
  { id: 1, name: 'Rajesh Sharma', relationship: 'Primary Earner', lifeCover: '₹1,00,00,000', healthCover: '₹35,00,000', status: 'OPTIMAL', statusColor: 'emerald' },
  { id: 2, name: 'Priya Sharma', relationship: 'Spouse', lifeCover: '₹50,00,000', healthCover: '₹35,00,000 (Floater)', status: 'MODERATE', statusColor: 'sky' }
];

export const ProtectionDashboard: React.FC = () => {
  const { activeFamilyId, datasetMode } = useUiStore();
  const { data: response, isLoading, error } = useProtectionSummary(activeFamilyId);
  const [familyMembers, setFamilyMembers] = useState<MatrixMember[]>([]);

  useEffect(() => {
    if (datasetMode === 'DEMO') {
      setFamilyMembers(DEMO_MATRIX_MEMBERS);
    } else {
      apiClient.get<any[]>(`/family-members?familyId=${activeFamilyId}`)
        .then(res => {
          const raw = Array.isArray(res.data) ? res.data : [];
          const mapped: MatrixMember[] = raw.map(m => ({
            id: m.id,
            name: m.name,
            relationship: m.relationship || 'Family Member',
            lifeCover: m.lifeCover ? `₹${Number(m.lifeCover).toLocaleString('en-IN')}` : '₹0.00',
            healthCover: m.healthCover ? `₹${Number(m.healthCover).toLocaleString('en-IN')}` : '₹0.00',
            status: m.lifeCover || m.healthCover ? 'OPTIMAL' : 'PENDING_REVIEW',
            statusColor: m.lifeCover || m.healthCover ? 'emerald' : 'amber'
          }));
          setFamilyMembers(mapped);
        })
        .catch(() => setFamilyMembers([]));
    }
  }, [datasetMode, activeFamilyId]);

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

  const timelineEvents = datasetMode === 'DEMO' ? mockTimelineEvents : [];

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
          value={protectionData ? protectionData.protectionScore : 0}
          minValue={0}
          maxValue={100}
          ratingLabel={protectionData ? protectionData.protectionRating : 'CRITICAL_GAP'}
          statusColor={protectionData && protectionData.protectionScore > 50 ? '#10b981' : '#f43f5e'}
        />

        <MetricCard
          title="Total Life Cover"
          value={protectionData ? protectionData.lifeCover.formattedTotalSumAssured : '₹0.00'}
          subtext={`Target: ${protectionData ? protectionData.lifeCover.formattedTargetCoverage : '₹2.50 Cr'}`}
          changePercent={0}
          trend="UP"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
        />

        <MetricCard
          title="Total Health Cover"
          value={protectionData ? protectionData.healthCover.formattedTotalSumAssured : '₹0.00'}
          subtext="Family Floater Coverage"
          changePercent={0}
          trend="UP"
          icon={<HeartPulse className="w-4 h-4 text-sky-400" />}
        />
      </div>

      {/* 2. Insights & Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightCard
          type={holdingRows.length > 0 ? 'INFO' : 'WARNING'}
          title="Nominee Verification Status"
          message={holdingRows.length > 0 ? 'Active insurance policies have designated primary nominees.' : 'No insurance policies recorded yet. Add your policies to track nominee verification.'}
        />
        <InsightCard
          type="WARNING"
          title="Life Cover Gap Assessment"
          message={protectionData && protectionData.lifeCover.totalSumAssured > 0 ? `Current life sum assured is ${protectionData.lifeCover.coverageGapPercent}% of target.` : 'No active life insurance policies recorded. Consider evaluating family risk protection requirements.'}
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
              {familyMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No family members recorded yet. Add members in Onboarding or Family Manager to populate the matrix.
                  </td>
                </tr>
              ) : (
                familyMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="py-3 px-2 font-semibold text-slate-200">{member.name}</td>
                    <td className="py-3 px-2 text-slate-400">{member.relationship}</td>
                    <td className="py-3 px-2 font-mono text-emerald-400">{member.lifeCover}</td>
                    <td className="py-3 px-2 font-mono text-sky-400">{member.healthCover}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        member.statusColor === 'emerald'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : member.statusColor === 'sky'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
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
        <Timeline events={timelineEvents} />
      </div>
    </div>
  );
};
