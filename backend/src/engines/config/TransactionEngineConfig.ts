export interface TransactionEngineConfig {
  allowOversell: boolean;
  costBasisStrategy: 'AVERAGE_COST' | 'FIFO';
  unitPrecision: number;
  currencyPrecision: number;
  supportedTypes: string[];
}

export const DEFAULT_TRANSACTION_ENGINE_CONFIG: TransactionEngineConfig = {
  allowOversell: false,
  costBasisStrategy: 'AVERAGE_COST',
  unitPrecision: 4,
  currencyPrecision: 2,
  supportedTypes: [
    'BUY', 'SELL', 'REINVEST', 'DIVIDEND', 'INTEREST', 'BONUS', 'SPLIT', 'DEPOSIT', 'WITHDRAWAL', 'FEE', 'TAX'
  ]
};
