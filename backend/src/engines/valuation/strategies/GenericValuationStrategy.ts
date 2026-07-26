import { IValuationStrategy } from '../IValuationStrategy';
import { ValuationContext } from '../ValuationContext';
import { ValuationResult } from '../ValuationResult';
import { CurrencyPrecision } from '../CurrencyPrecision';
import { valuationRegistry } from '../AssetTypeValuationRegistry';

export class GenericValuationStrategy implements IValuationStrategy {
  public readonly assetType: string;
  public readonly name = 'Generic Cost Basis & Market Valuation Strategy';
  public readonly valuationMethod = 'COST_BASIS_FALLBACK';

  constructor(assetType = 'OTHER') {
    this.assetType = assetType;
  }

  public value(context: ValuationContext): ValuationResult {
    const auditTrail: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const currency = context.currency || context.priceSnapshot?.currency || 'INR';
    const qty = CurrencyPrecision.roundUnits(context.quantity || 1);
    const costBasis = CurrencyPrecision.roundMoney(context.costBasis);

    auditTrail.push(`[GenericValuation] Valuating ${context.assetType} (Qty: ${qty}, CostBasis: ${costBasis}) as of ${context.valuationDate}`);

    const unitPrice = context.priceSnapshot?.value || (qty > 0 && costBasis > 0 ? costBasis / qty : 1);
    const priceDate = context.priceSnapshot?.timestamp || context.valuationDate;
    const priceSource = context.priceSnapshot?.source || 'MANUAL';

    if (!context.priceSnapshot) {
      warnings.push(`No market price provider found for ${context.assetType}; using cost basis / manual input fallback`);
    }

    const marketValue = context.priceSnapshot ? CurrencyPrecision.roundMoney(qty * unitPrice) : costBasis;
    const unrealizedGain = CurrencyPrecision.roundMoney(marketValue - costBasis);
    const unrealizedGainPercent = costBasis > 0 ? CurrencyPrecision.roundPercent((unrealizedGain / costBasis) * 100) : 0;

    auditTrail.push(`[GenericValuation] MarketValue: ${marketValue}, CostBasis: ${costBasis}, UnrealizedGain: ${unrealizedGain} (${unrealizedGainPercent}%)`);

    return {
      success: errors.length === 0,
      assetId: context.assetId,
      assetType: context.assetType,
      quantity: qty,
      unitPrice,
      priceDate,
      valuationDate: context.valuationDate,
      marketValue,
      costBasis,
      unrealizedGain,
      unrealizedGainPercent,
      currency,
      valuationMethod: this.valuationMethod,
      dataQuality: context.priceSnapshot ? 'MEDIUM' : 'LOW',
      priceSource,
      warnings,
      errors,
      auditTrail,
      engineVersion: '1.0.0'
    };
  }
}

export const genericValuationStrategy = new GenericValuationStrategy('OTHER');
valuationRegistry.register(genericValuationStrategy);
valuationRegistry.register(new GenericValuationStrategy('BANK'));
