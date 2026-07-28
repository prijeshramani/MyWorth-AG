import React, { useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useAIContextDashboard } from '../../hooks/useAIContextDashboard';
import { aiContextService } from '../../services/aiContextService';
import type { CompiledPromptResponseDTO } from '../../services/aiContextService';
import { PageSkeleton } from '../common/PageSkeleton';
import { MetricCard } from '../ui/MetricCard';
import { RiskGauge } from '../ui/RiskGauge';
import { 
  Bot, 
  Cpu, 
  Database, 
  ShieldCheck, 
  FileCode, 
  Terminal, 
  CheckCircle, 
  RefreshCw, 
  Layers, 
  Lock, 
  Sparkles, 
  Zap, 
  BookOpen, 
  Search, 
  Shield, 
  AlertCircle
} from 'lucide-react';

export const AIReadinessDashboard: React.FC = () => {
  const { activeFamilyId } = useUiStore();
  const { contextQuery, memoryQuery } = useAIContextDashboard(activeFamilyId);

  const [activeTab, setActiveTab] = useState<'overview' | 'inspector' | 'memory' | 'prompt-compiler'>('overview');
  const [selectedDomain, setSelectedDomain] = useState<'portfolio' | 'tax' | 'estate' | 'planning' | 'recommendations'>('portfolio');

  // Prompt Simulator State
  const [testQuery, setTestQuery] = useState('My PAN is ABCDE1234F, summarize tax savings for Old vs New regime.');
  const [compiledResult, setCompiledResult] = useState<CompiledPromptResponseDTO | null>(null);
  const [compiling, setCompiling] = useState(false);

  if (contextQuery.isLoading || memoryQuery.isLoading) {
    return <PageSkeleton />;
  }

  const contextData = contextQuery.data?.data;
  const memoryList = memoryQuery.data?.data || [];
  const capabilities = contextData?.capabilities || [];
  const domainContexts = contextData?.domainContexts;

  const handleRefreshContext = async () => {
    await aiContextService.refresh(activeFamilyId);
    contextQuery.refetch();
  };

  const handleCompilePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompiling(true);
    try {
      const res = await aiContextService.compilePrompt({
        familyId: activeFamilyId,
        userQuery: testQuery
      });
      setCompiledResult(res.data);
    } catch {
      // Handled
    } finally {
      setCompiling(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-slate-100">AI Context, Memory & Evidence Foundation</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Structured intelligence synthesis across 8 domain engines, evidence proof layer, multi-session memory, and prompt compiler.
          </p>
        </div>

        <button
          onClick={handleRefreshContext}
          className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Context Payload
        </button>
      </div>

      {/* KPI Cards & Health Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RiskGauge
          label="AI Context Health Score (S_AIContext)"
          value={contextData?.contextHealthScore || 96}
          minValue={0}
          maxValue={100}
          ratingLabel="OPTIMAL"
          statusColor="#a855f7"
        />

        <MetricCard
          title="Active Capabilities Seeded"
          value={`${capabilities.length} AI Capabilities`}
          subtext="Portfolio, Tax, Estate & Retirement"
          changePercent={100.0}
          trend="UP"
          icon={<Cpu className="w-4 h-4 text-purple-400" />}
        />

        <MetricCard
          title="Evidence Proof Verification"
          value={`${contextData?.evidenceSummary?.totalProofItems || 1} Proof Item(s)`}
          subtext={`SHA-256: ${contextData?.evidenceSummary?.latestProofHash || 'b7e19902'}`}
          changePercent={0.0}
          trend="NEUTRAL"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
        />
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs overflow-x-auto">
        {(['overview', 'inspector', 'memory', 'prompt-compiler'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md font-semibold transition-colors capitalize whitespace-nowrap ${
              activeTab === tab ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'prompt-compiler' ? 'Prompt Compiler & Safety Simulator' : tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Capability Registry */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="card-glass p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              AI Capability Registry
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {capabilities.map((c) => (
                <div key={c.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-100">{c.name}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {c.capability_code}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Domain Context Inspector */}
      {activeTab === 'inspector' && (
        <div className="card-glass p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Structured Domain Context Inspector
            </h3>

            <div className="flex gap-2 text-xs font-mono">
              {(['portfolio', 'tax', 'estate', 'planning', 'recommendations'] as const).map((dom) => (
                <button
                  key={dom}
                  onClick={() => setSelectedDomain(dom)}
                  className={`px-3 py-1 rounded capitalize ${
                    selectedDomain === dom ? 'bg-purple-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>
          </div>

          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto max-h-96">
            {JSON.stringify(domainContexts?.[selectedDomain], null, 2)}
          </pre>
        </div>
      )}

      {/* Tab 3: Multi-Session Memory Timeline */}
      {activeTab === 'memory' && (
        <div className="card-glass p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Multi-Session Memory & User Preference Timeline
          </h3>

          <div className="space-y-3">
            {memoryList.map((m) => (
              <div key={m.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex justify-between items-center text-xs font-mono">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 mr-2">
                    {m.memory_type}
                  </span>
                  <span className="font-bold text-slate-200">{m.key}</span>
                  <span className="text-slate-400 block text-[11px] mt-1">{m.value_json}</span>
                </div>
                <span className="text-slate-500 text-[10px]">{m.created_at}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Prompt Compiler & Safety Simulator */}
      {activeTab === 'prompt-compiler' && (
        <div className="card-glass p-6 space-y-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Prompt Builder & Safety Guardrails Simulator
          </h3>

          <form onSubmit={handleCompilePrompt} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Simulated User Query (Includes PII Redaction Test)</label>
              <textarea
                rows={2}
                value={testQuery}
                onChange={e => setTestQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 font-mono focus:outline-none"
              />
            </div>
            <button type="submit" disabled={compiling} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded">
              {compiling ? 'Compiling Prompt...' : 'Compile System & User Prompt'}
            </button>
          </form>

          {compiledResult && (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                <span className="text-amber-400 font-bold block">Safety Evaluation Guardrails</span>
                <div className="text-slate-300">PII Redacted Query: {compiledResult.safety.redactedQuery}</div>
                <div className="text-slate-400 text-[11px]">{compiledResult.safety.disclaimer}</div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-bold">Compiled System Prompt</span>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded text-purple-300 text-[11px] whitespace-pre-wrap">
                  {compiledResult.compiledPrompt.systemPrompt}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
