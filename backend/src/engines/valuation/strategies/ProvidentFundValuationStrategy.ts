import { IValuationStrategy } from '../IValuationStrategy';
import { ValuationContext } from '../ValuationContext';
import { ValuationResult } from '../ValuationResult';
import { CurrencyPrecision } from '../CurrencyPrecision';
import { valuationRegistry } from '../AssetTypeValuationRegistry';

function calculateElapsedYears(startDateStr: string, endDateStr: string): number {
  const sDate = new Date(startDateStr);
  const eDate = new Date(endDateStr);
  if (isNaN(sDate.getTime()) || isNaN(eDate.getTime()) || eDate <= sDate) return 0;

  const diffYears = eDate.getFullYear() - sDate.getFullYear();
  const diffMonths = eDate.getMonth() - sDate.getMonth();
  const diffDays = eDate.getDate() - sDate.getDate();
  return Math.max(0, diffYears + (diffMonths / 12) + (diffDays / 365));
}

export class ProvidentFundValuationStrategy implements IValuationStrategy {
  public readonly assetType: string;
  public readonly name = 'Provident Fund (EPF/PPF/SSA) Interest Accumulation Strategy';
  public readonly valuationMethod = 'ANNUAL_INTEREST_ACCUMULATION';

  constructor(assetType = 'EPF') {
    this.assetType = assetType;
  }

  public value(context: ValuationContext): ValuationResult {
    const auditTrail: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const currency = context.currency || context.priceSnapshot?.currency || 'INR';
    const costBasis = CurrencyPrecision.roundMoney(context.costBasis || context.priceSnapshot?.value || 0);

    auditTrail.push(`[ProvidentFundValuation] Valuating ${context.assetType} (CostBasis: ${costBasis}) as of ${context.valuationDate}`);

    if (costBasis <= 0) {
      warnings.push(`Provident fund balance is ${costBasis}; valuation is 0`);
      return {
        success: true,
        assetId: context.assetId,
        assetType: context.assetType,
        quantity: 1,
        unitPrice: 0,
        priceDate: context.valuationDate,
        valuationDate: context.valuationDate,
        marketValue: 0,
        costBasis: 0,
        unrealizedGain: 0,
        unrealizedGainPercent: 0,
        currency,
        valuationMethod: this.valuationMethod,
        dataQuality: 'HIGH',
        priceSource: 'CALCULATED',
        warnings,
        errors,
        auditTrail,
        engineVersion: '1.0.0'
      };
    }

    const interestRate = context.metadata?.interestRate || context.options?.interestRate || 8.25; // Default 8.25% EPF rate
    const startDateStr = context.metadata?.startDate || context.priceSnapshot?.timestamp || context.valuationDate;

    let accruedMarketValue = costBasis;

    if (interestRate > 0 && startDateStr && startDateStr !== context.valuationDate) {
      const elapsedYears = calculateElapsedYears(startDateStr, context.valuationDate);
      if (elapsedYears > 0) {
        const r = interestRate / 100;
        // Simple annual compounding formula for PF accumulation: A = P * (1 + r)^t
        accruedMarketValue = costBasis * Math.pow(1 + r, elapsedYears);
        auditTrail.push(`[ProvidentFundValuation] Rate: ${interestRate}%, ElapsedYears: ${elapsedYears.toFixed(4)}, Principal: ${costBasis}, AccruedValue: ${accruedMarketValue.toFixed(2)}`);
      }
    }

    const marketValue = CurrencyPrecision.roundMoney(accruedMarketValue);
    const unrealizedGain = CurrencyPrecision.roundMoney(marketValue - costBasis);
    const unrealizedGainPercent = costBasis > 0 ? CurrencyPrecision.roundPercent((unrealizedGain / costBasis) * 100) : 0;

    return {
      success: errors.length === 0,
      assetId: context.assetId,
      assetType: context.assetType,
      quantity: 1,
      unitPrice: marketValue,
      priceDate: context.valuationDate,
      valuationDate: context.valuationDate,
      marketValue,
      costBasis,
      unrealizedGain,
      unrealizedGainPercent,
      currency,
      valuationMethod: this.valuationMethod,
      dataQuality: 'HIGH',
      priceSource: 'CALCULATED',
      warnings,
      errors,
      auditTrail,
      engineVersion: '1.0.0'
    };
  }
}

export const providentFundValuationStrategy = new ProvidentFundValuationStrategy('EPF');
valuationRegistry.register(providentFundValuationStrategy);
valuationRegistry.register(new ProvidentFundValuationStrategy('PPF'));
valuationRegistry.register(new ProvidentFundValuationStrategy('SSA'));
