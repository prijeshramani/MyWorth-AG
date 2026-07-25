import { Router, Request, Response } from 'express';
import { assetRepository } from '../repositories/SQLiteAssetRepository';
import { transactionRepository } from '../repositories/SQLiteTransactionRepository';

const router = Router();

// GET /api/cashflow - Calculate cash flow summary, category exposure, and monthly metrics
router.get('/', (req: Request, res: Response, next) => {
  try {
    // 1. Get the BankInsights Account asset via Repository
    const bankAsset = assetRepository.findByIdentifierAndType('BANK_INSIGHTS', 'BANK_ACCOUNT');

    if (!bankAsset) {
      return res.json({
        hasData: false,
        summary: { totalIncome: 0, totalExpense: 0, netSavings: 0, savingsRate: 0 },
        categoryBreakdown: {},
        monthlyTimeline: [],
        recentTransactions: []
      });
    }

    const assetId = bankAsset.id;

    // 2. Fetch all bank account transactions chronologically via Repository
    const transactions = transactionRepository.findByAssetId(assetId)
      .filter(t => t.source === 'BANK_INSIGHTS');

    if (transactions.length === 0) {
      return res.json({
        hasData: false,
        summary: { totalIncome: 0, totalExpense: 0, netSavings: 0, savingsRate: 0 },
        categoryBreakdown: {},
        monthlyTimeline: [],
        recentTransactions: []
      });
    }

    // 3. Compute Summary KPIs
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown: Record<string, number> = {};
    const monthlyGroups: Record<string, { month: string; income: number; expense: number }> = {};

    for (const tx of transactions) {
      const isCredit = tx.type === 'CREDIT';
      const amount = tx.amount;
      
      if (isCredit) {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        const cat = tx.tx_category || 'Uncategorized';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amount;
      }

      const monthKey = tx.date.substring(0, 7);
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = { month: monthKey, income: 0, expense: 0 };
      }
      
      if (isCredit) {
        monthlyGroups[monthKey].income += amount;
      } else {
        monthlyGroups[monthKey].expense += amount;
      }
    }

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    const monthlyTimeline = Object.values(monthlyGroups).sort((a, b) => a.month.localeCompare(b.month));
    const recentTransactions = transactions.slice(0, 500);

    res.json({
      hasData: true,
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netSavings: Math.round(netSavings * 100) / 100,
        savingsRate: Math.round(savingsRate * 100) / 100
      },
      categoryBreakdown,
      monthlyTimeline,
      recentTransactions
    });
  } catch (error) {
    next(error);
  }
});

export default router;
