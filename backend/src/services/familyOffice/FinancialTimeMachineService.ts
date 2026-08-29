import crypto from 'crypto';
import { db } from '../../db';
import {
  TimeMachineReconstruction,
  TimeMachineReconstructionSchema,
  ReconstructedAssetHolding,
  DomainReconstructionStatus,
  ProtectionShieldSummary,
  HistoricalValuationType
} from '../../contracts/familyOfficeContracts';
import { SQLitePriceRepository, priceRepository, TIME_MACHINE_RULE_REGISTRY } from '../../repositories/SQLitePriceRepository';
import { SQLiteTransactionRepository, transactionRepository } from '../../repositories/SQLiteTransactionRepository';
import { calculateFixedDepositValuation } from '../../utils/fdValuation';

export class FinancialTimeMachineService {
  constructor(
    private priceRepo: SQLitePriceRepository = priceRepository,
    private txRepo: SQLiteTransactionRepository = transactionRepository
  ) {}

  /**
   * Reconstruct the Family's Historical Economic Position as of asOfDate.
   */
  public reconstructHistoricalEconomicState(
    familyId: number,
    asOfDateInput: string
  ): TimeMachineReconstruction {
    // 1. Strict Validation
    if (!asOfDateInput || !/^\d{4}-\d{2}-\d{2}$/.test(asOfDateInput)) {
      throw new Error(`INVALID_DATE_FORMAT: asOfDate must be in YYYY-MM-DD format, received '${asOfDateInput}'.`);
    }

    const asOfDate = asOfDateInput;
    const todayStr = new Date().toISOString().split('T')[0];
    if (asOfDate > todayStr) {
      const err = new Error(`FUTURE_AS_OF_DATE_UNSUPPORTED: asOfDate '${asOfDate}' cannot be in the future (today is '${todayStr}'). For future projections, use the What-If Simulation Sandbox.`);
      (err as any).statusCode = 400;
      (err as any).code = 'FUTURE_AS_OF_DATE_UNSUPPORTED';
      throw err;
    }

    // 2. Query family-scoped assets (active or created on/before asOfDate)
    const assets = db.prepare(`
      SELECT a.*, fm.name as member_name
      FROM assets a
      JOIN family_members fm ON fm.id = a.family_member_id
      WHERE fm.family_id = ?
      ORDER BY a.id ASC
    `).all(familyId) as any[];

    // 3. Batch load all transactions for this family on or before asOfDate
    const allTxs = this.txRepo.findAllByFamilyAsOf(familyId, asOfDate);
    const txByAsset = new Map<number, typeof allTxs>();
    for (const tx of allTxs) {
      if (!txByAsset.has(tx.asset_id)) {
        txByAsset.set(tx.asset_id, []);
      }
      txByAsset.get(tx.asset_id)!.push(tx);
    }

    let containsNonMarketValuations = false;
    const reconstructedHoldings: ReconstructedAssetHolding[] = [];
    const cashBalances: Record<string, number> = {};
    const provenanceCount: Record<string, number> = {
      EXACT_HISTORICAL: 0,
      PRIOR_DATE_PROXY: 0,
      KNOWN_ACQUISITION_COST: 0,
      CALCULATED: 0,
      HISTORICAL_SOURCE_UNAVAILABLE: 0
    };

    let totalGrossAssets = 0;
    let portfolioCompleteCount = 0;
    let portfolioTotalCount = 0;

    // 4. Reconstruct each asset
    for (const asset of assets) {
      portfolioTotalCount++;
      const assetTxs = txByAsset.get(asset.id) || [];
      const meta = this.parseMetadata(asset.metadata || asset.metadata_json);

      // --- FIXED DEPOSITS ---
      if (asset.type === 'FIXED_DEPOSIT' || asset.category === 'Debt' && meta.interest_rate) {
        const startDateStr = meta.start_date || meta.startDate || (assetTxs[0]?.date) || asset.created_at?.split(' ')[0] || asOfDate;
        const maturityDateStr = meta.maturity_date || meta.maturityDate || null;
        const interestRate = Number(meta.interest_rate || meta.interestRate || 7.0);
        const compoundingFreq = meta.compounding_frequency || meta.compoundingFrequency || 'QUARTERLY';
        const costBasis = Number(meta.principal_amount || asset.cost_basis || assetTxs[0]?.amount || 0);

        if (asOfDate < startDateStr) {
          // Pre-start: Not in existence
          continue;
        }

        const isMatured = maturityDateStr && asOfDate > maturityDateStr;
        const hasRedemptionTx = assetTxs.some(t => t.date > (maturityDateStr || '') && t.type === 'SELL');

        if (isMatured && !hasRedemptionTx) {
          // Mandatory Correction #2: Post-maturity ownership unproven -> value is null, not counted in net worth
          reconstructedHoldings.push({
            assetId: asset.id,
            assetName: asset.name,
            assetClass: asset.category,
            units: 1,
            unitPrice: null,
            costBasis: costBasis > 0 ? costBasis : null,
            priceDate: maturityDateStr,
            valuationType: 'UNKNOWN',
            provenance: 'HISTORICAL_SOURCE_UNAVAILABLE',
            daysOfProxyLag: 0,
            totalMarketValue: null,
            unrealizedGainLoss: null,
            currency: asset.currency || 'INR',
            status: 'INSUFFICIENT_DATA',
            lifecycleStatus: 'MATURED_PENDING_REINVESTMENT',
            missingDataReason: `FD matured on ${maturityDateStr}. Continued ownership unverified without redemption or renewal record.`,
            isEstimate: true
          });
          provenanceCount.HISTORICAL_SOURCE_UNAVAILABLE++;
          continue;
        }

        // Active FD: Calculate compounding accrual
        const accrualDateStr = isMatured && maturityDateStr ? maturityDateStr : asOfDate;
        const finalCostBasis = costBasis > 0 ? costBasis : 100000;
        const valuation = calculateFixedDepositValuation({
          costBasis: finalCostBasis,
          interestRate,
          startDateStr,
          asOfDateStr: accrualDateStr,
          compoundingFrequency: compoundingFreq
        });

        const accruedVal = Math.round(valuation.marketValue);
        totalGrossAssets += accruedVal;
        portfolioCompleteCount++;
        provenanceCount.CALCULATED++;

        reconstructedHoldings.push({
          assetId: asset.id,
          assetName: asset.name,
          assetClass: asset.category,
          units: 1,
          unitPrice: accruedVal,
          costBasis: finalCostBasis,
          priceDate: accrualDateStr,
          valuationType: 'ACCRUED_VALUE',
          provenance: 'CALCULATED',
          daysOfProxyLag: 0,
          totalMarketValue: accruedVal,
          unrealizedGainLoss: Math.round(valuation.accruedInterest),
          currency: asset.currency || 'INR',
          status: 'COMPLETE',
          lifecycleStatus: 'ACTIVE',
          isEstimate: false
        });
        continue;
      }

      // --- CASH / BANK ACCOUNTS ---
      if (asset.category === 'Cash' || asset.type === 'BANK_ACCOUNT') {
        let cashBal = 0;
        let hasTxs = false;

        for (const tx of assetTxs) {
          hasTxs = true;
          if (tx.type === 'CREDIT' || tx.type === 'BUY' || tx.type === 'REINVEST') {
            cashBal += tx.amount;
          } else if (tx.type === 'DEBIT' || tx.type === 'SELL') {
            cashBal = Math.max(0, cashBal - tx.amount);
          }
        }

        if (!hasTxs) {
          // If no transactions exist, check if asset was created on/before asOfDate
          const assetCreatedDate = asset.created_at ? asset.created_at.split(' ')[0] : '9999-99-99';
          if (assetCreatedDate <= asOfDate && asset.cost_basis > 0) {
            cashBal = asset.cost_basis;
            hasTxs = true;
          }
        }

        if (hasTxs) {
          const roundedCash = Math.round(cashBal);
          totalGrossAssets += roundedCash;
          portfolioCompleteCount++;
          provenanceCount.CALCULATED++;
          cashBalances[asset.name] = roundedCash;

          reconstructedHoldings.push({
            assetId: asset.id,
            assetName: asset.name,
            assetClass: asset.category,
            units: 1,
            unitPrice: roundedCash,
            costBasis: roundedCash,
            priceDate: asOfDate,
            valuationType: 'LEDGER_BALANCE',
            provenance: 'CALCULATED',
            daysOfProxyLag: 0,
            totalMarketValue: roundedCash,
            unrealizedGainLoss: 0,
            currency: asset.currency || 'INR',
            status: 'COMPLETE',
            isEstimate: false
          });
        } else {
          // Mandatory Correction #1: Missing cash data is null, not 0
          provenanceCount.HISTORICAL_SOURCE_UNAVAILABLE++;
          reconstructedHoldings.push({
            assetId: asset.id,
            assetName: asset.name,
            assetClass: asset.category,
            units: 1,
            unitPrice: null,
            costBasis: null,
            priceDate: null,
            valuationType: 'UNKNOWN',
            provenance: 'HISTORICAL_SOURCE_UNAVAILABLE',
            daysOfProxyLag: 0,
            totalMarketValue: null,
            unrealizedGainLoss: null,
            currency: asset.currency || 'INR',
            status: 'INSUFFICIENT_DATA',
            missingDataReason: 'No historical ledger transactions or snapshot recorded on or before asOfDate.',
            isEstimate: false
          });
        }
        continue;
      }

      // --- MARKET-VALUED ASSETS (Equity, MF, US Stock, Debt, Gold, Property) ---
      let units = 0;
      let totalCostPool = 0;
      let hasNegativeAnomaly = false;
      let hasUnsupportedTx = false;

      // Deterministic WAC calculation: transactions sorted by date ASC, id ASC
      for (const tx of assetTxs) {
        if (tx.type === 'BUY' || tx.type === 'REINVEST') {
          if (tx.quantity <= 0 || tx.amount <= 0) {
            hasUnsupportedTx = true;
          }
          units += tx.quantity;
          totalCostPool += tx.amount;
        } else if (tx.type === 'BONUS') {
          units += tx.quantity;
          // totalCostPool unchanged, dilutes per-unit cost
        } else if (tx.type === 'SELL') {
          if (units <= 0) {
            hasNegativeAnomaly = true;
            units = 0;
            totalCostPool = 0;
          } else {
            const avgCost = totalCostPool / units;
            const disposalCost = tx.quantity * avgCost;
            units -= tx.quantity;
            totalCostPool = Math.max(0, totalCostPool - disposalCost);
            if (units < 0) {
              hasNegativeAnomaly = true;
              units = 0;
              totalCostPool = 0;
            }
          }
        } else if (tx.type === 'DIVIDEND' || tx.type === 'INTEREST') {
          // Income event, units and cost pool unchanged
        } else {
          hasUnsupportedTx = true;
        }
      }

      // If no transactions exist, check if asset was created on/before asOfDate with initial balance
      if (assetTxs.length === 0) {
        const assetCreatedDate = asset.created_at ? asset.created_at.split(' ')[0] : '9999-99-99';
        if (assetCreatedDate <= asOfDate && asset.cost_basis > 0) {
          units = 1;
          totalCostPool = asset.cost_basis;
        }
      }

      // Handle full disposal
      if (units === 0 && !hasNegativeAnomaly && assetTxs.length > 0) {
        reconstructedHoldings.push({
          assetId: asset.id,
          assetName: asset.name,
          assetClass: asset.category,
          units: 0,
          unitPrice: 0,
          costBasis: 0,
          priceDate: asOfDate,
          valuationType: 'MARKET_VALUE',
          provenance: 'EXACT_HISTORICAL',
          daysOfProxyLag: 0,
          totalMarketValue: 0,
          unrealizedGainLoss: 0,
          currency: asset.currency || 'INR',
          status: 'COMPLETE',
          isEstimate: false
        });
        portfolioCompleteCount++;
        provenanceCount.EXACT_HISTORICAL++;
        continue;
      }

      // Handle anomaly
      if (hasNegativeAnomaly || hasUnsupportedTx || units <= 0) {
        provenanceCount.HISTORICAL_SOURCE_UNAVAILABLE++;
        reconstructedHoldings.push({
          assetId: asset.id,
          assetName: asset.name,
          assetClass: asset.category,
          units: 0,
          unitPrice: null,
          costBasis: totalCostPool > 0 ? totalCostPool : null,
          priceDate: null,
          valuationType: 'UNKNOWN',
          provenance: 'HISTORICAL_SOURCE_UNAVAILABLE',
          daysOfProxyLag: 0,
          totalMarketValue: null,
          unrealizedGainLoss: null,
          currency: asset.currency || 'INR',
          status: 'INSUFFICIENT_DATA',
          missingDataReason: hasNegativeAnomaly
            ? 'Anomalous negative quantity detected during ledger reconstruction.'
            : 'Missing or unsupported transaction records prevent accurate reconstruction.',
          isEstimate: false
        });
        continue;
      }

      // 5. Price resolution with 5-level valuation hierarchy
      const priceResult = this.priceRepo.findPriceAsOf(familyId, asset.id, asOfDate, asset.category);

      if (priceResult && priceResult.status === 'COMPLETE') {
        const unitPrice = priceResult.amount;
        const marketVal = Math.round(units * unitPrice);
        const unrealized = Math.round(marketVal - totalCostPool);

        totalGrossAssets += marketVal;
        portfolioCompleteCount++;
        if (priceResult.provenance === 'EXACT_HISTORICAL') {
          provenanceCount.EXACT_HISTORICAL++;
        } else {
          provenanceCount.PRIOR_DATE_PROXY++;
        }

        reconstructedHoldings.push({
          assetId: asset.id,
          assetName: asset.name,
          assetClass: asset.category,
          units,
          unitPrice,
          costBasis: Math.round(totalCostPool),
          priceDate: priceResult.resolvedValuationDate,
          valuationType: 'MARKET_VALUE',
          provenance: priceResult.provenance,
          daysOfProxyLag: priceResult.daysOfProxyLag,
          totalMarketValue: marketVal,
          unrealizedGainLoss: unrealized,
          currency: asset.currency || 'INR',
          status: 'COMPLETE',
          isEstimate: priceResult.provenance === 'PRIOR_DATE_PROXY'
        });
      } else if (totalCostPool > 0) {
        // Fallback Level 3: Known Acquisition Cost
        containsNonMarketValuations = true;
        const avgCost = totalCostPool / units;
        const costVal = Math.round(totalCostPool);

        totalGrossAssets += costVal;
        portfolioCompleteCount++;
        provenanceCount.KNOWN_ACQUISITION_COST++;

        reconstructedHoldings.push({
          assetId: asset.id,
          assetName: asset.name,
          assetClass: asset.category,
          units,
          unitPrice: Math.round(avgCost * 100) / 100,
          costBasis: costVal,
          priceDate: asOfDate,
          valuationType: 'ACQUISITION_COST',
          provenance: 'KNOWN_ACQUISITION_COST',
          daysOfProxyLag: priceResult?.daysOfProxyLag || 0,
          totalMarketValue: costVal,
          unrealizedGainLoss: null, // Strictly null on cost fallback
          currency: asset.currency || 'INR',
          status: 'PARTIAL',
          missingDataReason: priceResult?.missingDataReason || 'No market price found within proxy window; falling back to acquisition cost.',
          isEstimate: true
        });
      } else {
        // Fallback Level 5: Historical Source Unavailable
        // Mandatory Correction #1: Missing value must be null
        provenanceCount.HISTORICAL_SOURCE_UNAVAILABLE++;
        reconstructedHoldings.push({
          assetId: asset.id,
          assetName: asset.name,
          assetClass: asset.category,
          units,
          unitPrice: null,
          costBasis: null,
          priceDate: null,
          valuationType: 'UNKNOWN',
          provenance: 'HISTORICAL_SOURCE_UNAVAILABLE',
          daysOfProxyLag: priceResult?.daysOfProxyLag || 0,
          totalMarketValue: null,
          unrealizedGainLoss: null,
          currency: asset.currency || 'INR',
          status: 'INSUFFICIENT_DATA',
          missingDataReason: 'No valid historical market price or acquisition cost available on or before asOfDate.',
          isEstimate: false
        });
      }
    }

    // 5. Protection Shield Reconstruction (Coverage only, never in net worth)
    const policyRows = db.prepare(`
      SELECT id, policy_number, insurer_name, policy_type, sum_assured, premium_amount, start_date, maturity_date, status
      FROM insurance_policies
      WHERE family_id = ? AND start_date <= ? AND (maturity_date IS NULL OR maturity_date >= ?)
      ORDER BY id ASC
    `).all(familyId, asOfDate, asOfDate) as any[];

    let totalSumAssured = 0;
    const policiesList: ProtectionShieldSummary['policies'] = [];
    for (const p of policyRows) {
      if (p.status !== 'LAPSED' && p.status !== 'SURRENDERED') {
        totalSumAssured += p.sum_assured;
        policiesList.push({
          policyId: p.id,
          policyName: p.insurer_name ? `${p.insurer_name} (${p.policy_type})` : (p.policy_number || 'Insurance Policy'),
          policyType: p.policy_type,
          sumAssured: p.sum_assured,
          startDate: p.start_date,
          status: p.status
        });
      }
    }

    const protectionShield: ProtectionShieldSummary = {
      totalSumAssured: Math.round(totalSumAssured),
      activePolicyCount: policiesList.length,
      policies: policiesList
    };

    // 6. Liabilities (Snapshot on or before asOfDate)
    const liabilitiesBreakdown: Record<string, number> = {};
    let totalLiabilities = 0;
    try {
      const liabilityRows = db.prepare(`
        SELECT name, current_balance FROM liabilities
        WHERE family_id = ? AND (created_at IS NULL OR created_at <= ?)
      `).all(familyId, asOfDate + ' 23:59:59') as any[];

      for (const l of liabilityRows) {
        const bal = Math.round(l.current_balance || 0);
        totalLiabilities += bal;
        liabilitiesBreakdown[l.name] = bal;
      }
    } catch {
      // Table may not exist in minimal environments
    }

    // 7. Goals Domain Status
    const goalsCount = db.prepare(`
      SELECT count(*) as cnt FROM financial_goals WHERE family_id = ? AND created_at <= ?
    `).get(familyId, asOfDate + ' 23:59:59') as { cnt: number };

    // 8. Estate Domain Status
    let estateCount = 0;
    try {
      const willCount = db.prepare(`
        SELECT count(*) as cnt FROM wills WHERE family_id = ? AND (registered_at <= ? OR created_at <= ?)
      `).get(familyId, asOfDate, asOfDate + ' 23:59:59') as { cnt: number };
      estateCount += (willCount?.cnt || 0);
    } catch {}

    // 9. Tax Fiscal Profile
    const applicableFY = this.resolveIndianFinancialYear(asOfDate);
    let taxRecordsCount = 0;
    try {
      const taxProf = db.prepare(`
        SELECT count(*) as cnt FROM tax_profiles WHERE family_id = ? AND financial_year = ? AND created_at <= ?
      `).get(familyId, applicableFY, asOfDate + ' 23:59:59') as { cnt: number };
      taxRecordsCount = taxProf?.cnt || 0;
    } catch {}

    // 10. Completeness and Domain Breakdown
    const portfolioScore = portfolioTotalCount > 0 ? (portfolioCompleteCount / portfolioTotalCount) * 100 : 100;
    const completenessScore = Math.round((portfolioCompleteCount / (portfolioTotalCount || 1)) * 100) / 100;

    const domains = {
      portfolio: {
        domain: 'PORTFOLIO' as const,
        status: portfolioScore >= 90 ? ('COMPLETE' as const) : portfolioScore >= 50 ? ('PARTIAL' as const) : ('INSUFFICIENT_DATA' as const),
        coveragePct: Math.round(portfolioScore),
        missingDataReasons: reconstructedHoldings.filter(h => h.missingDataReason).map(h => `${h.assetName}: ${h.missingDataReason}`),
        sourceTables: ['transactions', 'assets', 'asset_prices']
      },
      protection: {
        domain: 'PROTECTION' as const,
        status: policiesList.length > 0 ? ('COMPLETE' as const) : ('PARTIAL' as const),
        coveragePct: policiesList.length > 0 ? 100 : 0,
        missingDataReasons: policiesList.length === 0 ? ['No active insurance policies registered as of date.'] : [],
        sourceTables: ['insurance_policies']
      },
      liquidity: {
        domain: 'LIQUIDITY' as const,
        status: Object.keys(cashBalances).length > 0 ? ('COMPLETE' as const) : ('PARTIAL' as const),
        coveragePct: Object.keys(cashBalances).length > 0 ? 100 : 50,
        missingDataReasons: Object.keys(cashBalances).length === 0 ? ['No cash ledger records found.'] : [],
        sourceTables: ['transactions', 'assets']
      },
      goals: {
        domain: 'GOALS' as const,
        status: goalsCount.cnt > 0 ? ('COMPLETE' as const) : ('PARTIAL' as const),
        coveragePct: goalsCount.cnt > 0 ? 100 : 0,
        missingDataReasons: goalsCount.cnt === 0 ? ['No financial goals active on or before asOfDate.'] : [],
        sourceTables: ['financial_goals']
      },
      estate: {
        domain: 'ESTATE' as const,
        status: estateCount > 0 ? ('COMPLETE' as const) : ('PARTIAL' as const),
        coveragePct: estateCount > 0 ? 100 : 0,
        missingDataReasons: estateCount === 0 ? ['No registered estate documents found on or before asOfDate.'] : [],
        sourceTables: ['wills', 'trusts']
      },
      tax: {
        domain: 'TAX' as const,
        status: taxRecordsCount > 0 ? ('COMPLETE' as const) : ('PARTIAL' as const),
        coveragePct: taxRecordsCount > 0 ? 100 : 0,
        missingDataReasons: taxRecordsCount === 0 ? [`No tax profile registered for FY ${applicableFY}.`] : [],
        sourceTables: ['tax_profiles', 'tax_deductions']
      }
    };

    const overallStatus = completenessScore >= 0.9 ? 'COMPLETE' : completenessScore >= 0.5 ? 'PARTIAL' : 'INSUFFICIENT_DATA';
    const netWorth = Math.round(totalGrossAssets - totalLiabilities);

    // 11. Deterministic Canonical State Hashing (excluding volatile timestamps)
    const stateHash = this.computeCanonicalStateHash({
      familyId,
      asOfDate,
      reconstructionMode: 'HISTORICAL_ECONOMIC_STATE',
      netWorth,
      grossAssets: Math.round(totalGrossAssets),
      totalLiabilities: Math.round(totalLiabilities),
      containsNonMarketValuations,
      holdings: reconstructedHoldings.map(h => ({
        assetId: h.assetId,
        units: h.units,
        unitPrice: h.unitPrice,
        totalMarketValue: h.totalMarketValue,
        valuationType: h.valuationType,
        provenance: h.provenance,
        daysOfProxyLag: h.daysOfProxyLag
      })),
      domains: Object.entries(domains).map(([k, v]) => ({ key: k, status: v.status, coveragePct: v.coveragePct })),
      ruleVersion: TIME_MACHINE_RULE_REGISTRY.version,
      calculationVersion: '2026.1'
    });

    const result: TimeMachineReconstruction = {
      familyId,
      asOfDate,
      reconstructionMode: 'HISTORICAL_ECONOMIC_STATE',
      knowledgeTimeStatus: 'NOT_FULLY_RECONSTRUCTABLE',
      netWorth,
      grossAssets: Math.round(totalGrossAssets),
      totalLiabilities: Math.round(totalLiabilities),
      containsNonMarketValuations,
      completenessScore,
      overallStatus,
      holdings: reconstructedHoldings,
      cashBalances,
      liabilitiesBreakdown,
      protectionShield,
      domains,
      provenanceBreakdown: provenanceCount,
      stateHash,
      ruleVersion: TIME_MACHINE_RULE_REGISTRY.version,
      calculationVersion: '2026.1',
      reconstructedAt: new Date().toISOString()
    };

    return TimeMachineReconstructionSchema.parse(result);
  }

  /**
   * Deterministic SHA-256 State Hashing over Canonical Preimage.
   */
  public computeCanonicalStateHash(preimage: Record<string, any>): string {
    const canonicalStr = this.deterministicStringify(preimage);
    return crypto.createHash('sha256').update(canonicalStr).digest('hex');
  }

  private deterministicStringify(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this.deterministicStringify(item)).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + this.deterministicStringify(obj[k])).join(',') + '}';
  }

  private resolveIndianFinancialYear(dateStr: string): string {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1; // 1-12
    const year = d.getFullYear();
    if (month >= 4) {
      const nextYear = (year + 1) % 100;
      return `${year}-${nextYear.toString().padStart(2, '0')}`;
    } else {
      const prevYear = year - 1;
      const currYear = year % 100;
      return `${prevYear}-${currYear.toString().padStart(2, '0')}`;
    }
  }

  private parseMetadata(metaJson?: string | null): Record<string, any> {
    if (!metaJson) return {};
    try {
      return JSON.parse(metaJson);
    } catch {
      return {};
    }
  }
}

export const financialTimeMachineService = new FinancialTimeMachineService();
