import { initDb, db } from '../db';
import { encryptText, decryptText } from '../services/encryptionService';
import { assetRepository } from '../repositories/SQLiteAssetRepository';
import { transactionRepository } from '../repositories/SQLiteTransactionRepository';
import { priceRepository } from '../repositories/SQLitePriceRepository';
import { credentialRepository } from '../repositories/SQLiteCredentialRepository';
import { familyRepository } from '../repositories/SQLiteFamilyRepository';
import { familyMemberRepository } from '../repositories/SQLiteFamilyMemberRepository';
import { entityRepository } from '../repositories/SQLiteEntityRepository';
import { accountRepository } from '../repositories/SQLiteAccountRepository';
import { assetMasterRepository } from '../repositories/SQLiteAssetMasterRepository';
import { holdingRepository } from '../repositories/SQLiteHoldingRepository';
import { familyService } from '../services/FamilyService';
import { entityService } from '../services/EntityService';
import { accountService } from '../services/AccountService';
import { ownershipService } from '../services/OwnershipService';
import { assetMasterService } from '../services/AssetMasterService';
import { holdingService } from '../services/HoldingService';
import { runInTransaction } from '../db/transactionHelper';
import { AppError, ValidationError, NotFoundError } from '../errors/AppError';

// Sprint 1D Engines & Infrastructure
import { FinancialMath } from '../engines/common/FinancialMath';
import { engineRegistry } from '../engines/common/EngineRegistry';
import { transactionEngine } from '../engines/TransactionEngine';
import { RawTransactionInput } from '../engines/validators/TransactionValidator';

// Sprint 1E Valuation Engines & Infrastructure
import {
  CurrencyPrecision,
  marketCalendar,
  valuationRegistry,
  PriceSnapshot,
  ValuationContext
} from '../engines/valuation';

