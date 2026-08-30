import React from 'react';
import { Search, Filter, Clock, CheckCircle } from 'lucide-react';
import type { TimelineDomain, TimelineImportance } from '../../types/familyOffice';

interface TimelineFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedDomain: TimelineDomain | 'ALL';
  onDomainSelect: (domain: TimelineDomain | 'ALL') => void;
  selectedImportance: TimelineImportance | 'ALL';
  onImportanceSelect: (imp: TimelineImportance | 'ALL') => void;
  includeScheduled: boolean;
  onToggleScheduled: (include: boolean) => void;
}

const DOMAINS: Array<{ id: TimelineDomain | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'All Domains' },
  { id: 'PORTFOLIO', label: 'Portfolio' },
  { id: 'PROTECTION', label: 'Protection' },
  { id: 'TAX', label: 'Tax' },
  { id: 'ESTATE', label: 'Estate' },
  { id: 'GOAL', label: 'Goals' },
  { id: 'LIFE_EVENT', label: 'Life Events' },
  { id: 'AI_DECISION', label: 'AI Decisions' }
];

const IMPORTANCE_LEVELS: Array<{ id: TimelineImportance | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'All Priority' },
  { id: 'CRITICAL', label: 'Critical' },
  { id: 'HIGH', label: 'High' },
  { id: 'MEDIUM', label: 'Medium' },
  { id: 'INFO', label: 'Info' }
];

export const TimelineFilterBar: React.FC<TimelineFilterBarProps> = ({
  search,
  onSearchChange,
  selectedDomain,
  onDomainSelect,
  selectedImportance,
  onImportanceSelect,
  includeScheduled,
  onToggleScheduled
}) => {
  return (
    <div className="space-y-3 bg-[#15161A] p-4 rounded-xl border border-[#2B2E35] mb-6">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search timeline events, transactions, narrative keywords..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#1E2025] border border-[#2B2E35] rounded-xl text-xs text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#4F7FFF]"
          />
        </div>

        {/* Scheduled Toggle */}
        <button
          onClick={() => onToggleScheduled(!includeScheduled)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
            includeScheduled
              ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/40 shadow-sm'
              : 'bg-[#1E2025] text-[#9CA3AF] border-[#2B2E35] hover:text-[#F3F4F6]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Include Scheduled Obligations</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#15161A] border border-[#2B2E35]">
            {includeScheduled ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Domain Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] text-[#6B7280] font-semibold uppercase mr-1 shrink-0">Domain:</span>
        {DOMAINS.map((d) => {
          const active = selectedDomain === d.id;
          return (
            <button
              key={d.id}
              onClick={() => onDomainSelect(d.id)}
              className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-all ${
                active
                  ? 'bg-[#4F7FFF] text-white font-semibold shadow-sm'
                  : 'bg-[#1E2025] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#2B2E35]'
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {/* Importance Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-[11px] text-[#6B7280] font-semibold uppercase mr-1 shrink-0">Importance:</span>
        {IMPORTANCE_LEVELS.map((imp) => {
          const active = selectedImportance === imp.id;
          return (
            <button
              key={imp.id}
              onClick={() => onImportanceSelect(imp.id)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium shrink-0 transition-all ${
                active
                  ? 'bg-[#F79009]/20 text-[#F79009] border border-[#F79009]/40 font-semibold'
                  : 'bg-[#1E2025] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#2B2E35]'
              }`}
            >
              {imp.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
