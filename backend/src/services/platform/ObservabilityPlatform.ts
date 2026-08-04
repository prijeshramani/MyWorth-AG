export interface MetricSnapshot {
  timestamp: string;
  apiLatencyMs: number;
  aiLatencyMs: number;
  dbPerformanceMs: number;
  cacheHitPercent: number;
  contextBuildTimeMs: number;
  recommendationTimeMs: number;
  simulationTimeMs: number;
  backupTimeMs: number;
  importTimeMs: number;
  errorRatePercent: number;
}

export class ObservabilityPlatform {
  private snapshotsHistory: MetricSnapshot[] = [];

  constructor() {
    this.seedInitialHistory();
  }

  private seedInitialHistory(): void {
    const now = Date.now();
    // Generate 6 historical snapshots (10 min intervals)
    for (let i = 5; i >= 0; i--) {
      const ts = new Date(now - i * 10 * 60 * 1000).toISOString();
      this.snapshotsHistory.push({
        timestamp: ts,
        apiLatencyMs: 45 + Math.floor(Math.random() * 15),
        aiLatencyMs: 320 + Math.floor(Math.random() * 80),
        dbPerformanceMs: 4 + Math.floor(Math.random() * 3),
        cacheHitPercent: 94 + Math.floor(Math.random() * 5),
        contextBuildTimeMs: 110 + Math.floor(Math.random() * 30),
        recommendationTimeMs: 85 + Math.floor(Math.random() * 25),
        simulationTimeMs: 210 + Math.floor(Math.random() * 40),
        backupTimeMs: 450 + Math.floor(Math.random() * 100),
        importTimeMs: 650 + Math.floor(Math.random() * 150),
        errorRatePercent: 0.0
      });
    }
  }

  public recordMetricSnapshot(snapshot: Partial<MetricSnapshot>): MetricSnapshot {
    const latest = this.snapshotsHistory[this.snapshotsHistory.length - 1];
    const newSnapshot: MetricSnapshot = {
      timestamp: new Date().toISOString(),
      apiLatencyMs: snapshot.apiLatencyMs ?? latest.apiLatencyMs,
      aiLatencyMs: snapshot.aiLatencyMs ?? latest.aiLatencyMs,
      dbPerformanceMs: snapshot.dbPerformanceMs ?? latest.dbPerformanceMs,
      cacheHitPercent: snapshot.cacheHitPercent ?? latest.cacheHitPercent,
      contextBuildTimeMs: snapshot.contextBuildTimeMs ?? latest.contextBuildTimeMs,
      recommendationTimeMs: snapshot.recommendationTimeMs ?? latest.recommendationTimeMs,
      simulationTimeMs: snapshot.simulationTimeMs ?? latest.simulationTimeMs,
      backupTimeMs: snapshot.backupTimeMs ?? latest.backupTimeMs,
      importTimeMs: snapshot.importTimeMs ?? latest.importTimeMs,
      errorRatePercent: snapshot.errorRatePercent ?? latest.errorRatePercent
    };

    this.snapshotsHistory.push(newSnapshot);
    if (this.snapshotsHistory.length > 50) {
      this.snapshotsHistory.shift();
    }
    return newSnapshot;
  }

  public getLatestMetrics(): MetricSnapshot {
    return this.snapshotsHistory[this.snapshotsHistory.length - 1];
  }

  public getHistoricalTrends(): MetricSnapshot[] {
    return this.snapshotsHistory;
  }
}

export const observabilityPlatform = new ObservabilityPlatform();
