import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Activity, ArrowRight, Shield, Droplets, Target, Scroll, Calculator } from 'lucide-react';
import type { FamilyFinancialHealth } from '../../types/familyOffice';

interface FFHHealthWidgetProps {
  health: FamilyFinancialHealth | null;
  isLoading?: boolean;
  onNavigateToHealth: () => void;
}

export const FFHHealthWidget: React.FC<FFHHealthWidgetProps> = ({
  health,
  isLoading,
  onNavigateToHealth
}) => {
  if (isLoading || !health) {
    return (
      <Card variant="glass" className="p-5 border border-[#2B2E35] animate-pulse">
        <div className="h-4 w-32 bg-[#2B2E35] rounded mb-3" />
        <div className="h-8 w-24 bg-[#2B2E35] rounded mb-4" />
        <div className="space-y-2">
          <div className="h-2 w-full bg-[#2B2E35] rounded" />
          <div className="h-2 w-full bg-[#2B2E35] rounded" />
        </div>
      </Card>
    );
  }

  const p = health.pillars;

  return (
    <Card variant="glass" className="p-5 border border-[#4F7FFF]/30 bg-gradient-to-br from-[#4F7FFF]/10 via-[#15161A] to-[#15161A]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#4F7FFF]/20 border border-[#4F7FFF]/30">
            <Activity className="w-4 h-4 text-[#4F7FFF]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#F3F4F6]">Family Financial Health</h4>
            <p className="text-[10px] text-[#9CA3AF]">Life Stage: {health.lifeStage.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <Badge variant={health.overallScore >= 70 ? 'success' : health.overallScore >= 45 ? 'warning' : 'danger'} size="sm">
          {health.overallStatus}
        </Badge>
      </div>

      <div className="flex items-baseline justify-between my-2">
        <div className="text-2xl font-extrabold text-[#F3F4F6] font-mono">
          {health.overallScore.toFixed(0)} <span className="text-xs font-normal text-[#9CA3AF]">/ 100</span>
        </div>
        <div className="text-xs text-[#9CA3AF] font-mono">
          Completeness: {(health.completenessScore * 100).toFixed(0)}%
        </div>
      </div>

      {/* Mini Pillar Meters */}
      <div className="grid grid-cols-5 gap-1.5 my-3">
        <div title="Protection" className="space-y-1">
          <div className="h-1.5 rounded-full bg-[#1E2025] overflow-hidden">
            <div className="h-full bg-[#F04438]" style={{ width: `${p.protection?.score || 0}%` }} />
          </div>
          <div className="text-[9px] text-center text-[#9CA3AF] font-mono">Prot</div>
        </div>

        <div title="Liquidity" className="space-y-1">
          <div className="h-1.5 rounded-full bg-[#1E2025] overflow-hidden">
            <div className="h-full bg-[#38BDF8]" style={{ width: `${p.liquidity?.score || 0}%` }} />
          </div>
          <div className="text-[9px] text-center text-[#9CA3AF] font-mono">Liq</div>
        </div>

        <div title="Goals" className="space-y-1">
          <div className="h-1.5 rounded-full bg-[#1E2025] overflow-hidden">
            <div className="h-full bg-[#4F7FFF]" style={{ width: `${p.goals?.status === 'NOT_APPLICABLE' ? 0 : p.goals?.score || 0}%` }} />
          </div>
          <div className="text-[9px] text-center text-[#9CA3AF] font-mono">Goal</div>
        </div>

        <div title="Estate" className="space-y-1">
          <div className="h-1.5 rounded-full bg-[#1E2025] overflow-hidden">
            <div className="h-full bg-[#F79009]" style={{ width: `${p.estate?.score || 0}%` }} />
          </div>
          <div className="text-[9px] text-center text-[#9CA3AF] font-mono">Est</div>
        </div>

        <div title="Tax & Data" className="space-y-1">
          <div className="h-1.5 rounded-full bg-[#1E2025] overflow-hidden">
            <div className="h-full bg-[#32D583]" style={{ width: `${p.taxAndData?.score || 0}%` }} />
          </div>
          <div className="text-[9px] text-center text-[#9CA3AF] font-mono">Tax</div>
        </div>
      </div>

      <Button
        variant="secondary"
        onClick={onNavigateToHealth}
        className="w-full text-xs mt-2 justify-between"
      >
        <span>View Full 5-Pillar Analysis</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </Card>
  );
};
