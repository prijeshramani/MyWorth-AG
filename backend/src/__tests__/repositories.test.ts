import { assetRepository } from '../repositories/SQLiteAssetRepository';
import { transactionRepository } from '../repositories/SQLiteTransactionRepository';
import { priceRepository } from '../repositories/SQLitePriceRepository';
import { credentialRepository } from '../repositories/SQLiteCredentialRepository';

describe('Repository Layer Functionality', () => {
  let createdAssetId: number;

  it('should create and retrieve an asset via SQLiteAssetRepository', () => {
    const asset = assetRepository.create({
      name: 'Test Test Fund',
      type: 'MUTUAL_FUND',
      category: 'Equity',
      identifier: 'INF000000001'
    });

    expect(asset.id).toBeDefined();
    expect(asset.name).toBe('Test Test Fund');
    createdAssetId = asset.id;

    const fetched = assetRepository.findById(createdAssetId);
    expect(fetched).not.toBeNull();
    expect(fetched?.identifier).toBe('INF000000001');
  });

  it('should create and retrieve transactions via SQLiteTransactionRepository', () => {
    const tx = transactionRepository.create({
      asset_id: createdAssetId,
      type: 'BUY',
      date: '2026-07-25',
      quantity: 10,
      price: 100,
      amount: 1000,
      source: 'MANUAL'
    });

    expect(tx.id).toBeDefined();
    expect(tx.amount).toBe(1000);

    const assetTxs = transactionRepository.findByAssetId(createdAssetId);
    expect(assetTxs.length).toBeGreaterThan(0);
  });

  it('should upsert and retrieve historical price entries via SQLitePriceRepository', () => {
    priceRepository.upsertPrice(createdAssetId, '2026-07-25', 105.5);

    const latest = priceRepository.findLatestPrice(createdAssetId);
    expect(latest).not.toBeNull();
    expect(latest?.price).toBe(105.5);
  });

  it('should store and retrieve encrypted credentials via SQLiteCredentialRepository', () => {
    const secretKey = 'test_api_token_secret_key';
    credentialRepository.saveCredential('test_broker_token', secretKey);

    const retrieved = credentialRepository.getCredential('test_broker_token');
    expect(retrieved).toBe(secretKey);
  });

  afterAll(() => {
    if (createdAssetId) {
      assetRepository.delete(createdAssetId);
    }
  });
});
