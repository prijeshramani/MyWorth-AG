export interface CapitalGainTransactionInput {
  assetType: 'EQUITY' | 'MUTUAL_FUND' | 'DEBT' | 'GOLD' | 'PROPERTY';
  buyDate: string;
  sellDate: string;
  buyAmount: number;
  sellAmount: number;
}

export interface CapitalGainResult {
  assetType: string;
  gainType: 'STCG' | 'LTCG';
  holdingPeriodMonths: number;
  realizedGain: number;
  taxableGain: number;
  taxRatePercent: number;
  estimatedTaxPayable: number;
}

export class CapitalGainTaxEngine {
  public static calculateCapitalGain(input: CapitalGainTransactionInput): CapitalGainResult {
    const buyTime = new Date(input.buyDate).getTime();
    const sellTime = new Date(input.sellDate).getTime();
    const holdingPeriodMonths = Math.round((sellTime - buyTime) / (1000 * 60 * 60 * 24 * 30.44));

    const realizedGain = input.sellAmount - input.buyAmount;

    let isLtcg = false;
    let taxRatePercent = 20;

    if (input.assetType === 'EQUITY' || input.assetType === 'MUTUAL_FUND') {
      isLtcg = holdingPeriodMonths >= 12;
      taxRatePercent = isLtcg ? 12.5 : 20;
    } else if (input.assetType === 'PROPERTY' || input.assetType === 'GOLD') {
      isLtcg = holdingPeriodMonths >= 24;
      taxRatePercent = isLtcg ? 12.5 : 20;
    } else {
      isLtcg = holdingPeriodMonths >= 36;
      taxRatePercent = 20;
    }

    const gainType: 'STCG' | 'LTCG' = isLtcg ? 'LTCG' : 'STCG';
    let taxableGain = Math.max(0, realizedGain);

    if (isLtcg && (input.assetType === 'EQUITY' || input.assetType === 'MUTUAL_FUND')) {
      taxableGain = Math.max(0, realizedGain - 125000); // ₹1.25 Lakh exemption limit
    }

    const estimatedTaxPayable = Math.round(taxableGain * (taxRatePercent / 100));

    return {
      assetType: input.assetType,
      gainType,
      holdingPeriodMonths,
      realizedGain,
      taxableGain,
      taxRatePercent,
      estimatedTaxPayable
    };
  }
}
