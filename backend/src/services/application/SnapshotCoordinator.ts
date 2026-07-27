import { NetWorthSnapshot } from '../../engines/NetWorthTypes';
import { PerformanceSnapshot } from '../../engines/PerformanceTypes';
import { PortfolioAnalyticsSnapshot } from '../../engines/PortfolioAnalyticsTypes';
import { RiskSnapshot } from '../../engines/RiskTypes';

export interface SnapshotLineageEnvelope {
  masterSnapshotId: string;
  familyId: number;
  asOfDate: string;
  netWorthSnapshotId: string;
  performanceSnapshotId?: string;
  analyticsSnapshotId?: string;
  riskSnapshotId?: string;
  masterChecksum: string;
  createdAt: string;
}

export class SnapshotCoordinator {
  private static instance: SnapshotCoordinator;
  private memoryStore: Map<string, SnapshotLineageEnvelope> = new Map();

  public static getInstance(): SnapshotCoordinator {
    if (!SnapshotCoordinator.instance) {
      SnapshotCoordinator.instance = new SnapshotCoordinator();
    }
    return SnapshotCoordinator.instance;
  }

  public coordinateSnapshotLineage(
    familyId: number,
    asOfDate: string,
    netWorthSnapshot: NetWorthSnapshot,
    perfSnapshot?: PerformanceSnapshot,
    analyticsSnapshot?: PortfolioAnalyticsSnapshot,
    riskSnapshot?: RiskSnapshot
  ): SnapshotLineageEnvelope {
    const masterSnapshotId = `master_snap_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();

    const envelope: SnapshotLineageEnvelope = {
      masterSnapshotId,
      familyId,
      asOfDate,
      netWorthSnapshotId: netWorthSnapshot.snapshotId,
      performanceSnapshotId: perfSnapshot?.snapshotId,
      analyticsSnapshotId: analyticsSnapshot?.snapshotId,
      riskSnapshotId: riskSnapshot?.snapshotId,
      masterChecksum: netWorthSnapshot.manifest.checksum,
      createdAt
    };

    this.memoryStore.set(masterSnapshotId, envelope);
    return envelope;
  }

  public getSnapshotLineage(masterSnapshotId: string): SnapshotLineageEnvelope | undefined {
    return this.memoryStore.get(masterSnapshotId);
  }
}

export const snapshotCoordinator = SnapshotCoordinator.getInstance();
