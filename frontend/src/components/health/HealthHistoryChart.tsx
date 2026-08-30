import React from 'react';
import { Card } from '../ui/Card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import type { FamilyHealthSnapshotRow } from '../../types/familyOffice';

interface HealthHistoryChartProps {
  snapshots: FamilyHealthSnapshotRow[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#15161A] border border-[#2B2E35] p-3 rounded-xl shadow-2xl text-xs z-50">
        <div className="text-[10px] text-[#6B7280] font-mono mb-1">{data.snapshot_period || label}</div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4F7FFF]" />
          <span className="text-[#9CA3AF]">Overall Score:</span>
          <span className="text-[#F3F4F6] font-bold font-mono">{data.overall_score} / 100</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#32D583]" />
          <span className="text-[#9CA3AF]">Completeness:</span>
          <span className="text-[#F3F4F6] font-bold font-mono">{(data.completeness_score * 100).toFixed(0)}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export const HealthHistoryChart: React.FC<HealthHistoryChartProps> = ({ snapshots }) => {
  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-[#9CA3AF] bg-[#1E2025]/30 rounded-xl border border-dashed border-[#2B2E35]">
        No historical snapshots taken yet. Click "Save Snapshot" to record this period's baseline.
      </div>
    );
  }

  // Reverse snapshots to show oldest to newest chronologically
  const chartData = [...snapshots].reverse().map(s => ({
    period: s.snapshot_period,
    overall_score: s.overall_score,
    completeness_score: s.completeness_score,
    as_of_date: s.as_of_date
  }));

  return (
    <Card variant="glass" className="p-5 border border-[#2B2E35]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-[#F3F4F6]">Historical Health Trend</h4>
          <p className="text-xs text-[#9CA3AF]">Monthly snapshot trajectory of Family Financial Health</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4F7FFF]" />
            <span className="text-[#9CA3AF] font-medium">Composite Score</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F7FFF" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4F7FFF" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="period" 
              stroke="#6B7280" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#2B2E35' }}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="#6B7280" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#2B2E35' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="overall_score" 
              stroke="#4F7FFF" 
              strokeWidth={2.5} 
              fillOpacity={1} 
              fill="url(#scoreGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
