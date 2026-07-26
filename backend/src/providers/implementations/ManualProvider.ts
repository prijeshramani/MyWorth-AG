import { IMarketDataProvider, ProviderCapabilities, ProviderRequestContext, ProviderHealthStatus, ProviderMetrics } from '../IMarketDataProvider';
import { PriceSnapshot } from '../../engines/valuation/PriceSnapshot';
import { ProviderHealthService } from '../resilience/ProviderHealthService';

export class ManualProvider implements IMarketDataProvider {
  public readonly id = 'MANUAL';
  public readonly name = 'Manual Override Market Provider';
  public readonly supportedExchanges = ['NSE', 'BSE', 'NASDAQ', 'NYSE', 'UNLISTED'];

  public readonly capabilities: ProviderCapabilities = {
    supportedAssetTypes: [
      'STOCK', 'MUTUAL_FUND', 'ETF', 'GOLD', 'BOND', 'FD', 'EPF', 'PPF', 'NPS', 'SSA', 'BANK', 'REAL_ESTATE', 'CRYPTO', 'OTHER'
    ],
    supportsHistoricalData: true,
    supportsIntraday: false,
    supportsCorporateActions: false,
    supportsFX: false,
    rateLimitPerMinute: 10000
  };

  private healthService: ProviderHealthService;
  private manualPriceStore: Map<string, number> = new Map();

  constructor() {
    this.healthService = new ProviderHealthService(this.id);
  }

  public setManualPrice(symbol: string, price: number): void {
    this.manualPriceStore.set(symbol.toUpperCase(), price);
  }

  public async fetchLatestPrice(
    rawSymbol: string,
    _exchange = 'UNLISTED',
    reqContext?: ProviderRequestContext
  ): Promise<PriceSnapshot | null> {
    const startTime = Date.now();
    const symbolUpper = rawSymbol.toUpperCase();
    const storedPrice = this.manualPriceStore.get(symbolUpper) || 100.0;
    const currency = reqContext?.preferredCurrency || 'INR';

    const snapshot: PriceSnapshot = Object.freeze({
      value: storedPrice,
      currency,
      source: this.id,
      timestamp: reqContext?.requestTimestamp || new Date().toISOString().split('T')[0],
      confidence: 'MEDIUM',
      stale: false,
      adjusted: false
    });

    this.healthService.recordSuccess(Date.now() - startTime);
    return snapshot;
  }

  public async fetchHistoricalPrices(
    rawSymbol: string,
    startDate: string,
    endDate: string,
    exchange = 'UNLISTED',
    reqContext?: ProviderRequestContext
  ): Promise<PriceSnapshot[]> {
    const latest = await this.fetchLatestPrice(rawSymbol, exchange, reqContext);
    if (!latest) return [];
    return [
      Object.freeze({ ...latest, timestamp: startDate }),
      Object.freeze({ ...latest, timestamp: endDate })
    ];
  }

  public getHealth(): ProviderHealthStatus {
    return 'ONLINE';
  }

  public getMetrics(): ProviderMetrics {
    return this.healthService.getMetrics();
  }
}

export const manualProvider = new ManualProvider();
