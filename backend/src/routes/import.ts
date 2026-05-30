import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parsePdfStatement } from '../services/pdfParser';
import { parseNpsCsvStatement } from '../services/csvParser';
import { parseZerodhaXmlStatement } from '../services/xmlParser';
import { parseZerodhaHoldingsStatement } from '../services/excelParser';
import { 
  getKiteCredentials, 
  saveKiteCredentials, 
  getKiteLoginUrl, 
  exchangeKiteToken, 
  syncKiteHoldingsWithStoredToken 
} from '../services/kiteService';
import {
  getBankInsightsPath,
  saveBankInsightsPath,
  syncBankInsightsTransactions
} from '../services/bankinsightsService';
import {
  getAngelOneCredentials,
  saveAngelOneCredentials,
  syncAngelOneHoldings
} from '../services/angeloneService';
import {
  saveIndMoneyAccessToken,
  getIndMoneyCredentials,
  fetchIndMoneyHoldings
} from '../services/indmoneyService';
import { db } from '../db';

const router = Router();

// Configure multer to upload file in memory buffer (safe, stays local in RAM)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/import/parse - Ingest PDF/CSV/XML, decrypt, extract raw text & transactions
router.post('/parse', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const password = req.body.password as string | undefined;
    const isCsv = req.file.originalname.toLowerCase().endsWith('.csv') || req.file.mimetype === 'text/csv';
    const isXml = req.file.originalname.toLowerCase().endsWith('.xml') || req.file.mimetype === 'text/xml' || req.file.mimetype === 'application/xml';
    const isXlsx = req.file.originalname.toLowerCase().endsWith('.xlsx') || req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    console.log(`Parsing uploaded statement: name=${req.file.originalname}, size=${req.file.size} bytes, format=${isCsv ? 'CSV' : isXml ? 'XML' : isXlsx ? 'XLSX' : 'PDF'}, hasPassword=${!!password}`);

    let result;
    if (isCsv) {
      result = parseNpsCsvStatement(req.file.buffer);
    } else if (isXml) {
      result = parseZerodhaXmlStatement(req.file.buffer);
    } else if (isXlsx) {
      result = parseZerodhaHoldingsStatement(req.file.buffer);
    } else {
      result = await parsePdfStatement(req.file.buffer, password);
    }

    // Securely dump the extracted plain text to a local file for diagnostic regex refining
    try {
      const fs = require('fs');
      const path = require('path');
      const debugTextPath = path.resolve(__dirname, '../../../data/raw_cams_text.txt');
      fs.writeFileSync(debugTextPath, result.rawText, 'utf8');
      console.log(`Successfully dumped ${result.rawText.length} characters to local diagnostic log: data/raw_cams_text.txt`);
    } catch (writeErr) {
      console.error('Failed to write diagnostic raw text:', writeErr);
    }

    // Dry run matching against existing DB assets
    const enrichedTransactions = result.transactions.map(tx => {
      // Find asset by identifier or name
      let existingAsset = null;
      
      if (tx.identifier) {
        existingAsset = db.prepare(`
          SELECT id, name, category FROM assets 
          WHERE name = ? AND identifier = ? AND type = ?
        `).get(tx.assetName, tx.identifier, tx.assetType) as { id: number; name: string; category: string } | undefined;
      }

      if (!existingAsset) {
        existingAsset = db.prepare(`
          SELECT id, name, category FROM assets 
          WHERE name = ? AND type = ?
        `).get(tx.assetName, tx.assetType) as { id: number; name: string; category: string } | undefined;
      }

      // Check if this identical transaction is already in DB
      let isDuplicate = false;
      if (existingAsset) {
        const txDuplicate = db.prepare(`
          SELECT id FROM transactions 
          WHERE asset_id = ? AND type = ? AND date = ? AND quantity = ? AND price = ? AND amount = ?
        `).get(
          existingAsset.id,
          tx.type,
          tx.date,
          tx.quantity,
          tx.price,
          tx.amount
        );
        isDuplicate = !!txDuplicate;
      }

      return {
        ...tx,
        exists: !!existingAsset,
        assetId: existingAsset ? existingAsset.id : null,
        isDuplicate
      };
    });

    res.json({
      statementType: result.statementType,
      transactions: enrichedTransactions,
      rawText: result.rawText
    });
  } catch (error: any) {
    console.error('Import parse error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse PDF' });
  }
});

