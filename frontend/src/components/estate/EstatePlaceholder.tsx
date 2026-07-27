import React from 'react';
import { Scroll, ShieldCheck, Award, ArrowRight } from 'lucide-react';

export const EstatePlaceholder: React.FC = () => {
  return (
    <div className="card-glass p-8 text-center space-y-4 max-w-2xl mx-auto my-12">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
        <Scroll className="w-8 h-8" />
      </div>

      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase inline-block">
        Phase 6B Module • Coming Soon
      </span>

      <h2 className="text-xl font-bold text-slate-100">Generational Wealth & Estate Succession Planning</h2>
      
      <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto">
        Upcoming Phase 6B modules will introduce family trust structure management, digital Will creation, beneficiary entitlement distribution, nominee verification, and generational wealth succession tracking.
      </p>

      <div className="pt-4 flex justify-center gap-3 text-xs font-mono">
        <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg">
          • Family Trust Management
        </span>
        <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg">
          • Digital Will Registry
        </span>
        <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg">
          • Nominee Mapping
        </span>
      </div>
    </div>
  );
};
