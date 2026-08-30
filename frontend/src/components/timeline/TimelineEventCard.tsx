import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  TrendingUp, 
  ShieldAlert, 
  Calculator, 
  Scroll, 
  Target, 
  UserCheck, 
  Sparkles, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import type { TimelineEvent, TimelineDomain, TimelineImportance } from '../../types/familyOffice';

interface TimelineEventCardProps {
  event: TimelineEvent;
}

const getDomainIcon = (domain: TimelineDomain) => {
  switch (domain) {
    case 'PORTFOLIO':
      return <TrendingUp className="w-4 h-4 text-[#32D583]" />;
    case 'PROTECTION':
      return <ShieldAlert className="w-4 h-4 text-[#F04438]" />;
    case 'TAX':
      return <Calculator className="w-4 h-4 text-[#38BDF8]" />;
    case 'ESTATE':
      return <Scroll className="w-4 h-4 text-[#F79009]" />;
    case 'GOAL':
      return <Target className="w-4 h-4 text-[#4F7FFF]" />;
    case 'LIFE_EVENT':
      return <UserCheck className="w-4 h-4 text-[#E879F9]" />;
    case 'AI_DECISION':
      return <Sparkles className="w-4 h-4 text-[#8B5CF6]" />;
    default:
      return <Clock className="w-4 h-4 text-[#9CA3AF]" />;
  }
};

const getImportanceBadge = (importance: TimelineImportance) => {
  switch (importance) {
    case 'CRITICAL':
      return <Badge variant="danger" size="sm">CRITICAL</Badge>;
    case 'HIGH':
      return <Badge variant="warning" size="sm">HIGH</Badge>;
    case 'MEDIUM':
      return <Badge variant="primary" size="sm">MEDIUM</Badge>;
    case 'INFO':
    default:
      return <Badge variant="neutral" size="sm">INFO</Badge>;
  }
};

export const TimelineEventCard: React.FC<TimelineEventCardProps> = ({ event }) => {
  const isScheduled = event.eventStatus === 'SCHEDULED';
  const hasAmount = event.amount !== undefined && event.amount !== null;

  return (
    <Card 
      variant="glass" 
      className={`p-4 border transition-all ${
        isScheduled 
          ? 'border-dashed border-[#38BDF8]/40 bg-[#38BDF8]/5 hover:border-[#38BDF8]/70' 
          : 'border-[#2B2E35] hover:border-[#4F7FFF]/40'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl border mt-0.5 ${
            isScheduled 
              ? 'bg-[#38BDF8]/10 border-[#38BDF8]/30' 
              : 'bg-[#1E2025] border-[#2B2E35]'
          }`}>
            {getDomainIcon(event.domain)}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold text-[#F3F4F6]">{event.title}</span>
              {getImportanceBadge(event.importanceTier)}
              {isScheduled && (
                <Badge variant="info" size="sm" icon={<Clock className="w-3 h-3" />}>
                  SCHEDULED OBLIGATION
                </Badge>
              )}
            </div>

            {event.description && (
              <p className="text-xs text-[#9CA3AF] leading-relaxed mb-2">
                {event.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-[11px] text-[#6B7280] font-mono flex-wrap">
              <span>Domain: <strong className="text-[#9CA3AF]">{event.domain}</strong></span>
              <span>Source: <strong className="text-[#9CA3AF]">{event.sourceType}</strong></span>
              {event.metadata?.maskedIdentifier && (
                <span>ID: <strong className="text-[#9CA3AF]">{event.metadata.maskedIdentifier}</strong></span>
              )}
            </div>
          </div>
        </div>

        <div className="sm:text-right shrink-0 mt-2 sm:mt-0 pl-11 sm:pl-0">
          {hasAmount && (
            <div className={`text-sm font-extrabold font-mono ${
              isScheduled ? 'text-[#38BDF8]' : 'text-[#F3F4F6]'
            }`}>
              {event.amount! < 0 ? '-' : ''}₹{Math.abs(event.amount!).toLocaleString('en-IN')}
            </div>
          )}
          <div className="text-[11px] text-[#9CA3AF] font-mono mt-0.5">
            {event.eventDate.slice(0, 10)}
          </div>
        </div>
      </div>
    </Card>
  );
};
