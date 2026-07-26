export interface PriceSnapshot {
  value: number;
  currency: string;
  source: string; // e.g. 'NSE', 'AMFI', 'NPS', 'USER_INPUT', 'MANUAL', 'CALCULATED'
  timestamp: string; // YYYY-MM-DD or ISO
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  stale?: boolean;
  adjusted?: boolean;
}
