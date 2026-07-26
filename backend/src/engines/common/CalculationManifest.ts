import * as crypto from 'crypto';

export interface CalculationManifest {
  engine: string;
  engineVersion: string;
  businessRuleVersion: string;
  algorithmVersion: string;
  calculationVersion: string;
  valuationSnapshotId?: string;
  fxSnapshotId?: string;
  executionTimeMs: number;
  processedHoldings: number;
  processedValuations: number;
  warningCount: number;
  checksum: string;
}

export class CalculationManifestHelper {
  public static createManifest(params: {
    engine: string;
    engineVersion: string;
    businessRuleVersion: string;
    algorithmVersion?: string;
    calculationVersion?: string;
    valuationSnapshotId?: string;
    fxSnapshotId?: string;
    executionTimeMs: number;
    processedHoldings: number;
    processedValuations: number;
    warningCount: number;
    payloadToHash: any;
  }): CalculationManifest {
    const jsonStr = JSON.stringify(params.payloadToHash);
    const checksum = crypto.createHash('sha256').update(jsonStr).digest('hex');

    return {
      engine: params.engine,
      engineVersion: params.engineVersion,
      businessRuleVersion: params.businessRuleVersion,
      algorithmVersion: params.algorithmVersion || 'ALGO_V1_LINEAR',
      calculationVersion: params.calculationVersion || 'CALC_V1',
      valuationSnapshotId: params.valuationSnapshotId,
      fxSnapshotId: params.fxSnapshotId,
      executionTimeMs: params.executionTimeMs,
      processedHoldings: params.processedHoldings,
      processedValuations: params.processedValuations,
      warningCount: params.warningCount,
      checksum
    };
  }
}
