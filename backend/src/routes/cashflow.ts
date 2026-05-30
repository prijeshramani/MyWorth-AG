import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// GET /api/cashflow - Calculate cash flow summary, category exposure, and monthly metrics
router.get('/', (req: Request, res: Response) => {
  try {
    // 1. Get the BankInsights Account asset ID
    const bankAsset = db.prepare(`
      SELECT id FROM assets 
      WHERE type = 'BANK_ACCOUNT' AND identifier = 'BANK_INSIGHTS'
    `).get() as { id: number } | undefined;

    if (!bankAsset) {
      // If the asset doesn't exist yet, return empty/initial state
      return res.json({
        hasData: false,
        summary: { totalIncome: 0, totalExpense: 0, netSavings: 0, savingsRate: 0 },
        categoryBreakdown: {},
        monthlyTimeline: [],
        recentTransactions: []
      });
    }

    const assetId = bankAsset.id;

    // 2. Fetch all bank account transactions chronologically
    const transactions = db.prepare(`
      SELECT id, type, date, amount, narration, tx_category 
      FROM transactions
      WHERE asset_id = ? AND source = 'BANK_INSIGHTS'
      ORDER BY date DESC
    `).all(assetId) as Array<{
      id: number;
      type: 'DEBIT' | 'CREDIT';
      date: string;
      amount: number;
      narration: string;
      tx_category: string;
    }>;

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
        // Debit category breakdown
        const cat = tx.tx_category || 'Uncategorized';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amount;
      }

      // Group by Month (YYYY-MM)
      const monthKey = tx.date.substring(0, 7); // "YYYY-MM"
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

    // Sort monthly timeline chronologically
    const monthlyTimeline = Object.values(monthlyGroups).sort((a, b) => a.month.localeCompare(b.month));

    // Limit transactions returned for the main ledger to first 500 for UI speed (frontend can paginate/scroll)
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
  } catch (error: any) {
    console.error('Error fetching cashflow analytics:', error);
    res.status(500).json({ error: error.message || 'Failed to aggregate cash flow.' });
  }
});

// POST /api/cashflow/category - Manually update the category of a transaction
router.post('/category', (req: Request, res: Response) => {
  try {
    const { transactionId, category } = req.body;
    if (!transactionId || !category) {
      return res.status(400).json({ error: 'Transaction ID and new category are required.' });
    }

    const result = db.prepare(`
      UPDATE transactions 
      SET tx_category = ? 
      WHERE id = ? AND source = 'BANK_INSIGHTS'
    `).run(category, transactionId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found or not from BankInsights source.' });
    }

    res.json({ success: true, message: 'Transaction category overridden successfully.' });
  } catch (error: any) {
    console.error('Error updating transaction category:', error);
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

export default router;
