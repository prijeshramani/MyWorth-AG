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
  ValuationContext,
  ValuationResult
} from '../engines/valuation';

// Sprint 2B Provider Framework & Resilience
import {
  yahooFinanceProvider,
  manualProvider,
  MockProvider,
  ReplayProvider,
  ProviderCache,
  CircuitBreaker,
  ProviderHealthService,
  providerIdentifierMapper,
  InvalidSymbolError
} from '../providers';

// Sprint 3 Net Worth Engine
import { netWorthEngine, NetWorthEngine } from '../engines/NetWorthEngine';
import { CalculationManifestHelper } from '../engines/common/CalculationManifest';

// Sprint 4 Performance Engine
import { performanceEngine, PerformanceEngine } from '../engines/PerformanceEngine';
import { CashFlowEvent } from '../engines/PerformanceTypes';

// Sprint 5A Portfolio Analytics Engine
import { portfolioAnalyticsEngine, PortfolioAnalyticsEngine } from '../engines/PortfolioAnalyticsEngine';

// Sprint 5B Risk Intelligence Engine
import { riskEngine, RiskEngine } from '../engines/RiskEngine';
import { PortfolioTimePoint, BenchmarkReturnPoint } from '../engines/RiskTypes';

// Sprint 6A Application Service Layer & DTO Mappers
import { DTOMapper } from '../mappers/DTOMapper';
import { snapshotCoordinator } from '../services/application/SnapshotCoordinator';
import { portfolioApplicationService } from '../services/application/PortfolioApplicationService';
import { dashboardApplicationService } from '../services/application/DashboardApplicationService';
import { importApplicationService } from '../services/application/ImportApplicationService';
import { reportingApplicationService } from '../services/application/ReportingApplicationService';

