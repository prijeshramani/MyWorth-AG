import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parsePdfStatement } from '../services/pdfParser';
import { parseCsvStatement } from '../services/csvParser';
import { parseZerodhaXmlStatement } from '../services/xmlParser';
import { parseExcelStatement } from '../services/excelParser';
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
  getUpstoxCredentials,
  saveUpstoxCredentials,
  getUpstoxLoginUrl,
  exchangeUpstoxCode,
  syncUpstoxHoldingsWithStoredToken
} from '../services/upstoxService';
import { saveIndMoneyCredentials, saveIndMoneyAccessToken, getIndMoneyCredentials, fetchIndMoneyHoldings, syncIndMoneyHoldings } from '../services/indmoneyService';
import { assetRepository } from '../repositories/SQLiteAssetRepository';
import { transactionRepository } from '../repositories/SQLiteTransactionRepository';
import { db } from '../db';

const router = Router();

// Configure multer to upload file in memory buffer (safe, stays local in RAM)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/import/parse - Ingest PDF/CSV/XML/Excel, decrypt, extract raw text & transactions
router.post('/parse', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const password = req.body.password as string | undefined;
    const fileNameLower = req.file.originalname.toLowerCase();
    const mimeLower = req.file.mimetype.toLowerCase();

    const isCsv = fileNameLower.endsWith('.csv') || mimeLower === 'text/csv';
    const isXml = fileNameLower.endsWith('.xml') || mimeLower === 'text/xml' || mimeLower === 'application/xml';
    const isXlsx = fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls') || mimeLower.includes('spreadsheet') || mimeLower.includes('excel') || mimeLower.includes('ms-excel');

    console.log(`Parsing uploaded statement: name=${req.file.originalname}, size=${req.file.size} bytes, format=${isCsv ? 'CSV' : isXml ? 'XML' : isXlsx ? 'XLS/XLSX' : 'PDF'}, hasPassword=${!!password}`);

    let result;
    if (isCsv) {
      result = parseCsvStatement(req.file.buffer);
    } else if (isXml) {
      result = parseZerodhaXmlStatement(req.file.buffer);
    } else if (isXlsx) {
      result = await parseExcelStatement(req.file.buffer, password);
    } else {
      result = await parsePdfStatement(req.file.buffer, password);
    }

    // Dry run matching against existing DB assets via Repositories
    const enrichedTransactions = result.transactions.map(tx => {
      // Find asset by identifier or name
      let existingAsset = null;
      
      if (tx.identifier) {
        existingAsset = assetRepository.findByNameIdentifierType(tx.assetName, tx.identifier, tx.assetType);
      }

      if (!existingAsset) {
        existingAsset = assetRepository.findByNameAndType(tx.assetName, tx.assetType);
      }

      // Check if this identical transaction is already in DB
      let isDuplicate = false;
      if (existingAsset) {
        const txDuplicate = transactionRepository.findDuplicate(
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
        statementType: result.statementType,
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
    const { transactions, familyMemberId } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'No transactions to import provided' });
    }

    const memberId = familyMemberId ? Number(familyMemberId) : null;
    let assetsCreated = 0;
    let transactionsImported = 0;
    let positionsUpdated = 0;
    let duplicatesSkipped = 0;

    // Execute import in a strict SQLite transaction
    const processImport = db.transaction(() => {
      for (const tx of transactions) {
        let assetId = tx.assetId;

        // 1. If asset does not exist in DB, create it with family_member_id
        if (!assetId) {
          let existing = null;
          if (tx.identifier) {
            existing = db.prepare('SELECT id FROM assets WHERE identifier = ? AND LOWER(name) = LOWER(?) AND type = ?').get(tx.identifier, tx.assetName, tx.assetType || 'STOCK') as { id: number } | undefined;
          }
          if (!existing) {
            existing = db.prepare('SELECT id FROM assets WHERE LOWER(name) = LOWER(?) AND type = ?').get(tx.assetName, tx.assetType || 'STOCK') as { id: number } | undefined;
          }

          if (existing) {
            assetId = existing.id;
            if (memberId) {
              db.prepare('UPDATE assets SET family_member_id = ? WHERE id = ?').run(memberId, assetId);
            }
          } else {
            const result = db.prepare(`
              INSERT INTO assets (name, type, category, identifier, family_member_id)
              VALUES (?, ?, ?, ?, ?)
            `).run(tx.assetName, tx.assetType || 'STOCK', tx.category || 'Stocks', tx.identifier || null, memberId);
            assetId = Number(result.lastInsertRowid);
            assetsCreated++;
          }
        } else if (memberId) {
          db.prepare('UPDATE assets SET family_member_id = ? WHERE id = ?').run(memberId, assetId);
        }

        // 2. Upsert price on transaction date (using current live market price if present)
        const marketPriceToSave = (typeof tx.currentPrice === 'number' && tx.currentPrice > 0) ? tx.currentPrice : tx.price;
        db.prepare(`
          INSERT OR REPLACE INTO asset_prices (asset_id, date, price)
          VALUES (?, ?, ?)
        `).run(assetId, tx.date, marketPriceToSave);

        // 3. Skip opening balance transactions if prior transactions already exist for this asset
        if (tx.isOpeningBalance) {
          const priorTx = db.prepare(`
            SELECT id FROM transactions 
            WHERE asset_id = ? AND date < ? 
            LIMIT 1
          `).get(assetId, tx.date);

          if (priorTx) {
            console.log(`Skipping opening balance transaction on ${tx.date} for asset #${assetId} (${tx.assetName}) as prior transactions exist.`);
            duplicatesSkipped++;
            continue;
          }
        }

        // 4. Check for duplicate transaction (exact date match or holdings position match)
        const duplicate = transactionRepository.findDuplicate(
          assetId,
          tx.type || 'BUY',
          tx.date,
          tx.quantity,
          tx.price,
          tx.amount
        );

        if (duplicate) {
          duplicatesSkipped++;
          continue; // Skip double importing transaction
        }

        // Check if there is an existing baseline holdings transaction for this asset whose position/price was updated by broker sync
        const existingHoldingsTx = db.prepare(`
          SELECT id, source FROM transactions 
          WHERE asset_id = ? AND type = 'BUY'
          ORDER BY id DESC LIMIT 1
        `).get(assetId) as { id: number; source: string } | undefined;

        const allowedSources = ['PDF_IMPORT', 'MANUAL', 'BANK_INSIGHTS'];
        const sourceTag = (tx.source && allowedSources.includes(tx.source)) ? tx.source : 'PDF_IMPORT';
        const stType = (tx.statementType || tx.source || '').toUpperCase();
        const isOrderBookOrTax = stType.includes('ORDER') || stType.includes('TRADE') || stType.includes('TAX') || stType.includes('BOOK');
        const isHoldingsType = !isOrderBookOrTax && (
          stType.includes('HOLDINGS') || 
          ['ANGELONE', 'ZERODHA', 'UPSTOX', 'INDMONEY', 'KITE'].some(b => stType.includes(b))
        );

        if (existingHoldingsTx && isHoldingsType) {
          // Update existing holdings baseline transaction to reflect latest position quantity & average buy price
          db.prepare(`
            UPDATE transactions 
            SET date = ?, quantity = ?, price = ?, amount = ?, source = ?
            WHERE id = ?
          `).run(tx.date, tx.quantity, tx.price, tx.amount, sourceTag, existingHoldingsTx.id);
          positionsUpdated++;
          continue;
        }

        // 4. Insert transaction
        db.prepare(`
          INSERT INTO transactions (asset_id, type, date, quantity, price, amount, source)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(assetId, tx.type || 'BUY', tx.date, tx.quantity, tx.price, tx.amount, sourceTag);

        transactionsImported++;
      }
    });

    processImport();

    res.json({
      success: true,
      assetsCreated,
      transactionsImported,
      positionsUpdated,
      duplicatesSkipped,
      totalProcessed: transactions.length
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
function enrichAndMapTransactions(rawTxs: any[], statementType?: string) {
  return rawTxs.map(tx => {
    let existingAsset = null;
    if (tx.identifier) {
      existingAsset = db.prepare(`
        SELECT id, name, category FROM assets 
        WHERE identifier = ? AND type = ?
      `).get(tx.identifier, tx.assetType || 'STOCK') as { id: number; name: string; category: string } | undefined;
    }
    if (!existingAsset) {
      existingAsset = db.prepare(`
        SELECT id, name, category FROM assets 
        WHERE LOWER(name) = LOWER(?) AND type = ?
      `).get(tx.assetName, tx.assetType || 'STOCK') as { id: number; name: string; category: string } | undefined;
    }

    let isDuplicate = false;
    if (existingAsset) {
      const txDuplicate = transactionRepository.findDuplicate(
        existingAsset.id,
        tx.type || 'BUY',
        tx.date,
        tx.quantity,
        tx.price,
        tx.amount
      );
      isDuplicate = !!txDuplicate;
    }

    return {
      ...tx,
      statementType: statementType || tx.statementType,
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
    const enriched = enrichAndMapTransactions(transactions, 'ZERODHA_HOLDINGS');
    
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
    
    const enriched = enrichAndMapTransactions(transactions, 'ZERODHA_HOLDINGS');
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
    const enriched = enrichAndMapTransactions(transactions, 'ANGELONE_HOLDINGS');
    
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
    const { familyMemberId } = req.body || {};
    const stats = await syncBankInsightsTransactions(familyMemberId ? Number(familyMemberId) : undefined);
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

// POST /api/import/indmoney/config - Save INDMoney credentials (API Key/Secret, TOTP Secret, or Access Token)
router.post('/indmoney/config', (req: Request, res: Response) => {
  try {
    const { clientId, apiSecret, totpSecret, accessToken } = req.body;
    if (!accessToken && (!clientId || !apiSecret || !totpSecret)) {
      return res.status(400).json({ error: 'Provide either Access Token OR (Client ID, API Secret, and TOTP Secret Key).' });
    }
    saveIndMoneyCredentials(clientId || '', apiSecret || '', totpSecret || '', accessToken || '');
    res.json({ success: true, message: 'INDMoney credentials saved locally.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/import/indmoney/sync - Sync holdings from INDstocks API using stored TOTP credentials or token
router.post('/indmoney/sync', async (req: Request, res: Response) => {
  try {
    const { token, accessToken } = req.body || {};
    const transactions = await syncIndMoneyHoldings(accessToken || token);
    const enriched = enrichAndMapTransactions(transactions, 'INDMONEY_HOLDINGS');
    
    res.json({
      success: true,
      statementType: 'INDMONEY_HOLDINGS',
      transactions: enriched,
      rawText: `INDMoney sync - Success\nTotal Holdings: ${transactions.length}`
    });
  } catch (error: any) {
    console.error('INDMoney Sync Ingestion Error:', error);
    const statusCode = error.message?.includes('Token Expired') || error.message?.includes('Invalid') || error.message?.includes('Failed') ? 400 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to sync with INDMoney API.' });
  }
});

// GET /api/import/upstox/config - Retrieve current Upstox configuration status
router.get('/upstox/config', (req: Request, res: Response) => {
  try {
    const creds = getUpstoxCredentials();
    res.json(creds);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/import/upstox/config - Save Upstox API credentials
router.post('/upstox/config', (req: Request, res: Response) => {
  try {
    const { apiKey, apiSecret, redirectUri } = req.body;
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: 'Both API Key and API Secret are required.' });
    }
    saveUpstoxCredentials(apiKey, apiSecret, redirectUri);
    res.json({ success: true, message: 'Upstox API credentials saved locally.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/import/upstox/login-url - Get Upstox redirect login URL
router.get('/upstox/login-url', (req: Request, res: Response) => {
  try {
    const loginUrl = getUpstoxLoginUrl();
    res.json({ loginUrl });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/import/upstox/session - Exchange authorization code for holdings
router.post('/upstox/session', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Authorization Code is required.' });
    }

    const transactions = await exchangeUpstoxCode(code);
    const enriched = enrichAndMapTransactions(transactions, 'UPSTOX_HOLDINGS');

    res.json({
      statementType: 'UPSTOX_HOLDINGS',
      transactions: enriched,
      rawText: `Upstox Developer API Sync - Success\nTotal Holdings: ${transactions.length}`
    });
  } catch (error: any) {
    console.error('Upstox Session Ingestion Error:', error);
    res.status(500).json({ error: error.message || 'Failed to exchange Upstox authorization code.' });
  }
});

// POST /api/import/upstox/sync - Perform holdings sync with stored access token
router.post('/upstox/sync', async (req: Request, res: Response) => {
  try {
    const transactions = await syncUpstoxHoldingsWithStoredToken();
    const enriched = enrichAndMapTransactions(transactions, 'UPSTOX_HOLDINGS');

    res.json({
      success: true,
      statementType: 'UPSTOX_HOLDINGS',
      transactions: enriched,
      rawText: `Upstox API Background Sync - Success\nTotal Holdings: ${transactions.length}`
    });
  } catch (error: any) {
    console.error('Upstox Stored Token Sync Error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync with stored Upstox token.' });
  }
});

export default router;
