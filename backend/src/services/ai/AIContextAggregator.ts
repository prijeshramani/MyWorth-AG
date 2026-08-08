import { db } from '../../db';
import { calculateFixedDepositValuation, extractFdMetadata } from '../../utils/fdValuation';
import { CapitalGainsCalculator } from '../../engines/tax/CapitalGainsCalculator';
import { SQLiteRecommendationRuleRepository } from '../../repositories/SQLiteRecommendationRuleRepository';
import { SQLiteRecommendationRepository } from '../../repositories/SQLiteRecommendationRepository';
import { InsightScoringService } from '../InsightScoringService';
import { TaxCalculationEngine } from '../../engines/tax/TaxCalculationEngine';
import { SQLiteEstateRepository } from '../../repositories/SQLiteEstateRepository';
import { EstateHealthService } from '../EstateHealthService';
import { SQLiteGoalRepository } from '../../repositories/SQLiteGoalRepository';
import { ProjectionEngineService } from '../ProjectionEngineService';
import { GoalPlanningService } from '../GoalPlanningService';
import { RecommendationOrchestrator } from '../RecommendationOrchestrator';
import { RecommendationEngineService } from '../RecommendationEngineService';

const ruleRepo = new SQLiteRecommendationRuleRepository(db);
const recRepo = new SQLiteRecommendationRepository(db);
const scoringService = new InsightScoringService();
const taxEngine = new TaxCalculationEngine();
const estateRepo = new SQLiteEstateRepository(db);
const estateHealthService = new EstateHealthService(estateRepo);
const goalRepo = new SQLiteGoalRepository(db);
const projectionEngine = new ProjectionEngineService();
const goalService = new GoalPlanningService(goalRepo, projectionEngine);

const orchestrator = new RecommendationOrchestrator(ruleRepo, recRepo, scoringService, taxEngine, estateHealthService, goalService);
const recEngineService = new RecommendationEngineService(recRepo, orchestrator);

export interface EvidenceItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  data: any;
  confidence: number; // 0.0 to 1.0 (e.g. 0.95 = 95%)
  freshness: 'REALTIME' | 'DAILY' | 'STATIC';
  sourceEngine: string; // e.g. "CapitalGainsCalculator", "RuleEngine", "ProjectionEngine", "KnowledgeGraph"
  calculationVersion: string; // e.g. "v2024.1 (Finance Act 2024)"
  ruleVersion: string; // e.g. "v1.2.0"
  lastUpdated: string;
}

export interface AggregatedAIContext {
  familyId: number;
  totalNetWorth: number;
  assetSummary: {
    totalAssets: number;
    equityTotal: number;
    debtTotal: number;
    cashTotal: number;
    alternativeTotal: number;
    topHoldings: Array<{ name: string; type: string; value: number }>;
  };
  capitalGainsEvidence?: {
    stcgTotal: number;
    ltcgTotal: number;
    ltcgExemptionUsed: number;
    harvestableLosses: number;
    taxLossHarvestingOpportunities: any[];
  };
  recommendationsEvidence?: any[];
  graphEvidence?: {
    totalNodes: number;
    totalEdges: number;
    unassignedAssetsCount: number;
  };
  evidenceItems: EvidenceItem[];
}