// POST /api/import/confirm - Commit the parsed transactions into the database
router.post('/confirm', (req: Request, res: Response) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'No transactions to import provided' });
    }

    let assetsCreated = 0;
    let transactionsImported = 0;
    let duplicatesSkipped = 0;

    // Execute import in a strict SQLite transaction
    const processImport = db.transaction(() => {
      for (const tx of transactions) {
        let assetId = tx.assetId;

        // 1. If asset does not exist in DB, create it
        if (!assetId) {
          // Check again inside transaction to prevent race conditions
          let existing = null;
          if (tx.identifier) {
            existing = db.prepare('SELECT id FROM assets WHERE name = ? AND identifier = ? AND type = ?').get(tx.assetName, tx.identifier, tx.assetType) as { id: number } | undefined;
          }
          if (!existing) {
            existing = db.prepare('SELECT id FROM assets WHERE name = ? AND type = ?').get(tx.assetName, tx.assetType) as { id: number } | undefined;
          }

          if (existing) {
            assetId = existing.id;
          } else {
            const result = db.prepare(`
              INSERT INTO assets (name, type, category, identifier)
              VALUES (?, ?, ?, ?)
            `).run(tx.assetName, tx.assetType, tx.category, tx.identifier || null);
            assetId = Number(result.lastInsertRowid);
            assetsCreated++;
          }
        }

        // 2. Check for duplicate transaction
        const duplicate = db.prepare(`
          SELECT id FROM transactions 
          WHERE asset_id = ? AND type = ? AND date = ? AND quantity = ? AND price = ? AND amount = ?
        `).get(assetId, tx.type, tx.date, tx.quantity, tx.price, tx.amount);

        if (duplicate) {
          duplicatesSkipped++;
          continue; // Skip double importing
        }

        // 3. Insert transaction
        db.prepare(`
          INSERT INTO transactions (asset_id, type, date, quantity, price, amount, source)
          VALUES (?, ?, ?, ?, ?, ?, 'PDF_IMPORT')
        `).run(assetId, tx.type, tx.date, tx.quantity, tx.price, tx.amount);

        // 4. Upsert price on transaction date
        db.prepare(`
          INSERT OR REPLACE INTO asset_prices (asset_id, date, price)
          VALUES (?, ?, ?)
        `).run(assetId, tx.date, tx.price);

        transactionsImported++;
      }
    });

    processImport();

    res.json({
      success: true,
      assetsCreated,
      transactionsImported,
      duplicatesSkipped
    });
  } catch (error: any) {
    console.error('Import confirm error:', error);
    res.status(500).json({ error: error.message || 'Failed to save imported transactions' });
  }
});

