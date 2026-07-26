import { ProviderMetrics, ProviderHealthStatus } from '../IMarketDataProvider';
import { CircuitBreaker } from './CircuitBreaker';

export class ProviderHealthService {
  private providerId: string;
  private totalRequests = 0;
  private successCount = 0;
  private errorCount = 0;
  private totalLatencyMs = 0;
  private lastSuccessfulSync?: string;
  private lastFailure?: string;
  private circuitBreaker: CircuitBreaker;

  constructor(providerId: string, circuitBreaker?: CircuitBreaker) {
    this.providerId = providerId;
    this.circuitBreaker = circuitBreaker || new CircuitBreaker();
  }

  public recordSuccess(latencyMs: number): void {
    this.totalRequests++;
    this.successCount++;
    this.totalLatencyMs += latencyMs;
    this.lastSuccessfulSync = new Date().toISOString();
    this.circuitBreaker.onSuccess();
  }

  public recordError(error: Error, latencyMs = 0): void {
    this.totalRequests++;
    this.errorCount++;
    this.totalLatencyMs += latencyMs;
    this.lastFailure = `${new Date().toISOString()} - ${error.message}`;
    this.circuitBreaker.onFailure();
  }

  public getCircuitBreaker(): CircuitBreaker {
    return this.circuitBreaker;
  }

  public getHealth(): ProviderHealthStatus {
    const circuitState = this.circuitBreaker.getState();
    if (circuitState === 'OPEN') return 'OFFLINE';
    if (circuitState === 'HALF_OPEN') return 'DEGRADED';
    
    if (this.totalRequests > 5) {
      const errorRatio = this.errorCount / this.totalRequests;
      if (errorRatio > 0.3) return 'DEGRADED';
    }
    return 'ONLINE';
  }

  public getMetrics(): ProviderMetrics {
    const avgLatency = this.totalRequests > 0 ? Math.round(this.totalLatencyMs / this.totalRequests) : 0;
    const successRate = this.totalRequests > 0 ? Math.round((this.successCount / this.totalRequests) * 10000) / 100 : 100;

    return {
      totalRequests: this.totalRequests,
      successCount: this.successCount,
      errorCount: this.errorCount,
      successRate,
      averageLatencyMs: avgLatency,
      lastSuccessfulSync: this.lastSuccessfulSync,
      lastFailure: this.lastFailure
    };
  }

  public reset(): void {
    this.totalRequests = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.totalLatencyMs = 0;
    this.lastSuccessfulSync = undefined;
    this.lastFailure = undefined;
    this.circuitBreaker.reset();
  }
}
