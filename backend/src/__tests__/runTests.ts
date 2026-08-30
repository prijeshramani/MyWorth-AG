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
import * as fs from 'fs';
import * as path from 'path';
import { runContractsTests } from './sprint8b0/contracts.test';
import { runCorrelationTests } from './sprint8b0/correlation.test';
import { runIdempotencyTests } from './sprint8b0/idempotency.test';
import { runAuditHooksTests } from './sprint8b0/auditHooks.test';
import { runDigitalTwinTests } from './sprint8b1/digitalTwin.test';
import { runLifeEventsTests } from './sprint8b2/lifeEvents.test';
import { runProactiveObserverTests } from './sprint8b3/proactiveObserver.test';
import { runSprint8c0Tests } from './sprint8c0/contractsAndMigrations.test';
import { runSprint8c1Tests } from './sprint8c1/familyFinancialHealth.test';
import { runSprint8c2Tests } from './sprint8c2/familyTimeline.test';
import { runSprint8c3Tests } from './sprint8c3/financialTimeMachine.test';
import { runSprint8c4Tests } from './sprint8c4/frontendContracts.test';

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

// Sprint 6B REST API Layer & Express App
import { app } from '../app';
import axios from 'axios';
import { Server } from 'http';

async function runTestSuite() {
  // Ensure database initialization & migrations
  initDb();

  console.log('\n==================================================');
  console.log(' RUNNING REGRESSION & SPRINT 6D DEVELOPER TESTS   ');
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

  // 17. Sprint 6A Application Service Layer & DTO Mappers
  console.log('\n--- 17. Testing Sprint 6A Application Service Layer & DTO Mappers ---');

  const inrFormatted = DTOMapper.formatCurrency(10350000.50, 'INR');
  assert(inrFormatted === '₹1,03,50,000.50', 'DTOMapper formats INR according to Indian numbering system (₹1,03,50,000.50)');

  const usdFormatted = DTOMapper.formatCurrency(10000.50, 'USD');
  assert(usdFormatted === '$10,000.50', 'DTOMapper formats USD according to International currency standards ($10,000.50)');

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

  const dashResponse = await dashboardApplicationService.getDashboardOverview(family.id, '2026-07-26');
  assert(dashResponse.familyId === family.id, 'DashboardApplicationService returns familyId');
  assert(dashResponse.formattedTotalWealth.startsWith('₹'), 'DashboardApplicationService returns formatted total wealth string');
  assert(dashResponse.memberSummaries.length === 1, 'DashboardApplicationService maps member net worth summaries');

  const importRes = await importApplicationService.importTransactionBatch([
    { holdingId: holding.id, assetId: stockAsset.id, type: 'BUY', date: '2026-07-26', quantity: 10, price: 3000, amount: 30000, source: 'ZERODHA' }
  ], 'idempotency_key_9901');
  assert(importRes.status === 'COMPLETED' && importRes.importBatchId === 'idempotency_key_9901', 'ImportApplicationService respects idempotency keys');

  const reportRes = await reportingApplicationService.generateReport({
    familyId: family.id,
    reportType: 'PORTFOLIO_SUMMARY',
    format: 'PDF'
  });
  assert(reportRes.reportId.startsWith('rep_portfolio_summary_'), 'ReportingApplicationService generates reportId');
  assert(reportRes.downloadUrl !== undefined, 'ReportingApplicationService returns valid download URL');

  // 18. Sprint 6B REST API Layer & Middleware Tests
  console.log('\n--- 18. Testing Sprint 6B REST API Endpoints & Middlewares ---');

  // Start ephemeral Express HTTP server
  const server: Server = await new Promise((resolve) => {
    const srv = app.listen(0, () => resolve(srv));
  });
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const customCorrId = `test_corr_${Date.now()}`;
  const portSummaryHttpRes = await axios.get(`${baseUrl}/api/v1/portfolio/summary?familyId=${family.id}&includeRiskMetrics=true`, {
    headers: { 'X-Correlation-ID': customCorrId }
  });
  
  assert(portSummaryHttpRes.status === 200, 'GET /api/v1/portfolio/summary returns HTTP 200 OK');
  assert(portSummaryHttpRes.headers['x-correlation-id'] === customCorrId, 'CorrelationId Middleware echoes X-Correlation-ID header');
  assert(portSummaryHttpRes.data.success === true, 'Standard response envelope contains success = true');
  assert(portSummaryHttpRes.data.data.familyId === family.id, 'API-001 returns DTO with matching familyId');
  assert(portSummaryHttpRes.data.metadata.executionTimeMs >= 0, 'API-001 attaches executionTimeMs in metadata');
  assert(portSummaryHttpRes.data.metadata.apiVersion === 'v1.0', 'API-001 attaches apiVersion in metadata');

  const dashHttpRes = await axios.get(`${baseUrl}/api/v1/dashboard/overview?familyId=${family.id}`);
  assert(dashHttpRes.status === 200, 'GET /api/v1/dashboard/overview returns HTTP 200 OK');
  assert(dashHttpRes.data.data.formattedTotalWealth.startsWith('₹'), 'API-002 returns formatted total wealth string');

  const reportHttpRes = await axios.post(`${baseUrl}/api/v1/reports/generate`, {
    familyId: family.id,
    reportType: 'PORTFOLIO_SUMMARY',
    format: 'PDF'
  });
  assert(reportHttpRes.status === 200, 'POST /api/v1/reports/generate returns HTTP 200 OK');
  assert(reportHttpRes.data.data.downloadUrl.includes('.pdf'), 'API-003 returns PDF download URL');

  let caught400 = false;
  try {
    await axios.get(`${baseUrl}/api/v1/portfolio/summary`);
  } catch (err: any) {
    if (err.response) {
      assert(err.response.status === 400, 'Request Validation Middleware triggers 400 Bad Request on missing familyId');
      const errCode = err.response.data?.errors?.[0]?.code || err.response.data?.error?.code;
      assert(errCode === 'VALIDATION_ERROR', 'Error Middleware formats standard error envelope with VALIDATION_ERROR');
      caught400 = true;
    } else {
      console.log('>>> caught400 unexpected err:', err.message);
    }
  }
  assert(caught400, 'API validation rejects invalid request query');

  let caught404 = false;
  try {
    await axios.get(`${baseUrl}/api/v1/portfolio/summary?familyId=999999`);
  } catch (err: any) {
    if (err.response) {
      assert(err.response.status === 404, 'Error Middleware transforms NotFoundError to HTTP 404 Not Found');
      const errCode = err.response.data?.errors?.[0]?.code || err.response.data?.error?.code;
      assert(errCode === 'NOT_FOUND', 'Error Middleware formats standard error envelope with NOT_FOUND');
      caught404 = true;
    } else {
      console.log('>>> caught404 unexpected err:', err.message);
    }
  }
  assert(caught404, 'API handles non-existent entity with HTTP 404');

  // 19. Sprint 6C Security Foundation & Observability Health Tests
  console.log('\n--- 19. Testing Sprint 6C Security Foundation & Health Endpoints ---');

  assert(portSummaryHttpRes.headers['x-content-type-options'] === 'nosniff', 'Helmet Middleware attaches X-Content-Type-Options: nosniff');
  assert(portSummaryHttpRes.headers['x-frame-options'] === 'DENY', 'Helmet Middleware attaches X-Frame-Options: DENY');
  assert(portSummaryHttpRes.headers['x-xss-protection'] === '1; mode=block', 'Helmet Middleware attaches X-XSS-Protection');
  assert(portSummaryHttpRes.headers['strict-transport-security'] !== undefined, 'Helmet Middleware attaches Strict-Transport-Security');

  assert(portSummaryHttpRes.headers['x-ratelimit-limit'] === '100', 'RateLimiter Middleware attaches X-RateLimit-Limit header (100)');
  assert(portSummaryHttpRes.headers['x-ratelimit-remaining'] !== undefined, 'RateLimiter Middleware attaches X-RateLimit-Remaining header');

  const healthRes = await axios.get(`${baseUrl}/health`);
  assert(healthRes.status === 200 && healthRes.data.status === 'UP', 'GET /health returns HTTP 200 OK with status UP');
  assert(healthRes.data.components.database.status === 'HEALTHY', 'GET /health verifies SQLite database health');

  const livenessRes = await axios.get(`${baseUrl}/health/liveness`);
  assert(livenessRes.status === 200 && livenessRes.data.status === 'UP', 'GET /health/liveness returns HTTP 200 OK');

  const readinessRes = await axios.get(`${baseUrl}/health/readiness`);
  assert(readinessRes.status === 200 && readinessRes.data.status === 'READY', 'GET /health/readiness returns HTTP 200 OK');

  let caught413 = false;
  try {
    const hugePayload = { familyId: family.id, reportType: 'PORTFOLIO_SUMMARY', format: 'PDF', padding: 'X'.repeat(1.5 * 1024 * 1024) };
    await axios.post(`${baseUrl}/api/v1/reports/generate`, hugePayload);
  } catch (err: any) {
    if (err.response) {
      assert(err.response.status === 413, 'Body Size Limiter rejects oversized JSON payload (>1MB) with HTTP 413 Payload Too Large');
      caught413 = true;
    }
  }
  assert(caught413, 'Body size limiter enforces max 1MB JSON limit');

  // 20. Sprint 6D Developer Portal & Swagger UI Tests
  console.log('\n--- 20. Testing Sprint 6D Developer Portal & Interactive Swagger UI ---');

  const swaggerHtmlRes = await axios.get(`${baseUrl}/api-docs`);
  assert(swaggerHtmlRes.status === 200, 'GET /api-docs returns HTTP 200 OK');
  assert(String(swaggerHtmlRes.headers['content-type'] || '').includes('text/html'), 'GET /api-docs returns HTML document content');
  assert(swaggerHtmlRes.data.includes('SwaggerUIBundle'), 'GET /api-docs serves Swagger UI bundle initialization HTML');

  const swaggerJsonRes = await axios.get(`${baseUrl}/api-docs/swagger.json`);
  assert(swaggerJsonRes.status === 200, 'GET /api-docs/swagger.json returns HTTP 200 OK');
  assert(swaggerJsonRes.data.openapi === '3.0.3', 'GET /api-docs/swagger.json returns OpenAPI 3.0.3 schema object');
  assert(swaggerJsonRes.data.paths['/portfolio/summary'] !== undefined, 'OpenAPI JSON spec documents /portfolio/summary path');

  const postmanPath = path.join(__dirname, '../../../docs/POSTMAN_COLLECTION.json');
  const postmanExists = fs.existsSync(postmanPath);
  assert(postmanExists, 'Postman Collection JSON file exists in docs directory');

  if (postmanExists) {
    const postmanJson = JSON.parse(fs.readFileSync(postmanPath, 'utf8'));
    assert(postmanJson.info.name === 'Family Wealth OS REST API', 'Postman Collection JSON contains valid info.name');
    assert(postmanJson.item.length >= 3, 'Postman Collection JSON defines request items');
  }

  // Section 21: Testing Phase 5D Protection & Insurance Domain
  console.log('\n--- 21. Testing Phase 5D Protection & Insurance Domain ---');
  const { InsuranceRepository } = require('../repositories/InsuranceRepository');
  const { InsuranceApplicationService } = require('../services/InsuranceApplicationService');
  const insuranceRepo = new InsuranceRepository(db);
  const insuranceAppService = new InsuranceApplicationService(insuranceRepo, familyRepository);

  const policy = insuranceRepo.create({
    family_id: family.id,
    policy_number: 'POL-TEST-9901',
    insurer_name: 'Max Life Insurance',
    policy_type: 'TERM_INSURANCE',
    policy_holder_id: member.id,
    sum_assured: 10000000,
    premium_amount: 15000,
    premium_frequency: 'ANNUAL',
    start_date: '2025-01-01',
    next_premium_due_date: '2027-01-01',
    status: 'ACTIVE',
    nominee_name: 'Priya Sharma'
  });

  assert(policy.id !== undefined, 'InsuranceRepository creates policy record');
  assert(policy.policy_number === 'POL-TEST-9901', 'InsuranceRepository persists policy number');

  const protectionRes = await axios.get(`${baseUrl}/api/v1/protection/summary?familyId=${family.id}`);
  assert(protectionRes.status === 200, 'GET /api/v1/protection/summary returns HTTP 200 OK');
  assert(protectionRes.data.success === true, 'GET /api/v1/protection/summary returns success envelope');
  assert(protectionRes.data.data.protectionScore !== undefined, 'GET /api/v1/protection/summary returns protectionScore');
  assert(protectionRes.data.data.lifeCover.totalSumAssured >= 10000000, 'GET /api/v1/protection/summary aggregates lifeCover sum assured');

  // Section 22: Testing Phase 5E Platform Security, Auth & RBAC
  console.log('\n--- 22. Testing Phase 5E Platform Security, Auth & RBAC ---');
  const { PasswordService } = require('../services/passwordService');
  const { JwtService } = require('../services/jwtService');
  const { SQLiteUserRepository } = require('../repositories/SQLiteUserRepository');
  const { SQLiteAuditRepository } = require('../repositories/SQLiteAuditRepository');
  const { AuthenticationService } = require('../services/AuthenticationService');

  const userRepo = new SQLiteUserRepository(db);
  const auditRepo = new SQLiteAuditRepository(db);
  const authService = new AuthenticationService(userRepo, auditRepo);

  const hash = PasswordService.hashPassword('SuperSecret123!');
  assert(PasswordService.verifyPassword('SuperSecret123!', hash) === true, 'PasswordService verifies valid password hash');
  assert(PasswordService.verifyPassword('WrongPass', hash) === false, 'PasswordService rejects invalid password');

  const jwt = JwtService.generateAccessToken({ userId: 1, familyId: Number(family.id), email: 'test@family.com', roles: ['Owner'], permissions: ['Investment.Read'] });
  const decoded = JwtService.verifyAccessToken(jwt);
  assert(decoded.userId === 1, 'JwtService verifies access token payload');
  assert(decoded.roles.includes('Owner'), 'JwtService attaches user roles');

  const testEmail = `rajesh.sharma_${Date.now()}@myworth.test`;
  const createdUser = userRepo.create({
    family_id: family.id,
    email: testEmail,
    password_hash: PasswordService.hashPassword('MyWorthSecurePass2026'),
    first_name: 'Rajesh',
    last_name: 'Sharma',
    status: 'ACTIVE'
  });
  assert(createdUser.id !== undefined, 'SQLiteUserRepository creates user record');

  userRepo.assignRole(createdUser.id, 'Owner');
  const loginRes = await axios.post(`${baseUrl}/api/v1/auth/login`, {
    email: testEmail,
    password: 'MyWorthSecurePass2026'
  });

  assert(loginRes.status === 200, 'POST /api/v1/auth/login returns HTTP 200 OK');
  assert(loginRes.data.data.accessToken !== undefined, 'POST /api/v1/auth/login returns accessToken');
  assert(loginRes.data.data.refreshToken !== undefined, 'POST /api/v1/auth/login returns refreshToken');
  assert(loginRes.data.data.user.roles.includes('Owner'), 'POST /api/v1/auth/login includes Owner role');

  // Section 23: Testing Phase 6A Indian Tax Intelligence Engine
  console.log('\n--- 23. Testing Phase 6A Indian Tax Intelligence Engine ---');
  const { TaxRuleSeedLoader } = require('../engines/tax/TaxRuleSeedLoader');
  const { TaxCalculationEngine } = require('../engines/tax/TaxCalculationEngine');
  const { CapitalGainTaxEngine } = require('../engines/tax/CapitalGainTaxEngine');

  TaxRuleSeedLoader.seedTaxRules(db);

  const calcNew = TaxCalculationEngine.calculateNewRegimeTax({ grossIncome: 1800000 });
  assert(calcNew.netTaxableIncome === 1725000, 'TaxCalculationEngine applies ₹75k standard deduction in New Regime');
  assert(calcNew.totalTaxPayable > 0, 'TaxCalculationEngine computes base tax and cess for New Regime');

  const calcOld = TaxCalculationEngine.calculateOldRegimeTax({ grossIncome: 1800000, claimed80C: 150000, claimed80D: 25000 });
  assert(calcOld.totalDeductions === 225000, 'TaxCalculationEngine applies Section 80C & 80D deductions in Old Regime');

  const cgRes = CapitalGainTaxEngine.calculateCapitalGain({ assetType: 'EQUITY', buyDate: '2023-01-01', sellDate: '2025-06-01', buyAmount: 200000, sellAmount: 400000 });
  assert(cgRes.gainType === 'LTCG', 'CapitalGainTaxEngine identifies Equity holding > 12m as LTCG');
  assert(cgRes.taxRatePercent === 12.5, 'CapitalGainTaxEngine applies 12.5% LTCG tax rate');

  const taxSummaryRes = await axios.get(`${baseUrl}/api/v1/tax/summary?familyId=${family.id}`);
  assert(taxSummaryRes.status === 200, 'GET /api/v1/tax/summary returns HTTP 200 OK');
  assert(taxSummaryRes.data.data.recommendedRegime !== undefined, 'GET /api/v1/tax/summary identifies recommended tax regime');
  assert(Array.isArray(taxSummaryRes.data.data.deductions), 'GET /api/v1/tax/summary returns deduction tracker array');

  // Section 24: Testing Phase 6B.0 Knowledge Graph Foundation & Relationship Engine
  console.log('\n--- 24. Testing Phase 6B.0 Knowledge Graph Foundation & Relationship Engine ---');
  const { KnowledgeGraphSeedLoader } = require('../engines/graph/KnowledgeGraphSeedLoader');
  const { SQLiteKnowledgeGraphRepository } = require('../repositories/SQLiteKnowledgeGraphRepository');
  const { GraphQueryService } = require('../services/GraphQueryService');
  const { RelationshipService } = require('../services/RelationshipService');

  KnowledgeGraphSeedLoader.seedRelationshipTypes(db);
  const graphTestRepo = new SQLiteKnowledgeGraphRepository(db);
  const graphTestQuery = new GraphQueryService(graphTestRepo);
  const graphTestService = new RelationshipService(db, graphTestRepo);

  const nodePerson = graphTestRepo.getOrCreateNode(family.id, 'PERSON', 1, 'Rajesh Sharma');
  const nodeAsset = graphTestRepo.getOrCreateNode(family.id, 'ASSET', 101, 'HDFC Top 100 Fund');
  assert(nodePerson.id !== undefined, 'SQLiteKnowledgeGraphRepository creates PERSON node');
  assert(nodeAsset.id !== undefined, 'SQLiteKnowledgeGraphRepository creates ASSET node');

  const ownsRel = graphTestRepo.getRelationshipTypeByCode('OWNS');
  assert(ownsRel !== undefined, 'KnowledgeGraphSeedLoader seeds baseline OWNS relationship type');

  const edge = graphTestRepo.addEdge(family.id, nodePerson.id, nodeAsset.id, ownsRel.id);
  assert(edge.id !== undefined, 'SQLiteKnowledgeGraphRepository connects nodes with directed edge');

  graphTestService.syncKnowledgeGraphFromDomainEntities(family.id);
  const graphOverview = graphTestQuery.getOverviewGraph(family.id);
  assert(graphOverview.nodeCount > 0, 'GraphQueryService retrieves node count');
  assert(graphOverview.edgeCount > 0, 'GraphQueryService retrieves edge count');

  const graphApiRes = await axios.get(`${baseUrl}/api/v1/graph/overview?familyId=${family.id}`);
  assert(graphApiRes.status === 200, 'GET /api/v1/graph/overview returns HTTP 200 OK');
  assert(graphApiRes.data.data.estateReadiness !== undefined, 'GET /api/v1/graph/overview computes estateReadiness graph');

  // Section 25: Testing Phase 6B Estate Planning, Legacy & Wealth Succession
  console.log('\n--- 25. Testing Phase 6B Estate Planning, Legacy & Wealth Succession ---');
  const { SQLiteEstateRepository } = require('../repositories/SQLiteEstateRepository');
  const { EstateHealthService } = require('../services/EstateHealthService');
  const { EstateSimulationService } = require('../services/EstateSimulationService');
  const { EmergencyModeService } = require('../services/EmergencyModeService');

  const estateTestRepo = new SQLiteEstateRepository(db);
  const estateHealth = new EstateHealthService(estateTestRepo);
  const estateSim = new EstateSimulationService(estateTestRepo);
  const emergencyTest = new EmergencyModeService(estateTestRepo);

  const profile = estateTestRepo.getOrCreateProfile(family.id);
  assert(profile.id !== undefined, 'SQLiteEstateRepository initializes estate profile');

  const newWill = estateTestRepo.createWill({
    family_id: family.id,
    testator_id: 1,
    title: 'Primary Testator Will FY2026',
    status: 'REGISTERED',
    executor_name: 'Adv. Ramesh Varma'
  });
  assert(newWill.id !== undefined, 'SQLiteEstateRepository creates registered Will record');

  const newTrust = estateTestRepo.createTrust({
    family_id: family.id,
    trust_name: 'Sharma Family Private Trust',
    trust_type: 'FAMILY',
    corpus_amount: 5000000,
    settlor_id: 1,
    status: 'ACTIVE'
  });
  assert(newTrust.id !== undefined, 'SQLiteEstateRepository creates Family Trust record');

  const healthScore = estateHealth.calculateEstateHealth(family.id);
  assert(healthScore.overallScore >= 80, 'EstateHealthService computes configurable Estate Health Score');

  const simResult = estateSim.runDeathScenarioSimulation(family.id);
  assert(simResult.distributions.length >= 1, 'EstateSimulationService computes death scenario distribution tree');

  const emergencyConsole = emergencyTest.getEmergencyConsoleData(family.id);
  assert(emergencyConsole.emergencyAccessAuditLogged === true, 'EmergencyModeService logs emergency access audit event');

  const estateDashRes = await axios.get(`${baseUrl}/api/v1/estate/dashboard?familyId=${family.id}`);
  assert(estateDashRes.status === 200, 'GET /api/v1/estate/dashboard returns HTTP 200 OK');
  assert(estateDashRes.data.data.health.overallScore !== undefined, 'GET /api/v1/estate/dashboard returns health score');

  // Section 26: Testing Phase 6C Financial Goals, Retirement & Life Planning
  console.log('\n--- 26. Testing Phase 6C Financial Goals, Retirement & Life Planning ---');
  const { SQLiteGoalRepository } = require('../repositories/SQLiteGoalRepository');
  const { ProjectionEngineService } = require('../services/ProjectionEngineService');
  const { GoalPlanningService } = require('../services/GoalPlanningService');
  const { RetirementPlanningService } = require('../services/RetirementPlanningService');
  const { CashflowProjectionService } = require('../services/CashflowProjectionService');
  const { PlanningRecommendationService } = require('../services/PlanningRecommendationService');

  const goalTestRepo = new SQLiteGoalRepository(db);
  const projEngineTest = new ProjectionEngineService();
  const goalTestService = new GoalPlanningService(goalTestRepo, projEngineTest);
  const retirementTestService = new RetirementPlanningService(goalTestRepo, projEngineTest);
  const cashflowTestService = new CashflowProjectionService(goalTestRepo, projEngineTest);
  const recTestService = new PlanningRecommendationService(goalTestRepo, retirementTestService, goalTestService);

  const projResult = projEngineTest.projectCorpus({
    initialLumpSum: 500000,
    monthlySip: 25000,
    sipStepUpPct: 10,
    expectedReturnPct: 12,
    inflationPct: 6,
    years: 10
  });
  assert(projResult.totalProjectedCorpus > projResult.totalInvested, 'ProjectionEngineService computes compound interest with annual SIP step-up');
  assert(projResult.yearlySchedule.length === 10, 'ProjectionEngineService returns yearly schedule array');

  const assumptions = goalTestRepo.getOrCreateAssumptions(family.id);
  assert(assumptions.default_inflation_pct === 6.0, 'SQLiteGoalRepository loads central assumptions registry');

  const newGoal = goalTestRepo.createGoal({
    family_id: family.id,
    goal_type: 'EDUCATION',
    title: 'Child Higher Education Fund 2035',
    target_amount: 5000000,
    target_year: 2035,
    current_allocated_amount: 500000,
    monthly_sip_amount: 20000,
    expected_return_pct: 12.0,
    inflation_pct: 10.0,
    priority: 'HIGH',
    status: 'ON_TRACK'
  });
  assert(newGoal.id !== undefined, 'SQLiteGoalRepository creates financial goal record');

  const retirementAnalysis = retirementTestService.getRetirementAnalysis(family.id);
  assert(retirementAnalysis.corpusRequiredAtRetirement > 0, 'RetirementPlanningService computes inflation-adjusted corpus requirement');
  assert(retirementAnalysis.readinessPct !== undefined, 'RetirementPlanningService computes retirement readiness percentage');

  const cashflowForecast = cashflowTestService.getCashflowForecast(family.id);
  assert(cashflowForecast.yearlyForecast.length === 10, 'CashflowProjectionService projects 10-year cash flow surplus');

  const recs = recTestService.generatePlanningRecommendations(family.id);
  assert(recs.length >= 1, 'PlanningRecommendationService generates explainable planning recommendations');

  const planDashRes = await axios.get(`${baseUrl}/api/v1/planning/dashboard?familyId=${family.id}`);
  assert(planDashRes.status === 200, 'GET /api/v1/planning/dashboard returns HTTP 200 OK');
  assert(planDashRes.data.data.retirement.readinessPct !== undefined, 'GET /api/v1/planning/dashboard returns retirement readiness');
  assert(planDashRes.data.data.recommendations.length >= 1, 'GET /api/v1/planning/dashboard returns recommendations array');

  // Section 27: Testing Phase 6D Intelligent Recommendation & Insight Engine
  console.log('\n--- 27. Testing Phase 6D Intelligent Recommendation & Insight Engine ---');
  const { SQLiteRecommendationRuleRepository } = require('../repositories/SQLiteRecommendationRuleRepository');
  const { SQLiteRecommendationRepository } = require('../repositories/SQLiteRecommendationRepository');
  const { InsightScoringService } = require('../services/InsightScoringService');
  const { RecommendationOrchestrator } = require('../services/RecommendationOrchestrator');
  const { RecommendationEngineService } = require('../services/RecommendationEngineService');
  const recRuleRepo = new SQLiteRecommendationRuleRepository(db);
  const recRepoTest = new SQLiteRecommendationRepository(db);
  const scoringTestService = new InsightScoringService();

  const taxSeedLoaderTest = new TaxRuleSeedLoader(db);
  const taxEngineTest = new TaxCalculationEngine(taxSeedLoaderTest);

  const activeRules = recRuleRepo.getActiveRules();
  assert(activeRules.length >= 6, 'SQLiteRecommendationRuleRepository seeds configurable baseline rules');

  const orchestratorTest = new RecommendationOrchestrator(recRuleRepo, recRepoTest, scoringTestService, taxEngineTest, estateHealth, goalTestService);
  const recEngineTest = new RecommendationEngineService(recRepoTest, orchestratorTest);

  const generatedRecs = orchestratorTest.evaluateAndGenerateAll(family.id);
  assert(generatedRecs.length >= 1, 'RecommendationOrchestrator evaluates rules across domain engines');

  const scoreResult = scoringTestService.calculateScores(generatedRecs[0]);
  assert(scoreResult.overallRankScore > 0, 'InsightScoringService computes multi-dimensional overall rank score');

  const explanation = recEngineTest.explainRecommendation(generatedRecs[0].id);
  assert(explanation.whyGenerated !== undefined, 'RecommendationEngineService generates 100% explainable AI context');

  recEngineTest.updateRecommendationStatus(generatedRecs[0].id, family.id, 'ACCEPTED', 'User accepted tax optimization recommendation');
  const updatedRec = recRepoTest.getRecommendationById(generatedRecs[0].id);
  assert(updatedRec?.status === 'ACCEPTED', 'SQLiteRecommendationRepository updates status and logs audit history');

  const recDashRes = await axios.get(`${baseUrl}/api/v1/recommendations/dashboard?familyId=${family.id}`);
  assert(recDashRes.status === 200, 'GET /api/v1/recommendations/dashboard returns HTTP 200 OK');
  assert(recDashRes.data.data.journeys.length >= 1, 'GET /api/v1/recommendations/dashboard returns active journeys');

  // Section 28: Testing Phase 7A AI Context, Memory & Evidence Layer
  console.log('\n--- 28. Testing Phase 7A AI Context, Memory & Evidence Layer ---');
  const { SQLiteAIContextRepository } = require('../repositories/SQLiteAIContextRepository');
  const { EvidenceService } = require('../services/EvidenceService');
  const { AIMemoryService } = require('../services/AIMemoryService');
  const { AISafetyService } = require('../services/AISafetyService');
  const { PromptBuilderService } = require('../services/PromptBuilderService');
  const { AIContextService } = require('../services/AIContextService');

  const aiTestRepo = new SQLiteAIContextRepository(db);
  const evidenceTestService = new EvidenceService(aiTestRepo);
  const memoryTestService = new AIMemoryService(aiTestRepo);
  const safetyTestService = new AISafetyService();
  const promptTestBuilder = new PromptBuilderService(aiTestRepo);
  const contextTestService = new AIContextService(aiTestRepo, evidenceTestService, new TaxCalculationEngine(), estateHealth, goalTestService, recEngineTest);

  const capabilities = aiTestRepo.getCapabilities();
  assert(capabilities.length >= 4, 'SQLiteAIContextRepository seeds AI Capability Registry');

  const proof = evidenceTestService.createEvidence(family.id, 'TEST_PROOF_CODE', 'TestEngine', { calculationResult: 42 });
  assert(proof.id !== undefined, 'EvidenceService generates immutable evidence proof with SHA-256 calculation hash');
  assert(proof.calculation_hash.length === 16, 'EvidenceService computes calculation hash');

  const memoryItem = memoryTestService.saveMemoryItem(family.id, 'PERMANENT', 'RISK_PROFILE', { profile: 'AGGRESSIVE' });
  assert(memoryItem.id !== undefined, 'AIMemoryService stores long-term memory item');

  const safetyEval = safetyTestService.evaluateQuery('My PAN is ABCDE1234F, what is my tax savings?');
  assert(safetyEval.redactedQuery.includes('[REDACTED_PAN]'), 'AISafetyService redacts PII PAN patterns');

  const compiledPrompt = promptTestBuilder.compilePrompt('WEALTH_ADVISOR_BASE', 'Summarize my retirement gap', { corpusGap: 5000000 }, { proofHash: 'abc12345' });
  assert(compiledPrompt.userPrompt.includes('Summarize my retirement gap'), 'PromptBuilderService compiles system and user prompts');

  const unifiedContext = contextTestService.getUnifiedAIContext(family.id);
  assert(unifiedContext.contextHealthScore >= 90, 'AIContextService aggregates domain context across 7 engines');

  const aiDashRes = await axios.get(`${baseUrl}/api/v1/ai/context?familyId=${family.id}`);
  assert(aiDashRes.status === 200, 'GET /api/v1/ai/context returns HTTP 200 OK');
  assert(aiDashRes.data.data.evidenceSummary.totalProofItems > 0, 'GET /api/v1/ai/context returns evidence summary proof');

  const memRes = await axios.get(`${baseUrl}/api/v1/ai/memory?familyId=${family.id}`);
  assert(memRes.status === 200, 'GET /api/v1/ai/memory returns HTTP 200 OK');

  const evRes = await axios.get(`${baseUrl}/api/v1/ai/evidence/${proof.id}`);
  assert(evRes.status === 200, 'GET /api/v1/ai/evidence/:id returns HTTP 200 OK with proof data');

  // Section 29: Testing Phase 7B.0 DX, Onboarding & Beta Readiness
  console.log('\n--- 29. Testing Phase 7B.0 DX, Onboarding & Beta Readiness ---');
  const { BackupService } = require('../services/BackupService');
  const { SystemHealthService } = require('../services/SystemHealthService');
  const { OnboardingService } = require('../services/OnboardingService');

  const backupTestService = new BackupService();
  const healthTestService = new SystemHealthService(backupTestService);
  const onboardingTestService = new OnboardingService(db);

  const backupMeta = backupTestService.createBackup('Test Recovery Point');
  assert(backupMeta.filename !== undefined, 'BackupService creates named recovery point in Beta Safe Mode');

  const backupsList = backupTestService.listBackups();
  assert(backupsList.length > 0, 'BackupService lists available recovery backups');

  const integrityCheck = backupTestService.verifyIntegrity(db);
  assert(integrityCheck.isValid === true, 'BackupService verifies data integrity (Migration v11, FK check)');

  const healthData = healthTestService.getSystemHealth();
  assert(healthData.systemHealthScore >= 90, 'SystemHealthService computes System Health Score S_Health');
  assert(healthData.readinessScore === 100, 'SystemHealthService evaluates Beta Readiness Checklist');

  const onboardingStatus = onboardingTestService.getStatus();
  assert(onboardingStatus.hasFamily === true, 'OnboardingService evaluates first-run status');

  const dxHealthRes = await axios.get(`${baseUrl}/api/v1/dx/health`);
  assert(dxHealthRes.status === 200, 'GET /api/v1/dx/health returns HTTP 200 OK');

  const dxOnboardingRes = await axios.get(`${baseUrl}/api/v1/dx/onboarding/status`);
  assert(dxOnboardingRes.status === 200, 'GET /api/v1/dx/onboarding/status returns HTTP 200 OK');

  const dxBackupRes = await axios.post(`${baseUrl}/api/v1/dx/backup`, { name: 'API Backup' });
  assert(dxBackupRes.status === 201, 'POST /api/v1/dx/backup creates backup file');

  // Close HTTP server
  await new Promise((resolve) => server.close(resolve));

  // Cleanup test entities & holdings
  transactionRepository.delete(holdingTx.id);
  holdingRepository.softDelete(holding.id);
  assetMasterRepository.softDelete(stockAsset.id);
  accountRepository.softDelete(account.id);
  entityRepository.softDelete(entity.id);
  familyMemberRepository.softDelete(member.id);
  // ==========================================
  // SPRINT 8B.0 CONTRACTS & INFRASTRUCTURE TESTS
  // ==========================================
  const contractsResults = await runContractsTests();
  passed += contractsResults.passed;
  failed += contractsResults.failed;

  const correlationResults = await runCorrelationTests();
  passed += correlationResults.passed;
  failed += correlationResults.failed;

  const idempotencyResults = await runIdempotencyTests();
  passed += idempotencyResults.passed;
  failed += idempotencyResults.failed;

  const auditHooksResults = await runAuditHooksTests();
  passed += auditHooksResults.passed;
  failed += auditHooksResults.failed;

  // ==========================================
  // SPRINT 8B.1 DIGITAL TWIN TESTS
  // ==========================================
  const digitalTwinResults = await runDigitalTwinTests();
  passed += digitalTwinResults.passed;
  failed += digitalTwinResults.failed;

  // ==========================================
  // SPRINT 8B.2 LIFE EVENTS ENGINE TESTS
  // ==========================================
  const lifeEventsResults = await runLifeEventsTests();
  passed += lifeEventsResults.passed;
  failed += lifeEventsResults.failed;

  // ==========================================
  // SPRINT 8B.3 PROACTIVE OBSERVER TESTS
  // ==========================================
  const proactiveObserverResults = await runProactiveObserverTests();
  passed += proactiveObserverResults.passed;
  failed += proactiveObserverResults.failed;

  // ==========================================
  // SPRINT 8C.0 CONTRACTS & MIGRATIONS TESTS
  // ==========================================
  const sprint8c0Results = await runSprint8c0Tests();
  passed += sprint8c0Results.passed;
  failed += sprint8c0Results.failed;

  // ==========================================
  // SPRINT 8C.1 FAMILY FINANCIAL HEALTH TESTS
  // ==========================================
  const sprint8c1Results = await runSprint8c1Tests();
  passed += sprint8c1Results.passed;
  failed += sprint8c1Results.failed;

  // ==========================================
  // SPRINT 8C.2 MULTI-DOMAIN TIMELINE TESTS
  // ==========================================
  const sprint8c2Results = await runSprint8c2Tests();
  passed += sprint8c2Results.passed;
  failed += sprint8c2Results.failed;

  // ==========================================
  // SPRINT 8C.3 FINANCIAL TIME MACHINE TESTS
  // ==========================================
  const sprint8c3Results = await runSprint8c3Tests();
  passed += sprint8c3Results.passed;
  failed += sprint8c3Results.failed;

  // ==========================================
  // SPRINT 8C.4 FRONTEND CONTRACTS & INVARIANTS
  // ==========================================
  const sprint8c4Results = await runSprint8c4Tests();
  passed += sprint8c4Results.passed;
  failed += sprint8c4Results.failed;

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
