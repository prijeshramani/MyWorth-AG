import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Shield, Droplets, Target, Scroll, Calculator, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import type { FFHPillarScore, PillarStatus } from '../../types/familyOffice';

interface PillarScoreCardProps {
  pillarKey: string;
  pillar: FFHPillarScore;
}

const getPillarIcon = (pillarKey: string) => {
  switch (pillarKey) {
    case 'protection':
      return <Shield className="w-5 h-5 text-[#F04438]" />;
    case 'liquidity':
      return <Droplets className="w-5 h-5 text-[#38BDF8]" />;
    case 'goals':
      return <Target className="w-5 h-5 text-[#4F7FFF]" />;
    case 'estate':
      return <Scroll className="w-5 h-5 text-[#F79009]" />;
    case 'taxAndData':
      return <Calculator className="w-5 h-5 text-[#32D583]" />;
    default:
      return <HelpCircle className="w-5 h-5 text-[#8B5CF6]" />;
  }
};

const getPillarTitle = (pillarKey: string) => {
  switch (pillarKey) {
    case 'protection':
      return 'Protection Shield';
    case 'liquidity':
      return 'Liquidity & Runway';
    case 'goals':
      return 'Financial Goals';
    case 'estate':
      return 'Estate & Succession';
    case 'taxAndData':
      return 'Tax & Data Hygiene';
    default:
      return pillarKey;
  }
};

const getStatusBadge = (status: PillarStatus) => {
  switch (status) {
    case 'COMPLETE':
      return <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>Complete & Verified</Badge>;
    case 'PARTIAL':
      return <Badge variant="warning" size="sm" icon={<AlertCircle className="w-3 h-3" />}>Partial History</Badge>;
    case 'INSUFFICIENT_DATA':
      return <Badge variant="warning" size="sm" icon={<AlertCircle className="w-3 h-3" />}>Insufficient Data</Badge>;
    case 'KNOWN_ZERO':
      return <Badge variant="neutral" size="sm">Zero Balance</Badge>;
    case 'NOT_APPLICABLE':
      return <Badge variant="neutral" size="sm">N/A (Weight Redistributed)</Badge>;
    case 'STALE':
      return <Badge variant="warning" size="sm">Needs Refresh</Badge>;
    case 'UNKNOWN':
    default:
      return <Badge variant="neutral" size="sm">Unknown State</Badge>;
  }
};

export const PillarScoreCard: React.FC<PillarScoreCardProps> = ({ pillarKey, pillar }) => {
  const isNA = pillar.status === 'NOT_APPLICABLE';
  const isInsufficient = pillar.status === 'INSUFFICIENT_DATA';

  return (
    <Card variant="glass" className="p-5 border border-[#2B2E35] flex flex-col justify-between hover:border-[#4F7FFF]/40 transition-all">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#1E2025] border border-[#2B2E35]">
              {getPillarIcon(pillarKey)}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#F3F4F6]">{getPillarTitle(pillarKey)}</h4>
              <p className="text-[11px] text-[#9CA3AF] font-mono">Weight: {(pillar.weight * 100).toFixed(0)}%</p>
            </div>
          </div>
          {getStatusBadge(pillar.status)}
        </div>

        {/* Score & Progress */}
        <div className="my-3">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs text-[#9CA3AF]">Pillar Score</span>
            <span className="text-xl font-extrabold text-[#F3F4F6]">
              {isNA ? 'N/A' : (isInsufficient || pillar.score === null) ? '--' : `${pillar.score.toFixed(0)} / 100`}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#1E2025] overflow-hidden border border-[#2B2E35]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isNA ? 'bg-slate-600' :
                (pillar.score || 0) >= 80 ? 'bg-[#32D583]' :
                (pillar.score || 0) >= 50 ? 'bg-[#4F7FFF]' :
                (pillar.score || 0) >= 30 ? 'bg-[#F79009]' : 'bg-[#F04438]'
              }`}
              style={{ width: `${isNA || pillar.score === null ? 0 : Math.min(100, Math.max(0, pillar.score))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#6B7280] mt-1 font-mono">
            <span>Contribution: {isNA ? '0.0' : (pillar.weightedContribution || 0).toFixed(1)} pts</span>
            <span>Weight: {(pillar.weight * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Missing Data Explanation */}
        {pillar.missingDataReason && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 mt-2 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{pillar.missingDataReason}</span>
          </div>
        )}

        {/* Metrics Breakdown */}
        {pillar.metrics && Object.keys(pillar.metrics).length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#2B2E35] grid grid-cols-2 gap-2 text-xs">
            {Object.entries(pillar.metrics).slice(0, 4).map(([k, v]) => {
              if (typeof v === 'object' && v !== null) return null;
              const formattedVal = typeof v === 'number' 
                ? (v > 10000 ? `₹${(v / 100000).toFixed(1)} L` : v.toLocaleString())
                : String(v);
              return (
                <div key={k} className="bg-[#1E2025]/50 p-2 rounded-lg">
                  <div className="text-[10px] text-[#9CA3AF] capitalize truncate">{k.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="font-bold text-[#F3F4F6] text-xs font-mono">{formattedVal}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 text-[10px] text-[#6B7280] font-mono flex justify-between items-center border-t border-[#2B2E35]/50">
        <span>Engine: {pillar.authoritativeEngine || 'FamilyOffice Core'}</span>
      </div>
    </Card>
  );
};
