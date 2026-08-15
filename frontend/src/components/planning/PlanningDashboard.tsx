import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUiStore } from '../../store/useUiStore';
import { usePlanningDashboard } from '../../hooks/usePlanningDashboard';
import { planningService } from '../../services/planningService';
import type { ScenarioResultDTO } from '../../services/planningService';
import { queryKeys } from '../../hooks/queryKeys';
import { PageSkeleton } from '../common/PageSkeleton';
import { MetricCard } from '../ui/MetricCard';
import { RiskGauge } from '../ui/RiskGauge';
import { 
  Target, 
  TrendingUp, 
  Sparkles, 
  Plus, 
  GraduationCap, 
  Home, 
  Car, 
  Palmtree, 
  ShieldAlert, 
  Calendar, 
  Sliders, 
  Zap, 
  DollarSign,
  CheckCircle,
  HelpCircle,
  X,
  Loader2
} from 'lucide-react';

export const PlanningDashboard: React.FC = () => {
  const { activeFamilyId } = useUiStore();
  const { data: response, isLoading, refetch } = usePlanningDashboard(activeFamilyId);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'retirement' | 'cashflow' | 'scenarios' | 'recommendations'>('overview');
  
  // Scenario Runner states
  const [scenarioName, setScenarioName] = useState('Optimistic Growth (14% Equity)');
  const [returnOverride, setReturnOverride] = useState(14.0);
  const [inflationOverride, setInflationOverride] = useState(6.0);
  const [stepUpOverride, setStepUpOverride] = useState(12.0);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResultDTO | null>(null);
  const [runningScenario, setRunningScenario] = useState(false);

  // New Goal Modal states
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [goalType, setGoalType] = useState<'RETIREMENT' | 'EDUCATION' | 'HOUSE' | 'VEHICLE' | 'VACATION' | 'EMERGENCY'>('EDUCATION');
  const [goalTitle, setGoalTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState(5000000);
  const [targetYear, setTargetYear] = useState(2035);
  const [monthlySip, setMonthlySip] = useState(20000);
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  if (isLoading) {
    return <PageSkeleton />;
  }

  const data = response?.data;
  const health = data?.health;
  const goals = data?.goals || [];
  const retirement = data?.retirement;
  const cashflow = data?.cashflow;
  const recs = data?.recommendations || [];
  const assumptions = data?.assumptions;

  const handleRunScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunningScenario(true);
    try {
      const res = await planningService.runScenario({
        familyId: activeFamilyId,
        scenarioName,
        returnOverridePct: returnOverride,
        inflationOverridePct: inflationOverride,
        stepUpOverridePct: stepUpOverride
      });
      setScenarioResult(res.data);
    } catch {
      // Handled
    } finally {
      setRunningScenario(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    setIsSubmittingGoal(true);
    setGoalError(null);
    try {
      await planningService.createGoal({
        familyId: activeFamilyId,
        goalType,
        title: goalTitle.trim(),
        targetAmount: Number(targetAmount),
        targetYear: Number(targetYear),
        monthlySipAmount: Number(monthlySip),
        expectedReturnPct: 12.0,
        inflationPct: 6.0
      });
      setShowAddGoalModal(false);
      setGoalTitle('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
      await refetch();
      setActiveTab('goals');
    } catch (err: any) {
      console.error('Failed to create goal:', err);
      setGoalError(err.response?.data?.error?.message || err.message || 'Failed to save goal');
    } finally {
      setIsSubmittingGoal(false);
    }
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'RETIREMENT': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'EDUCATION': return <GraduationCap className="w-4 h-4 text-sky-400" />;
      case 'HOUSE': return <Home className="w-4 h-4 text-purple-400" />;
      case 'VEHICLE': return <Car className="w-4 h-4 text-amber-400" />;
      case 'VACATION': return <Palmtree className="w-4 h-4 text-teal-400" />;
      default: return <ShieldAlert className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-slate-100">Financial Goals, Retirement & Life Planning</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Unified Projection Engine, Goal Health Scoring (S_Goal), Inflation-adjusted Retirement Readiness, and Cashflow Forecasting.
          </p>
        </div>

        <button
          onClick={() => setShowAddGoalModal(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Financial Goal
        </button>
      </div>

      {/* KPI Cards & Goal Health Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RiskGauge
          label="Goal Health Score (S_Goal)"
          value={health?.overallScore || 88}
          minValue={0}
          maxValue={100}
          ratingLabel={health?.ratingLabel || 'OPTIMAL'}
          statusColor="#0284c7"
        />

        <MetricCard
          title="Total Target Corpus"
          value={`₹${(health?.totalTargetCorpus || 50000000).toLocaleString('en-IN')}`}
          subtext={`Across ${health?.goalsCount || 4} Life Goals`}
          changePercent={12.5}
          trend="UP"
          icon={<Target className="w-4 h-4 text-sky-400" />}
        />

        <MetricCard
          title="Total Projected Corpus"
          value={`₹${(health?.totalProjectedCorpus || 44000000).toLocaleString('en-IN')}`}
          subtext={`${health?.goalsOnTrackCount || 3} Goals On Track`}
          changePercent={8.4}
          trend="UP"
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
        />
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs overflow-x-auto">
        {(['overview', 'goals', 'retirement', 'cashflow', 'scenarios', 'recommendations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md font-semibold transition-colors capitalize whitespace-nowrap ${
              activeTab === tab ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'scenarios' ? 'Scenario Comparison' : tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-glass p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              Central Assumption Registry
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 text-[10px] block">Baseline Inflation</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">{assumptions?.default_inflation_pct || 6.0}% p.a.</span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 text-[10px] block">Equity Expected Return</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">{assumptions?.equity_return_pct || 12.0}% p.a.</span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 text-[10px] block">Education Inflation</span>
                <span className="font-mono text-amber-400 font-bold text-sm">{assumptions?.education_inflation_pct || 10.0}% p.a.</span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-slate-400 text-[10px] block">SIP Annual Step-Up</span>
                <span className="font-mono text-purple-400 font-bold text-sm">{assumptions?.sip_step_up_pct || 10.0}% p.a.</span>
              </div>
            </div>
          </div>

          <div className="card-glass p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              AI Planning Recommendations
            </h3>

            <div className="space-y-3">
              {recs.map((r) => (
                <div key={r.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>{r.title}</span>
                    <span className="font-mono text-sky-400 text-[10px]">{r.confidence_pct}% Confidence</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Goals Manager */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((g) => (
              <div key={g.id} className="card-glass p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getGoalIcon(g.goal_type)}
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{g.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400">Target Year: {g.target_year}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {g.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Amount:</span>
                    <span className="text-slate-100 font-bold">₹{g.target_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly SIP:</span>
                    <span className="text-sky-400 font-bold">₹{g.monthly_sip_amount.toLocaleString('en-IN')}/mo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Retirement Planner */}
      {activeTab === 'retirement' && retirement && (
        <div className="card-glass p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Retirement Readiness Analysis</h3>
              <p className="text-xs text-slate-400 mt-0.5">Inflation-adjusted Corpus at Age {retirement.profile.retirement_age}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-emerald-400">{retirement.readinessPct}%</span>
              <span className="text-[10px] text-slate-400 block font-mono">Retirement Readiness</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="text-slate-400 text-[10px] block uppercase">Future Monthly Expense</span>
              <span className="text-base font-bold text-slate-100">₹{retirement.futureMonthlyExpenseAtRetirement.toLocaleString('en-IN')}/mo</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="text-slate-400 text-[10px] block uppercase">Corpus Required (4% SWR)</span>
              <span className="text-base font-bold text-amber-400">₹{retirement.corpusRequiredAtRetirement.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="text-slate-400 text-[10px] block uppercase">Projected Corpus</span>
              <span className="text-base font-bold text-emerald-400">₹{retirement.corpusProjectedAtRetirement.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono">
            💡 {retirement.explanation}
          </div>
        </div>
      )}

      {/* Tab 4: Cashflow Forecast */}
      {activeTab === 'cashflow' && cashflow && (
        <div className="card-glass p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            10-Year Cashflow & Liquidity Reserve Forecast
          </h3>

          <div className="space-y-2">
            {cashflow.yearlyForecast.map((cf) => (
              <div key={cf.year} className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-200">{cf.year}</span>
                <span className="text-slate-400">Inflow: ₹{cf.monthlyInflow.toLocaleString('en-IN')}/mo</span>
                <span className="text-slate-400">Outflow: ₹{cf.monthlyOutflow.toLocaleString('en-IN')}/mo</span>
                <span className="text-emerald-400 font-bold">Accumulated: ₹{cf.annualSurplusAccumulated.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Scenario Comparison */}
      {activeTab === 'scenarios' && (
        <div className="card-glass p-6 space-y-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Projection Engine Scenario Comparison
          </h3>

          <form onSubmit={handleRunScenario} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Scenario Name</label>
              <input
                type="text"
                value={scenarioName}
                onChange={e => setScenarioName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Return Override (%)</label>
              <input
                type="number"
                step="0.5"
                value={returnOverride}
                onChange={e => setReturnOverride(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Inflation Override (%)</label>
              <input
                type="number"
                step="0.5"
                value={inflationOverride}
                onChange={e => setInflationOverride(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={runningScenario} className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded">
                {runningScenario ? 'Simulating...' : 'Run Scenario'}
              </button>
            </div>
          </form>

          {scenarioResult && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 text-xs font-mono">
              <div className="flex justify-between font-bold text-slate-100">
                <span>Scenario: {scenarioResult.scenarioName}</span>
                <span className="text-emerald-400">Total Projected: ₹{scenarioResult.projectionResult.totalProjectedCorpus.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-slate-400 text-[11px]">{scenarioResult.projectionResult.formulaExplanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Recommendations Feed */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Explainable AI-Ready Recommendations Feed
          </h3>

          <div className="space-y-3">
            {recs.map((r) => (
              <div key={r.id} className="card-glass p-5 space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-slate-100">{r.title}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {r.priority} PRIORITY
                  </span>
                </div>
                <p className="text-xs text-slate-300">{r.description}</p>
                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                  <span>Confidence: {r.confidence_pct}%</span>
                  <span>Horizon: {r.time_horizon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateGoal} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Financial Goal</h3>
              <button type="button" onClick={() => setShowAddGoalModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            {goalError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-600 dark:text-rose-400">
                {goalError}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Goal Type</label>
              <select
                value={goalType}
                onChange={e => setGoalType(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="EDUCATION">Education</option>
                <option value="RETIREMENT">Retirement</option>
                <option value="HOUSE">House Purchase</option>
                <option value="VEHICLE">Vehicle Purchase</option>
                <option value="VACATION">Vacation</option>
                <option value="EMERGENCY">Emergency Fund</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Goal Title</label>
              <input
                type="text"
                required
                value={goalTitle}
                onChange={e => setGoalTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                placeholder="e.g. Child Education"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Target Amount (₹)</label>
              <input
                type="number"
                required
                min={1000}
                value={targetAmount}
                onChange={e => setTargetAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Target Year</label>
              <input
                type="number"
                required
                min={new Date().getFullYear()}
                max={2100}
                value={targetYear}
                onChange={e => setTargetYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Monthly SIP (₹)</label>
              <input
                type="number"
                min={0}
                value={monthlySip}
                onChange={e => setMonthlySip(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                placeholder="e.g. 20000"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={isSubmittingGoal}
                onClick={() => setShowAddGoalModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingGoal}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                {isSubmittingGoal && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSubmittingGoal ? 'Saving Goal...' : 'Save Goal'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
