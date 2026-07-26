import { IValuationStrategy } from '../IValuationStrategy';
import { ValuationContext } from '../ValuationContext';
import { ValuationResult } from '../ValuationResult';
import { CurrencyPrecision } from '../CurrencyPrecision';
import { valuationRegistry } from '../AssetTypeValuationRegistry';

export class RealEstateValuationStrategy implements IValuationStrategy {
  public readonly assetType = 'REAL_ESTATE';
  public readonly name = 'Real Estate Property Appraisal Strategy';
  public readonly valuationMethod = 'PROPERTY_APPRAISAL_VALUATION';

  public value(context: ValuationContext): ValuationResult {
    const auditTrail: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const currency = context.currency || context.priceSnapshot?.currency || 'INR';
    const costBasis = CurrencyPrecision.roundMoney(context.costBasis || 0);

    auditTrail.push(`[RealEstateValuation] Valuating REAL_ESTATE (CostBasis: ${costBasis}) as of ${context.valuationDate}`);

    const areaSqFt = context.metadata?.areaSqFt || 0;
    const pricePerSqFt = context.metadata?.pricePerSqFt || context.priceSnapshot?.value || 0;
    const lastAppraisedValue = context.metadata?.lastAppraisedValue || context.priceSnapshot?.value || costBasis;

    let marketValue = costBasis;

    if (areaSqFt > 0 && pricePerSqFt > 0) {
      marketValue = CurrencyPrecision.roundMoney(areaSqFt * pricePerSqFt);
      auditTrail.push(`[RealEstateValuation] Area: ${areaSqFt} sqft @ ${pricePerSqFt}/sqft = ${marketValue}`);
    } else if (lastAppraisedValue > 0) {
      marketValue = CurrencyPrecision.roundMoney(lastAppraisedValue);
      auditTrail.push(`[RealEstateValuation] Using last appraised value: ${marketValue}`);
    } else {
      warnings.push(`No area/sqft price or appraisal data available for REAL_ESTATE ${context.assetId || ''}; falling back to cost basis`);
    }

    const unrealizedGain = CurrencyPrecision.roundMoney(marketValue - costBasis);
    const unrealizedGainPercent = costBasis > 0 ? CurrencyPrecision.roundPercent((unrealizedGain / costBasis) * 100) : 0;

    return {
      success: errors.length === 0,
      assetId: context.assetId,
      assetType: this.assetType,
      quantity: areaSqFt > 0 ? areaSqFt : 1,
      unitPrice: pricePerSqFt > 0 ? pricePerSqFt : marketValue,
      priceDate: context.priceSnapshot?.timestamp || context.valuationDate,
      valuationDate: context.valuationDate,
      marketValue,
      costBasis,
      unrealizedGain,
      unrealizedGainPercent,
      currency,
      valuationMethod: this.valuationMethod,
      dataQuality: 'HIGH',
      priceSource: context.priceSnapshot?.source || 'APPRAISAL',
      warnings,
      errors,
      auditTrail,
      engineVersion: '1.0.0'
    };
  }
}

export const realEstateValuationStrategy = new RealEstateValuationStrategy();
valuationRegistry.register(realEstateValuationStrategy);
