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

async function runTestSuite() {
  // Ensure database initialization
  initDb();

  console.log('\n==================================================');
  console.log('    RUNNING SPRINT 1A, 1B & 1C UNIT & REGRESSION TESTS  ');
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
    pan_number: 'ABCDE1234F'
  });
  assert(entity.id > 0 && entity.pan_number === 'ABCDE1234F', 'EntityService creates Entity with valid PAN');

  let duplicatePanCaught = false;
  try {
    entityService.createEntity({
      family_member_id: member.id,
      name: 'Duplicate HUF',
      entity_type: 'HUF',
      pan_number: 'ABCDE1234F'
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

  // Master Asset Creation
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

  // 3-Tier Deduplication Tests
  // Priority 1: ISIN match
  const deduplicatedIsin = assetMasterService.getOrCreateAsset({
    asset_type: 'STOCK',
    name: 'Reliance Industries Limited Different Name',
    display_name: 'RIL',
    isin: 'INE002A01018'
  });
  assert(!deduplicatedIsin.created && deduplicatedIsin.asset.id === stockAsset.id, '3-Tier Deduplication Priority 1 matches by ISIN');

  // Priority 2: Symbol + Asset Type match
  const deduplicatedSymbol = assetMasterService.getOrCreateAsset({
    asset_type: 'STOCK',
    name: 'Reliance Stock Duplicate',
    symbol: 'RELIANCE.NS'
  });
  assert(!deduplicatedSymbol.created && deduplicatedSymbol.asset.id === stockAsset.id, '3-Tier Deduplication Priority 2 matches by Symbol + Type');

  // Priority 3: Name + Asset Type match
  const deduplicatedName = assetMasterService.getOrCreateAsset({
    asset_type: 'STOCK',
    name: 'Reliance Industries Ltd'
  });
  assert(!deduplicatedName.created && deduplicatedName.asset.id === stockAsset.id, '3-Tier Deduplication Priority 3 matches by Name + Type');

  // Holding Ownership Link Creation (Account -> Asset Master)
  const holding = holdingService.createHolding({
    account_id: account.id,
    asset_id: stockAsset.id,
    opened_at: '2026-01-01',
    status: 'OPEN'
  });
  assert(holding.id > 0 && holding.account_id === account.id && holding.asset_id === stockAsset.id, 'HoldingService links Account to Master Asset');

  // Verify Holding Listing & Asset Info Join
  const accountHoldings = holdingService.getAllHoldings(account.id);
  assert(accountHoldings.length === 1 && accountHoldings[0].asset_name === 'Reliance Industries Ltd', 'HoldingService queries holdings with joined Asset Master details');

  // Test Soft-Delete on Holding & Master Asset
  holdingService.softDeleteHolding(holding.id);
  assert(holdingRepository.findById(holding.id) === null, 'Soft-deleted Holding is excluded from repository queries');

  holdingRepository.restore(holding.id);
  assert(holdingRepository.findById(holding.id) !== null, 'HoldingRepository restores soft-deleted holding');

  // Cleanup test ownership entities & master assets
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
