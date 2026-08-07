import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  badge?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  badge,
  className = '',
}) => {
  const getTrendBadge = () => {
    if (!trend) return null;

    if (trend.direction === 'up') {
      return (
        <Badge variant="success" size="sm" icon={<TrendingUp className="w-3 h-3" />}>
          {trend.value} {trend.label && <span className="opacity-75">{trend.label}</span>}
        </Badge>
      );
    }

    if (trend.direction === 'down') {
      return (
        <Badge variant="danger" size="sm" icon={<TrendingDown className="w-3 h-3" />}>
          {trend.value} {trend.label && <span className="opacity-75">{trend.label}</span>}
        </Badge>
      );
    }

    return (
      <Badge variant="neutral" size="sm" icon={<Minus className="w-3 h-3" />}>
        {trend.value}
      </Badge>
    );
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
            {title}
          </span>
          {badge && <Badge variant="primary" size="sm">{badge}</Badge>}
        </div>
        {icon && (
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#15161A] border border-slate-200 dark:border-[#2B2E35] text-[#4F7FFF]">
            {icon}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-2xl sm:text-3xl font-extrabold text-[#F3F4F6] tracking-tight truncate min-w-0">
          {value}
        </div>
        {getTrendBadge() && (
          <div className="flex">{getTrendBadge()}</div>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-[#6B7280]">
          {subtitle}
        </p>
      )}
    </Card>
  );
};
