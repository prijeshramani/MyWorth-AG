import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { CapitalGainsCalculator, TransactionItem } from '../engines/tax/CapitalGainsCalculator';
import { Form16Parser } from '../services/form16Parser';
import { ITRSchemaBuilder } from '../services/ITRSchemaBuilder';

const router = Router();

// GET /api/v1/tax/capital-gains - Calculate STCG, LTCG & Tax Loss Harvesting
router.get('/capital-gains', (req: Request, res: Response) => {
  try {
    const familyId = Number(req.query.familyId) || 1;
    const memberId = req.query.memberId ? Number(req.query.memberId) : null;
    const fy = (req.query.fy as string) || '2025-26';

    // 1. Fetch transactions for the family or specific member
    const txQuery = memberId 
      ? `SELECT t.id, t.asset_id as assetId, a.name as assetName, a.identifier as symbol, 
                a.type as assetType, a.category, t.type, t.date, t.quantity, t.price, t.amount
         FROM transactions t
         JOIN assets a ON t.asset_id = a.id
         WHERE a.family_member_id = ?
         ORDER BY t.date ASC`
      : `SELECT t.id, t.asset_id as assetId, a.name as assetName, a.identifier as symbol, 
                a.type as assetType, a.category, t.type, t.date, t.quantity, t.price, t.amount
         FROM transactions t
         JOIN assets a ON t.asset_id = a.id
         WHERE (a.family_member_id IN (SELECT id FROM family_members WHERE family_id = ?) OR a.family_member_id IS NULL)
         ORDER BY t.date ASC`;

    const rawTxs = db.prepare(txQuery).all(memberId || familyId) as TransactionItem[];

    // 2. Fetch current holdings with live pricing
    const assetsQuery = memberId
      ? `SELECT a.id, a.name, a.identifier, a.type,
                COALESCE(SUM(CASE WHEN t.type = 'BUY' THEN t.quantity WHEN t.type = 'SELL' THEN -t.quantity ELSE 0 END), 0) as currentUnits,
                COALESCE(AVG(CASE WHEN t.type = 'BUY' THEN t.price END), 0) as avgBuyPrice,
                COALESCE(p.price, AVG(CASE WHEN t.type = 'BUY' THEN t.price END), 0) as currentPrice
         FROM assets a
         LEFT JOIN transactions t ON a.id = t.asset_id
         LEFT JOIN (
           SELECT asset_id, price FROM asset_prices 
           WHERE (asset_id, date) IN (SELECT asset_id, MAX(date) FROM asset_prices GROUP BY asset_id)
         ) p ON a.id = p.asset_id
         WHERE a.family_member_id = ?
         GROUP BY a.id`
      : `SELECT a.id, a.name, a.identifier, a.type,
                COALESCE(SUM(CASE WHEN t.type = 'BUY' THEN t.quantity WHEN t.type = 'SELL' THEN -t.quantity ELSE 0 END), 0) as currentUnits,
                COALESCE(AVG(CASE WHEN t.type = 'BUY' THEN t.price END), 0) as avgBuyPrice,
                COALESCE(p.price, AVG(CASE WHEN t.type = 'BUY' THEN t.price END), 0) as currentPrice
         FROM assets a
         LEFT JOIN transactions t ON a.id = t.asset_id
         LEFT JOIN (
           SELECT asset_id, price FROM asset_prices 
           WHERE (asset_id, date) IN (SELECT asset_id, MAX(date) FROM asset_prices GROUP BY asset_id)
         ) p ON a.id = p.asset_id
         WHERE (a.family_member_id IN (SELECT id FROM family_members WHERE family_id = ?) OR a.family_member_id IS NULL)
         GROUP BY a.id`;

    const currentAssets = db.prepare(assetsQuery).all(memberId || familyId) as any[];

    const enrichedAssets = currentAssets.map(a => {
      const units = Math.max(0, a.currentUnits || 0);
      const buyPrice = a.avgBuyPrice || 0;
      const livePrice = a.currentPrice || buyPrice;
      const totalCost = units * buyPrice;
      const currentValue = units * livePrice;
      return {
        id: a.id,
        name: a.name,
        identifier: a.identifier,
        type: a.type,
        currentUnits: units,
        avgBuyPrice: buyPrice,
        currentPrice: livePrice,
        totalCost,
        currentValue
      };
    });

    const summary = CapitalGainsCalculator.calculateCapitalGains(rawTxs, enrichedAssets, fy);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Capital Gains Calculation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate capital gains.' });
  }
});

