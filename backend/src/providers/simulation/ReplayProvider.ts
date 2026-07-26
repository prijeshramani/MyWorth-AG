import { IMarketDataProvider, ProviderCapabilities, ProviderRequestContext, ProviderHealthStatus, ProviderMetrics } from '../IMarketDataProvider';
import { PriceSnapshot } from '../../engines/valuation/PriceSnapshot';
import { ProviderHealthService } from '../resilience/ProviderHealthService';

export type ReplayMode = 'REALTIME' | 'ACCELERATED' | 'STEP_BY_STEP';

export class ReplayProvider implements IMarketDataProvider {
  public readonly id = 'REPLAY_PROVIDER';
  public readonly name = 'Historical Price Series Replay Provider';
  public readonly supportedExchanges = ['NSE', 'BSE', 'NASDAQ', 'NYSE'];

  public readonly capabilities: ProviderCapabilities = {
    supportedAssetTypes: ['STOCK', 'MUTUAL_FUND', 'ETF', 'BOND', 'GOLD', 'CRYPTO'],
    supportsHistoricalData: true,
    supportsIntraday: false,
    supportsCorporateActions: true,
    supportsFX: true,
    rateLimitPerMinute: 10000
  };

  private healthService: ProviderHealthService;
  private priceSeries: Map<string, PriceSnapshot[]> = new Map();
  private currentStepIndex: Map<string, number> = new Map();
  private replayMode: ReplayMode = 'STEP_BY_STEP';

  constructor(replayMode: ReplayMode = 'STEP_BY_STEP') {
    this.healthService = new ProviderHealthService(this.id);
    this.replayMode = replayMode;
  }

  public setReplayMode(mode: ReplayMode): void {
    this.replayMode = mode;
  }

  public loadPriceSeries(symbol: string, series: PriceSnapshot[]): void {
    this.priceSeries.set(symbol.toUpperCase(), series);
    this.currentStepIndex.set(symbol.toUpperCase(), 0);
  }

  public async fetchLatestPrice(
    rawSymbol: string,
    _exchange = 'NSE',
    _reqContext?: ProviderRequestContext
  ): Promise<PriceSnapshot | null> {
    const startTime = Date.now();
    const symbolUpper = rawSymbol.toUpperCase();
    const series = this.priceSeries.get(symbolUpper);

    if (!series || series.length === 0) {
      const snapshot: PriceSnapshot = Object.freeze({
        value: 100.0,
        currency: 'INR',
        source: this.id,
        timestamp: new Date().toISOString().split('T')[0],
        confidence: 'MEDIUM',
        stale: false,
        adjusted: true
      });
      this.healthService.recordSuccess(Date.now() - startTime);
      return snapshot;
    }

    let currentIndex = this.currentStepIndex.get(symbolUpper) || 0;
    const snapshot = series[currentIndex % series.length];

    if (this.replayMode === 'STEP_BY_STEP') {
      this.currentStepIndex.set(symbolUpper, (currentIndex + 1) % series.length);
    }

    this.healthService.recordSuccess(Date.now() - startTime);
    return snapshot;
  }

  public async fetchHistoricalPrices(
    rawSymbol: string,
    _startDate: string,
    _endDate: string,
    _exchange = 'NSE',
    _reqContext?: ProviderRequestContext
  ): Promise<PriceSnapshot[]> {
    const symbolUpper = rawSymbol.toUpperCase();
    const series = this.priceSeries.get(symbolUpper);
    if (series && series.length > 0) {
      return series;
    }
    const latest = await this.fetchLatestPrice(rawSymbol);
    return latest ? [latest] : [];
  }

  public getHealth(): ProviderHealthStatus {
    return 'ONLINE';
  }

  public getMetrics(): ProviderMetrics {
    return this.healthService.getMetrics();
  }
}

export const replayProvider = new ReplayProvider();
