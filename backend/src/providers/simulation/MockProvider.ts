import { IMarketDataProvider, ProviderCapabilities, ProviderRequestContext, ProviderHealthStatus, ProviderMetrics } from '../IMarketDataProvider';
import { PriceSnapshot } from '../../engines/valuation/PriceSnapshot';
import { ProviderHealthService } from '../resilience/ProviderHealthService';

export class MockProvider implements IMarketDataProvider {
  public readonly id = 'MOCK_PROVIDER';
  public readonly name = 'Deterministic Mock Provider';
  public readonly supportedExchanges = ['NSE', 'BSE', 'NASDAQ', 'NYSE'];

  public readonly capabilities: ProviderCapabilities = {
    supportedAssetTypes: ['STOCK', 'MUTUAL_FUND', 'ETF', 'BOND', 'GOLD', 'CRYPTO'],
    supportsHistoricalData: true,
    supportsIntraday: true,
    supportsCorporateActions: true,
    supportsFX: true,
    rateLimitPerMinute: 10000
  };

  private healthService: ProviderHealthService;
  private shouldFail: boolean;

  constructor(shouldFail = false) {
    this.healthService = new ProviderHealthService(this.id);
    this.shouldFail = shouldFail;
  }

  public setFailState(fail: boolean): void {
    this.shouldFail = fail;
  }

  public async fetchLatestPrice(
    rawSymbol: string,
    exchange = 'NSE',
    reqContext?: ProviderRequestContext
  ): Promise<PriceSnapshot | null> {
    const startTime = Date.now();

    if (this.shouldFail) {
      const err = new Error('MockProvider forced failure simulation');
      this.healthService.recordError(err, Date.now() - startTime);
      throw err;
    }

    const isUS = exchange === 'NASDAQ' || exchange === 'NYSE';
    const currency = reqContext?.preferredCurrency || (isUS ? 'USD' : 'INR');
    
    // Deterministic price hash generated from symbol characters
    let charSum = 0;
    for (let i = 0; i < rawSymbol.length; i++) charSum += rawSymbol.charCodeAt(i);
    const mockPrice = Math.round((charSum * 12.34) * 100) / 100;

    const snapshot: PriceSnapshot = Object.freeze({
      value: mockPrice,
      currency,
      source: this.id,
      timestamp: reqContext?.requestTimestamp || new Date().toISOString().split('T')[0],
      confidence: 'HIGH',
      stale: false,
      adjusted: true
    });

    this.healthService.recordSuccess(Date.now() - startTime);
    return snapshot;
  }

  public async fetchHistoricalPrices(
    rawSymbol: string,
    startDate: string,
    endDate: string,
    exchange = 'NSE',
    reqContext?: ProviderRequestContext
  ): Promise<PriceSnapshot[]> {
    const latest = await this.fetchLatestPrice(rawSymbol, exchange, reqContext);
    if (!latest) return [];
    return [
      Object.freeze({ ...latest, timestamp: startDate, value: latest.value * 0.95 }),
      Object.freeze({ ...latest, timestamp: endDate })
    ];
  }

  public getHealth(): ProviderHealthStatus {
    return this.healthService.getHealth();
  }

  public getMetrics(): ProviderMetrics {
    return this.healthService.getMetrics();
  }
}

export const mockProvider = new MockProvider();
