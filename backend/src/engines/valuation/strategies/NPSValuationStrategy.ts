import { IValuationStrategy } from '../IValuationStrategy';
import { ValuationContext } from '../ValuationContext';
import { ValuationResult } from '../ValuationResult';
import { CurrencyPrecision } from '../CurrencyPrecision';
import { marketCalendar } from '../MarketCalendar';
import { valuationRegistry } from '../AssetTypeValuationRegistry';

export class NPSValuationStrategy implements IValuationStrategy {
  public readonly assetType = 'NPS';
  public readonly name = 'NPS Tier NAV Strategy';
  public readonly valuationMethod = 'NPS_TIER_NAV';

  public value(context: ValuationContext): ValuationResult {
    const auditTrail: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const currency = context.currency || context.priceSnapshot?.currency || 'INR';
    const qty = CurrencyPrecision.roundUnits(context.quantity);
    const costBasis = CurrencyPrecision.roundMoney(context.costBasis);

    auditTrail.push(`[NPSValuation] Valuating ${qty} units of NPS as of ${context.valuationDate}`);

    if (qty <= 0) {
      warnings.push(`Quantity is ${qty}; NPS valuation is 0`);
      return {
        success: true,
        assetId: context.assetId,
        assetType: this.assetType,
        quantity: qty,
        unitPrice: 0,
        priceDate: context.valuationDate,
        valuationDate: context.valuationDate,
        marketValue: 0,
        costBasis,
        unrealizedGain: CurrencyPrecision.roundMoney(0 - costBasis),
        unrealizedGainPercent: costBasis > 0 ? -100 : 0,
        currency,
        valuationMethod: this.valuationMethod,
        dataQuality: 'HIGH',
        priceSource: context.priceSnapshot?.source || 'CRA_NPS',
        warnings,
        errors,
        auditTrail,
        engineVersion: '1.0.0'
      };
    }

    const nav = context.priceSnapshot?.value || 0;
    const priceDate = context.priceSnapshot?.timestamp || context.valuationDate;
    const priceSource = context.priceSnapshot?.source || 'CRA_NPS';

    if (nav <= 0) {
      warnings.push(`No active NAV available for NPS ${context.assetId || ''}`);
    }

    let dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'STALE' = 'HIGH';
    if (marketCalendar.isStalePrice(priceDate, context.valuationDate, 5)) {
      dataQuality = 'STALE';
      warnings.push(`NPS NAV date ${priceDate} is stale relative to valuation date ${context.valuationDate}`);
    }

    const marketValue = CurrencyPrecision.roundMoney(qty * nav);
    const unrealizedGain = CurrencyPrecision.roundMoney(marketValue - costBasis);
    const unrealizedGainPercent = costBasis > 0 ? CurrencyPrecision.roundPercent((unrealizedGain / costBasis) * 100) : 0;

    auditTrail.push(`[NPSValuation] Qty: ${qty}, NAV: ${nav} (${priceSource}), MarketValue: ${marketValue}, CostBasis: ${costBasis}, UnrealizedGain: ${unrealizedGain} (${unrealizedGainPercent}%)`);

    return {
      success: errors.length === 0,
      assetId: context.assetId,
      assetType: this.assetType,
      quantity: qty,
      unitPrice: nav,
      priceDate,
      valuationDate: context.valuationDate,
      marketValue,
      costBasis,
      unrealizedGain,
      unrealizedGainPercent,
      currency,
      valuationMethod: this.valuationMethod,
      dataQuality,
      priceSource,
      warnings,
      errors,
      auditTrail,
      engineVersion: '1.0.0'
    };
  }
}

export const npsValuationStrategy = new NPSValuationStrategy();
valuationRegistry.register(npsValuationStrategy);
