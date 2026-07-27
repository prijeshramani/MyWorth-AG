import React from 'react';
import { AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export interface InsightCardProps {
  type?: 'WARNING' | 'INFO' | 'GAIN';
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  type = 'INFO',
  title,
  message,
  actionText,
  onAction
}) => {
  const styles = {
    WARNING: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
      icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
      titleColor: 'text-amber-300'
    },
    INFO: {
      border: 'border-sky-500/30',
      bg: 'bg-sky-500/10',
      icon: <Info className="w-5 h-5 text-sky-400" />,
      titleColor: 'text-sky-300'
    },
    GAIN: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      titleColor: 'text-emerald-300'
    }
  };

  const currentStyle = styles[type];

  return (
    <div className={`card-glass p-5 border ${currentStyle.border} ${currentStyle.bg} flex items-start gap-4`}>
      <div className="mt-0.5">{currentStyle.icon}</div>
      <div className="flex-1">
        <h4 className={`text-xs font-bold uppercase tracking-wider ${currentStyle.titleColor} mb-1`}>
          {title}
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
        {actionText && (
          <button
            onClick={onAction}
            className="mt-3 text-xs font-semibold text-sky-400 hover:text-sky-300 underline underline-offset-4 transition-colors"
          >
            {actionText} →
          </button>
        )}
      </div>
    </div>
  );
};
