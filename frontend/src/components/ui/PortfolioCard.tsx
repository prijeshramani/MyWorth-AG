import React from 'react';
import { Users, Building2, ChevronRight } from 'lucide-react';

export interface PortfolioCardProps {
  familyId: number;
  familyName: string;
  formattedNetWorth: string;
  memberCount: number;
  entityCount: number;
  accountCount: number;
  dominantAssetType?: string;
  onClick?: () => void;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  familyName,
  formattedNetWorth,
  memberCount,
  entityCount,
  accountCount,
  dominantAssetType = 'STOCK',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className="card-glass card-glass-hover p-6 cursor-pointer group flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold text-slate-100 group-hover:text-sky-400 transition-colors flex items-center gap-2">
            {familyName}
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-sky-400" />
          </h3>
          <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            {dominantAssetType}
          </span>
        </div>

        <div className="text-2xl font-bold font-mono text-slate-100 my-3">
          {formattedNetWorth}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{memberCount} Members</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{entityCount} Entities • {accountCount} Accounts</span>
        </div>
      </div>
    </div>
  );
};
