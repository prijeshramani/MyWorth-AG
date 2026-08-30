import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Shield, Landmark, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { TimeMachineReconstruction } from '../../types/familyOffice';

interface HistoricalBalanceSheetProps {
  reconstruction: TimeMachineReconstruction;
}

export const HistoricalBalanceSheet: React.FC<HistoricalBalanceSheetProps> = ({ reconstruction }) => {
  const p = reconstruction.protectionShield;

  return (
    <div className="space-y-4 mb-6">
      {/* Top Reconstructed Totals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Net Worth */}
        <Card variant="glass" className="p-5 border border-[#4F7FFF]/40 bg-gradient-to-br from-[#4F7FFF]/10 via-[#15161A] to-[#15161A] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
              <span>Reconstructed Net Worth</span>
              <TrendingUp className="w-4 h-4 text-[#4F7FFF]" />
            </div>
            <div className="text-2xl font-extrabold text-[#F3F4F6] font-mono my-2">
              ₹{reconstruction.netWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="pt-2 border-t border-[#2B2E35] flex items-center justify-between text-xs">
            <span className="text-[#9CA3AF]">Status:</span>
            <Badge variant={reconstruction.overallStatus === 'COMPLETE' ? 'success' : 'warning'} size="sm">
              {reconstruction.overallStatus}
            </Badge>
          </div>
        </Card>

        {/* Gross Assets */}
        <Card variant="glass" className="p-5 border border-[#2B2E35] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
              <span>Gross Reconstructed Assets</span>
              <Landmark className="w-4 h-4 text-[#32D583]" />
            </div>
            <div className="text-xl font-bold text-[#32D583] font-mono my-2">
              ₹{reconstruction.grossAssets.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <p className="text-[11px] text-[#6B7280] font-mono">
            {reconstruction.holdings.length} asset positions evaluated
          </p>
        </Card>

        {/* Total Liabilities */}
        <Card variant="glass" className="p-5 border border-[#2B2E35] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
              <span>Total Historical Liabilities</span>
              <AlertCircle className="w-4 h-4 text-[#F04438]" />
            </div>
            <div className="text-xl font-bold text-[#F04438] font-mono my-2">
              ₹{reconstruction.totalLiabilities.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <p className="text-[11px] text-[#6B7280] font-mono">
            {Object.keys(reconstruction.liabilitiesBreakdown || {}).length} liability records active
          </p>
        </Card>

        {/* Protection Shield (Strictly Isolated from Net Worth) */}
        <Card variant="glass" className="p-5 border border-[#F04438]/30 bg-[#F04438]/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
              <span>Protection Shield Cover</span>
              <Shield className="w-4 h-4 text-[#F04438]" />
            </div>
            <div className="text-xl font-bold text-[#F3F4F6] font-mono my-2">
              ₹{(p?.totalSumAssured || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="pt-2 border-t border-[#2B2E35] text-[10px] text-[#F04438] font-semibold flex items-center gap-1">
            <span>🛡️ Isolated Cover (Not added to Net Worth)</span>
          </div>
        </Card>
      </div>

      {/* Reconstruction Metadata Banner */}
      <div className="p-3 rounded-xl bg-[#1E2025]/50 border border-[#2B2E35] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[#9CA3AF]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#8B5CF6]" />
          <span>Mode: <strong className="text-[#F3F4F6]">{reconstruction.reconstructionMode}</strong></span>
          <span>• Knowledge-Time: <strong className="text-[#F3F4F6]">{reconstruction.knowledgeTimeStatus}</strong></span>
        </div>
        <div className="font-mono text-[11px] text-[#6B7280]">
          Hash: {reconstruction.stateHash.slice(0, 12)}... • Calc Ver: {reconstruction.calculationVersion}
        </div>
      </div>
    </div>
  );
};
