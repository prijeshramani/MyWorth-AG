import { PriceSnapshot } from '../engines/valuation/PriceSnapshot';

export interface ProviderCapabilities {
  supportedAssetTypes: string[];
  supportsHistoricalData: boolean;
  supportsIntraday: boolean;
  supportsCorporateActions: boolean;
  supportsFX: boolean;
  rateLimitPerMinute: number;
}

export interface ProviderRequestContext {
  correlationId?: string;
  requestTimestamp?: string;
  timeoutMs?: number;
  preferredCurrency?: string;
  retryAttempt?: number;
}

export interface ProviderMetrics {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  successRate: number; // percentage e.g. 98.5
  averageLatencyMs: number;
  lastSuccessfulSync?: string;
  lastFailure?: string;
}

export type ProviderHealthStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE';

export interface IMarketDataProvider {
  readonly id: string;
  readonly name: string;
  readonly supportedExchanges: string[];
  readonly capabilities: ProviderCapabilities;

  fetchLatestPrice(
    querySymbol: string,
    exchange?: string,
    reqContext?: ProviderRequestContext
  ): Promise<PriceSnapshot | null>;

  fetchHistoricalPrices(
    querySymbol: string,
    startDate: string,
    endDate: string,
    exchange?: string,
    reqContext?: ProviderRequestContext
  ): Promise<PriceSnapshot[]>;

  getHealth(): ProviderHealthStatus;
  getMetrics(): ProviderMetrics;
}