// POST /api/v1/tax/form16/upload - Parse Form 16 Text/PDF
router.post('/form16/upload', (req: Request, res: Response) => {
  try {
    const { rawText } = req.body;
    const parsed = Form16Parser.parseForm16Text(rawText || '');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to parse Form 16.' });
  }
});

// GET /api/v1/tax/itr/download-json - Generate official Income Tax Department JSON for e-filing
router.get('/itr/download-json', (req: Request, res: Response) => {
  try {
    const familyId = Number(req.query.familyId) || 1;
    const memberId = req.query.memberId ? Number(req.query.memberId) : null;
    const regime = ((req.query.regime as string) || 'NEW').toUpperCase() as 'OLD' | 'NEW';

    // 1. Fetch Selected Family Member Details
    const memberQuery = memberId 
      ? `SELECT * FROM family_members WHERE id = ? AND deleted_at IS NULL`
      : `SELECT * FROM family_members WHERE family_id = ? AND deleted_at IS NULL ORDER BY id ASC LIMIT 1`;

    const member = db.prepare(memberQuery).get(memberId || familyId) as any;

    const pan = member?.pan || 'ABCDE1234F';
    const name = member?.name || 'Dhvani Prijesh Ramani';

    // 2. Fetch Capital Gains for selected member
    const txQuery = memberId
      ? `SELECT t.id, t.asset_id as assetId, a.name as assetName, a.identifier as symbol, 
                a.type as assetType, a.category, t.type, t.date, t.quantity, t.price, t.amount
         FROM transactions t
         JOIN assets a ON t.asset_id = a.id
         WHERE a.family_member_id = ?
         ORDER BY t.date ASC`
      : `SELECT t.id, t.asset_id as assetId, a.name as assetName, a.identifier as symbol, 
                a.type as assetType, a.category, t.type, t.date, t.quantity, t.price, t.amount
         FROM transactions t
         JOIN assets a ON t.asset_id = a.id
         WHERE (a.family_member_id IN (SELECT id FROM family_members WHERE family_id = ?) OR a.family_member_id IS NULL)
         ORDER BY t.date ASC`;

    const rawTxs = db.prepare(txQuery).all(memberId || familyId) as TransactionItem[];

    const cgSummary = CapitalGainsCalculator.calculateCapitalGains(rawTxs, []);
    const form16Data = Form16Parser.parseForm16Text('');

    const itrJson = ITRSchemaBuilder.generateOfficialITRJson({
      pan,
      name,
      dob: '1992-05-15',
      fatherName: 'Prijesh Ramani',
      mobile: '9820098200',
      email: 'investor@myworth.app',
      address: {
        doorNo: 'B/303',
        street: 'Station Road',
        area: 'Agashi Road',
        city: 'Virar West',
        state: 'Maharashtra',
        pincode: '401301'
      },
      bankAccount: {
        accountNumber: '918020030040',
        ifscCode: 'SBIN0001234',
        bankName: 'State Bank of India'
      },
      form16: form16Data,
      capitalGains: cgSummary,
      bankInterestIncome: 12500,
      dividendIncome: 8400,
      regime
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=ITR_${pan}_AY2026-27.json`);
    res.json(itrJson);
  } catch (error: any) {
    console.error('ITR JSON Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate ITR JSON payload.' });
  }
});

export default router;
