import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageShell } from '../layout/PageShell';
import { Card } from '../ui/Card';
import { StatCard } from '../ui/StatCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CardSkeleton } from '../ui/Skeleton';
import { familyHealthService } from '../../services/familyHealthService';
import { PillarScoreCard } from './PillarScoreCard';
import { HealthHistoryChart } from './HealthHistoryChart';
import { 
  Activity, 
  Camera, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  Info
} from 'lucide-react';
import type { FamilyFinancialHealth, LifeStage } from '../../types/familyOffice';

const getLifeStageBadge = (stage: LifeStage) => {
  switch (stage) {
    case 'EARLY_CAREER':
      return <Badge variant="primary">Early Career (Liquidity Focus)</Badge>;
    case 'WEALTH_ACCUMULATION':
      return <Badge variant="success">Wealth Accumulation</Badge>;
    case 'FAMILY_EXPANSION':
      return <Badge variant="warning">Family Expansion (Protection Focus)</Badge>;
    case 'PRE_RETIREMENT':
      return <Badge variant="info">Pre-Retirement (Goal & Tax Focus)</Badge>;
    case 'RETIREMENT':
      return <Badge variant="primary">Retirement (Estate & Runway Focus)</Badge>;
    case 'LEGACY_PLANNING':
      return <Badge variant="neutral">Legacy & Succession Planning</Badge>;
    default:
      return <Badge variant="neutral">{stage}</Badge>;
  }
};

export const FamilyHealthDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [snapshotMsg, setSnapshotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Read-only health query
  const { data: health, isLoading: isHealthLoading, error: healthError, refetch: refetchHealth } = useQuery<FamilyFinancialHealth>({
    queryKey: ['familyHealth'],
    queryFn: () => familyHealthService.getHealth()
  });

  // Read-only history query
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['familyHealthHistory'],
    queryFn: () => familyHealthService.getHistory(24)
  });

  // Explicit snapshot mutation
  const snapshotMutation = useMutation({
    mutationFn: () => familyHealthService.takeSnapshot(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['familyHealthHistory'] });
      setSnapshotMsg({
        type: 'success',
        text: `Snapshot recorded for period ${res.snapshot_period} (Score: ${res.overall_score})`
      });
      setTimeout(() => setSnapshotMsg(null), 4000);
    },
    onError: (err: any) => {
      setSnapshotMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to capture snapshot.'
      });
      setTimeout(() => setSnapshotMsg(null), 5000);
    }
  });

  if (isHealthLoading) {
    return (
      <PageShell title="Family Financial Health" subtitle="Evaluating 5-pillar composite health and life-stage weights...">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </PageShell>
    );
  }

  if (healthError || !health) {
    return (
      <PageShell title="Family Financial Health" subtitle="Family Office Intelligence">
        <Card variant="glass" className="p-8 text-center border-rose-500/30">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#F3F4F6]">Unable to Load Financial Health</h3>
          <p className="text-xs text-[#9CA3AF] max-w-md mx-auto my-2">
            {(healthError as any)?.message || 'An error occurred while evaluating the family financial health index.'}
          </p>
          <Button variant="primary" onClick={() => refetchHealth()} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry Health Evaluation
          </Button>
        </Card>
      </PageShell>
    );
  }

  const pillars = health.pillars;

  return (
    <PageShell
      title="Family Financial Health"
      subtitle={`Authoritative 5-pillar composite scoring for Family #${health.familyId}`}
      actions={
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => refetchHealth()}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-Evaluate
          </Button>
          <Button
            variant="primary"
            onClick={() => snapshotMutation.mutate()}
            disabled={snapshotMutation.isPending}
            className="text-xs"
          >
            <Camera className={`w-3.5 h-3.5 mr-1.5 ${snapshotMutation.isPending ? 'animate-spin' : ''}`} />
            {snapshotMutation.isPending ? 'Saving...' : 'Save Snapshot'}
          </Button>
        </div>
      }
    >
      {/* Toast Notice */}
      {snapshotMsg && (
        <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center justify-between border ${
          snapshotMsg.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {snapshotMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{snapshotMsg.text}</span>
          </div>
        </div>
      )}

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card variant="glass" className="p-5 border border-[#4F7FFF]/30 bg-gradient-to-br from-[#4F7FFF]/10 to-transparent flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
              <span>Overall Composite Score</span>
              <Activity className="w-4 h-4 text-[#4F7FFF]" />
            </div>
            <div className="text-3xl font-extrabold text-[#F3F4F6] font-mono my-2">
              {health.overallScore.toFixed(0)} <span className="text-base font-normal text-[#9CA3AF]">/ 100</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#2B2E35] flex items-center justify-between text-xs">
            <span className="text-[#9CA3AF]">Status:</span>
            <Badge variant={health.overallScore >= 70 ? 'success' : health.overallScore >= 45 ? 'warning' : 'danger'} size="sm">
              {health.overallStatus}
            </Badge>
          </div>
        </Card>

        <Card variant="glass" className="p-5 border border-[#2B2E35] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
              <span>Life-Stage Weighting</span>
              <Sparkles className="w-4 h-4 text-[#F79009]" />
            </div>
            <div className="my-2">{getLifeStageBadge(health.lifeStage)}</div>
          </div>
          <p className="text-[11px] text-[#6B7280]">
            Dynamic weight profile calibrated for current family demographic.
          </p>
        </Card>

        <Card variant="glass" className="p-5 border border-[#2B2E35] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
              <span>Data Completeness</span>
              <ShieldCheck className="w-4 h-4 text-[#32D583]" />
            </div>
            <div className="text-2xl font-bold text-[#F3F4F6] font-mono my-2">
              {(health.completenessScore * 100).toFixed(0)}%
            </div>
          </div>
          <p className="text-[11px] text-[#6B7280]">
            Higher completeness unlocks maximum precision across 5 pillars.
          </p>
        </Card>

        <Card variant="glass" className="p-5 border border-[#2B2E35] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
              <span>Calculation Hash</span>
              <Info className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <div className="text-xs font-mono text-[#F3F4F6] truncate my-2 bg-[#1E2025] p-1.5 rounded border border-[#2B2E35]">
              {health.stateHash.slice(0, 16)}...
            </div>
          </div>
          <div className="text-[10px] text-[#6B7280] font-mono flex justify-between">
            <span>Version: {health.calculationVersion}</span>
            <span>As of: {health.asOfDate.slice(0, 10)}</span>
          </div>
        </Card>
      </div>

      {/* 5-Pillar Score Cards Grid */}
      <h3 className="text-sm font-bold text-[#F3F4F6] uppercase tracking-wider mb-3">
        Five-Pillar Health Breakdown
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {pillars.protection && <PillarScoreCard pillarKey="protection" pillar={pillars.protection} />}
        {pillars.liquidity && <PillarScoreCard pillarKey="liquidity" pillar={pillars.liquidity} />}
        {pillars.goals && <PillarScoreCard pillarKey="goals" pillar={pillars.goals} />}
        {pillars.estate && <PillarScoreCard pillarKey="estate" pillar={pillars.estate} />}
        {pillars.taxAndData && <PillarScoreCard pillarKey="taxAndData" pillar={pillars.taxAndData} />}
      </div>

      {/* Historical Snapshot Trend */}
      <HealthHistoryChart snapshots={historyData?.snapshots || []} />
    </PageShell>
  );
};