async function runTestSuite() {
  // Ensure database initialization & migrations
  initDb();

  console.log('\n==================================================');
  console.log(' RUNNING REGRESSION & SPRINT 1E VALUATION TESTS ');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Encryption Service Tests
  console.log('--- 1. Testing AES-256-GCM Encryption Service ---');
  const secretPayload = 'super_secret_broker_api_token_12345';
  const encrypted = encryptText(secretPayload);
  assert(encrypted !== secretPayload && encrypted.startsWith('enc:'), 'encryptText generates encrypted format with enc: prefix');
  
  const decrypted = decryptText(encrypted);
  assert(decrypted === secretPayload, 'decryptText restores original sensitive payload');

  const legacyText = 'unencrypted_legacy_token';
  assert(decryptText(legacyText) === legacyText, 'decryptText handles unencrypted legacy text transparently');

  // 2. Custom Error Hierarchy Tests
  console.log('\n--- 2. Testing Custom Error Hierarchy ---');
  const err = new ValidationError('Invalid asset payload');
  assert(err instanceof AppError, 'ValidationError extends AppError');
  assert(err.statusCode === 400 && err.errorCode === 'VALIDATION_ERROR', 'ValidationError has statusCode 400 and errorCode VALIDATION_ERROR');

  // 3. Sprint 1A Repositories
  console.log('\n--- 3. Testing Sprint 1A Repositories ---');
  const testAsset = assetRepository.create({
    name: 'Sprint 1A Unit Test Fund',
    type: 'MUTUAL_FUND',
    category: 'Equity',
    identifier: 'INF000000TEST'
  });
  assert(testAsset.id > 0 && testAsset.name === 'Sprint 1A Unit Test Fund', 'SQLiteAssetRepository creates new asset entity');

  const fetchedAsset = assetRepository.findById(testAsset.id);
  assert(fetchedAsset?.identifier === 'INF000000TEST', 'SQLiteAssetRepository fetches asset by ID');

  const testTx = transactionRepository.create({
    asset_id: testAsset.id,
    type: 'BUY',
    date: '2026-07-25',
    quantity: 50,
    price: 120,
    amount: 6000,
    source: 'MANUAL'
  });
  assert(testTx.id > 0 && testTx.amount === 6000, 'SQLiteTransactionRepository creates transaction entry');

  priceRepository.upsertPrice(testAsset.id, '2026-07-25', 125.5);
  const latestPrice = priceRepository.findLatestPrice(testAsset.id);
  assert(latestPrice?.price === 125.5, 'SQLitePriceRepository upserts and fetches price');

  credentialRepository.saveCredential('sprint1a_test_token', secretPayload);
  const retrievedToken = credentialRepository.getCredential('sprint1a_test_token');
  assert(retrievedToken === secretPayload, 'SQLiteCredentialRepository transparently encrypts & decrypts credential');

  assetRepository.delete(testAsset.id);
  assert(assetRepository.findById(testAsset.id) === null, 'SQLiteAssetRepository cascades asset deletion');

  // 4. Sprint 1B Ownership Hierarchy & Repositories (Family -> Member -> Entity -> Account)
  console.log('\n--- 4. Testing Sprint 1B Ownership Hierarchy Repositories & Soft-Delete ---');

  const testPan = 'ABCDE' + Math.floor(1000 + Math.random() * 9000) + 'F';

  const family = familyService.createFamily({ name: 'Sharma Family', currency: 'INR' });
  assert(family.id > 0 && family.name === 'Sharma Family', 'FamilyService creates Family');

  const fetchedFamily = familyService.getFamilyById(family.id);
  assert(fetchedFamily.currency === 'INR', 'FamilyService fetches Family by ID');

  const member = familyService.createFamilyMember({
    family_id: family.id,
    name: 'Rajesh Sharma',
    relationship: 'GRANDPARENT',
    date_of_birth: '1955-04-15'
  });
  assert(member.id > 0 && member.relationship === 'GRANDPARENT', 'FamilyService creates Family Member with extended Enum');

  const entity = entityService.createEntity({
    family_member_id: member.id,
    name: 'Rajesh Sharma HUF',
    entity_type: 'HUF',
    pan_number: testPan
  });
  assert(entity.id > 0 && entity.pan_number === testPan, 'EntityService creates Entity with valid PAN');

  let duplicatePanCaught = false;
  try {
    entityService.createEntity({
      family_member_id: member.id,
      name: 'Duplicate HUF',
      entity_type: 'HUF',
      pan_number: testPan
    });
  } catch (e: any) {
    duplicatePanCaught = e instanceof ValidationError && e.message.includes('already exists');
  }
  assert(duplicatePanCaught, 'EntityService rejects creation with duplicate active PAN');

  const account = accountService.createAccount({
    entity_id: entity.id,
    account_name: 'HDFCBANK Wealth Account',
    account_type: 'BANK',
    institution_name: 'HDFC Bank',
    account_number: '50100012345678',
    nickname: 'Emergency Pool'
  });
  assert(account.id > 0 && account.masked_account_number === '••••5678', 'AccountService creates Account with auto-masked account number');

  // 5. Ownership Chain Resolution
  console.log('\n--- 5. Testing Ownership Chain Resolution ---');
  const chain = ownershipService.resolveAccountOwnershipChain(account.id);
  assert(chain.family.name === 'Sharma Family', 'OwnershipService resolves top-level Family');
  assert(chain.familyMember.name === 'Rajesh Sharma', 'OwnershipService resolves Family Member');
  assert(chain.entity.name === 'Rajesh Sharma HUF', 'OwnershipService resolves Entity');
  assert(chain.account.account_name === 'HDFCBANK Wealth Account', 'OwnershipService resolves Account');

  // 6. Soft-Delete Verification
  console.log('\n--- 6. Testing Soft-Delete Behavior ---');
  accountService.softDeleteAccount(account.id);
  let softDeletedAccountCaught = false;
  try {
    accountService.getAccountById(account.id);
  } catch (e) {
    softDeletedAccountCaught = e instanceof NotFoundError;
  }
  assert(softDeletedAccountCaught, 'Soft-deleted Account is excluded from active repository queries');

  const rawAccountRow = db.prepare('SELECT * FROM accounts WHERE id = ?').get(account.id) as any;
  assert(rawAccountRow !== undefined && rawAccountRow.deleted_at !== null, 'Soft-deleted Account record is preserved in database with deleted_at timestamp');

  accountRepository.restore(account.id);
  assert(accountService.getAccountById(account.id).id === account.id, 'Repository restores soft-deleted entity');

  // 7. Repository Transaction Support Test
  console.log('\n--- 7. Testing Atomic Repository Transactions & Rollbacks ---');
  let transactionRolledBack = false;
  try {
    runInTransaction(() => {
      familyService.createFamily({ name: 'Temp Family' });
      throw new Error('Simulated transaction failure');
    });
  } catch (e: any) {
    transactionRolledBack = e.message === 'Simulated transaction failure';
  }
  assert(transactionRolledBack, 'runInTransaction executes atomic rollbacks on error');

  const tempFamilyCheck = familyRepository.findAll().find(f => f.name === 'Temp Family');
  assert(tempFamilyCheck === undefined, 'Atomic rollback leaves database state clean');

  // 8. Sprint 1C Asset Master & Holding Foundation Tests
  console.log('\n--- 8. Testing Sprint 1C Asset Master & Holding Foundation ---');

  const stockAsset = assetMasterService.createAsset({
    asset_type: 'STOCK',
    name: 'Reliance Industries Ltd',
    display_name: 'Reliance Industries',
    symbol: 'RELIANCE.NS',
    isin: 'INE002A01018',
    currency: 'INR',
    metadata: { exchange: 'NSE', sector: 'Energy' }
  });
  assert(stockAsset.id > 0 && stockAsset.isin === 'INE002A01018', 'AssetMasterService creates Master Asset with metadata');

  const deduplicatedIsin = assetMasterService.getOrCreateAsset({
    asset_type: 'STOCK',
    name: 'Reliance Industries Limited Different Name',
    display_name: 'RIL',
    isin: 'INE002A01018'
  });
  assert(!deduplicatedIsin.created && deduplicatedIsin.asset.id === stockAsset.id, '3-Tier Deduplication Priority 1 matches by ISIN');

  const holding = holdingService.createHolding({
    account_id: account.id,
    asset_id: stockAsset.id,
    opened_at: '2026-01-01',
    status: 'OPEN'
  });
  assert(holding.id > 0 && holding.account_id === account.id && holding.asset_id === stockAsset.id, 'HoldingService links Account to Master Asset');

  // 9. Pre-Sprint 1D Transaction Ownership Refactoring Tests
  console.log('\n--- 9. Testing Pre-Sprint 1D Transaction Holding Ownership ---');

  const holdingTx = transactionRepository.create({
    holding_id: holding.id,
    asset_id: stockAsset.id,
    type: 'BUY',
    date: '2026-07-25',
    quantity: 25,
    price: 3000,
    amount: 75000,
    source: 'MANUAL',
    narration: 'Zerodha buy trade'
  });
  assert(holdingTx.id > 0 && holdingTx.holding_id === holding.id, 'SQLiteTransactionRepository stores holding_id');

  const txsByHolding = transactionRepository.findByHoldingId(holding.id);
  assert(txsByHolding.length === 1 && txsByHolding[0].amount === 75000, 'findByHoldingId aggregates transactions by Holding');

  const txsByAccount = transactionRepository.findByAccount(account.id);
  assert(txsByAccount.length === 1 && txsByAccount[0].id === holdingTx.id, 'findByAccount aggregates transactions across Holdings by Account');

  const txsByEntity = transactionRepository.findByEntity(entity.id);
  assert(txsByEntity.length === 1 && txsByEntity[0].id === holdingTx.id, 'findByEntity aggregates transactions across Accounts by Entity');

  const txsByMember = transactionRepository.findByFamilyMember(member.id);
  assert(txsByMember.length === 1 && txsByMember[0].id === holdingTx.id, 'findByFamilyMember aggregates transactions across Entities by Family Member');

  // 10. Sprint 1D Transaction Engine Foundation Tests
  console.log('\n--- 10. Testing Sprint 1D Transaction Engine & Financial Infrastructure ---');

  assert(FinancialMath.roundMoney(100.456) === 100.46, 'FinancialMath.roundMoney rounds to 2 decimal places');
  assert(FinancialMath.roundUnits(10.123456) === 10.1235, 'FinancialMath.roundUnits rounds to 4 decimal places');
  assert(FinancialMath.safeDiv(100, 0, 0) === 0, 'FinancialMath.safeDiv handles zero denominator safely');

  const registeredEngine = engineRegistry.getEngine('TRANSACTION_ENGINE');
  assert(registeredEngine !== undefined && registeredEngine.metadata.id === 'TRANSACTION_ENGINE', 'EngineRegistry retrieves registered TRANSACTION_ENGINE');

  const testTxs: RawTransactionInput[] = [
    { id: 1, holding_id: holding.id, type: 'BUY', date: '2026-01-10', quantity: 100, price: 100, amount: 10000 },
    { id: 2, holding_id: holding.id, type: 'BUY', date: '2026-02-15', quantity: 100, price: 200, amount: 20000 },
    { id: 3, holding_id: holding.id, type: 'SELL', date: '2026-03-20', quantity: 50, price: 250, amount: 12500 },
    { id: 4, holding_id: holding.id, type: 'SPLIT', date: '2026-04-01', quantity: 2, price: 0, amount: 0 },
    { id: 5, holding_id: holding.id, type: 'BONUS', date: '2026-05-01', quantity: 100, price: 0, amount: 0 }
  ];

  const engineResult = transactionEngine.execute({
    correlationId: 'test_corr_1001',
    holdingId: holding.id,
    data: testTxs
  });

  assert(engineResult.success === true, 'TransactionEngine executes cleanly without validation errors');
  assert(engineResult.data?.summary.totalQuantity === 400, 'TransactionEngine tracks final quantity post buys, sell, split, and bonus (400 units)');
  assert(engineResult.data?.summary.totalCostBasis === 22500, 'TransactionEngine maintains total cost basis (22500)');
  assert(engineResult.data?.summary.averageCost === 56.25, 'TransactionEngine maintains average cost basis (56.25)');

  // 11. Sprint 1E Asset Valuation Foundation Tests
  console.log('\n--- 11. Testing Sprint 1E Asset Valuation Infrastructure & Strategies ---');

  // CurrencyPrecision & MarketCalendar Tests
  assert(CurrencyPrecision.roundPercent(12.3456) === 12.35, 'CurrencyPrecision.roundPercent rounds percentage accurately');
  assert(CurrencyPrecision.formatCurrency(5000, 'USD', 'en-US').includes('$5,000'), 'CurrencyPrecision.formatCurrency supports dynamic non-INR currencies');

  assert(marketCalendar.isTradingDay('2026-07-24') === true, 'MarketCalendar detects weekday Friday as trading day');
  assert(marketCalendar.isTradingDay('2026-07-26') === false, 'MarketCalendar detects weekend Sunday as non-trading day');
  assert(marketCalendar.isStalePrice('2026-07-01', '2026-07-26', 5) === true, 'MarketCalendar detects stale prices (>5 days)');

  // AssetTypeValuationRegistry Tests
  assert(valuationRegistry.hasStrategy('STOCK') === true, 'ValuationRegistry registers STOCK strategy');
  assert(valuationRegistry.hasStrategy('MUTUAL_FUND') === true, 'ValuationRegistry registers MUTUAL_FUND strategy');
  assert(valuationRegistry.hasStrategy('FD') === true, 'ValuationRegistry registers FD strategy');
  assert(valuationRegistry.hasStrategy('EPF') === true, 'ValuationRegistry registers EPF strategy');

  // Strategy 1: Equity (STOCK) Valuation
  const stockSnapshot: PriceSnapshot = { value: 3200, currency: 'INR', source: 'NSE', timestamp: '2026-07-25' };
  const stockValContext: ValuationContext = {
    assetId: stockAsset.id,
    assetType: 'STOCK',
    quantity: 100,
    costBasis: 250000,
    priceSnapshot: stockSnapshot,
    valuationDate: '2026-07-26'
  };
  const stockValResult = valuationRegistry.value(stockValContext);
  assert(stockValResult.success === true && stockValResult.marketValue === 320000, 'EquityValuationStrategy computes closing market value (100 * 3200 = 320000)');
  assert(stockValResult.unrealizedGain === 70000 && stockValResult.unrealizedGainPercent === 28, 'EquityValuationStrategy computes unrealized gain (70000 / 28%)');

  // Strategy 2: Mutual Fund Valuation
  const mfSnapshot: PriceSnapshot = { value: 150.5, currency: 'INR', source: 'AMFI', timestamp: '2026-07-25' };
  const mfValContext: ValuationContext = {
    assetType: 'MUTUAL_FUND',
    quantity: 1000,
    costBasis: 100000,
    priceSnapshot: mfSnapshot,
    valuationDate: '2026-07-26'
  };
  const mfValResult = valuationRegistry.value(mfValContext);
  assert(mfValResult.marketValue === 150500 && mfValResult.unrealizedGain === 50500, 'MutualFundValuationStrategy computes NAV market value');

  // Strategy 3: Fixed Deposit (FD) Compounding Interest Valuation
  const fdValContext: ValuationContext = {
    assetType: 'FD',
    quantity: 1,
    costBasis: 100000,
    valuationDate: '2027-01-01', // 1 year elapsed
    metadata: {
      interestRate: 10.0, // 10% annual rate
      compoundingFrequency: 'ANNUAL',
      startDate: '2026-01-01'
    }
  };
  const fdValResult = valuationRegistry.value(fdValContext);
  assert(fdValResult.marketValue === 110000, 'FixedDepositValuationStrategy computes 1-year annual compound interest (100000 @ 10% = 110000)');

  // Strategy 4: Provident Fund (EPF/PPF) Interest Accumulation
  const epfValContext: ValuationContext = {
    assetType: 'EPF',
    quantity: 1,
    costBasis: 200000,
    valuationDate: '2027-01-01',
    metadata: {
      interestRate: 8.25,
      startDate: '2026-01-01'
    }
  };
  const epfValResult = valuationRegistry.value(epfValContext);
  assert(epfValResult.marketValue === 216500, 'ProvidentFundValuationStrategy computes EPF 1-year interest accumulation (200000 @ 8.25% = 216500)');

  // Strategy 5: Gold Valuation (per gram)
  const goldSnapshot: PriceSnapshot = { value: 7500, currency: 'INR', source: 'BULLION', timestamp: '2026-07-25' };
  const goldValResult = valuationRegistry.value({
    assetType: 'GOLD',
    quantity: 50, // 50 grams
    costBasis: 300000,
    priceSnapshot: goldSnapshot,
    valuationDate: '2026-07-26'
  });
  assert(goldValResult.marketValue === 375000, 'GoldValuationStrategy computes per-gram bullion value (50g * 7500 = 375000)');

  // Strategy 6: Real Estate Valuation
  const reValResult = valuationRegistry.value({
    assetType: 'REAL_ESTATE',
    quantity: 1,
    costBasis: 5000000,
    valuationDate: '2026-07-26',
    metadata: {
      areaSqFt: 1200,
      pricePerSqFt: 6000
    }
  });
  assert(reValResult.marketValue === 7200000, 'RealEstateValuationStrategy computes property valuation from area & rate (1200 * 6000 = 7200000)');

  // Edge Cases (Recommendation 10)
  // Edge Case A: Zero Quantity
  const zeroQtyResult = valuationRegistry.value({
    assetType: 'STOCK',
    quantity: 0,
    costBasis: 10000,
    valuationDate: '2026-07-26'
  });
  assert(zeroQtyResult.marketValue === 0 && zeroQtyResult.warnings.length > 0, 'Edge Case A: Zero quantity yields 0 market value and warning');

  // Edge Case B: Stale Price Detection (>5 days old)
  const staleSnapshot: PriceSnapshot = { value: 100, currency: 'INR', source: 'NSE', timestamp: '2026-06-01' };
  const staleResult = valuationRegistry.value({
    assetType: 'STOCK',
    quantity: 10,
    costBasis: 1000,
    priceSnapshot: staleSnapshot,
    valuationDate: '2026-07-26'
  });
  assert(staleResult.dataQuality === 'STALE' && staleResult.warnings.some(w => w.includes('stale')), 'Edge Case B: Stale price flags dataQuality as STALE');

  // Edge Case C: Unsupported Asset Type Warning (Recommendation 8)
  const unmappedResult = valuationRegistry.value({
    assetType: 'UNKNOWN_CRYPTO_DERIVATIVE',
    quantity: 10,
    costBasis: 500,
    valuationDate: '2026-07-26'
  });
  assert(unmappedResult.success === false && unmappedResult.valuationMethod === 'UNSUPPORTED_VALUATION_STRATEGY', 'Edge Case C: Unmapped asset type returns explicit warning & unsupported valuation method');

  // Cleanup test entities & holdings
  transactionRepository.delete(holdingTx.id);
  holdingRepository.softDelete(holding.id);
  assetMasterRepository.softDelete(stockAsset.id);
  accountRepository.softDelete(account.id);
  entityRepository.softDelete(entity.id);
  familyMemberRepository.softDelete(member.id);
  familyRepository.softDelete(family.id);

  console.log('\n==================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test runner exception:', err);
  process.exit(1);
});
