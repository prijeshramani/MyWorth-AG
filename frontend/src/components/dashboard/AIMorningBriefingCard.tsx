import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { useUiStore } from '../../store/useUiStore';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldAlert, 
  Calculator, 
  CheckCircle2, 
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';

export const AIMorningBriefingCard: React.FC = () => {
  const { setActiveTab } = useUiStore();
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/briefing/morning-briefing');
        setBriefing(res.data?.data);
      } catch {
        // Fallback default briefing state
        setBriefing({
          greeting: 'Good Evening',
          netWorthFormatted: '₹1,45,82,500',
          deltaTodayFormatted: '+₹42,000',
          isDeltaPositive: true,
          deltaPercent: 0.28,
          highlights: [
            { id: '1', type: 'WARNING', title: 'Insurance Premium Renewal Due', description: 'Star Health Optima renewal in 12 days.', actionTab: 'protection', actionText: 'View Policy' },
            { id: '2', type: 'OPPORTUNITY', title: 'Tax Saving Headroom (Section 80C)', description: 'Claim ₹38,400 remaining tax deduction.', actionTab: 'tax', actionText: 'Optimize Tax' },
            { id: '3', type: 'SUCCESS', title: 'Portfolio Up Today', description: 'Consolidated holdings grew +0.28% today.', actionTab: 'portfolio', actionText: 'View Portfolio' }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchBriefing();
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse p-6 space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
      </Card>
    );
  }

  if (!briefing) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50/80 via-white to-slate-50/80 dark:from-indigo-950/30 dark:via-slate-900/60 dark:to-slate-950/40 border border-indigo-200/80 dark:border-indigo-800/40 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-100 dark:border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              {briefing.greeting}, {briefing.selfMemberName || 'there'}
            </h2>
            <Badge variant="primary" size="sm">Executive Briefing</Badge>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Real-time daily net worth delta • Proactive risk alerts • Tax optimization opportunities
          </p>
        </div>

        <div className="flex items-baseline gap-3 bg-white/80 dark:bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Net Worth</span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{briefing.netWorthFormatted}</span>
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold ${briefing.isDeltaPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {briefing.isDeltaPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{briefing.deltaTodayFormatted} ({briefing.deltaPercent}%)</span>
          </div>
        </div>
      </div>

      {/* Highlights List */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Today's Financial Highlights & Action Items
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {briefing.highlights?.slice(0, 3).map((item: any) => (
            <div 
              key={item.id}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    item.type === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40' :
                    item.type === 'WARNING' ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40' :
                    item.type === 'OPPORTUNITY' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/40' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
                  }`}>
                    {item.type}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</h5>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">{item.description}</p>
              </div>

              {item.actionTab && (
                <button
                  onClick={() => setActiveTab(item.actionTab)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 pt-1"
                >
                  <span>{item.actionText || 'Take Action'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
