import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageShell } from '../layout/PageShell';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { CardSkeleton } from '../ui/Skeleton';
import { familyTimelineService } from '../../services/familyTimelineService';
import { TimelineFilterBar } from './TimelineFilterBar';
import { TimelineEventCard } from './TimelineEventCard';
import { 
  History, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  Sparkles
} from 'lucide-react';
import type { TimelineDomain, TimelineImportance, TimelineEvent } from '../../types/familyOffice';

export const FamilyTimelineView: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<TimelineDomain | 'ALL'>('ALL');
  const [selectedImportance, setSelectedImportance] = useState<TimelineImportance | 'ALL'>('ALL');
  const [includeScheduled, setIncludeScheduled] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Read-only timeline query
  const { data: events, isLoading, error, refetch } = useQuery<TimelineEvent[]>({
    queryKey: ['familyTimeline', selectedDomain, selectedImportance, includeScheduled, search],
    queryFn: () => familyTimelineService.getTimeline({
      domain: selectedDomain === 'ALL' ? undefined : selectedDomain,
      importanceTier: selectedImportance === 'ALL' ? undefined : selectedImportance,
      includeScheduled,
      search: search.trim() ? search.trim() : undefined,
      limit: 50
    })
  });

  // Explicit sync mutation
  const syncMutation = useMutation({
    mutationFn: () => familyTimelineService.syncTimeline(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['familyTimeline'] });
      setSyncNotice({
        type: 'success',
        text: `Timeline synchronized. Reconciled ${res.reconciledCount} events across 7 domains.`
      });
      setTimeout(() => setSyncNotice(null), 4000);
    },
    onError: (err: any) => {
      setSyncNotice({
        type: 'error',
        text: err.response?.data?.error?.message || 'Timeline synchronization failed.'
      });
      setTimeout(() => setSyncNotice(null), 5000);
    }
  });

  return (
    <PageShell
      title="Family Timeline Ledger"
      subtitle="Unified chronological ledger across Portfolio, Protection, Tax, Estate, Goals, Life Events, and AI Decisions"
      actions={
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => refetch()}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh View
          </Button>
          <Button
            variant="primary"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Reconciling Ledger...' : 'Sync Ledger Projection'}
          </Button>
        </div>
      }
    >
      {/* Toast Notice */}
      {syncNotice && (
        <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center justify-between border ${
          syncNotice.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {syncNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{syncNotice.text}</span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <TimelineFilterBar
        search={search}
        onSearchChange={setSearch}
        selectedDomain={selectedDomain}
        onDomainSelect={setSelectedDomain}
        selectedImportance={selectedImportance}
        onImportanceSelect={setSelectedImportance}
        includeScheduled={includeScheduled}
        onToggleScheduled={setIncludeScheduled}
      />

      {/* Timeline Stream */}
      {(() => {
        const eventList = Array.isArray(events) ? events : ((events as any)?.events || []);

        if (isLoading) {
          return (
            <div className="space-y-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          );
        }

        if (error) {
          return (
            <Card variant="glass" className="p-8 text-center border-rose-500/30">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-[#F3F4F6]">Failed to Load Timeline Ledger</h4>
              <p className="text-xs text-[#9CA3AF] my-2">{(error as any)?.message || 'An error occurred.'}</p>
              <Button variant="primary" onClick={() => refetch()} className="text-xs mt-2">
                Retry Loading
              </Button>
            </Card>
          );
        }

        if (!eventList || eventList.length === 0) {
          return (
            <EmptyState
              icon={<History className="w-8 h-8 text-[#4F7FFF]" />}
              title="No Timeline Events Found"
              description="No financial activity, protection policies, tax filings, or goals match your active filters."
              actionLabel={search || selectedDomain !== 'ALL' || selectedImportance !== 'ALL' ? "Clear Filters" : "Sync Ledger Projection"}
              onAction={() => {
                if (search || selectedDomain !== 'ALL' || selectedImportance !== 'ALL') {
                  setSearch('');
                  setSelectedDomain('ALL');
                  setSelectedImportance('ALL');
                } else {
                  syncMutation.mutate();
                }
              }}
            />
          );
        }

        return (
          <div className="space-y-3 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#2B2E35] hidden sm:block sm:before:block">
            {eventList.map((event) => (
              <div key={event.eventId} className="relative sm:pl-10">
                <TimelineEventCard event={event} />
              </div>
            ))}
          </div>
        );
      })()}
    </PageShell>
  );
};
