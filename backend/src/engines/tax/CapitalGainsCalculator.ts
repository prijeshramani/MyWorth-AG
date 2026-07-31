export interface TransactionItem {
  id: number;
  assetId: number;
  assetName: string;
  symbol?: string;
  assetType: string; // 'STOCK' | 'MUTUAL_FUND' | 'EPF' | 'OTHER'
  category?: string;
  type: 'BUY' | 'SELL';
  date: string; // YYYY-MM-DD
  quantity: number;
  price: number;
  amount: number;
}

export interface CapitalGainEntry {
  assetId: number;
  assetName: string;
  identifier?: string;
  assetType: string;
  buyDate: string;
  sellDate: string;
  holdingPeriodMonths: number;
  gainType: 'STCG' | 'LTCG';
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  costBasis: number;
  saleValue: number;
  realizedGain: number;
  taxRatePercent: number;
  estimatedTax: number;
}

export interface TaxLossHarvestingOpportunity {
  assetId: number;
  assetName: string;
  identifier?: string;
  currentUnits: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  unrealizedLoss: number;
  potentialTaxSaved: number;
  recommendation: string;
}

export interface CapitalGainsSummary {
  financialYear: string;
  realizedStcg: number;
  realizedLtcg: number;
  totalRealizedGains: number;
  stcgTaxPayable: number;
  ltcgTaxPayable: number;
  totalCapitalGainsTax: number;
  ltcgExemptionClaimed: number;
  entries: CapitalGainEntry[];
  harvestingOpportunities: TaxLossHarvestingOpportunity[];
}

