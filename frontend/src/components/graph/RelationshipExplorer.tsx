import React, { useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useGraphOverview } from '../../hooks/useGraphOverview';
import { PageSkeleton } from '../common/PageSkeleton';
import { PageShell } from '../layout/PageShell';
import { Card } from '../ui/Card';
import { StatCard } from '../ui/StatCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
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
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const RelationshipExplorer: React.FC = () => {
  const { activeFamilyId } = useUiStore();
  const { data: response, isLoading, isError, error, refetch } = useGraphOverview(activeFamilyId);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  if (isLoading) {
    return <PageSkeleton />;
  }

  const rawData = (response as any)?.data || response;
  const graphData = (rawData as any)?.data || rawData || {};
  const rawNodes = (graphData as any)?.nodes || [];
  const rawEdges = (graphData as any)?.edges || [];

  const nodes = Array.isArray(rawNodes) ? rawNodes : [];
  const edges = Array.isArray(rawEdges) ? rawEdges : [];
  const estateReadiness = (graphData as any)?.estateReadiness;

  const nodeCount = (graphData as any)?.nodeCount ?? nodes.length;
  const edgeCount = (graphData as any)?.edgeCount ?? edges.length;

  const filteredNodes = nodes.filter(n => {
    if (!n) return false;
    const matchesType = filterType === 'ALL' || n.entity_type === filterType;
    const labelStr = String(n.label || n.name || '');
    const matchesSearch = labelStr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const selectedNode = nodes.find(n => n && n.id === selectedNodeId);
  const selectedNodeEdges = selectedNode
    ? edges.filter(e => e && (e.source_node_id === selectedNode.id || e.target_node_id === selectedNode.id))
    : [];

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'PERSON': return <User className="w-4 h-4 text-[#38BDF8]" />;
      case 'ASSET': return <PieChart className="w-4 h-4 text-[#32D583]" />;
      case 'POLICY': return <ShieldAlert className="w-4 h-4 text-[#F04438]" />;
      case 'ACCOUNT': return <Landmark className="w-4 h-4 text-[#F79009]" />;
      case 'DOCUMENT': return <FileText className="w-4 h-4 text-[#8B5CF6]" />;
      case 'TAX_PROFILE': return <Calculator className="w-4 h-4 text-[#38BDF8]" />;
      default: return <GitFork className="w-4 h-4 text-[#9CA3AF]" />;
    }
  };

  return (
    <PageShell
      title="Knowledge Graph Explorer"
      subtitle="Canonical relationship map connecting Family Members, Asset Holdings, Policies, Accounts, Documents & Tax Profiles."
      badge={<Badge variant="primary" icon={<GitFork className="w-3.5 h-3.5" />}>Readiness: {estateReadiness?.readinessScore || 100}%</Badge>}
      actions={
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={() => refetch()}
        >
          Sync Graph
        </Button>
      }
    >
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Nominee Coverage Score"
          value={`${estateReadiness?.nomineeCoveragePercent || 100}%`}
          subtitle="Nominee Registration Rate"
          trend={{ value: 'OPTIMAL', direction: 'up' }}
          icon={<ShieldCheck className="w-5 h-5 text-[#32D583]" />}
        />
        <StatCard
          title="Total Graph Nodes"
          value={nodeCount.toString()}
          subtitle="Persons, Assets, Policies & Accounts"
          trend={{ value: '+8.5%', direction: 'up' }}
          icon={<GitFork className="w-5 h-5 text-[#4F7FFF]" />}
        />
        <StatCard
          title="Active Directed Edges"
          value={edgeCount.toString()}
          subtitle="Ownership, Nominee & Dependents"
          trend={{ value: '+12.0%', direction: 'up' }}
          icon={<CheckCircle className="w-5 h-5 text-[#32D583]" />}
        />
      </div>

      {/* Filter & Search Bar */}
      <Card variant="glass" padding="sm" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {['ALL', 'PERSON', 'ASSET', 'POLICY', 'ACCOUNT', 'DOCUMENT', 'TAX_PROFILE'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all ${
                filterType === t
                  ? 'bg-[#4F7FFF] text-white shadow-md shadow-[#4F7FFF]/20'
                  : 'bg-[#15161A] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#2B2E35]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search graph nodes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-[#15161A] border border-[#2B2E35] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#4F7FFF]"
          />
        </div>
      </Card>

      {/* Interactive Graph Node Grid & Inspector Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Node Grid */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider font-mono">
            Canonical Entities ({filteredNodes.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredNodes.map((n) => {
              const isSelected = selectedNodeId === n.id;
              return (
                <div
                  key={n.id}
                  onClick={() => setSelectedNodeId(n.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#4F7FFF]/15 border-[#4F7FFF] shadow-md shadow-[#4F7FFF]/10'
                      : 'bg-[#1E2025] border-[#2B2E35] hover:border-[#4F7FFF]/40 hover:bg-[#252830]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#15161A] border border-[#2B2E35]">
                        {getNodeIcon(n.entity_type)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#F3F4F6]">{n.label}</h4>
                        <span className="text-[10px] font-mono text-[#9CA3AF] uppercase">
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
        <Card variant="glass" className="space-y-4">
          <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider font-mono">
            Relationship Inspector
          </h3>

          {selectedNode ? (
            <div className="space-y-4">
              <div className="p-3 bg-[#15161A] border border-[#2B2E35] rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-[#4F7FFF] uppercase font-bold">{selectedNode.entity_type}</span>
                <h4 className="text-sm font-bold text-[#F3F4F6]">{selectedNode.label}</h4>
                <span className="text-[11px] font-mono text-[#6B7280]">Node ID: #{selectedNode.id}</span>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-mono text-[#9CA3AF] uppercase font-bold block">
                  Connected Edges ({selectedNodeEdges.length})
                </span>
                
                {selectedNodeEdges.length === 0 ? (
                  <p className="text-xs text-[#6B7280] italic">No active directed edges linked to this node.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedNodeEdges.map((e) => (
                      <div key={e.id} className="p-2.5 bg-[#15161A] border border-[#2B2E35] rounded-xl text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between text-[#F3F4F6] font-semibold">
                          <span>{e.source_label || `Node #${e.source_node_id}`}</span>
                          <ArrowRight className="w-3 h-3 text-[#4F7FFF]" />
                          <span>{e.target_label || `Node #${e.target_node_id}`}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#9CA3AF]">
                          <span className="text-[#32D583] font-bold">{e.relationship_name || e.relationship_code}</span>
                          <span>Weight: {e.weight}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-[#6B7280] text-xs italic">
              Select any graph entity node to inspect connected relationship edges.
            </div>
          )}
        </Card>

      </div>
    </PageShell>
  );
};
