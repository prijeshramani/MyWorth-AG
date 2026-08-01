import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Sparkles, 
  TrendingUp, 
  Bookmark, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  ArrowUpRight, 
  Layers,
  Award
} from 'lucide-react';

interface SimulationParams {
  monthlySipAmount: number;
  monthlySipStepUpPercent: number;
  lumpSumInvestment: number;
  retirementTargetAge: number;
  currentAge: number;
  inflationRatePercent: number;
  expectedReturnPercent: number;
}

interface ScenarioResult {
  scenarioName: 'Base' | 'Optimistic' | 'Conservative' | 'Custom';
  expectedReturnPercent: number;
  inflationRatePercent: number;
  projectedCorpusAtRetirement: number;
  corpusRequiredAtRetirement: number;
  corpusReadinessPercent: number;
  monthlySipRequired: number;
  financialBenefitAmount: number;
  riskLevel: string;
}

interface TemplateDef {
  id: string;
  title: string;
  category: string;
  description: string;
  defaultParams: Partial<SimulationParams>;
}

export const WhatIfSimulator: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    monthlySipAmount: 25000,
    monthlySipStepUpPercent: 10,
    lumpSumInvestment: 100000,
    retirementTargetAge: 55,
    currentAge: 35,
    inflationRatePercent: 6,
    expectedReturnPercent: 12
  });

  const [templates, setTemplates] = useState<TemplateDef[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<string>('retirement_boost');
  const [simulationData, setSimulationData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    runSimulation();
  }, [params]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/v1/ai/actions/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/ai/actions/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: 1,
          params,
          templateType: activeTemplate
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationData(data);
      }
    } catch (err) {
      console.error('Failed to run simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = (tmpl: TemplateDef) => {
    setActiveTemplate(tmpl.id);
    setParams(prev => ({ ...prev, ...tmpl.defaultParams }));
  };

  const handleSaveSnapshot = async () => {
    if (!simulationData) return;
    try {
      const res = await fetch('/api/v1/ai/actions/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: 1,
          title: `Snapshot: ${activeTemplate} (Age ${params.retirementTargetAge})`,
          templateType: activeTemplate,
          scenarioInputs: params,
          assumptions: { inflation: params.inflationRatePercent, return: params.expectedReturnPercent },
          projectionResults: simulationData.scenarios
        })
      });

      if (res.ok) {
        setSavedSuccessMsg('Simulation snapshot saved successfully to local database!');
        setTimeout(() => setSavedSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      alert(`Save snapshot error: ${err.message}`);
    }
  };

  const scenarios: ScenarioResult[] = simulationData ? [
    simulationData.scenarios.base,
    simulationData.scenarios.optimistic,
    simulationData.scenarios.conservative,
    simulationData.scenarios.custom
  ] : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Sliders className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">What-If Simulation Engine</h1>
                <span className="px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold rounded-md">
                  Zero Data Mutation
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ephemeral Scenario Comparisons • Real-Time Sliders • Multi-Scenario Projections
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveSnapshot}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-all self-start md:self-auto"
          >
            <Bookmark className="w-4 h-4" />
            Save Snapshot
          </button>
        </div>

        {/* Template Buttons Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 flex-shrink-0 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Simulation Templates:
          </span>
          {templates.map(tmpl => (
            <button
              key={tmpl.id}
              onClick={() => handleApplyTemplate(tmpl)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-xl border transition-all flex items-center gap-1.5 flex-shrink-0 ${
                activeTemplate === tmpl.id
                  ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/20 font-bold'
                  : 'bg-slate-800/40 text-slate-300 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              {tmpl.title}
            </button>
          ))}
        </div>
      </div>

      {savedSuccessMsg && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Control Panel: Real-Time Sliders */}
        <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Sliders className="w-4 h-4 text-sky-400" />
            Scenario Parameters
          </h3>

          {/* Monthly SIP Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Monthly SIP Amount</span>
              <span className="font-bold text-sky-400">₹{params.monthlySipAmount.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="5000"
              max="150000"
              step="2500"
              value={params.monthlySipAmount}
              onChange={(e) => setParams({ ...params, monthlySipAmount: Number(e.target.value) })}
              className="w-full accent-sky-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Lump Sum Investment Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Lump Sum Investment</span>
              <span className="font-bold text-indigo-400">₹{params.lumpSumInvestment.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000000"
              step="25000"
              value={params.lumpSumInvestment}
              onChange={(e) => setParams({ ...params, lumpSumInvestment: Number(e.target.value) })}
              className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Retirement Age Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Retirement Target Age</span>
              <span className="font-bold text-amber-400">{params.retirementTargetAge} Years</span>
            </div>
            <input
              type="range"
              min="45"
              max="65"
              step="1"
              value={params.retirementTargetAge}
              onChange={(e) => setParams({ ...params, retirementTargetAge: Number(e.target.value) })}
              className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Inflation Rate Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Assumed Inflation Rate</span>
              <span className="font-bold text-rose-400">{params.inflationRatePercent}%</span>
            </div>
            <input
              type="range"
              min="4"
              max="10"
              step="0.5"
              value={params.inflationRatePercent}
              onChange={(e) => setParams({ ...params, inflationRatePercent: Number(e.target.value) })}
              className="w-full accent-rose-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Expected Return Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Expected Annual Return</span>
              <span className="font-bold text-emerald-400">{params.expectedReturnPercent}%</span>
            </div>
            <input
              type="range"
              min="7"
              max="16"
              step="0.5"
              value={params.expectedReturnPercent}
              onChange={(e) => setParams({ ...params, expectedReturnPercent: Number(e.target.value) })}
              className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Right Panel: Side-by-Side Scenario Comparison */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Side-by-Side Scenario Projections
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Baseline Net Worth: ₹{(simulationData?.baselineNetWorth || 0).toLocaleString('en-IN')}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {scenarios.map((sc, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md hover:border-sky-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs uppercase tracking-wider">{sc.scenarioName} Scenario</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${sc.corpusReadinessPercent >= 100 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                      {sc.corpusReadinessPercent}% Target Readiness
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Projected Corpus at Age {params.retirementTargetAge}</span>
                    <div className="text-base font-bold text-sky-400">
                      ₹{sc.projectedCorpusAtRetirement.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
                    <div>Return: <span className="text-slate-200">{sc.expectedReturnPercent}%</span></div>
                    <div>Inflation: <span className="text-slate-200">{sc.inflationRatePercent}%</span></div>
                    <div>Required SIP: <span className="text-slate-200">₹{sc.monthlySipRequired.toLocaleString('en-IN')}</span></div>
                    <div>Delta Benefit: <span className="text-emerald-400">+₹{sc.financialBenefitAmount.toLocaleString('en-IN')}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation Impact Card */}
          {simulationData?.recommendationImpact && (
            <div className="bg-gradient-to-r from-sky-950/40 via-indigo-950/40 to-slate-900/60 border border-sky-800/40 p-5 rounded-3xl space-y-2 backdrop-blur-xl shadow-xl">
              <div className="flex items-center gap-2 text-sky-400">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold text-xs">AI Recommendation Impact Rationale</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {simulationData.recommendationImpact.summary}
              </p>
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-800/60">
                <span>Expected Improvement: <strong className="text-emerald-400">{simulationData.recommendationImpact.expectedImprovement}</strong></span>
                <span>Latency: {simulationData.recommendationImpact.estimatedCompletionTime}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
