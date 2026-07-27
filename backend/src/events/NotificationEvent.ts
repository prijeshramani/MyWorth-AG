export interface NotificationEvent {
  eventId: string;
  familyId: number;
  type: 'PREMIUM_DUE' | 'GOAL_REMINDER' | 'TAX_ALERT' | 'PORTFOLIO_DRIFT';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
