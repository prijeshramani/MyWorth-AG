import { IValuationStrategy } from '../IValuationStrategy';
import { ValuationContext } from '../ValuationContext';
import { ValuationResult } from '../ValuationResult';
import { CurrencyPrecision } from '../CurrencyPrecision';
import { marketCalendar } from '../MarketCalendar';
import { valuationRegistry } from '../AssetTypeValuationRegistry';

export class EquityValuationStrategy implements IValuationStrategy {
  public readonly assetType = 'STOCK';
  public readonly name = 'Equity Market Closing Price Strategy';
  public readonly valuationMethod = 'MARKET_CLOSING_PRICE';

  public value(context: ValuationContext): ValuationResult {
    const auditTrail: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const currency = context.currency || context.priceSnapshot?.currency || 'INR';
    const qty = CurrencyPrecision.roundUnits(context.quantity);
    const costBasis = CurrencyPrecision.roundMoney(context.costBasis);

    auditTrail.push(`[EquityValuation] Valuating ${qty} units of STOCK as of ${context.valuationDate}`);

    if (qty <= 0) {
      warnings.push(`Quantity is ${qty}; market valuation is 0`);
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
        priceSource: context.priceSnapshot?.source || 'USER_INPUT',
        warnings,
        errors,
        auditTrail,
        engineVersion: '1.0.0'
      };
    }

    const price = context.priceSnapshot?.value || 0;
    const priceDate = context.priceSnapshot?.timestamp || context.valuationDate;
    const priceSource = context.priceSnapshot?.source || 'USER_INPUT';

    if (price <= 0) {
      warnings.push(`No active market closing price available for STOCK ${context.assetId || ''}`);
    }

    let dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'STALE' = 'HIGH';
    if (marketCalendar.isStalePrice(priceDate, context.valuationDate, 5)) {
      dataQuality = 'STALE';
      warnings.push(`Price date ${priceDate} is stale relative to valuation date ${context.valuationDate}`);
    }

    const marketValue = CurrencyPrecision.roundMoney(qty * price);
    const unrealizedGain = CurrencyPrecision.roundMoney(marketValue - costBasis);
    const unrealizedGainPercent = costBasis > 0 ? CurrencyPrecision.roundPercent((unrealizedGain / costBasis) * 100) : 0;

    auditTrail.push(`[EquityValuation] Qty: ${qty}, Price: ${price} (${priceSource}), MarketValue: ${marketValue}, CostBasis: ${costBasis}, UnrealizedGain: ${unrealizedGain} (${unrealizedGainPercent}%)`);

    return {
      success: errors.length === 0,
      assetId: context.assetId,
      assetType: this.assetType,
      quantity: qty,
      unitPrice: price,
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

export const equityValuationStrategy = new EquityValuationStrategy();
valuationRegistry.register(equityValuationStrategy);
