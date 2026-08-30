import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  ArrowUpRight, 
  ShieldAlert, 
  Layers, 
  Zap, 
  Compass,
  RefreshCw
} from 'lucide-react';
import { onboardingCompletenessService } from '../../services/onboardingCompletenessService';
import type { ActionableCompletenessResponse, NextBestAction } from '../../types/familyOffice';

interface NextBestActionPanelProps {
  onNavigate: (route: string) => void;
  onOpenOnboarding: () => void;
}

export const NextBestActionPanel: React.FC<NextBestActionPanelProps> = ({
  onNavigate,
  onOpenOnboarding
}) => {
  const [data, setData] = useState<ActionableCompletenessResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);

  const fetchCompleteness = async () => {
    try {
      setLoading(true);
      const res = await onboardingCompletenessService.getActionableCompleteness();
      setData(res);
    } catch (err) {
      console.warn('[NextBestActionPanel] Failed to load actionable completeness:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompleteness();
  }, []);

  if (loading) {
    return (
      <div className="card-glass p-6 rounded-2xl animate-pulse flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20"></div>
          <div>
            <div className="h-4 w-40 bg-slate-700 rounded mb-2"></div>
            <div className="h-3 w-64 bg-slate-800 rounded"></div>
          </div>
        </div>
        <div className="h-8 w-24 bg-slate-700 rounded-xl"></div>
      </div>
    );
  }

  if (!data) return null;

  const actions = data.rankedActions || [];
  const topActions = showAll ? actions : actions.slice(0, 3);
  const hasActions = actions.length > 0;

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'DATA_INTEGRITY':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Data Integrity
          </span>
        );
      case 'MISSING_FOUNDATION':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Core Foundation
          </span>
        );
      case 'INTELLIGENCE_ENRICHMENT':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Enrichment
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-500/20 text-slate-300 border border-slate-500/30">
            {category}
          </span>
        );
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'HIGH':
        return (
          <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-0.5">
            <Zap className="w-3 h-3 fill-rose-400" /> High Impact
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-0.5">
            <Zap className="w-3 h-3 fill-amber-400" /> Medium Impact
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-0.5">
            <Zap className="w-3 h-3" /> Low Impact
          </span>
        );
    }
  };

  return (
    <div className="card-glass p-6 rounded-2xl border border-indigo-500/20 relative overflow-hidden mb-8 shadow-xl shadow-indigo-950/20">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Family Office Actionable Next Steps
              </h3>
              {data.status === 'COMPLETE' ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Complete
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {data.completenessScore}% Completeness
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {hasActions 
                ? `${actions.length} prioritized recommendations to complete your financial digital twin`
                : 'All foundational family financial records and governance profiles are complete.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchCompleteness}
            title="Refresh action ranking"
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-white transition-all text-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenOnboarding}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Launch Setup Wizard
          </button>
        </div>
      </div>

      {/* Action Items List */}
      {hasActions ? (
        <div className="divide-y divide-slate-800/60 mt-2">
          {topActions.map((action: NextBestAction, index: number) => {
            const isExpanded = expandedActionId === action.actionId;
            return (
              <div 
                key={action.actionId} 
                className="py-3.5 group hover:bg-slate-800/20 px-2 rounded-xl transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold border border-slate-700 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors">
                          {action.title}
                        </span>
                        {getCategoryBadge(action.category)}
                        {getImpactBadge(action.impactLevel)}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setExpandedActionId(isExpanded ? null : action.actionId)}
                      className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition-all flex items-center gap-1"
                    >
                      Why it matters
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onNavigate(action.targetRoute)}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      Take Action
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Explanation Card */}
                {isExpanded && (
                  <div className="mt-3 ml-9 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-2">
                    <p className="text-slate-300 leading-relaxed">
                      <strong className="text-indigo-400">Impact Analysis: </strong>
                      {action.whyItMatters}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-500 font-medium">Unlocks / Improves:</span>
                      {action.affectedCapabilities.map((cap) => (
                        <span 
                          key={cap} 
                          className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200">
            Family Digital Twin Is Authoritative & Fully Grounded
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            All 5 pillars (Lineage, Balance Sheet, Protection, Trajectory, Estate) have complete active records.
          </p>
        </div>
      )}

      {/* Footer view toggle */}
      {actions.length > 3 && (
        <div className="mt-3 pt-3 border-t border-slate-800/40 flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
          >
            {showAll ? 'Show top 3 recommendations' : `View all ${actions.length} prioritized actions`}
            {showAll ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};
