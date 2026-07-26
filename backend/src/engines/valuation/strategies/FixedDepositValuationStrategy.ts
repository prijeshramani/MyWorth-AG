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

export class FixedDepositValuationStrategy implements IValuationStrategy {
  public readonly assetType = 'FD';
  public readonly name = 'Fixed Deposit Compounding Interest Strategy';
  public readonly valuationMethod = 'COMPOUND_INTEREST_MATURITY';

  public value(context: ValuationContext): ValuationResult {
    const auditTrail: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const currency = context.currency || context.priceSnapshot?.currency || 'INR';
    const costBasis = CurrencyPrecision.roundMoney(context.costBasis || context.priceSnapshot?.value || 0);

    auditTrail.push(`[FixedDepositValuation] Valuating FD (CostBasis: ${costBasis}) as of ${context.valuationDate}`);

    if (costBasis <= 0) {
      warnings.push(`Fixed Deposit principal cost basis is ${costBasis}; valuation is 0`);
      return {
        success: true,
        assetId: context.assetId,
        assetType: this.assetType,
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

    const interestRate = context.metadata?.interestRate || context.options?.interestRate || 0; // percentage e.g. 7.25
    const compFreqStr = (context.metadata?.compoundingFrequency || context.options?.compoundingFrequency || 'QUARTERLY').toUpperCase();
    const startDateStr = context.metadata?.startDate || context.priceSnapshot?.timestamp || context.valuationDate;

    let n = 4; // QUARTERLY default
    if (compFreqStr === 'MONTHLY') n = 12;
    else if (compFreqStr === 'HALF_YEARLY') n = 2;
    else if (compFreqStr === 'ANNUAL') n = 1;

    let accruedMarketValue = costBasis;

    if (interestRate > 0 && startDateStr && startDateStr !== context.valuationDate) {
      const elapsedYears = calculateElapsedYears(startDateStr, context.valuationDate);
      if (elapsedYears > 0) {
        const r = interestRate / 100;
        // Compound interest formula: A = P * (1 + r/n)^(n * t)
        accruedMarketValue = costBasis * Math.pow(1 + r / n, n * elapsedYears);
        auditTrail.push(`[FixedDepositValuation] Rate: ${interestRate}%, Freq: ${compFreqStr} (n=${n}), ElapsedYears: ${elapsedYears.toFixed(4)}, Principal: ${costBasis}, AccruedValue: ${accruedMarketValue.toFixed(2)}`);
      } else {
        warnings.push(`Start date ${startDateStr} is invalid or in the future relative to ${context.valuationDate}`);
      }
    } else if (interestRate <= 0) {
      warnings.push(`Interest rate not specified in metadata for FD ${context.assetId || ''}; using principal value`);
    }

    const marketValue = CurrencyPrecision.roundMoney(accruedMarketValue);
    const unrealizedGain = CurrencyPrecision.roundMoney(marketValue - costBasis);
    const unrealizedGainPercent = costBasis > 0 ? CurrencyPrecision.roundPercent((unrealizedGain / costBasis) * 100) : 0;

    return {
      success: errors.length === 0,
      assetId: context.assetId,
      assetType: this.assetType,
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

export const fixedDepositValuationStrategy = new FixedDepositValuationStrategy();
valuationRegistry.register(fixedDepositValuationStrategy);
