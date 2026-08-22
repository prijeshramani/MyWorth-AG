import { familyRepository } from '../../repositories/SQLiteFamilyRepository';
import { familyMemberRepository } from '../../repositories/SQLiteFamilyMemberRepository';
import { DashboardOverviewResponseDTO } from '../../dto/PortfolioDTOs';
import { DTOMapper } from '../../mappers/DTOMapper';
import { db } from '../../db';
import { priceRepository } from '../../repositories/SQLitePriceRepository';
import { transactionRepository } from '../../repositories/SQLiteTransactionRepository';
import { calculateFixedDepositValuation, extractFdMetadata } from '../../utils/fdValuation';

export class DashboardApplicationService {
  private computeRealDatabaseNetWorth(familyId: number): {
    totalMarketValue: number;
    totalCostBasis: number;
    assetAllocation: any[];
    memberValues: Map<number, number>;
  } {
    let totalMarketValue = 0;
    let totalCostBasis = 0;
    const allocationMap = new Map<string, number>();
    const memberValues = new Map<number, number>();

    try {
      const assets = db.prepare(`
        SELECT DISTINCT a.* 
        FROM assets a 
        LEFT JOIN family_members fm ON a.family_member_id = fm.id
        WHERE (fm.family_id = ? OR a.family_member_id IS NULL)
      `).all(familyId) as any[];

      for (const asset of assets) {
        const transactions = transactionRepository.findByAssetId(asset.id);
        let currentUnits = 0;
        let totalCost = 0;
        let totalUnitsBought = 0;
        let bankEpfBalance = 0;

        if (asset.type === 'FIXED_DEPOSIT') {
          const latestPriceRow = priceRepository.findLatestPrice(asset.id);
          let txSum = 0;
          let firstTxDate = '';
          for (const tx of transactions) {
            if (tx.type === 'BUY' || tx.type === 'REINVEST') {
              txSum += tx.amount;
              if (!firstTxDate || tx.date < firstTxDate) firstTxDate = tx.date;
            } else if (tx.type === 'SELL') {
              txSum -= tx.amount;
            }
          }
          const meta = extractFdMetadata(asset, firstTxDate);
          const fdVal = calculateFixedDepositValuation({
            costBasis: txSum,
            interestRate: meta.interestRate,
            startDateStr: meta.startDate,
            compoundingFrequency: meta.compoundingFrequency
          });
          if (latestPriceRow && latestPriceRow.price !== txSum && latestPriceRow.price > 0) {
            bankEpfBalance = latestPriceRow.price;
          } else {
            bankEpfBalance = fdVal.marketValue > 0 ? fdVal.marketValue : txSum;
          }
          currentUnits = bankEpfBalance > 0 ? 1.0 : 0;
          totalCost = txSum > 0 ? txSum : bankEpfBalance;
        } else if (asset.type === 'BANK_ACCOUNT') {
          const latestPriceRow = priceRepository.findLatestPrice(asset.id);
          let txSum = 0;
          for (const tx of transactions) {
            if (tx.type === 'BUY' || tx.type === 'REINVEST') txSum += tx.amount;
            else if (tx.type === 'SELL') txSum -= tx.amount;
          }
          bankEpfBalance = latestPriceRow ? latestPriceRow.price : (txSum || Number(asset.current_value) || Number(asset.cost_basis) || 0);
          currentUnits = bankEpfBalance > 0 ? 1.0 : 0;
          totalCost = txSum > 0 ? txSum : bankEpfBalance;
        } else if (asset.type === 'EPF' || asset.type === 'SSY' || asset.type === 'PPF') {
          const latestPriceRow = priceRepository.findLatestPriceAbove(asset.id, 1.0);
          let txSum = 0;
          let lastTxDate = '';
          for (const tx of transactions) {
            if (tx.type === 'BUY' || tx.type === 'REINVEST' || tx.type === 'INTEREST') txSum += tx.amount;
            else if (tx.type === 'SELL') txSum -= tx.amount;
            if (tx.date > lastTxDate) lastTxDate = tx.date;
          }
          if (latestPriceRow && (!lastTxDate || latestPriceRow.date >= lastTxDate)) {
            bankEpfBalance = latestPriceRow.price;
          } else {
            bankEpfBalance = txSum || Number(asset.current_value) || Number(asset.cost_basis) || 0;
          }
          currentUnits = bankEpfBalance > 0 ? 1.0 : 0;
          totalCost = asset.type === 'SSY' || asset.type === 'PPF' ? (txSum || Number(asset.cost_basis) || bankEpfBalance) : 0;
        } else if (asset.type === 'PROPERTY' || asset.type === 'GOLD' || asset.type === 'OTHER') {
          const latestPriceRow = priceRepository.findLatestPrice(asset.id);
          let txSum = 0;
          for (const tx of transactions) {
            if (tx.type === 'BUY' || tx.type === 'REINVEST') txSum += tx.amount;
            else if (tx.type === 'SELL') txSum -= tx.amount;
          }
          bankEpfBalance = latestPriceRow ? latestPriceRow.price : (txSum || Number(asset.current_value) || Number(asset.cost_basis) || 0);
          currentUnits = bankEpfBalance > 0 ? 1.0 : 0;
          totalCost = txSum > 0 ? txSum : (Number(asset.cost_basis) || bankEpfBalance);
        } else {
          for (const tx of transactions) {
            if (tx.type === 'BUY' || tx.type === 'REINVEST' || tx.type === 'INTEREST') {
              currentUnits += tx.quantity;
              totalCost += tx.amount;
              totalUnitsBought += tx.quantity;
            } else if (tx.type === 'SELL') {
              currentUnits -= tx.quantity;
              if (totalUnitsBought > 0) {
                const avgBuyPrice = totalCost / totalUnitsBought;
                totalCost -= tx.quantity * avgBuyPrice;
                totalUnitsBought -= tx.quantity;
              }
            }
          }
        }

        currentUnits = Math.round(Math.max(0, currentUnits) * 10000) / 10000;
        totalCost = Math.round(Math.max(0, totalCost) * 100) / 100;

        let currentPrice = 0;
        if (asset.type === 'BANK_ACCOUNT' || asset.type === 'EPF' || asset.type === 'FIXED_DEPOSIT' || asset.type === 'SSY' || asset.type === 'PPF' || asset.type === 'PROPERTY' || asset.type === 'GOLD' || asset.type === 'OTHER') {
          currentPrice = bankEpfBalance;
        } else {
          const lastTx = transactions.length > 0 ? transactions[transactions.length - 1] : null;
          const latestPriceRow = priceRepository.findLatestPrice(asset.id);
          
          if (lastTx && lastTx.price > 0) {
            currentPrice = lastTx.price;
            if (latestPriceRow && latestPriceRow.price > 0 && latestPriceRow.price <= lastTx.price * 10) {
              currentPrice = latestPriceRow.price;
            }
          } else if (latestPriceRow && latestPriceRow.price > 0 && latestPriceRow.price < 200000) {
            currentPrice = latestPriceRow.price;
          } else if (Number(asset.current_value) > 0) {
            currentPrice = Number(asset.current_value);
            currentUnits = 1.0;
          }
        }

        let currentValue = currentUnits * currentPrice;

        // Fallback: If asset in DB has current_value but computed to 0, use asset.current_value
        if (currentValue === 0 && (Number(asset.current_value) > 0 || Number(asset.cost_basis) > 0)) {
          currentValue = Number(asset.current_value) || Number(asset.cost_basis) || 0;
          if (totalCost === 0) {
            totalCost = Number(asset.cost_basis) || currentValue;
          }
        }

        totalMarketValue += currentValue;
        totalCostBasis += totalCost;

        const assetType = asset.type || 'OTHER';
        allocationMap.set(assetType, (allocationMap.get(assetType) || 0) + currentValue);

        if (asset.family_member_id) {
          memberValues.set(asset.family_member_id, (memberValues.get(asset.family_member_id) || 0) + currentValue);
        }
      }
    } catch (e) {
      console.error('Error computing assets valuation for dashboard overview:', e);
    }

    const assetAllocation: any[] = [];
    allocationMap.forEach((val, key) => {
      if (val > 0) {
        assetAllocation.push({
          name: key.replace(/_/g, ' '),
          assetType: key,
          value: val,
          percentage: 0,
          formattedValue: DTOMapper.formatCurrency(val, 'INR')
        });
      }
    });

    assetAllocation.forEach(item => {
      item.percentage = totalMarketValue > 0 ? Number(((item.value / totalMarketValue) * 100).toFixed(2)) : 0;
    });

    return { totalMarketValue, totalCostBasis, assetAllocation, memberValues };
  }

