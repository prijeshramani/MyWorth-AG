export interface DomainEvent {
  eventId: string;
  eventType: 'UserLoggedIn' | 'UserLoggedOut' | 'PolicyUpdated' | 'InvestmentUpdated' | 'FamilyMemberAdded' | 'DocumentUploaded';
  familyId: number;
  aggregateId: string;
  payload: Record<string, any>;
  occurredAt: string;
}
