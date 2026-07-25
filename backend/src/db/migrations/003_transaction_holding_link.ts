import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

const VALID_ASSET_TYPES = new Set([
  'STOCK', 'MUTUAL_FUND', 'ETF', 'BOND', 'FD', 'PPF', 'EPF', 'NPS', 'SSA', 'BANK', 'GOLD', 'REAL_ESTATE', 'CRYPTO', 'OTHER'
]);

function normalizeAssetType(legacyType: string | null | undefined): string {
  if (!legacyType) return 'OTHER';
  const upper = legacyType.toUpperCase().trim();
  if (upper === 'BANK_ACCOUNT') return 'BANK';
  if (upper === 'PF') return 'EPF';
  if (VALID_ASSET_TYPES.has(upper)) return upper;
  return 'OTHER';
}

export const migration003: Migration = {
  version: 3,
  name: '003_transaction_holding_link',
  up: (db: Database.Database) => {
    // 1. Add holding_id column to transactions table if it doesn't already exist
    const columns = db.prepare("PRAGMA table_info(transactions)").all() as { name: string }[];
    const hasHoldingId = columns.some(col => col.name === 'holding_id');

    if (!hasHoldingId) {
      db.prepare(`
        ALTER TABLE transactions ADD COLUMN holding_id INTEGER REFERENCES holdings(id)
      `).run();
    }

    // 2. Deterministic Backfill Strategy for Unlinked Legacy Transactions
    const unlinkedTxs = db.prepare(`
      SELECT * FROM transactions WHERE holding_id IS NULL
    `).all() as { id: number; asset_id: number }[];

    if (unlinkedTxs.length > 0) {
      // Find or create [System Migration Default] ownership hierarchy
      let family = db.prepare("SELECT id FROM families WHERE deleted_at IS NULL ORDER BY id ASC LIMIT 1").get() as { id: number } | undefined;
      if (!family) {
        const fRes = db.prepare("INSERT INTO families (name, currency) VALUES ('Default Family', 'INR')").run();
        family = { id: Number(fRes.lastInsertRowid) };
      }

      let member = db.prepare("SELECT id FROM family_members WHERE family_id = ? AND deleted_at IS NULL ORDER BY id ASC LIMIT 1").get(family.id) as { id: number } | undefined;
      if (!member) {
        const mRes = db.prepare("INSERT INTO family_members (family_id, name, relationship) VALUES (?, 'Primary Member', 'SELF')").run(family.id);
        member = { id: Number(mRes.lastInsertRowid) };
      }

      let entity = db.prepare("SELECT id FROM entities WHERE family_member_id = ? AND deleted_at IS NULL ORDER BY id ASC LIMIT 1").get(member.id) as { id: number } | undefined;
      if (!entity) {
        const eRes = db.prepare("INSERT INTO entities (family_member_id, name, entity_type) VALUES (?, 'Primary Individual', 'INDIVIDUAL')").run(member.id);
        entity = { id: Number(eRes.lastInsertRowid) };
      }

      let account = db.prepare("SELECT id FROM accounts WHERE entity_id = ? AND deleted_at IS NULL ORDER BY id ASC LIMIT 1").get(entity.id) as { id: number } | undefined;
      if (!account) {
        const aRes = db.prepare(`
          INSERT INTO accounts (entity_id, account_name, account_type, nickname) 
          VALUES (?, '[System Migration Default] Primary Account', 'OTHER', 'Migration Default')
        `).run(entity.id);
        account = { id: Number(aRes.lastInsertRowid) };
      }

      const updateStmt = db.prepare("UPDATE transactions SET holding_id = ? WHERE id = ?");

      for (const tx of unlinkedTxs) {
        // Resolve or create holding for asset_id
        let holding = db.prepare("SELECT id FROM holdings WHERE account_id = ? AND asset_id = ? AND deleted_at IS NULL LIMIT 1").get(account.id, tx.asset_id) as { id: number } | undefined;

        if (!holding) {
          // Check if asset exists in assets_master
          let masterAsset = db.prepare("SELECT id FROM assets_master WHERE id = ? AND deleted_at IS NULL").get(tx.asset_id) as { id: number } | undefined;
          if (!masterAsset) {
            // Check legacy assets table and copy into assets_master if necessary
            const legacyAsset = db.prepare("SELECT * FROM assets WHERE id = ?").get(tx.asset_id) as any;
            if (legacyAsset) {
              const mappedType = normalizeAssetType(legacyAsset.type);
              const amRes = db.prepare(`
                INSERT INTO assets_master (id, asset_type, name, display_name, symbol, currency)
                VALUES (?, ?, ?, ?, ?, 'INR')
              `).run(legacyAsset.id, mappedType, legacyAsset.name, legacyAsset.name, legacyAsset.identifier || null);
              masterAsset = { id: Number(amRes.lastInsertRowid) };
            } else {
              const amRes = db.prepare(`
                INSERT INTO assets_master (asset_type, name, display_name, currency)
                VALUES ('OTHER', 'Unlinked Legacy Asset ' || ?, 'Legacy Asset', 'INR')
              `).run(tx.asset_id);
              masterAsset = { id: Number(amRes.lastInsertRowid) };
            }
          }

          const hRes = db.prepare(`
            INSERT INTO holdings (account_id, asset_id, status)
            VALUES (?, ?, 'OPEN')
          `).run(account.id, masterAsset.id);
          holding = { id: Number(hRes.lastInsertRowid) };
        }

        updateStmt.run(holding.id, tx.id);
      }
    }

    // 3. Create index on holding_id
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_transactions_holding_id ON transactions(holding_id)
    `).run();
  },
  down: (db: Database.Database) => {
    db.prepare("DROP INDEX IF EXISTS idx_transactions_holding_id").run();
  }
};
