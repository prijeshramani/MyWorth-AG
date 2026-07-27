import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MetricSkeleton } from '../common/PageSkeleton';

export interface MetricCardProps {
  title: string;
  value: string;
  subtext?: string;
  changePercent?: number;
  trend?: 'UP' | 'DOWN' | 'NEUTRAL';
  loading?: boolean;
  icon?: React.ReactNode;
  statusColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  changePercent,
  trend = 'NEUTRAL',
  loading = false,
  icon,
  statusColor
}) => {
  if (loading) {
    return <MetricSkeleton />;
  }

  const getTrendBadge = () => {
    if (changePercent === undefined) return null;
    const isGain = changePercent >= 0;

    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
          isGain
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}
      >
        {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isGain ? '+' : ''}{changePercent.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="card-glass card-glass-hover p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div>
        <div className="text-2xl md:text-3xl font-bold font-mono text-slate-100 tracking-tight">
          {value}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-xs">
          {subtext && <span className="text-slate-400">{subtext}</span>}
          {getTrendBadge()}
        </div>
      </div>
    </div>
  );
};
