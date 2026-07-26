import { IValuationStrategy } from './IValuationStrategy';
import { ValuationContext } from './ValuationContext';
import { ValuationResult } from './ValuationResult';

export class AssetTypeValuationRegistry {
  private static instance: AssetTypeValuationRegistry;
  private strategies: Map<string, IValuationStrategy> = new Map();

  private constructor() {}

  public static getInstance(): AssetTypeValuationRegistry {
    if (!AssetTypeValuationRegistry.instance) {
      AssetTypeValuationRegistry.instance = new AssetTypeValuationRegistry();
    }
    return AssetTypeValuationRegistry.instance;
  }

  public register(strategy: IValuationStrategy): void {
    this.strategies.set(strategy.assetType.toUpperCase(), strategy);
  }

  public getStrategy(assetType: string): IValuationStrategy | undefined {
    return this.strategies.get(assetType.toUpperCase());
  }

  public hasStrategy(assetType: string): boolean {
    return this.strategies.has(assetType.toUpperCase());
  }

  public value(context: ValuationContext, fallbackStrategy?: IValuationStrategy): ValuationResult {
    const strategy = this.getStrategy(context.assetType) || fallbackStrategy;

    if (!strategy) {
      const currency = context.currency || context.priceSnapshot?.currency || 'INR';
      return {
        success: false,
        assetId: context.assetId,
        assetType: context.assetType,
        quantity: context.quantity,
        unitPrice: context.priceSnapshot?.value || 0,
        priceDate: context.priceSnapshot?.timestamp,
        valuationDate: context.valuationDate,
        marketValue: 0,
        costBasis: context.costBasis,
        unrealizedGain: 0,
        unrealizedGainPercent: 0,
        currency,
        valuationMethod: 'UNSUPPORTED_VALUATION_STRATEGY',
        dataQuality: 'LOW',
        priceSource: context.priceSnapshot?.source || 'NONE',
        warnings: [`No valuation strategy registered for asset type '${context.assetType}'`],
        errors: [`Unmapped asset valuation type '${context.assetType}'`],
        auditTrail: [`[Registry] ERROR: Strategy for '${context.assetType}' not found`],
        engineVersion: '1.0.0'
      };
    }

    return strategy.value(context);
  }

  public listRegisteredAssetTypes(): string[] {
    return Array.from(this.strategies.keys());
  }

  public clear(): void {
    this.strategies.clear();
  }
}

export const valuationRegistry = AssetTypeValuationRegistry.getInstance();