  public async getDashboardOverview(
    requestedFamilyId?: number,
    asOfDate?: string
  ): Promise<DashboardOverviewResponseDTO> {
    let family: any = null;
    if (requestedFamilyId && !isNaN(requestedFamilyId) && requestedFamilyId > 0) {
      family = familyRepository.findById(requestedFamilyId);
    }

    if (!family) {
      const allFamilies = familyRepository.findAll();
      family = allFamilies[0] || { id: 1, name: 'My Family', currency: 'INR' };
    }
    
    const familyId = family.id;
    const currency = family.currency || 'INR';

    // Compute unified single-source-of-truth database net worth
    const realDbMetrics = this.computeRealDatabaseNetWorth(familyId);
    
    const totalMarketValue = realDbMetrics.totalMarketValue;
    const totalCostBasis = realDbMetrics.totalCostBasis;
    const assetAllocation = realDbMetrics.assetAllocation;

    const members = familyMemberRepository.findAll(familyId);
    const memberNodes = members.map(m => {
      const realVal = realDbMetrics.memberValues.get(m.id) || (totalMarketValue / (members.length || 1));
      return {
        id: m.id,
        name: m.name,
        marketValue: realVal
      };
    });

    return {
      familyId,
      familyName: family.name,
      asOfDate: asOfDate || new Date().toISOString().split('T')[0],
      reportingCurrency: currency,
      formattedTotalWealth: DTOMapper.formatCurrency(totalMarketValue, currency),
      totalMarketValue,
      totalCostBasis,
      totalAssets: totalMarketValue,
      totalLiabilities: 0,
      formattedTotalAssets: DTOMapper.formatCurrency(totalMarketValue, currency),
      formattedTotalLiabilities: DTOMapper.formatCurrency(0, currency),
      monthlySavings: 0,
      formattedMonthlySavings: DTOMapper.formatCurrency(0, currency),
      healthScore: totalMarketValue > 0 ? 94 : 0,
      assetAllocation,
      memberSummaries: memberNodes.map(m => ({
        memberId: m.id,
        memberName: m.name,
        formattedValue: DTOMapper.formatCurrency(m.marketValue, currency),
        percentageOfTotal: totalMarketValue > 0 ? Number(((m.marketValue / totalMarketValue) * 100).toFixed(2)) : 0
      })),
      alerts: []
    };
  }
}

export const dashboardApplicationService = new DashboardApplicationService();
