import React, { useEffect, useState } from 'react';
import { PageShell } from '../layout/PageShell';
import { Card } from '../ui/Card';
import { StatCard } from '../ui/StatCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CardSkeleton } from '../ui/Skeleton';
import { apiClient } from '../../services/apiClient';
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
  Layers
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface AIMissionControlProps {
  onNavigate: (tab: string) => void;
}

export const AIMissionControl: React.FC<AIMissionControlProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/dashboard');
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Unable to fetch live metrics.');
    } fontReady: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const COLORS = ['#4F7FFF', '#32D583', '#F79009', '#8B5CF6', '#38BDF8'];

  const bentoAssetAllocation = data?.assetAllocation || [
    { name: 'Equity & Mutual Funds', value: 24500000 },
    { name: 'Real Estate & Land', value: 15000000 },
    { name: 'Fixed Income & Bonds', value: 5000000 },
    { name: 'Gold & Commodities', value: 2300000 },
    { name: 'Liquid Cash & Bank', value: 1000000 },
  ];

  const formattedNetWorth = data?.totalNetWorth 
    ? `₹${(data.totalNetWorth / 10000000).toFixed(2)} Cr`
    : '₹4.78 Cr';

  if (loading) {
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
      subtitle="Comprehensive overview of family wealth, AI recommendations, and asset allocation."
      badge={<Badge variant="primary" icon={<Sparkles className="w-3 h-3" />}>AI Active</Badge>}
      actions={
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={fetchDashboardData}
        >
          Refresh Data
        </Button>
      }
    >
      {/* Hero Bento Grid Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Worth Hero Card */}
        <Card variant="glass" className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#1E2025] to-[#15161A]">
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
              +₹84,000 (+1.8% Today)
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#2B2E35]">
            <div>
              <span className="text-xs text-[#9CA3AF]">Total Assets</span>
              <p className="text-lg font-bold text-[#32D583]">₹5.12 Cr</p>
            </div>
            <div>
              <span className="text-xs text-[#9CA3AF]">Total Liabilities</span>
              <p className="text-lg font-bold text-[#F04438]">₹34.00 L</p>
            </div>
            <div>
              <span className="text-xs text-[#9CA3AF]">Monthly Savings</span>
              <p className="text-lg font-bold text-[#38BDF8]">₹2.45 L</p>
            </div>
            <div>
              <span className="text-xs text-[#9CA3AF]">Health Score</span>
              <p className="text-lg font-bold text-[#8B5CF6]">94 / 100</p>
            </div>
          </div>
        </Card>

        {/* AI Copilot Quick Summary */}
        <Card variant="default" className="relative overflow-hidden border-[#8B5CF6]/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F3F4F6]">AI Wealth Intelligence</h3>
              <p className="text-[11px] text-[#9CA3AF]">3 Active Recommendations</p>
            </div>
          </div>

          <div className="space-y-3 mb-4 text-xs text-[#9CA3AF]">
            <div className="p-2.5 rounded-xl bg-[#15161A] border border-[#2B2E35] flex items-start gap-2">
              <Zap className="w-4 h-4 text-[#F79009] shrink-0 mt-0.5" />
              <span>Rebalance ₹4.5L from Liquid Cash to High-Yield Debt for +₹38k annual return.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#15161A] border border-[#2B2E35] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-[#F04438] shrink-0 mt-0.5" />
              <span>Term Insurance gap of ₹1.2 Cr detected for primary earner.</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="w-full"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => onNavigate('ai-advisor')}
          >
            Launch AI Wealth Advisor
          </Button>
        </Card>
      </div>

      {/* Bento Grid Row 2: Asset Allocation & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Allocation Bento Card */}
        <Card variant="glass" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-[#32D583]" />
              <h3 className="text-base font-bold text-[#F3F4F6]">Asset Class Allocation</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('portfolio')}>
              View Breakdown
            </Button>
          </div>

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
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E2025', borderColor: '#2B2E35', borderRadius: '12px', color: '#F3F4F6' }}
                    formatter={(val: any) => `₹${(Number(val) / 100000).toFixed(2)} L`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {bentoAssetAllocation.map((item: any, idx: number) => (
                <div key={item.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#15161A]/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-[#9CA3AF] font-medium">{item.name}</span>
                  </div>
                  <span className="text-[#F3F4F6] font-bold">
                    ₹{(item.value / 100000).toFixed(1)} L
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Quick Launchpad Actions */}
        <Card variant="default">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-[#4F7FFF]" />
            <h3 className="text-base font-bold text-[#F3F4F6]">Quick Actions</h3>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('tax')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#15161A] hover:bg-[#252830] border border-[#2B2E35] transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#38BDF8]/15 text-[#38BDF8]">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F3F4F6] group-hover:text-[#4F7FFF] transition">Tax Savings Engine</h4>
                  <p className="text-[11px] text-[#6B7280]">Review 80C & LTCG Harvesting</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#4F7FFF] transition" />
            </button>

            <button
              onClick={() => onNavigate('estate')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#15161A] hover:bg-[#252830] border border-[#2B2E35] transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#F79009]/15 text-[#F79009]">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F3F4F6] group-hover:text-[#4F7FFF] transition">Estate Timeline</h4>
                  <p className="text-[11px] text-[#6B7280]">Wills, Trusts & Beneficiaries</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#4F7FFF] transition" />
            </button>

            <button
              onClick={() => onNavigate('protection')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#15161A] hover:bg-[#252830] border border-[#2B2E35] transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#F04438]/15 text-[#F04438]">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F3F4F6] group-hover:text-[#4F7FFF] transition">Insurance Gap Audit</h4>
                  <p className="text-[11px] text-[#6B7280]">Family Policy Health Check</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#4F7FFF] transition" />
            </button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
};
