import React, { useEffect, useState } from 'react';
import { PageShell } from '../layout/PageShell';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CardSkeleton } from '../ui/Skeleton';
import { apiClient } from '../../services/apiClient';
import { familyHealthService } from '../../services/familyHealthService';
import { proactiveObserverService } from '../../services/proactiveObserverService';
import { FFHHealthWidget } from './FFHHealthWidget';
import {
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Calculator,
  PieChart as PieIcon,
  Bot,
  Zap,
  RefreshCw,
  Wallet,
  Activity,
  Layers,
  FileUp,
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { AIMorningBriefingCard } from './AIMorningBriefingCard';
import type { FamilyFinancialHealth, ProactiveTrigger } from '../../types/familyOffice';

interface AIMissionControlProps {
  onNavigate: (tab: string) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const name = item.name || item.payload?.name || item.payload?.assetType || 'Asset';
    const val = Number(item.value || 0);
    const color = item.color || item.payload?.fill || '#32D583';
    return (
      <div className="bg-[#15161A] border border-[#2B2E35] p-3 rounded-xl shadow-2xl text-xs z-50">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-slate-300 font-semibold">{name}:</span>
          <span className="text-white font-extrabold ml-1">₹{val.toLocaleString('en-IN')}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const AIMissionControl: React.FC<AIMissionControlProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [healthData, setHealthData] = useState<FamilyFinancialHealth | null>(null);
  const [triggers, setTriggers] = useState<ProactiveTrigger[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [triageNotice, setTriageNotice] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [overviewRes, healthRes, triggersRes] = await Promise.allSettled([
        apiClient.get('/dashboard/overview'),
        familyHealthService.getHealth(),
        proactiveObserverService.getTriggers('ACTIVE')
      ]);

      if (overviewRes.status === 'fulfilled') {
        setData(overviewRes.value.data?.data);
      }
      if (healthRes.status === 'fulfilled') {
        setHealthData(healthRes.value);
      }
      if (triggersRes.status === 'fulfilled') {
        setTriggers(triggersRes.value);
      }
    } catch (err) {
      console.error('Failed to load Mission Control data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      setSyncing(true);
      await apiClient.post('/sync');
    } catch (syncErr) {
      console.error('Market price sync notice:', syncErr);
    } finally {
      setSyncing(false);
    }
    await fetchAllData();
  };

  const handleTriggerAction = async (triggerId: string, action: 'acknowledge' | 'snooze' | 'dismiss') => {
    try {
      setActionLoadingId(triggerId);
      if (action === 'acknowledge') {
        await proactiveObserverService.acknowledge(triggerId);
        setTriageNotice('Trigger acknowledged.');
      } else if (action === 'snooze') {
        await proactiveObserverService.snooze(triggerId, 7);
        setTriageNotice('Trigger snoozed for 7 days.');
      } else if (action === 'dismiss') {
        await proactiveObserverService.dismiss(triggerId, 'User dismissed from Mission Control');
        setTriageNotice('Trigger dismissed.');
      }
      // Remove from active list upon server confirmation
      setTriggers(prev => prev.filter(t => t.triggerId !== triggerId));
      setTimeout(() => setTriageNotice(null), 3000);
    } catch (err: any) {
      console.error(`Failed to ${action} trigger:`, err);
      setTriageNotice(`Action failed: ${err.message || 'Error occurred'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const COLORS = ['#4F7FFF', '#32D583', '#F79009', '#8B5CF6', '#38BDF8'];
  const bentoAssetAllocation = data?.assetAllocation || [];
  const formattedNetWorth = data?.formattedTotalWealth || '₹0.00';
  const totalAssets = data?.formattedTotalAssets || '₹0.00';
  const totalLiabilities = data?.formattedTotalLiabilities || '₹0.00';
  const monthlySavings = data?.formattedMonthlySavings || '₹0.00';

  if (loading && !data) {
    return (
      <PageShell title="AI Mission Control" subtitle="Loading your financial operating system...">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="AI Mission Control"
      subtitle="Executive command center for family financial intelligence, fiduciary observations, and wealth management."
      badge={<Badge variant="primary" icon={<Sparkles className="w-3 h-3" />}>AI Active</Badge>}
      actions={
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />}
          onClick={handleRefreshData}
          disabled={syncing || loading}
        >
          {syncing ? 'Syncing Live Prices...' : 'Refresh Data'}
        </Button>
      }
    >
      {/* Morning Briefing Card */}
      <AIMorningBriefingCard />

      {/* Triage Action Notice */}
      {triageNotice && (
        <div className="p-3 rounded-xl mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{triageNotice}</span>
        </div>
      )}

      {/* Hero Bento Grid Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Net Worth Hero Card */}
        <Card variant="glass" className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#1E2025] to-[#15161A] border border-[#2B2E35]">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#4F7FFF]/10 rounded-full filter blur-3xl -z-10" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#4F7FFF]">
                Total Family Net Worth
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-[#F3F4F6] tracking-tight mt-1">
                {formattedNetWorth}
              </h2>
            </div>
            <Badge variant="success" size="md" icon={<TrendingUp className="w-3.5 h-3.5" />}>
              Live Verified
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#2B2E35]">
            <div>
              <span className="text-xs text-[#9CA3AF]">Total Assets</span>
              <p className="text-lg font-bold text-[#32D583]">{totalAssets}</p>
            </div>
            <div>
              <span className="text-xs text-[#9CA3AF]">Total Liabilities</span>
              <p className="text-lg font-bold text-[#F04438]">{totalLiabilities}</p>
            </div>
            <div>
              <span className="text-xs text-[#9CA3AF]">Monthly Savings</span>
              <p className="text-lg font-bold text-[#38BDF8]">{monthlySavings}</p>
            </div>
            <div>
              <span className="text-xs text-[#9CA3AF]">Health Index</span>
              <p className="text-lg font-bold text-[#8B5CF6]">
                {healthData ? `${healthData.overallScore.toFixed(0)} / 100` : '--'}
              </p>
            </div>
          </div>
        </Card>

        {/* Compact Family Financial Health Widget */}
        <FFHHealthWidget
          health={healthData}
          isLoading={loading && !healthData}
          onNavigateToHealth={() => onNavigate('family-health')}
        />
      </div>

      {/* Proactive AI Fiduciary Triggers Stream */}
      {triggers.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#F79009]" />
              <h3 className="text-sm font-bold text-[#F3F4F6]">Active Proactive Observations ({triggers.length})</h3>
            </div>
            <span className="text-xs text-[#9CA3AF] font-mono">Server Confirmed Triage</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {triggers.slice(0, 4).map((t) => {
              const isActionPending = actionLoadingId === t.triggerId;
              const isCritical = t.urgency === 'CRITICAL';

              return (
                <Card 
                  key={t.triggerId} 
                  variant="glass" 
                  className={`p-4 border transition-all ${
                    isCritical 
                      ? 'border-[#F04438]/50 bg-[#F04438]/5' 
                      : 'border-[#F79009]/40 bg-[#F79009]/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={`w-4 h-4 ${isCritical ? 'text-[#F04438]' : 'text-[#F79009]'}`} />
                      <h4 className="text-xs font-bold text-[#F3F4F6]">{t.title}</h4>
                    </div>
                    <Badge variant={isCritical ? 'danger' : 'warning'} size="sm">
                      {t.urgency}
                    </Badge>
                  </div>

                  <p className="text-xs text-[#9CA3AF] leading-relaxed mb-3">
                    {t.narrativeText}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#2B2E35]/60 text-xs">
                    <span className="text-[10px] text-[#6B7280] font-mono capitalize">
                      Domain: {t.domain.toLowerCase()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTriggerAction(t.triggerId, 'acknowledge')}
                        disabled={isActionPending}
                        className="px-2 py-1 rounded bg-[#1E2025] hover:bg-[#252830] text-[#32D583] text-[11px] font-semibold border border-[#2B2E35]"
                      >
                        Ack
                      </button>
                      <button
                        onClick={() => handleTriggerAction(t.triggerId, 'snooze')}
                        disabled={isActionPending}
                        className="px-2 py-1 rounded bg-[#1E2025] hover:bg-[#252830] text-[#38BDF8] text-[11px] font-semibold border border-[#2B2E35]"
                      >
                        Snooze (7d)
                      </button>
                      <button
                        onClick={() => handleTriggerAction(t.triggerId, 'dismiss')}
                        disabled={isActionPending}
                        className="px-2 py-1 rounded bg-[#1E2025] hover:bg-[#252830] text-[#9CA3AF] hover:text-[#F04438] text-[11px] font-semibold border border-[#2B2E35]"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Bento Grid Row 2: Asset Allocation & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Allocation Bento Card */}
        <Card variant="glass" className="lg:col-span-2 border border-[#2B2E35]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-[#32D583]" />
              <h3 className="text-base font-bold text-[#F3F4F6]">Asset Class Allocation</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('portfolio')}>
              View Breakdown
            </Button>
          </div>

          {bentoAssetAllocation.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-700/60 rounded-2xl space-y-3">
              <p className="text-xs text-slate-400 font-medium">No assets registered yet in your portfolio.</p>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<FileUp className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('import')}
              >
                Import Statement or CAS PDF
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bentoAssetAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {bentoAssetAllocation.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {bentoAssetAllocation.map((item: any, idx: number) => (
                  <div key={item.name || item.assetType} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#15161A]/60 border border-[#2B2E35]/40">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-[#9CA3AF] font-medium">{item.name || item.assetType}</span>
                    </div>
                    <span className="text-[#F3F4F6] font-bold font-mono">
                      {item.formattedValue || `₹${Number(item.value).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Quick Launchpad Actions */}
        <Card variant="default" className="border border-[#2B2E35]">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-[#4F7FFF]" />
            <h3 className="text-base font-bold text-[#F3F4F6]">Intelligence Workspaces</h3>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('family-health')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#15161A] hover:bg-[#1E2025] border border-[#2B2E35] transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#32D583]/15 text-[#32D583]">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F3F4F6] group-hover:text-[#32D583] transition">Financial Health Index</h4>
                  <p className="text-[11px] text-[#6B7280]">5-Pillar Score & Life Stage Weights</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#32D583] transition" />
            </button>

            <button
              onClick={() => onNavigate('family-timeline')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#15161A] hover:bg-[#1E2025] border border-[#2B2E35] transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#38BDF8]/15 text-[#38BDF8]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F3F4F6] group-hover:text-[#38BDF8] transition">Timeline Ledger</h4>
                  <p className="text-[11px] text-[#6B7280]">7-Domain Chronological Stream</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#38BDF8] transition" />
            </button>

            <button
              onClick={() => onNavigate('time-machine')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#15161A] hover:bg-[#1E2025] border border-[#2B2E35] transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F3F4F6] group-hover:text-[#8B5CF6] transition">Time Machine & What-If</h4>
                  <p className="text-[11px] text-[#6B7280]">Balance Sheet Replay & Scenarios</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#8B5CF6] transition" />
            </button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
};
