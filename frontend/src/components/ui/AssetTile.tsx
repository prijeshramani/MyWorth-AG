import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface AssetTileProps {
  name: string;
  symbol?: string;
  assetType: string;
  formattedMarketValue: string;
  unrealizedGainPercent: number;
  onClick?: () => void;
}

export const AssetTile: React.FC<AssetTileProps> = ({
  name,
  symbol,
  assetType,
  formattedMarketValue,
  unrealizedGainPercent,
  onClick
}) => {
  const isGain = unrealizedGainPercent >= 0;

  return (
    <div
      onClick={onClick}
      className="card-glass card-glass-hover p-4 flex items-center justify-between cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-center font-bold text-xs text-sky-400 group-hover:border-sky-500/40 transition-colors">
          {symbol ? symbol.slice(0, 4) : name.slice(0, 4)}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200 group-hover:text-sky-300 transition-colors line-clamp-1">
            {name}
          </h4>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            {assetType} {symbol ? `• ${symbol}` : ''}
          </span>
        </div>
      </div>

      <div className="text-right">
        <div className="text-sm font-bold font-mono text-slate-100">
          {formattedMarketValue}
        </div>
        <div
          className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
            isGain ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isGain ? '+' : ''}{unrealizedGainPercent.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};
