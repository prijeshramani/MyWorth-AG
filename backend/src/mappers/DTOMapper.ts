import { NetWorthSnapshot } from '../engines/NetWorthTypes';
import { PerformanceSnapshot } from '../engines/PerformanceTypes';
import { PortfolioAnalyticsSnapshot } from '../engines/PortfolioAnalyticsTypes';
import { RiskSnapshot } from '../engines/RiskTypes';
import { PortfolioSummaryResponseDTO, DashboardOverviewResponseDTO } from '../dto/PortfolioDTOs';

export class DTOMapper {
  public static formatCurrency(value: number, currency: string = 'INR'): string {
    const symbolMap: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£'
    };
    const symbol = symbolMap[currency] || `${currency} `;
    
    if (currency === 'INR') {
      const absVal = Math.abs(value);
      const isNegative = value < 0;
      const parts = absVal.toFixed(2).split('.');
      let integerPart = parts[0];
      const decimalPart = parts[1];

      if (integerPart.length > 3) {
        const lastThree = integerPart.substring(integerPart.length - 3);
        const otherNumbers = integerPart.substring(0, integerPart.length - 3);
        const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
        integerPart = `${formattedOther},${lastThree}`;
      }
      return `${isNegative ? '-' : ''}${symbol}${integerPart}.${decimalPart}`;
    }

    return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  public static toPortfolioSummaryResponseDTO(
    familyId: number,
    familyName: string,
    netWorthSnapshot: NetWorthSnapshot,
    perfSnapshot?: PerformanceSnapshot,
    analyticsSnapshot?: PortfolioAnalyticsSnapshot,
    riskSnapshot?: RiskSnapshot
  ): PortfolioSummaryResponseDTO {
    const currency = netWorthSnapshot.reportingCurrency;
    
    return {
      familyId,
      familyName,
      asOfDate: netWorthSnapshot.timeModel.valuationDate,
      reportingCurrency: currency,
      netWorth: {
        totalMarketValue: netWorthSnapshot.summary.totalMarketValue,
        totalCostBasis: netWorthSnapshot.summary.totalCostBasis,
        unrealizedGain: netWorthSnapshot.summary.totalUnrealizedGain,
        unrealizedGainPercent: netWorthSnapshot.summary.totalUnrealizedGainPercent,
        formattedTotalMarketValue: this.formatCurrency(netWorthSnapshot.summary.totalMarketValue, currency),
        formattedTotalCostBasis: this.formatCurrency(netWorthSnapshot.summary.totalCostBasis, currency),
        formattedUnrealizedGain: this.formatCurrency(netWorthSnapshot.summary.totalUnrealizedGain, currency)
      },
      performance: perfSnapshot ? {
        absoluteReturnPercent: perfSnapshot.summary.absoluteReturnPercent,
        cagrPercent: perfSnapshot.summary.cagrPercent,
        xirrPercent: perfSnapshot.summary.xirrPercent
      } : undefined,
      analytics: analyticsSnapshot ? {
        diversificationScore: analyticsSnapshot.health.diversification.score,
        healthRating: analyticsSnapshot.health.rating,
        topSector: analyticsSnapshot.allocations.sectorAllocation[0]?.key || 'N/A'
      } : undefined,
      risk: riskSnapshot ? {
        annualizedVolatilityPercent: riskSnapshot.summary.annualizedVolatilityPercent,
        maxDrawdownPercent: riskSnapshot.summary.maxDrawdownPercent,
        sharpeRatio: riskSnapshot.summary.sharpeRatio,
        sortinoRatio: riskSnapshot.summary.sortinoRatio,
        riskRating: riskSnapshot.summary.riskRating
      } : undefined,
      masterChecksum: netWorthSnapshot.manifest.checksum
    };
  }

  public static toDashboardOverviewResponseDTO(
    familyId: number,
    familyName: string,
    netWorthSnapshot: NetWorthSnapshot,
    analyticsSnapshot?: PortfolioAnalyticsSnapshot
  ): DashboardOverviewResponseDTO {
    const currency = netWorthSnapshot.reportingCurrency;

    const assetAllocation = (analyticsSnapshot?.allocations.assetAllocation || []).map(a => ({
      name: a.key.replace(/_/g, ' '),
      assetType: a.key,
      value: a.marketValue,
      percentage: a.percentageOfTotal,
      formattedValue: this.formatCurrency(a.marketValue, currency)
    }));

    const memberSummaries = (netWorthSnapshot.hierarchy.children || []).map(memberNode => ({
      memberId: memberNode.id,
      memberName: memberNode.name,
      formattedValue: this.formatCurrency(memberNode.marketValue, currency),
      percentageOfTotal: netWorthSnapshot.summary.totalMarketValue > 0 
        ? Number(((memberNode.marketValue / netWorthSnapshot.summary.totalMarketValue) * 100).toFixed(2))
        : 0
    }));

    const alerts: Array<{ id: string; type: 'WARNING' | 'INFO'; message: string }> = [];
    if (netWorthSnapshot.summary.totalUnrealizedGain < 0) {
      alerts.push({
        id: 'ALERT_UNREALIZED_LOSS',
        type: 'WARNING',
        message: `Portfolio has an unrealized loss of ${this.formatCurrency(netWorthSnapshot.summary.totalUnrealizedGain, currency)}`
      });
    }

    return {
      familyId,
      familyName,
      asOfDate: netWorthSnapshot.timeModel.valuationDate,
      reportingCurrency: currency,
      formattedTotalWealth: this.formatCurrency(netWorthSnapshot.summary.totalMarketValue, currency),
      totalMarketValue: netWorthSnapshot.summary.totalMarketValue,
      totalCostBasis: netWorthSnapshot.summary.totalCostBasis || 0,
      totalAssets: netWorthSnapshot.summary.totalMarketValue,
      totalLiabilities: 0,
      formattedTotalAssets: this.formatCurrency(netWorthSnapshot.summary.totalMarketValue, currency),
      formattedTotalLiabilities: this.formatCurrency(0, currency),
      monthlySavings: 0,
      formattedMonthlySavings: this.formatCurrency(0, currency),
      healthScore: netWorthSnapshot.summary.totalMarketValue > 0 ? 94 : 0,
      assetAllocation,
      memberSummaries,
      alerts
    };
  }
}
