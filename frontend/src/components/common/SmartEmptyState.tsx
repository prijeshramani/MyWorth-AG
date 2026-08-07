import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useUiStore } from '../../store/useUiStore';
import { Sparkles, Plus, FileUp, Bot } from 'lucide-react';

export interface SmartEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  whyItMatters: string;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  showAskAi?: boolean;
}

export const SmartEmptyState: React.FC<SmartEmptyStateProps> = ({
  icon,
  title,
  description,
  whyItMatters,
  primaryActionText,
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
  showAskAi = true,
}) => {
  const { setActiveTab } = useUiStore();

  return (
    <Card variant="glass" className="max-w-2xl mx-auto p-8 text-center space-y-6">
      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 rounded-3xl w-16 h-16 mx-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/10">
        {icon}
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">{description}</p>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-left space-y-1 max-w-md mx-auto">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Why This Matters
        </span>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{whyItMatters}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {primaryActionText && onPrimaryAction && (
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onPrimaryAction}
          >
            {primaryActionText}
          </Button>
        )}

        {secondaryActionText && onSecondaryAction && (
          <Button
            variant="secondary"
            leftIcon={<FileUp className="w-4 h-4" />}
            onClick={onSecondaryAction}
          >
            {secondaryActionText}
          </Button>
        )}

        {showAskAi && (
          <Button
            variant="ghost"
            leftIcon={<Bot className="w-4 h-4 text-purple-500" />}
            onClick={() => setActiveTab('ai-advisor')}
          >
            Ask AI Advisor
          </Button>
        )}
      </div>
    </Card>
  );
};
