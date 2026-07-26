import { EngineWarning, EngineError } from '../common/EngineResult';

export interface RawTransactionInput {
  id?: number;
  holding_id?: number | null;
  asset_id?: number;
  type: string;
  date: string;
  quantity: number;
  price: number;
  amount: number;
  source?: string;
  narration?: string | null;
}

export class TransactionValidator {
  public static validate(
    transactions: RawTransactionInput[],
    targetHoldingId?: number,
    supportedTypes: Set<string> = new Set([
      'BUY', 'SELL', 'REINVEST', 'DIVIDEND', 'INTEREST', 'BONUS', 'SPLIT', 'DEPOSIT', 'WITHDRAWAL', 'FEE', 'TAX'
    ])
  ): { sortedTransactions: RawTransactionInput[]; warnings: EngineWarning[]; errors: EngineError[] } {
    const warnings: EngineWarning[] = [];
    const errors: EngineError[] = [];

    if (!transactions || transactions.length === 0) {
      warnings.push({
        code: 'EMPTY_TRANSACTION_LIST',
        message: 'No transactions provided for processing.'
      });
      return { sortedTransactions: [], warnings, errors };
    }

    // 1. Sort transactions chronologically (date ASC, id ASC)
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (a.id || 0) - (b.id || 0);
    });

    // 2. Validate individual transaction rules
    for (let i = 0; i < sortedTransactions.length; i++) {
      const tx = sortedTransactions[i];

      // Check supported type
      if (!supportedTypes.has(tx.type.toUpperCase())) {
        errors.push({
          code: 'UNSUPPORTED_TRANSACTION_TYPE',
          message: `Transaction ${tx.id || i} has unsupported type '${tx.type}'`,
          details: { transaction: tx }
        });
      }

      // Check holding ownership if targetHoldingId specified
      if (targetHoldingId && tx.holding_id && tx.holding_id !== targetHoldingId) {
        warnings.push({
          code: 'MISMATCHED_HOLDING_OWNERSHIP',
          message: `Transaction ${tx.id || i} holding_id (${tx.holding_id}) does not match context holding_id (${targetHoldingId})`,
          details: { transactionId: tx.id, holdingId: tx.holding_id, targetHoldingId }
        });
      }

      // Check negative quantity/price
      if (tx.quantity < 0) {
        warnings.push({
          code: 'NEGATIVE_QUANTITY_DETECTED',
          message: `Transaction ${tx.id || i} on ${tx.date} has negative quantity (${tx.quantity})`,
          details: { transactionId: tx.id, date: tx.date, quantity: tx.quantity }
        });
      }

      if (tx.price < 0) {
        warnings.push({
          code: 'NEGATIVE_PRICE_DETECTED',
          message: `Transaction ${tx.id || i} on ${tx.date} has negative price (${tx.price})`,
          details: { transactionId: tx.id, date: tx.date, price: tx.price }
        });
      }
    }

    return { sortedTransactions, warnings, errors };
  }
}