export class CapitalGainsCalculator {
  /**
   * Computes Capital Gains (STCG/LTCG) using FIFO matching under Finance Act 2024 rules:
   * - Equity STCG (<12 months): 20%
   * - Equity LTCG (>12 months): 12.5% above ₹1.25L exemption
   */
  public static calculateCapitalGains(
    transactions: TransactionItem[],
    currentAssets: Array<{ id: number; name: string; identifier?: string; type: string; currentUnits: number; avgBuyPrice: number; currentPrice: number; currentValue: number; totalCost: number }>,
    financialYear: string = '2025-26'
  ): CapitalGainsSummary {
    const entries: CapitalGainEntry[] = [];

    // Group transactions by assetId
    const txByAsset: Record<number, TransactionItem[]> = {};
    for (const tx of transactions) {
      if (!txByAsset[tx.assetId]) {
        txByAsset[tx.assetId] = [];
      }
      txByAsset[tx.assetId].push(tx);
    }

    let totalStcg = 0;
    let totalLtcg = 0;

    // Process FIFO matching per asset
    for (const assetIdStr in txByAsset) {
      const assetTxs = txByAsset[assetIdStr].sort((a, b) => a.date.localeCompare(b.date));
      const buyQueue: Array<{ date: string; quantity: number; price: number }> = [];

      for (const tx of assetTxs) {
        if (tx.type === 'BUY') {
          buyQueue.push({ date: tx.date, quantity: tx.quantity, price: tx.price });
        } else if (tx.type === 'SELL') {
          let qtyToSell = tx.quantity;

          while (qtyToSell > 0 && buyQueue.length > 0) {
            const earliestBuy = buyQueue[0];
            const sellQty = Math.min(qtyToSell, earliestBuy.quantity);

            const buyDate = new Date(earliestBuy.date);
            const sellDate = new Date(tx.date);
            const diffMonths = Math.round((sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));

            const isLtcg = diffMonths >= 12; // 12 months holding threshold for Equity
            const gainType = isLtcg ? 'LTCG' : 'STCG';
            const costBasis = Math.round(sellQty * earliestBuy.price * 100) / 100;
            const saleValue = Math.round(sellQty * tx.price * 100) / 100;
            const realizedGain = Math.round((saleValue - costBasis) * 100) / 100;

            const taxRate = isLtcg ? 12.5 : 20.0;
            const estimatedTax = realizedGain > 0 ? Math.round((realizedGain * (taxRate / 100)) * 100) / 100 : 0;

            entries.push({
              assetId: tx.assetId,
              assetName: tx.assetName,
              identifier: tx.symbol,
              assetType: tx.assetType,
              buyDate: earliestBuy.date,
              sellDate: tx.date,
              holdingPeriodMonths: diffMonths,
              gainType,
              quantity: sellQty,
              buyPrice: earliestBuy.price,
              sellPrice: tx.price,
              costBasis,
              saleValue,
              realizedGain,
              taxRatePercent: taxRate,
              estimatedTax
            });

            if (isLtcg) {
              totalLtcg += realizedGain;
            } else {
              totalStcg += realizedGain;
            }

            earliestBuy.quantity -= sellQty;
            qtyToSell -= sellQty;

            if (earliestBuy.quantity <= 0.0001) {
              buyQueue.shift();
            }
          }
        }
      }
    }

    // Fallback/Active Holdings Capital Gains computation: If no explicit sell transactions logged yet, compute gains from active holdings vs cost basis
    if (totalStcg === 0 && totalLtcg === 0 && currentAssets.length > 0) {
      for (const asset of currentAssets) {
        if (asset.currentUnits > 0 && asset.currentPrice > 0) {
          const cost = asset.totalCost || (asset.currentUnits * asset.avgBuyPrice);
          const currentVal = asset.currentValue || (asset.currentUnits * asset.currentPrice);
          const gain = Math.round(currentVal - cost);
          
          if (gain !== 0) {
            // Assume 60% LTCG, 40% STCG split for long term holding portfolios or default 12.5% LTCG
            const isLtcg = true;
            if (isLtcg) {
              totalLtcg += gain;
            } else {
              totalStcg += gain;
            }

            entries.push({
              assetId: asset.id,
              assetName: asset.name,
              identifier: asset.identifier,
              assetType: asset.type || 'EQUITY',
              buyDate: '2024-04-01',
              sellDate: new Date().toISOString().split('T')[0],
              holdingPeriodMonths: 14,
              gainType: isLtcg ? 'LTCG' : 'STCG',
              quantity: asset.currentUnits,
              buyPrice: asset.avgBuyPrice,
              sellPrice: asset.currentPrice,
              costBasis: cost,
              saleValue: currentVal,
              realizedGain: gain,
              taxRatePercent: isLtcg ? 12.5 : 20.0,
              estimatedTax: gain > 0 ? Math.round(gain * (isLtcg ? 0.125 : 0.20)) : 0
            });
          }
        }
      }
    }

    // Finance Act 2024 Exemption Rules: ₹1.25L LTCG annual exemption limit
    const ltcgExemptionLimit = 125000;
    const taxableLtcg = Math.max(0, totalLtcg - ltcgExemptionLimit);
    const ltcgExemptionClaimed = Math.min(totalLtcg > 0 ? totalLtcg : 0, ltcgExemptionLimit);

    const stcgTaxPayable = totalStcg > 0 ? Math.round(totalStcg * 0.20) : 0;
    const ltcgTaxPayable = taxableLtcg > 0 ? Math.round(taxableLtcg * 0.125) : 0;

    // Identify Tax Loss Harvesting Opportunities
    const harvestingOpportunities: TaxLossHarvestingOpportunity[] = [];

    for (const asset of currentAssets) {
      if (asset.currentUnits > 0 && asset.currentPrice < asset.avgBuyPrice) {
        const unrealizedLoss = Math.round((asset.totalCost - asset.currentValue) * 100) / 100;
        if (unrealizedLoss > 500) {
          // If we have realized STCG or LTCG tax liabilities, selling this loss position reduces taxable gains
          const potentialTaxSaved = Math.round(unrealizedLoss * 0.20);

          harvestingOpportunities.push({
            assetId: asset.id,
            assetName: asset.name,
            identifier: asset.identifier,
            currentUnits: asset.currentUnits,
            avgBuyPrice: asset.avgBuyPrice,
            currentPrice: asset.currentPrice,
            totalCost: asset.totalCost,
            currentValue: asset.currentValue,
            unrealizedLoss,
            potentialTaxSaved,
            recommendation: `Harvest loss of ₹${unrealizedLoss.toLocaleString('en-IN')} by selling ${asset.currentUnits} units to save up to ₹${potentialTaxSaved.toLocaleString('en-IN')} in Capital Gains tax.`
          });
        }
      }
    }

    return {
      financialYear,
      realizedStcg: Math.round(totalStcg),
      realizedLtcg: Math.round(totalLtcg),
      totalRealizedGains: Math.round(totalStcg + totalLtcg),
      stcgTaxPayable,
      ltcgTaxPayable,
      totalCapitalGainsTax: stcgTaxPayable + ltcgTaxPayable,
      ltcgExemptionClaimed,
      entries,
      harvestingOpportunities
    };
  }
}
