import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useUiStore } from '../../store/useUiStore';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Users, 
  Landmark, 
  PieChart, 
  ShieldAlert, 
  Target, 
  FileUp, 
  Scroll, 
  FileSpreadsheet, 
  Sparkles 
} from 'lucide-react';

export interface SetupStepItem {
  id: string;
  label: string;
  category: string;
  completed: boolean;
  tabTarget: string;
  icon: React.ReactNode;
}

export const OnboardingProgressCard: React.FC = () => {
  const { setActiveTab } = useUiStore();

  const steps: SetupStepItem[] = [
    { id: '1', label: 'Add Family Members & PANs', category: 'Entities', completed: true, tabTarget: 'family', icon: <Users className="w-3.5 h-3.5 text-sky-500" /> },
    { id: '2', label: 'Connect Bank & Demat Accounts', category: 'Wealth', completed: true, tabTarget: 'accounts', icon: <Landmark className="w-3.5 h-3.5 text-teal-500" /> },
    { id: '3', label: 'Import CAS Mutual Fund Statement', category: 'Ingestion', completed: true, tabTarget: 'import', icon: <FileUp className="w-3.5 h-3.5 text-indigo-500" /> },
    { id: '4', label: 'Register Health & Life Policies', category: 'Protection', completed: true, tabTarget: 'protection', icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> },
    { id: '5', label: 'Create Retirement & FIRE Goal', category: 'Planning', completed: true, tabTarget: 'planning', icon: <Target className="w-3.5 h-3.5 text-amber-500" /> },
    { id: '6', label: 'Register Will & Testator Inventory', category: 'Estate', completed: false, tabTarget: 'estate', icon: <Scroll className="w-3.5 h-3.5 text-purple-500" /> },
    { id: '7', label: 'Generate First Financial Report', category: 'Reports', completed: false, tabTarget: 'reports', icon: <FileSpreadsheet className="w-3.5 h-3.5 text-sky-500" /> },
    { id: '8', label: 'Run AI Wealth Advisor Consultation', category: 'AI', completed: true, tabTarget: 'ai-advisor', icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const totalCount = steps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <Card variant="glass" className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              FamilyWealthOS Setup Progress
            </h3>
            <Badge variant="primary" size="sm">{progressPercent}% Complete</Badge>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Complete household setup for optimal AI insights, tax calculation, and succession readiness.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{completedCount} of {totalCount} Steps Done</span>
          <span className="text-[10px] text-slate-500 block">Est. ~3 mins remaining</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
        <div 
          className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500" 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
        {steps.map((step) => (
          <div
            key={step.id}
            onClick={() => setActiveTab(step.tabTarget)}
            className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between gap-2 transition-all ${
              step.completed
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {step.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <span className="text-xs font-semibold truncate">{step.label}</span>
            </div>

            <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  );
};