// GET /api/import/kite/config - Retrieve current Kite configuration status
router.get('/kite/config', (req: Request, res: Response) => {
  try {
    const creds = getKiteCredentials();
    res.json(creds);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/import/kite/config - Save Kite API Key and Secret
router.post('/kite/config', (req: Request, res: Response) => {
  try {
    const { apiKey, apiSecret } = req.body;
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: 'Both API Key and API Secret are required.' });
    }
    saveKiteCredentials(apiKey, apiSecret);
    res.json({ success: true, message: 'Kite Connect API credentials saved locally.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/import/kite/login-url - Get Zerodha redirect login URL
router.get('/kite/login-url', (req: Request, res: Response) => {
  try {
    const loginUrl = getKiteLoginUrl();
    res.json({ loginUrl });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Helper for checking duplicates
function enrichAndMapTransactions(rawTxs: any[]) {
  return rawTxs.map(tx => {
    let existingAsset = null;
    if (tx.identifier) {
      existingAsset = db.prepare(`
        SELECT id, name, category FROM assets 
        WHERE name = ? AND identifier = ? AND type = ?
      `).get(tx.assetName, tx.identifier, tx.assetType) as { id: number; name: string; category: string } | undefined;
    }
    if (!existingAsset) {
      existingAsset = db.prepare(`
        SELECT id, name, category FROM assets 
        WHERE name = ? AND type = ?
      `).get(tx.assetName, tx.assetType) as { id: number; name: string; category: string } | undefined;
    }

    let isDuplicate = false;
    if (existingAsset) {
      const txDuplicate = db.prepare(`
        SELECT id FROM transactions 
        WHERE asset_id = ? AND type = ? AND date = ? AND quantity = ? AND price = ? AND amount = ?
      `).get(
        existingAsset.id,
        tx.type,
        tx.date,
        tx.quantity,
        tx.price,
        tx.amount
      );
      isDuplicate = !!txDuplicate;
    }

    return {
      ...tx,
      exists: !!existingAsset,
      assetId: existingAsset ? existingAsset.id : null,
      isDuplicate
    };
  });
}

// POST /api/import/kite/session - Exchange request_token and fetch holdings
router.post('/kite/session', async (req: Request, res: Response) => {
  try {
    const { requestToken } = req.body;
    if (!requestToken) {
      return res.status(400).json({ error: 'Request Token is required.' });
    }
    
    const transactions = await exchangeKiteToken(requestToken);
    const enriched = enrichAndMapTransactions(transactions);
    
    res.json({
      statementType: 'ZERODHA_HOLDINGS',
      transactions: enriched,
      rawText: `Zerodha Kite API Sync - Success\nTotal Holdings: ${transactions.length}`
    });
  } catch (error: any) {
    console.error('Kite Session Ingestion Error:', error);
    res.status(500).json({ error: error.message || 'Failed to exchange Zerodha session token.' });
  }
});

// POST /api/import/kite/sync - Try to sync using stored token (if valid for today)
router.post('/kite/sync', async (req: Request, res: Response) => {
  try {
    const transactions = await syncKiteHoldingsWithStoredToken();
    if (!transactions) {
      return res.json({ success: false, reason: 'EXPIRED_OR_MISSING', message: 'No valid stored access token found for today.' });
    }
    
    const enriched = enrichAndMapTransactions(transactions);
    res.json({
      success: true,
      statementType: 'ZERODHA_HOLDINGS',
      transactions: enriched,
      rawText: `Zerodha Kite API Background Sync - Success\nTotal Holdings: ${transactions.length}`
    });
  } catch (error: any) {
    console.error('Kite Stored Token Sync Error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync with stored Zerodha token.' });
  }
});

// GET /api/import/angelone/config - Retrieve current AngelOne configuration status
router.get('/angelone/config', (req: Request, res: Response) => {
  try {
    const creds = getAngelOneCredentials();
    res.json(creds);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/import/angelone/config - Save AngelOne SmartAPI Credentials
router.post('/angelone/config', (req: Request, res: Response) => {
  try {
    const { clientCode, password, apiKey, totpSecret } = req.body;
    if (!clientCode || !password || !apiKey || !totpSecret) {
      return res.status(400).json({ error: 'All credentials (Client Code, Password, API Key, and TOTP Secret) are required.' });
    }
    saveAngelOneCredentials(clientCode, password, apiKey, totpSecret);
    res.json({ success: true, message: 'AngelOne SmartAPI credentials saved locally.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/import/angelone/sync - Perform holdings sync with SmartAPI
router.post('/angelone/sync', async (req: Request, res: Response) => {
  try {
    const transactions = await syncAngelOneHoldings();
    const enriched = enrichAndMapTransactions(transactions);
    
    res.json({
      success: true,
      statementType: 'ANGELONE_HOLDINGS',
      transactions: enriched,
      rawText: `AngelOne SmartAPI Sync - Success\nTotal Holdings: ${transactions.length}`
    });
  } catch (error: any) {
    console.error('AngelOne Sync Ingestion Error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync with AngelOne SmartAPI.' });
  }
});

// GET /api/import/bankinsights/config - Get configured BankInsights database path
router.get('/bankinsights/config', (req: Request, res: Response) => {
  try {
    const dbPath = getBankInsightsPath();
    res.json({ dbPath });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/import/bankinsights/config - Save custom BankInsights database path
router.post('/bankinsights/config', (req: Request, res: Response) => {
  try {
    const { dbPath } = req.body;
    if (!dbPath) {
      return res.status(400).json({ error: 'Database path is required.' });
    }
    saveBankInsightsPath(dbPath);
    res.json({ success: true, message: 'BankInsights database path updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/import/bankinsights/sync - Trigger high-speed local database sync
router.post('/bankinsights/sync', async (req: Request, res: Response) => {
  try {
    const stats = await syncBankInsightsTransactions();
    res.json(stats);
  } catch (error: any) {
    console.error('BankInsights Sync Error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync with BankInsights database.' });
  }
});

// GET /api/import/indmoney/config - Get INDMoney configuration status
router.get('/indmoney/config', (req: Request, res: Response) => {
  try {
    const creds = getIndMoneyCredentials();
    res.json(creds);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/import/indmoney/config - Save INDMoney access token
router.post('/indmoney/config', (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required.' });
    }
    saveIndMoneyAccessToken(accessToken);
    res.json({ success: true, message: 'INDMoney access token saved locally.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/import/indmoney/sync - Sync holdings from INDstocks API
router.post('/indmoney/sync', async (req: Request, res: Response) => {
  try {
    // Get stored token from credentials table
    const row = db.prepare('SELECT value FROM credentials WHERE key = ?').get('indmoney_access_token') as { value: string } | undefined;
    if (!row?.value) {
      return res.status(400).json({ error: 'INDMoney access token is not configured. Please save your API token first.' });
    }
    
    const transactions = await fetchIndMoneyHoldings(row.value);
    const enriched = enrichAndMapTransactions(transactions);
    
    res.json({
      success: true,
      statementType: 'INDMONEY_HOLDINGS',
      transactions: enriched,
      rawText: `INDMoney programmatic sync - Success\nTotal Holdings: ${transactions.length}`
    });
  } catch (error: any) {
    console.error('INDMoney Sync Ingestion Error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync with INDMoney API.' });
  }
});

export default router;
