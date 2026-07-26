export * from './PriceSnapshot';
export * from './ValuationContext';
export * from './ValuationResult';
export * from './IValuationStrategy';
export * from './CurrencyPrecision';
export * from './MarketCalendar';
export * from './AssetTypeValuationRegistry';

// Auto-register strategies
import './strategies/EquityValuationStrategy';
import './strategies/MutualFundValuationStrategy';
import './strategies/ETFValuationStrategy';
import './strategies/GoldValuationStrategy';
import './strategies/BondValuationStrategy';
import './strategies/FixedDepositValuationStrategy';
import './strategies/ProvidentFundValuationStrategy';
import './strategies/NPSValuationStrategy';
import './strategies/RealEstateValuationStrategy';
import './strategies/CryptoValuationStrategy';
import './strategies/GenericValuationStrategy';
