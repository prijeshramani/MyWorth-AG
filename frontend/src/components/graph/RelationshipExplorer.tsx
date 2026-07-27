import React, { useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useGraphOverview } from '../../hooks/useGraphOverview';
import { PageSkeleton } from '../common/PageSkeleton';
import { MetricCard } from '../ui/MetricCard';
import { RiskGauge } from '../ui/RiskGauge';
import { 
  GitFork, 
  User, 
  PieChart, 
  ShieldAlert, 
  FileText, 
  Landmark, 
  Calculator, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const RelationshipExplorer: React.FC = () => {
  const { activeFamilyId } = useUiStore();
  const { data: response, isLoading, refetch } = useGraphOverview(activeFamilyId);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  if (isLoading) {
    return <PageSkeleton />;
  }

  const graphData = response?.data;
  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];
  const estateReadiness = graphData?.estateReadiness;

  const filteredNodes = nodes.filter(n => {
    const matchesType = filterType === 'ALL' || n.entity_type === filterType;
    const matchesSearch = n.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedNodeEdges = selectedNode
    ? edges.filter(e => e.source_node_id === selectedNode.id || e.target_node_id === selectedNode.id)
    : [];

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'PERSON': return <User className="w-4 h-4 text-sky-400" />;
      case 'ASSET': return <PieChart className="w-4 h-4 text-emerald-400" />;
      case 'POLICY': return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'ACCOUNT': return <Landmark className="w-4 h-4 text-amber-400" />;
      case 'DOCUMENT': return <FileText className="w-4 h-4 text-indigo-400" />;
      case 'TAX_PROFILE': return <Calculator className="w-4 h-4 text-teal-400" />;
      default: return <GitFork className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-slate-100">Knowledge Graph & Relationship Engine</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Canonical relationship map connecting Family Members, Asset Holdings, Policies, Accounts, Documents & Tax Profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            Estate Readiness: {estateReadiness?.readinessScore || 100}%
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RiskGauge
          label="Nominee Coverage Score"
          value={estateReadiness?.nomineeCoveragePercent || 100}
          minValue={0}
          maxValue={100}
          ratingLabel="OPTIMAL"
          statusColor="#10b981"
        />

        <MetricCard
          title="Total Graph Nodes"
          value={graphData?.nodeCount.toString() || '0'}
          subtext="Persons, Assets, Policies & Accounts"
          changePercent={8.5}
          trend="UP"
          icon={<GitFork className="w-4 h-4 text-sky-400" />}
        />

        <MetricCard
          title="Active Directed Edges"
          value={graphData?.edgeCount.toString() || '0'}
          subtext="Ownership, Nominee & Dependents"
          changePercent={12.0}
          trend="UP"
          icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="card-glass p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'PERSON', 'ASSET', 'POLICY', 'ACCOUNT', 'DOCUMENT', 'TAX_PROFILE'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-colors ${
                filterType === t
                  ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search graph nodes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Interactive Graph Node Grid & Inspector Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Node Grid */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Canonical Entities ({filteredNodes.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredNodes.map((n) => {
              const isSelected = selectedNodeId === n.id;
              return (
                <div
                  key={n.id}
                  onClick={() => setSelectedNodeId(n.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-500/50 shadow-md ring-1 ring-sky-500/30'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                        {getNodeIcon(n.entity_type)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">{n.label}</h4>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {n.entity_type} #{n.entity_id}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Relationship Inspector */}
        <div className="card-glass p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Relationship Inspector
          </h3>

          {selectedNode ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                <span className="text-[10px] font-mono text-sky-400 uppercase font-bold">{selectedNode.entity_type}</span>
                <h4 className="text-sm font-bold text-slate-100">{selectedNode.label}</h4>
                <span className="text-[11px] font-mono text-slate-500">Node ID: #{selectedNode.id}</span>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block">
                  Connected Edges ({selectedNodeEdges.length})
                </span>
                
                {selectedNodeEdges.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No active directed edges linked to this node.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedNodeEdges.map((e) => (
                      <div key={e.id} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between text-slate-300 font-semibold">
                          <span>{e.source_label || `Node #${e.source_node_id}`}</span>
                          <ArrowRight className="w-3 h-3 text-sky-400" />
                          <span>{e.target_label || `Node #${e.target_node_id}`}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="text-emerald-400 font-bold">{e.relationship_name || e.relationship_code}</span>
                          <span>Weight: {e.weight}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs italic">
              Select any graph entity node to inspect connected relationship edges.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