export class AIContextAggregator {
  public async getContextForFamily(familyId: number = 1): Promise<AggregatedAIContext> {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Gather Asset & Portfolio Metrics from Asset Repositories / Views
    const assets = db.prepare(`
      SELECT a.*, ap.price as latest_price
      FROM assets a
      LEFT JOIN asset_prices ap ON ap.asset_id = a.id AND ap.date = (SELECT MAX(date) FROM asset_prices WHERE asset_id = a.id)
    `).all() as any[];

    let equityTotal = 0;
    let debtTotal = 0;
    let cashTotal = 0;
    let alternativeTotal = 0;
    const topHoldings: Array<{ name: string; type: string; value: number }> = [];

    for (const asset of assets) {
      // Calculate current valuation using latest market price or transaction sum
      const txs = db.prepare('SELECT type, amount, quantity FROM transactions WHERE asset_id = ?').all(asset.id) as any[];
      let val = 0;

      if (asset.type === 'FIXED_DEPOSIT') {
        const latestPrice = db.prepare('SELECT price FROM asset_prices WHERE asset_id = ? ORDER BY date DESC LIMIT 1').get(asset.id) as { price: number } | undefined;
        const costBasis = txs.reduce((acc, t) => t.type === 'BUY' || t.type === 'REINVEST' ? acc + t.amount : acc - t.amount, 0);
        const firstTx = db.prepare('SELECT date FROM transactions WHERE asset_id = ? ORDER BY date ASC LIMIT 1').get(asset.id) as { date: string } | undefined;
        const meta = extractFdMetadata(asset, firstTx?.date);
        const fdVal = calculateFixedDepositValuation({
          costBasis,
          interestRate: meta.interestRate,
          startDateStr: meta.startDate,
          compoundingFrequency: meta.compoundingFrequency
        });

        if (latestPrice && latestPrice.price !== costBasis && latestPrice.price > 0) {
          val = latestPrice.price;
        } else {
          val = fdVal.marketValue > 0 ? fdVal.marketValue : costBasis;
        }
      } else if (asset.type === 'BANK_ACCOUNT' || asset.type === 'EPF') {
        const latestPrice = db.prepare('SELECT price FROM asset_prices WHERE asset_id = ? ORDER BY date DESC LIMIT 1').get(asset.id) as { price: number } | undefined;
        if (latestPrice) {
          val = latestPrice.price;
        } else {
          val = txs.reduce((acc, t) => t.type === 'BUY' || t.type === 'REINVEST' ? acc + t.amount : acc - t.amount, 0);
        }
      } else {
        const latestPrice = db.prepare('SELECT price FROM asset_prices WHERE asset_id = ? ORDER BY date DESC LIMIT 1').get(asset.id) as { price: number } | undefined;
        const totalQty = txs.reduce((acc, t) => t.type === 'BUY' || t.type === 'REINVEST' ? acc + t.quantity : acc - t.quantity, 0);
        const unitPrice = latestPrice ? latestPrice.price : (txs.length > 0 ? txs[txs.length - 1].amount / (txs[txs.length - 1].quantity || 1) : 0);
        val = totalQty * unitPrice;
      }

      val = Math.max(0, val);

      if (asset.category === 'Equity' || asset.type === 'STOCK' || asset.type === 'MUTUAL_FUND') {
        equityTotal += val;
      } else if (asset.category === 'Debt' || asset.type === 'EPF' || asset.type === 'NPS' || asset.type === 'FIXED_DEPOSIT') {
        debtTotal += val;
      } else if (asset.category === 'Cash' || asset.type === 'BANK_ACCOUNT') {
        cashTotal += val;
      } else {
        alternativeTotal += val;
      }

      topHoldings.push({ name: asset.name, type: asset.type, value: val });
    }

    topHoldings.sort((a, b) => b.value - a.value);
    const totalNetWorth = equityTotal + debtTotal + cashTotal + alternativeTotal;

    // 2. Gather Capital Gains & Tax Loss Harvesting Evidence from CapitalGainsCalculator
    let capitalGainsData: any = null;
    try {
      const rawTxs = db.prepare(`
        SELECT t.id, t.asset_id as assetId, a.name as assetName, a.identifier as symbol, 
               a.type as assetType, a.category, t.type, t.date, t.quantity, t.price, t.amount
        FROM transactions t
        JOIN assets a ON t.asset_id = a.id
        ORDER BY t.date ASC
      `).all() as any[];

      const currentAssets = db.prepare(`
        SELECT a.id, a.name, a.identifier, a.type,
               COALESCE(SUM(CASE WHEN t.type = 'BUY' THEN t.quantity WHEN t.type = 'SELL' THEN -t.quantity ELSE 0 END), 0) as currentUnits,
               COALESCE(AVG(CASE WHEN t.type = 'BUY' THEN t.price END), 0) as avgBuyPrice,
               COALESCE(p.price, AVG(CASE WHEN t.type = 'BUY' THEN t.price END), 0) as currentPrice
        FROM assets a
        LEFT JOIN transactions t ON a.id = t.asset_id
        LEFT JOIN (
          SELECT asset_id, price FROM asset_prices 
          WHERE (asset_id, date) IN (SELECT asset_id, MAX(date) FROM asset_prices GROUP BY asset_id)
        ) p ON a.id = p.asset_id
        GROUP BY a.id
      `).all() as any[];

      const enrichedAssets = currentAssets.map(a => ({
        id: a.id,
        name: a.name,
        identifier: a.identifier || '',
        type: a.type,
        currentUnits: Math.max(0, a.currentUnits || 0),
        avgBuyPrice: a.avgBuyPrice || 0,
        currentPrice: a.currentPrice || a.avgBuyPrice || 0,
        currentValue: Math.max(0, a.currentUnits || 0) * (a.currentPrice || a.avgBuyPrice || 0),
        totalCost: Math.max(0, a.currentUnits || 0) * (a.avgBuyPrice || 0)
      }));

      const summary = CapitalGainsCalculator.calculateCapitalGains(rawTxs, enrichedAssets, '2025-26');
      capitalGainsData = {
        stcgTotal: summary.realizedStcg,
        ltcgTotal: summary.realizedLtcg,
        ltcgExemptionUsed: summary.ltcgExemptionClaimed,
        harvestableLosses: summary.harvestingOpportunities.reduce((acc, h) => acc + h.unrealizedLoss, 0),
        taxLossHarvestingOpportunities: summary.harvestingOpportunities
      };
    } catch (err) {
      console.warn('Tax context aggregation warning:', err);
    }

    // 3. Gather Recommendations Evidence from RecommendationEngine
    let recs: any[] = [];
    try {
      const insights = recEngineService.getDashboardInsights(familyId);
      recs = insights.activeRecommendations || [];
    } catch (err) {
      console.warn('Recommendation context aggregation warning:', err);
    }

    // 4. Gather Knowledge Graph Evidence
    const nodeCount = (db.prepare('SELECT COUNT(*) as cnt FROM graph_nodes').get() as any)?.cnt || 0;
    const edgeCount = (db.prepare("SELECT COUNT(*) as cnt FROM graph_edges WHERE status = 'ACTIVE'").get() as any)?.cnt || 0;
    const unassignedCount = (db.prepare('SELECT COUNT(*) as cnt FROM assets WHERE family_member_id IS NULL').get() as any)?.cnt || 0;

    // 5. Construct Structured Evidence Items with Confidence Metrics
    const evidenceItems: EvidenceItem[] = [
      {
        id: 'ev_portfolio_metrics',
        title: 'Portfolio Valuation Snapshot',
        category: 'Portfolio Analytics',
        summary: `Total Net Worth: ₹${totalNetWorth.toLocaleString('en-IN')}, Equity: ₹${equityTotal.toLocaleString('en-IN')}, Debt: ₹${debtTotal.toLocaleString('en-IN')}`,
        data: { totalNetWorth, equityTotal, debtTotal, cashTotal, alternativeTotal },
        confidence: 0.98,
        freshness: 'REALTIME',
        sourceEngine: 'AssetMasterEngine',
        calculationVersion: 'v1.8.0',
        ruleVersion: 'v1.0.0',
        lastUpdated: todayStr
      },
      {
        id: 'ev_tax_summary',
        title: 'Capital Gains & Tax Loss Harvesting',
        category: 'Tax Intelligence',
        summary: `Realized STCG: ₹${(capitalGainsData?.stcgTotal || 0).toLocaleString('en-IN')}, Realized LTCG: ₹${(capitalGainsData?.ltcgTotal || 0).toLocaleString('en-IN')}, Tax Loss Harvest Opportunities: ${capitalGainsData?.taxLossHarvestingOpportunities?.length || 0}`,
        data: capitalGainsData,
        confidence: 0.95,
        freshness: 'DAILY',
        sourceEngine: 'CapitalGainsCalculator',
        calculationVersion: 'v2024.1 (Finance Act 2024)',
        ruleVersion: 'v1.2.0',
        lastUpdated: todayStr
      },
      {
        id: 'ev_recommendations',
        title: 'Actionable Rule Recommendations',
        category: 'Recommendation Layer',
        summary: `Total active recommendations: ${recs.length} rules evaluated.`,
        data: recs,
        confidence: 0.92,
        freshness: 'REALTIME',
        sourceEngine: 'RecommendationEngine',
        calculationVersion: 'v1.5.0',
        ruleVersion: 'v1.1.0',
        lastUpdated: todayStr
      },
      {
        id: 'ev_knowledge_graph',
        title: 'Family Wealth Knowledge Graph',
        category: 'Network Graph',
        summary: `Active Graph Nodes: ${nodeCount}, Active Edges: ${edgeCount}, Unassigned Assets: ${unassignedCount}`,
        data: { nodeCount, edgeCount, unassignedCount },
        confidence: 0.99,
        freshness: 'REALTIME',
        sourceEngine: 'KnowledgeGraphRepository',
        calculationVersion: 'v1.4.0',
        ruleVersion: 'v1.0.0',
        lastUpdated: todayStr
      }
    ];

    return {
      familyId,
      totalNetWorth,
      assetSummary: {
        totalAssets: assets.length,
        equityTotal,
        debtTotal,
        cashTotal,
        alternativeTotal,
        topHoldings: topHoldings.slice(0, 5)
      },
      capitalGainsEvidence: capitalGainsData ? {
        stcgTotal: capitalGainsData.stcgTotal || 0,
        ltcgTotal: capitalGainsData.ltcgTotal || 0,
        ltcgExemptionUsed: capitalGainsData.ltcgExemptionUsed || 0,
        harvestableLosses: capitalGainsData.harvestableLosses || 0,
        taxLossHarvestingOpportunities: capitalGainsData.taxLossHarvestingOpportunities || []
      } : undefined,
      recommendationsEvidence: recs,
      graphEvidence: {
        totalNodes: nodeCount,
        totalEdges: edgeCount,
        unassignedAssetsCount: unassignedCount
      },
      evidenceItems
    };
  }
}

export const aiContextAggregator = new AIContextAggregator();
