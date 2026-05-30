import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db';

const DEFAULT_DB_PATH = 'C:\\Users\\prije\\BankInsights - Copy\\bank-insights-backup-2026-04-27.sqlite3';

// Save custom path in credentials key-value table
export function saveBankInsightsPath(dbPath: string): void {
  db.prepare('INSERT OR REPLACE INTO credentials (key, value) VALUES (?, ?)').run('bankinsights_db_path', dbPath);
}

// Get configured path
export function getBankInsightsPath(): string {
  const row = db.prepare('SELECT value FROM credentials WHERE key = ?').get('bankinsights_db_path') as { value: string } | undefined;
  return row?.value || DEFAULT_DB_PATH;
}

// Execute synchronization
export async function syncBankInsightsTransactions(): Promise<{
  success: boolean;
  importedCount: number;
  duplicatesSkipped: number;
  latestBalance: number;
}> {
  const biDbPath = getBankInsightsPath();
  console.log(`Syncing BankInsights from: ${biDbPath}`);

  if (!fs.existsSync(biDbPath)) {
    throw new Error(`BankInsights SQLite database not found at: ${biDbPath}. Please check your path configuration.`);
  }

  let biDb: any;
  try {
    biDb = new Database(biDbPath, { readonly: true });
  } catch (err: any) {
    throw new Error(`Failed to open BankInsights SQLite file: ${err.message}`);
  }

  try {
    // 1. Fetch all transactions chronologically from BankInsights
    const biTransactions = biDb.prepare(`
      SELECT id, date, description, category, amount, direction, balance 
      FROM transactions
      ORDER BY date ASC, id ASC
    `).all() as Array<{
      id: string;
      date: string;
      description: string;
      category: string;
      amount: number;
      direction: string;
      balance: number;
    }>;

    console.log(`Fetched ${biTransactions.length} total transactions from BankInsights.`);

    if (biTransactions.length === 0) {
      return {
        success: true,
        importedCount: 0,
        duplicatesSkipped: 0,
        latestBalance: 0
      };
    }

    // 2. Find or create the BankInsights Account asset in MyWorth
    let assetRow = db.prepare(`
      SELECT id FROM assets WHERE name = ? AND type = ?
    `).get('BankInsights Account', 'BANK_ACCOUNT') as { id: number } | undefined;

    let assetId: number;
    if (assetRow) {
      assetId = assetRow.id;
    } else {
      const insAsset = db.prepare(`
        INSERT INTO assets (name, type, category, identifier)
        VALUES ('BankInsights Account', 'BANK_ACCOUNT', 'Cash', 'BANK_INSIGHTS')
      `).run();
      assetId = Number(insAsset.lastInsertRowid);
      console.log(`Created new BankInsights Account asset with ID: ${assetId}`);
    }

    let importedCount = 0;
    let duplicatesSkipped = 0;
    let latestBalance = 0;
    let latestTxDate = '';

    // Prepared statements for faster execution
    const checkDuplicate = db.prepare(`
      SELECT id FROM transactions
      WHERE asset_id = ? AND date = ? AND narration = ? AND amount = ? AND type = ?
    `);

    const insertTx = db.prepare(`
      INSERT INTO transactions (asset_id, type, date, quantity, price, amount, source, narration, tx_category)
      VALUES (?, ?, ?, 1.0, ?, ?, 'BANK_INSIGHTS', ?, ?)
    `);

    const upsertPrice = db.prepare(`
      INSERT OR REPLACE INTO asset_prices (asset_id, date, price)
      VALUES (?, ?, ?)
    `);

    // 3. Perform ingestion inside a strict SQLite transaction
    const processSync = db.transaction(() => {
      for (const tx of biTransactions) {
        const txType = tx.direction.toLowerCase() === 'credit' ? 'CREDIT' : 'DEBIT';
        const absAmount = Math.abs(tx.amount);
        const narration = tx.description || 'Unspecified Narration';
        const txCategory = tx.category || 'Uncategorized';

        // Check if identical transaction is already imported in MyWorth
        const dupRow = checkDuplicate.get(
          assetId,
          tx.date,
          narration,
          absAmount,
          txType
        );

        if (dupRow) {
          duplicatesSkipped++;
        } else {
          // Insert transaction
          insertTx.run(
            assetId,
            txType,
            tx.date,
            absAmount, // price
            absAmount, // amount
            narration,
            txCategory
          );
          importedCount++;
        }

        // Upsert running balance as the price for this asset on that date
        upsertPrice.run(assetId, tx.date, tx.balance);

        // Keep track of latest balance and date chronologically
        if (!latestTxDate || tx.date >= latestTxDate) {
          latestTxDate = tx.date;
          latestBalance = tx.balance;
        }
      }
    });

    processSync();

    console.log(`Sync completed: ${importedCount} imported, ${duplicatesSkipped} duplicates skipped. Latest balance: Rs. ${latestBalance}`);

    return {
      success: true,
      importedCount,
      duplicatesSkipped,
      latestBalance
    };
  } finally {
    try {
      biDb.close();
    } catch {}
  }
}
