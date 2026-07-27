import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock, DollarSign } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  title: string;
  timestamp: string;
  amount: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'VALUATION';
}

export interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'BUY':
        return <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />;
      case 'SELL':
        return <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />;
      case 'DIVIDEND':
        return <DollarSign className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="card-glass p-6">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
        Recent Activity Feed
      </h3>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {events.map((event) => (
          <div key={event.id} className="relative flex items-center justify-between text-xs">
            <div className="absolute -left-6 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
              {getEventIcon(event.type)}
            </div>

            <div>
              <h5 className="font-semibold text-slate-200">{event.title}</h5>
              <span className="text-[10px] text-slate-500 font-mono">{event.timestamp}</span>
            </div>

            <div className="font-mono font-bold text-slate-100">{event.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