async function runTestSuite() {
  // Ensure database initialization & migrations
  initDb();

  console.log('\n==================================================');
  console.log(' RUNNING REGRESSION & SPRINT 6A APPLICATION TESTS ');
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

  // 4. Sprint 1B Ownership Hierarchy Repositories & Soft-Delete
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

  // 10. Sprint 1D Transaction Engine Foundation Tests
  console.log('\n--- 10. Testing Sprint 1D Transaction Engine & Financial Infrastructure ---');

  assert(FinancialMath.roundMoney(100.456) === 100.46, 'FinancialMath.roundMoney rounds to 2 decimal places');
  assert(FinancialMath.roundUnits(10.123456) === 10.1235, 'FinancialMath.roundUnits rounds to 4 decimal places');

  // 11. Sprint 1E Asset Valuation Foundation Tests
  console.log('\n--- 11. Testing Sprint 1E Asset Valuation Infrastructure & Strategies ---');

  assert(CurrencyPrecision.roundPercent(12.3456) === 12.35, 'CurrencyPrecision.roundPercent rounds percentage accurately');
  assert(marketCalendar.isTradingDay('2026-07-24') === true, 'MarketCalendar detects weekday Friday as trading day');

  // 12. Sprint 2B Market Data Provider Framework Tests
  console.log('\n--- 12. Testing Sprint 2B Market Data Provider Framework & Resilience ---');

  const indiaQuery = providerIdentifierMapper.resolveProviderQuerySymbol({ providerId: 'YAHOO_FINANCE', symbol: 'RELIANCE', exchange: 'NSE' });
  assert(indiaQuery === 'RELIANCE.NS', 'ProviderIdentifierMapper appends .NS for Indian NSE stocks');

  const usQuery = providerIdentifierMapper.resolveProviderQuerySymbol({ providerId: 'YAHOO_FINANCE', symbol: 'AAPL', exchange: 'NASDAQ' });
  assert(usQuery === 'AAPL', 'ProviderIdentifierMapper preserves plain ticker for US NASDAQ stocks');

  const inPrice = await yahooFinanceProvider.fetchLatestPrice('RELIANCE', 'NSE');
  assert(inPrice !== null && inPrice.value === 2850.00 && inPrice.currency === 'INR', 'YahooFinanceProvider fetches Indian stock quote in INR');

  const usPrice = await yahooFinanceProvider.fetchLatestPrice('AAPL', 'NASDAQ');
  assert(usPrice !== null && usPrice.value === 180.50 && usPrice.currency === 'USD', 'YahooFinanceProvider fetches US stock quote in USD');

  // 13. Sprint 3 Net Worth Engine Tests & Calculation Manifest
  console.log('\n--- 13. Testing Sprint 3 Net Worth Engine & Calculation Manifest ---');

  const manifest = CalculationManifestHelper.createManifest({
    engine: 'NET_WORTH_ENGINE',
    engineVersion: '1.0.0',
    businessRuleVersion: '2026.1',
    executionTimeMs: 10,
    processedHoldings: 2,
    processedValuations: 2,
    warningCount: 0,
    payloadToHash: { test: 123 }
  });
  assert(manifest.checksum.length === 64, 'CalculationManifestHelper generates valid SHA-256 checksum string');

  const registeredNwEngine = engineRegistry.getEngine('NET_WORTH_ENGINE');
  assert(registeredNwEngine !== undefined && registeredNwEngine.metadata.id === 'NET_WORTH_ENGINE', 'EngineRegistry retrieves registered NET_WORTH_ENGINE');

  const inrValResult: ValuationResult = {
    success: true,
    assetId: 101,
    assetType: 'STOCK',
    quantity: 100,
    unitPrice: 2000,
    valuationDate: '2026-07-26',
    marketValue: 200000, // ₹2,00,000 INR
    costBasis: 150000,
    unrealizedGain: 50000,
    unrealizedGainPercent: 33.33,
    currency: 'INR',
    valuationMethod: 'MARKET_CLOSING_PRICE',
    dataQuality: 'HIGH',
    priceSource: 'NSE',
    warnings: [],
    errors: [],
    auditTrail: [],
    engineVersion: '1.0.0'
  };

  const usdValResult: ValuationResult = {
    success: true,
    assetId: 102,
    assetType: 'STOCK',
    quantity: 50,
    unitPrice: 200,
    valuationDate: '2026-07-26',
    marketValue: 10000, // $10,000 USD
    costBasis: 8000,
    unrealizedGain: 2000,
    unrealizedGainPercent: 25.0,
    currency: 'USD',
    valuationMethod: 'MARKET_CLOSING_PRICE',
    dataQuality: 'HIGH',
    priceSource: 'NASDAQ',
    warnings: [],
    errors: [],
    auditTrail: [],
    engineVersion: '1.0.0'
  };

  const nwEngineResult = netWorthEngine.execute({
    correlationId: 'nw_test_1001',
    data: {
      valuationResults: [inrValResult, usdValResult],
      fxRates: { 'USD_INR': 83.50, 'INR_INR': 1.0 },
      reportingCurrency: 'INR',
      asOfDate: '2026-07-26',
      hierarchyContext: {
        familyId: family.id,
        familyName: 'Sharma Family',
        members: [{
          id: member.id,
          name: 'Rajesh Sharma',
          entities: [{
            id: entity.id,
            name: 'Rajesh Sharma HUF',
            accounts: [{
              id: account.id,
              name: 'HDFCBANK Wealth Account',
              assetIds: [101, 102]
            }]
          }]
        }]
      }
    }
  });

  assert(nwEngineResult.success === true, 'NetWorthEngine executes successfully');
  const snapshot = nwEngineResult.data!;

  assert(snapshot.summary.totalMarketValue === 1035000, 'NetWorthEngine consolidates INR and USD assets accurately (₹1,035,000)');
  assert(snapshot.summary.reportingCurrency === 'INR', 'NetWorthEngine sets reporting currency to INR');
  assert(snapshot.currencyAggregation.nativeCurrencies.length === 2, 'NetWorthEngine aggregates 2 distinct native currencies');
  assert(snapshot.assetAllocation.dominantAssetType === 'STOCK', 'NetWorthEngine identifies STOCK as dominant asset type');
  assert(snapshot.assetAllocation.breakdown[0].percentageOfTotal === 100, 'NetWorthEngine calculates 100% stock allocation');
  assert(snapshot.hierarchy.name === 'Sharma Family', 'NetWorthEngine builds Family root node');
  assert(snapshot.hierarchy.children?.[0].name === 'Rajesh Sharma', 'NetWorthEngine builds Family Member node');
  assert(snapshot.hierarchy.children?.[0].children?.[0].name === 'Rajesh Sharma HUF', 'NetWorthEngine builds Entity node');
  assert(snapshot.hierarchy.children?.[0].children?.[0].children?.[0].marketValue === 1035000, 'NetWorthEngine rolls up Account market value');

  const execA = netWorthEngine.execute({ correlationId: 'nw_gate_1', data: { valuationResults: [inrValResult, usdValResult], fxRates: { 'USD_INR': 83.50 }, asOfDate: '2026-07-26' } });
  const execB = netWorthEngine.execute({ correlationId: 'nw_gate_2', data: { valuationResults: [inrValResult, usdValResult], fxRates: { 'USD_INR': 83.50 }, asOfDate: '2026-07-26' } });
  assert(execA.data?.manifest.checksum === execB.data?.manifest.checksum, 'Quality Gate: NetWorthEngine produces 100% deterministic calculation checksum');

  // 14. Sprint 4 Performance Engine Tests
  console.log('\n--- 14. Testing Sprint 4 Performance Engine & XIRR Solver ---');

  const registeredPerfEngine = engineRegistry.getEngine('PERFORMANCE_ENGINE');
  assert(registeredPerfEngine !== undefined && registeredPerfEngine.metadata.id === 'PERFORMANCE_ENGINE', 'EngineRegistry retrieves registered PERFORMANCE_ENGINE');

  const testCashFlows: CashFlowEvent[] = [
    { date: '2024-01-01', amount: -100000, type: 'BUY', currency: 'INR' },
    { date: '2025-01-01', amount: -50000, type: 'BUY', currency: 'INR' },
    { date: '2025-06-30', amount: 5000, type: 'DIVIDEND', currency: 'INR' }
  ];

  const perfValuation: ValuationResult = {
    success: true,
    assetId: 101,
    assetType: 'STOCK',
    quantity: 100,
    unitPrice: 2100,
    valuationDate: '2026-01-01',
    marketValue: 210000,
    costBasis: 150000,
    unrealizedGain: 60000,
    unrealizedGainPercent: 40.0,
    currency: 'INR',
    valuationMethod: 'MARKET_CLOSING_PRICE',
    dataQuality: 'HIGH',
    priceSource: 'NSE',
    warnings: [],
    errors: [],
    auditTrail: [],
    engineVersion: '1.0.0'
  };

  const perfResult = performanceEngine.execute({
    correlationId: 'perf_test_1001',
    data: {
      cashFlows: testCashFlows,
      currentValuation: perfValuation,
      reportingCurrency: 'INR',
      asOfDate: '2026-01-01',
      startDate: '2024-01-01'
    }
  });

  assert(perfResult.success === true, 'PerformanceEngine executes successfully');
  const perfSnapshot = perfResult.data!;

  assert(perfSnapshot.summary.xirrPercent > 0, 'PerformanceEngine computes positive XIRR via Newton-Raphson solver');
  assert(perfSnapshot.summary.cagrPercent > 0, 'PerformanceEngine computes positive CAGR for holding period > 365 days');
  assert(perfSnapshot.summary.absoluteReturnPercent > 0, 'PerformanceEngine computes positive Absolute Return (PERF-001)');
  assert(perfSnapshot.quality === 'EXACT', 'PerformanceEngine classifies quality as EXACT when solver converges cleanly');
  assert(perfSnapshot.manifest.checksum.length === 64, 'PerformanceEngine generates valid SHA-256 calculation manifest checksum');

  const perfExecA = performanceEngine.execute({ correlationId: 'perf_gate_1', data: { cashFlows: testCashFlows, currentValuation: perfValuation, asOfDate: '2026-01-01' } });
  const perfExecB = performanceEngine.execute({ correlationId: 'perf_gate_2', data: { cashFlows: testCashFlows, currentValuation: perfValuation, asOfDate: '2026-01-01' } });
  assert(perfExecA.data?.manifest.checksum === perfExecB.data?.manifest.checksum, 'Quality Gate: PerformanceEngine produces 100% deterministic calculation checksum');

  // 15. Sprint 5A Portfolio Analytics Engine Tests
  console.log('\n--- 15. Testing Sprint 5A Portfolio Analytics Engine & HHI Index ---');

  const registeredAnalyticsEngine = engineRegistry.getEngine('PORTFOLIO_ANALYTICS_ENGINE');
  assert(registeredAnalyticsEngine !== undefined && registeredAnalyticsEngine.metadata.id === 'PORTFOLIO_ANALYTICS_ENGINE', 'EngineRegistry retrieves registered PORTFOLIO_ANALYTICS_ENGINE');

  const bankValResult: ValuationResult = {
    success: true,
    assetId: 103,
    assetType: 'BANK',
    quantity: 1,
    unitPrice: 100000,
    valuationDate: '2026-07-26',
    marketValue: 100000, // ₹1,00,000 liquid cash
    costBasis: 100000,
    unrealizedGain: 0,
    unrealizedGainPercent: 0,
    currency: 'INR',
    valuationMethod: 'BOOK_VALUE',
    dataQuality: 'HIGH',
    priceSource: 'MANUAL',
    warnings: [],
    errors: [],
    auditTrail: [],
    engineVersion: '1.0.0'
  };

  const analyticsResult = portfolioAnalyticsEngine.execute({
    correlationId: 'analytics_test_1001',
    data: {
      valuationResults: [inrValResult, usdValResult, bankValResult],
      fxRates: { 'USD_INR': 83.50, 'INR_INR': 1.0 },
      assetMetadata: {
        101: { sector: 'Technology', market: 'IN_NSE', country: 'India' },
        102: { sector: 'Technology', market: 'US_NASDAQ', country: 'United States' },
        103: { sector: 'Banking', market: 'DOMESTIC', country: 'India', isLiquid: true }
      },
      reportingCurrency: 'INR',
      asOfDate: '2026-07-26'
    }
  });

  assert(analyticsResult.success === true, 'PortfolioAnalyticsEngine executes successfully');
  const analyticsSnapshot = analyticsResult.data!;

  assert(analyticsSnapshot.allocations.assetAllocation.length === 2, 'PortfolioAnalyticsEngine decomposes Asset Allocation (STOCK & BANK)');
  assert(analyticsSnapshot.allocations.sectorAllocation.length === 2, 'PortfolioAnalyticsEngine decomposes Sector Allocation (TECHNOLOGY & BANKING)');
  assert(analyticsSnapshot.allocations.marketAllocation.length === 3, 'PortfolioAnalyticsEngine decomposes Market Allocation (IN_NSE, US_NASDAQ, DOMESTIC)');
  assert(analyticsSnapshot.allocations.geographicAllocation.length === 2, 'PortfolioAnalyticsEngine decomposes Geographic Allocation (India & United States)');
  assert(analyticsSnapshot.health.diversification.score > 0, 'PortfolioAnalyticsEngine computes positive DiversificationScore');
  assert(analyticsSnapshot.health.diversification.hhiIndex > 0, 'PortfolioAnalyticsEngine computes valid HHI Index');
  assert(analyticsSnapshot.health.concentration.top1AssetConcentrationPercent > 0, 'PortfolioAnalyticsEngine measures Top 1 Asset concentration');
  assert(analyticsSnapshot.health.cashLiquidity.cashPercentage > 0, 'PortfolioAnalyticsEngine computes cash liquidity percentage');
  assert(analyticsSnapshot.health.healthScore > 0, 'PortfolioAnalyticsEngine evaluates composite PortfolioHealth score');
  assert(analyticsSnapshot.manifest.checksum.length === 64, 'PortfolioAnalyticsEngine generates valid SHA-256 calculation manifest checksum');

  const analyticsExecA = portfolioAnalyticsEngine.execute({ correlationId: 'anl_gate_1', data: { valuationResults: [inrValResult, usdValResult], fxRates: { 'USD_INR': 83.50 }, asOfDate: '2026-07-26' } });
  const analyticsExecB = portfolioAnalyticsEngine.execute({ correlationId: 'anl_gate_2', data: { valuationResults: [inrValResult, usdValResult], fxRates: { 'USD_INR': 83.50 }, asOfDate: '2026-07-26' } });
  assert(analyticsExecA.data?.manifest.checksum === analyticsExecB.data?.manifest.checksum, 'Quality Gate: PortfolioAnalyticsEngine produces 100% deterministic calculation checksum');

  // 16. Sprint 5B Risk Intelligence Engine Tests
  console.log('\n--- 16. Testing Sprint 5B Risk Intelligence Engine & Metrics ---');

  const registeredRiskEngine = engineRegistry.getEngine('RISK_ENGINE');
  assert(registeredRiskEngine !== undefined && registeredRiskEngine.metadata.id === 'RISK_ENGINE', 'EngineRegistry retrieves registered RISK_ENGINE');

  const samplePortfolioTimeSeries: PortfolioTimePoint[] = [
    { date: '2025-01-01', portfolioValue: 100000, returnPercent: 0 },
    { date: '2025-02-01', portfolioValue: 105000, returnPercent: 0.05 },
    { date: '2025-03-01', portfolioValue: 98000, returnPercent: -0.0667 },
    { date: '2025-04-01', portfolioValue: 112000, returnPercent: 0.1428 },
    { date: '2025-05-01', portfolioValue: 115000, returnPercent: 0.0267 }
  ];

  const sampleBenchmarkTimeSeries: Record<string, BenchmarkReturnPoint[]> = {
    NIFTY_50: [
      { date: '2025-01-01', indexValue: 22000, returnPercent: 0 },
      { date: '2025-02-01', indexValue: 22400, returnPercent: 0.0181 },
      { date: '2025-03-01', indexValue: 21800, returnPercent: -0.0267 },
      { date: '2025-04-01', indexValue: 23000, returnPercent: 0.055 },
      { date: '2025-05-01', indexValue: 23500, returnPercent: 0.0217 }
    ]
  };

  const riskResult = riskEngine.execute({
    correlationId: 'risk_test_1001',
    data: {
      portfolioTimeSeries: samplePortfolioTimeSeries,
      benchmarkTimeSeries: sampleBenchmarkTimeSeries,
      riskFreeRatePercent: 6.50,
      reportingCurrency: 'INR',
      asOfDate: '2025-05-01'
    }
  });

  assert(riskResult.success === true, 'RiskEngine executes successfully');
  const riskSnapshot = riskResult.data!;

  assert(riskSnapshot.summary.annualizedVolatilityPercent > 0, 'RiskEngine computes Annualized Volatility (RISK-003)');
  assert(riskSnapshot.summary.maxDrawdownPercent > 0, 'RiskEngine measures Maximum Drawdown (RISK-004)');
  assert(riskSnapshot.summary.sharpeRatio !== 0, 'RiskEngine solves Sharpe Ratio (RISK-001)');
  assert(riskSnapshot.summary.sortinoRatio !== 0, 'RiskEngine solves Sortino Ratio (RISK-002)');
  assert(riskSnapshot.benchmarkComparison !== undefined, 'RiskEngine generates BenchmarkComparison structure');
  assert(riskSnapshot.benchmarkComparison?.primaryBenchmark.beta !== undefined, 'RiskEngine solves Beta against Nifty 50 (RISK-005)');
  assert(riskSnapshot.benchmarkComparison?.primaryBenchmark.correlation !== undefined, 'RiskEngine solves Correlation against Nifty 50 (RISK-006)');
  assert(riskSnapshot.manifest.checksum.length === 64, 'RiskEngine generates valid SHA-256 calculation manifest checksum');

  const riskExecA = riskEngine.execute({ correlationId: 'risk_gate_1', data: { portfolioTimeSeries: samplePortfolioTimeSeries, asOfDate: '2025-05-01' } });
  const riskExecB = riskEngine.execute({ correlationId: 'risk_gate_2', data: { portfolioTimeSeries: samplePortfolioTimeSeries, asOfDate: '2025-05-01' } });
  assert(riskExecA.data?.manifest.checksum === riskExecB.data?.manifest.checksum, 'Quality Gate: RiskEngine produces 100% deterministic calculation checksum');

  // 17. Sprint 6A Application Service Layer & DTO Mapper Tests
  console.log('\n--- 17. Testing Sprint 6A Application Service Layer & DTO Mappers ---');

  // Test DTOMapper currency formatting (Indian & US)
  const inrFormatted = DTOMapper.formatCurrency(10350000.50, 'INR');
  assert(inrFormatted === '₹1,03,50,000.50', 'DTOMapper formats INR according to Indian numbering system (₹1,03,50,000.50)');

  const usdFormatted = DTOMapper.formatCurrency(10000.50, 'USD');
  assert(usdFormatted === '$10,000.50', 'DTOMapper formats USD according to International currency standards ($10,000.50)');

  // Test SnapshotCoordinator lineage tracking
  const lineageEnv = snapshotCoordinator.coordinateSnapshotLineage(
    family.id,
    '2026-07-26',
    snapshot,
    perfSnapshot,
    analyticsSnapshot,
    riskSnapshot
  );
  assert(lineageEnv.masterSnapshotId.startsWith('master_snap_'), 'SnapshotCoordinator generates masterSnapshotId');
  assert(lineageEnv.masterChecksum === snapshot.manifest.checksum, 'SnapshotCoordinator aligns SHA-256 calculation checksum');

  const fetchedLineage = snapshotCoordinator.getSnapshotLineage(lineageEnv.masterSnapshotId);
  assert(fetchedLineage?.familyId === family.id, 'SnapshotCoordinator retrieves persisted snapshot lineage by master ID');

  // Test PortfolioApplicationService end-to-end execution
  const pasResponse = await portfolioApplicationService.getConsolidatedPortfolio({
    familyId: family.id,
    asOfDate: '2026-07-26',
    reportingCurrency: 'INR',
    includeRiskMetrics: true
  });
  assert(pasResponse.familyId === family.id, 'PortfolioApplicationService resolves familyId');
  assert(pasResponse.familyName === 'Sharma Family', 'PortfolioApplicationService resolves familyName');
  assert(pasResponse.netWorth.formattedTotalMarketValue.startsWith('₹'), 'PortfolioApplicationService maps formatted INR net worth string');
  assert(pasResponse.analytics !== undefined, 'PortfolioApplicationService orchestrates PortfolioAnalyticsEngine');
  assert(pasResponse.risk !== undefined, 'PortfolioApplicationService orchestrates RiskEngine');
  assert(pasResponse.masterChecksum.length === 64, 'PortfolioApplicationService attaches SHA-256 calculation manifest checksum');

  // Test DashboardApplicationService high-level overview
  const dashResponse = await dashboardApplicationService.getDashboardOverview(family.id, '2026-07-26');
  assert(dashResponse.familyId === family.id, 'DashboardApplicationService returns familyId');
  assert(dashResponse.formattedTotalWealth.startsWith('₹'), 'DashboardApplicationService returns formatted total wealth string');
  assert(dashResponse.memberSummaries.length === 1, 'DashboardApplicationService maps member net worth summaries');

  // Test ImportApplicationService batch execution
  const importRes = await importApplicationService.importTransactionBatch([
    { holdingId: holding.id, assetId: stockAsset.id, type: 'BUY', date: '2026-07-26', quantity: 10, price: 3000, amount: 30000, source: 'ZERODHA' }
  ], 'idempotency_key_9901');
  assert(importRes.status === 'COMPLETED' && importRes.importBatchId === 'idempotency_key_9901', 'ImportApplicationService respects idempotency keys');

  // Test ReportingApplicationService workflow
  const reportRes = await reportingApplicationService.generateReport({
    familyId: family.id,
    reportType: 'PORTFOLIO_SUMMARY',
    format: 'PDF'
  });
  assert(reportRes.reportId.startsWith('rep_portfolio_summary_'), 'ReportingApplicationService generates reportId');
  assert(reportRes.downloadUrl !== undefined, 'ReportingApplicationService returns valid download URL');

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
