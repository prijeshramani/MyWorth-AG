import { IValuationStrategy } from '../IValuationStrategy';
import { ValuationContext } from '../ValuationContext';
import { ValuationResult } from '../ValuationResult';
import { CurrencyPrecision } from '../CurrencyPrecision';
import { marketCalendar } from '../MarketCalendar';
import { valuationRegistry } from '../AssetTypeValuationRegistry';

export class BondValuationStrategy implements IValuationStrategy {
  public readonly assetType = 'BOND';
  public readonly name = 'Bond Market & Face Value Strategy';
  public readonly valuationMethod = 'BOND_MARKET_PRICE_ACCRUED_INTEREST';

  public value(context: ValuationContext): ValuationResult {
    const auditTrail: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const currency = context.currency || context.priceSnapshot?.currency || 'INR';
    const qty = CurrencyPrecision.roundUnits(context.quantity);
    const costBasis = CurrencyPrecision.roundMoney(context.costBasis);

    auditTrail.push(`[BondValuation] Valuating ${qty} units of BOND as of ${context.valuationDate}`);

    if (qty <= 0) {
      warnings.push(`Quantity is ${qty}; Bond valuation is 0`);
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
        priceSource: context.priceSnapshot?.source || 'BOND_EXCHANGE',
        warnings,
        errors,
        auditTrail,
        engineVersion: '1.0.0'
      };
    }

    const cleanPrice = context.priceSnapshot?.value || (costBasis > 0 ? costBasis / qty : 1000);
    const priceDate = context.priceSnapshot?.timestamp || context.valuationDate;
    const priceSource = context.priceSnapshot?.source || 'BOND_EXCHANGE';

    let dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'STALE' = 'HIGH';
    if (context.priceSnapshot && marketCalendar.isStalePrice(priceDate, context.valuationDate, 5)) {
      dataQuality = 'STALE';
      warnings.push(`Bond price date ${priceDate} is stale relative to valuation date ${context.valuationDate}`);
    }

    const marketValue = CurrencyPrecision.roundMoney(qty * cleanPrice);
    const unrealizedGain = CurrencyPrecision.roundMoney(marketValue - costBasis);
    const unrealizedGainPercent = costBasis > 0 ? CurrencyPrecision.roundPercent((unrealizedGain / costBasis) * 100) : 0;

    auditTrail.push(`[BondValuation] Qty: ${qty}, UnitPrice: ${cleanPrice} (${priceSource}), MarketValue: ${marketValue}, CostBasis: ${costBasis}, UnrealizedGain: ${unrealizedGain} (${unrealizedGainPercent}%)`);

    return {
      success: errors.length === 0,
      assetId: context.assetId,
      assetType: this.assetType,
      quantity: qty,
      unitPrice: cleanPrice,
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

export const bondValuationStrategy = new BondValuationStrategy();
valuationRegistry.register(bondValuationStrategy);
