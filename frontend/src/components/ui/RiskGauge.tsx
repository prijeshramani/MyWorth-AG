import React from 'react';

export interface RiskGaugeProps {
  label: string;
  value: number;
  minValue?: number;
  maxValue?: number;
  ratingLabel?: 'LOW' | 'MODERATE' | 'HIGH';
  statusColor?: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  label,
  value,
  minValue = 0,
  maxValue = 100,
  ratingLabel = 'MODERATE',
  statusColor = '#0284c7'
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - minValue) / (maxValue - minValue)) * 100));
  const strokeDashoffset = 283 - (283 * percentage) / 100;

  return (
    <div className="card-glass card-glass-hover p-6 flex flex-col items-center justify-between text-center">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </span>

      <div className="relative w-32 h-32 flex items-center justify-center my-2">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-800"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={statusColor}
            strokeWidth="8"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold font-mono text-slate-100">{value}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">
            {ratingLabel}
          </span>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 font-mono">
        Range: {minValue} - {maxValue}
      </div>
    </div>
  );
};
