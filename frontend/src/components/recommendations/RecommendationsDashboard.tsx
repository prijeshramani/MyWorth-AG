import React, { useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useRecommendationsDashboard } from '../../hooks/useRecommendationsDashboard';
import { recommendationService } from '../../services/recommendationService';
import type { RecommendationDTO, ExplanationDTO } from '../../services/recommendationService';
import { PageSkeleton } from '../common/PageSkeleton';
import { MetricCard } from '../ui/MetricCard';
import { 
  Sparkles, 
  ShieldAlert, 
  TrendingUp, 
  Calculator, 
  Scroll, 
  Target, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight, 
  HelpCircle, 
  Layers, 
  Check, 
  X, 
  FileText,
  AlertTriangle
} from 'lucide-react';

export const RecommendationsDashboard: React.FC = () => {
  const { activeFamilyId } = useUiStore();
  const { data: response, isLoading, refetch } = useRecommendationsDashboard(activeFamilyId);

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedExplanation, setSelectedExplanation] = useState<ExplanationDTO | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (isLoading) {
    return <PageSkeleton />;
  }

  const dashData = response?.data;
  const activeRecs = dashData?.activeRecommendations || [];
  const journeys = dashData?.journeys || [];
  const history = dashData?.history || [];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await recommendationService.refresh(activeFamilyId);
      refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAccept = async (id: number) => {
    await recommendationService.accept(id, activeFamilyId);
    refetch();
  };

  const handleDismiss = async (id: number) => {
    await recommendationService.dismiss(id, activeFamilyId);
    refetch();
  };

  const handleComplete = async (id: number) => {
    await recommendationService.complete(id, activeFamilyId);
    refetch();
  };

  const handleOpenExplainability = async (id: number) => {
    setLoadingExplanation(true);
    try {
      const res = await recommendationService.explainRecommendation(id);
      setSelectedExplanation(res.data);
    } catch {
      // Handled
    } finally {
      setLoadingExplanation(false);
    }
  };

  const filteredRecs = activeRecs.filter((r) => {
    if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'TAX': return <Calculator className="w-4 h-4 text-emerald-400" />;
      case 'ESTATE': return <Scroll className="w-4 h-4 text-amber-400" />;
      case 'PROTECTION': return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'PLANNING': return <Target className="w-4 h-4 text-sky-400" />;
      default: return <TrendingUp className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-slate-100">AI Insights & Intelligent Recommendations</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Explainable Intelligence Orchestration across Tax, Estate, Protection, Financial Planning & Investment Engines.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Evaluating Engines...' : 'Refresh Insights'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Financial Impact (₹)"
          value={`₹${(dashData?.totalOpenImpactAmount ?? 0).toLocaleString('en-IN')}`}
          subtext="Potential Wealth Improvement & Tax Savings"
          changePercent={18.5}
          trend="UP"
          icon={<Sparkles className="w-4 h-4 text-amber-400" />}
        />

        <MetricCard
          title="Critical Open Risks"
          value={`${dashData?.criticalCount ?? 0} Critical Action Items`}
          subtext="Requires Immediate Attention"
          changePercent={-25.0}
          trend="DOWN"
          icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}
        />

        <MetricCard
          title="Active Recommendation Journeys"
          value={`${journeys.length} Guided Journeys`}
          subtext="Multi-Step Wealth Optimization"
          changePercent={10.0}
          trend="UP"
          icon={<Layers className="w-4 h-4 text-sky-400" />}
        />
      </div>

      {/* Journeys Panel */}
      <div className="card-glass p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          Active Recommendation Journeys
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {journeys.map((j) => (
            <div key={j.id} className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{j.title}</h4>
                  <p className="text-xs text-slate-400">{j.description}</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {j.completed_steps}/{j.total_steps} Steps
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full"
                  style={{ width: `${(j.completed_steps / (j.total_steps || 1)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category & Priority Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono">Category:</span>
          {['ALL', 'TAX', 'ESTATE', 'PROTECTION', 'PLANNING', 'INVESTMENT'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                categoryFilter === cat ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono">Priority:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((prio) => (
            <button
              key={prio}
              onClick={() => setPriorityFilter(prio)}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                priorityFilter === prio ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {prio}
            </button>
          ))}
        </div>
      </div>

      {/* Priority Queue Cards */}
      <div className="space-y-4">
        {filteredRecs.map((r) => (
          <div key={r.id} className="card-glass p-5 space-y-3 border-l-4 border-l-amber-500">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                {getCategoryIcon(r.category)}
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{r.title}</h4>
                  <span className="text-[10px] font-mono text-slate-400">Rule Code: {r.rule_code} • Confidence {r.confidence_pct}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  r.priority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {r.priority} PRIORITY
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{r.description}</p>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-4 font-mono text-[11px]">
                <span className="text-emerald-400 font-bold">Impact: ₹{r.financial_impact_amount.toLocaleString('en-IN')}</span>
                <span className="text-slate-400">Urgency: {r.urgency}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenExplainability(r.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Explain Proof
                </button>
                <button
                  onClick={() => handleAccept(r.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Accept
                </button>
                <button
                  onClick={() => handleDismiss(r.id)}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded text-xs flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Explainability Drawer / Modal */}
      {selectedExplanation && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 w-full max-w-xl space-y-4 font-mono">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> Explainable Proof Context
              </h3>
              <button onClick={() => setSelectedExplanation(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Why Generated</span>
                <span className="text-slate-200">{selectedExplanation.whyGenerated}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Source Engines Consumed</span>
                <div className="flex gap-2 pt-1">
                  {selectedExplanation.sourceEngines.map((e) => (
                    <span key={e} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-emerald-400 text-[10px]">
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase block">AI Context Summary</span>
                <p className="p-3 bg-slate-900 border border-slate-800 rounded text-slate-300 text-[11px]">
                  {selectedExplanation.aiContext?.summary || 'Calculated via deterministic rule evaluation.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedExplanation(null)} className="px-4 py-1.5 bg-amber-600 text-white rounded text-xs font-semibold">
                Close Proof
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
