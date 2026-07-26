import { IFinancialEngine, EngineMetadata } from './common/IFinancialEngine';
import { EngineContext } from './common/EngineContext';
import { EngineResult, EngineWarning, EngineError } from './common/EngineResult';
import { FinancialMath } from './common/FinancialMath';
import { RawTransactionInput, TransactionValidator } from './validators/TransactionValidator';
import { TransactionEngineConfig, DEFAULT_TRANSACTION_ENGINE_CONFIG } from './config/TransactionEngineConfig';
import { engineRegistry } from './common/EngineRegistry';

export interface NormalizedTransactionState {
  transactionId?: number;
  date: string;
  type: string;
  quantity: number;
  price: number;
  amount: number;
  runningQuantity: number;
  averageCost: number;
  totalCostBasis: number;
}

export interface HoldingStateSummary {
  holdingId?: number;
  totalQuantity: number;
  averageCost: number;
  totalCostBasis: number;
  status: 'OPEN' | 'CLOSED';
  transactionCount: number;
}

export interface TransactionEngineOutput {
  summary: HoldingStateSummary;
  normalizedTransactions: NormalizedTransactionState[];
}

export class TransactionEngine implements IFinancialEngine<RawTransactionInput[], TransactionEngineOutput> {
  public readonly metadata: EngineMetadata = {
    id: 'TRANSACTION_ENGINE',
    name: 'Transaction Engine Foundation',
    version: '1.0.0',
    supportedAssetTypes: [
      'STOCK', 'MUTUAL_FUND', 'ETF', 'BOND', 'FD', 'PPF', 'EPF', 'NPS', 'SSA', 'BANK', 'GOLD', 'REAL_ESTATE', 'CRYPTO', 'OTHER'
    ],
    deterministic: true,
    idempotent: true
  };

  private config: TransactionEngineConfig;

  constructor(config: Partial<TransactionEngineConfig> = {}) {
    this.config = { ...DEFAULT_TRANSACTION_ENGINE_CONFIG, ...config };
  }

  public execute(context: EngineContext<RawTransactionInput[]>): EngineResult<TransactionEngineOutput> {
    const startTime = Date.now();
    const auditTrail: string[] = [];
    const warnings: EngineWarning[] = [];
    const errors: EngineError[] = [];

    auditTrail.push(`[TransactionEngine v${this.metadata.version}] Execution started at ${new Date().toISOString()}`);
    if (context.correlationId) {
      auditTrail.push(`[Context] Correlation ID: ${context.correlationId}`);
    }

    const rawTxs = context.data || [];
    auditTrail.push(`[Input] Received ${rawTxs.length} raw transaction records`);

    // 1. Validate and sort transaction sequence
    const { sortedTransactions, warnings: valWarnings, errors: valErrors } = TransactionValidator.validate(
      rawTxs,
      context.holdingId,
      new Set(this.config.supportedTypes)
    );

    warnings.push(...valWarnings);
    errors.push(...valErrors);

    if (errors.length > 0) {
      auditTrail.push(`[Validation] Execution stopped with ${errors.length} validation errors`);
      return {
        success: false,
        warnings,
        errors,
        auditTrail,
        metrics: { processedCount: 0, warningCount: warnings.length, errorCount: errors.length },
        executionTimeMs: Date.now() - startTime,
        engineVersion: this.metadata.version
      };
    }

    // 2. Perform $O(N)$ calculation over transactions
    let runningQty = 0;
    let totalCostBasis = 0;
    let avgCost = 0;
    const normalizedTransactions: NormalizedTransactionState[] = [];

    for (let i = 0; i < sortedTransactions.length; i++) {
      const tx = sortedTransactions[i];
      const typeUpper = tx.type.toUpperCase();
      const qty = FinancialMath.roundUnits(Math.abs(tx.quantity), this.config.unitPrecision);
      const price = FinancialMath.roundMoney(Math.abs(tx.price), this.config.currencyPrecision);
      const amount = tx.amount ? FinancialMath.roundMoney(Math.abs(tx.amount), this.config.currencyPrecision) : FinancialMath.roundMoney(qty * price, this.config.currencyPrecision);

      if (typeUpper === 'BUY' || typeUpper === 'REINVEST' || typeUpper === 'DEPOSIT') {
        const addedCost = amount || FinancialMath.roundMoney(qty * price, this.config.currencyPrecision);
        runningQty = FinancialMath.roundUnits(runningQty + qty, this.config.unitPrecision);
        totalCostBasis = FinancialMath.roundMoney(totalCostBasis + addedCost, this.config.currencyPrecision);
        avgCost = FinancialMath.safeDiv(totalCostBasis, runningQty);
        auditTrail.push(`[BUY] Date: ${tx.date}, Qty: +${qty}, AddedCost: ${addedCost}, RunningQty: ${runningQty}, AvgCost: ${avgCost.toFixed(2)}`);

      } else if (typeUpper === 'SELL' || typeUpper === 'WITHDRAWAL') {
        // Detect Oversell
        if (qty > runningQty) {
          const oversellWarning: EngineWarning = {
            code: 'OVERSELL_CONDITION_DETECTED',
            message: `Oversell condition detected on ${tx.date} for transaction ${tx.id || i}. Sell quantity (${qty}) exceeds running balance (${runningQty}).`,
            details: { transactionId: tx.id, date: tx.date, sellQuantity: qty, runningQuantity: runningQty, deficit: FinancialMath.roundUnits(qty - runningQty) }
          };
          warnings.push(oversellWarning);
          auditTrail.push(`[WARNING] Oversell condition on ${tx.date}: Deficit = ${FinancialMath.roundUnits(qty - runningQty)}`);

          if (!this.config.allowOversell) {
            errors.push({
              code: 'OVERSELL_ERROR',
              message: oversellWarning.message,
              details: oversellWarning.details
            });
          }
        }

        const costReduction = FinancialMath.roundMoney(qty * avgCost, this.config.currencyPrecision);
        runningQty = FinancialMath.roundUnits(Math.max(0, runningQty - qty), this.config.unitPrecision);
        totalCostBasis = FinancialMath.roundMoney(Math.max(0, totalCostBasis - costReduction), this.config.currencyPrecision);

        if (runningQty === 0) {
          avgCost = 0;
          totalCostBasis = 0;
        } else {
          avgCost = FinancialMath.safeDiv(totalCostBasis, runningQty);
        }
        auditTrail.push(`[SELL] Date: ${tx.date}, Qty: -${qty}, ReducedCost: ${costReduction}, RunningQty: ${runningQty}, AvgCost: ${avgCost.toFixed(2)}`);

      } else if (typeUpper === 'SPLIT') {
        const splitRatio = qty || (price > 0 ? price : 1);
        if (splitRatio > 0 && runningQty > 0) {
          const oldQty = runningQty;
          runningQty = FinancialMath.roundUnits(runningQty * splitRatio, this.config.unitPrecision);
          avgCost = FinancialMath.safeDiv(totalCostBasis, runningQty);
          auditTrail.push(`[SPLIT] Date: ${tx.date}, Ratio: ${splitRatio}:1, OldQty: ${oldQty}, NewQty: ${runningQty}, NewAvgCost: ${avgCost.toFixed(2)}`);
        }

      } else if (typeUpper === 'BONUS') {
        const bonusUnits = qty;
        if (bonusUnits > 0) {
          runningQty = FinancialMath.roundUnits(runningQty + bonusUnits, this.config.unitPrecision);
          avgCost = FinancialMath.safeDiv(totalCostBasis, runningQty);
          auditTrail.push(`[BONUS] Date: ${tx.date}, BonusUnits: +${bonusUnits}, NewQty: ${runningQty}, NewAvgCost: ${avgCost.toFixed(2)}`);
        }
      } else {
        auditTrail.push(`[${typeUpper}] Date: ${tx.date}, Amount: ${amount} (No quantity impact)`);
      }

      normalizedTransactions.push({
        transactionId: tx.id,
        date: tx.date,
        type: typeUpper,
        quantity: qty,
        price,
        amount,
        runningQuantity: runningQty,
        averageCost: FinancialMath.roundMoney(avgCost, this.config.currencyPrecision),
        totalCostBasis: FinancialMath.roundMoney(totalCostBasis, this.config.currencyPrecision)
      });
    }

    const finalSummary: HoldingStateSummary = {
      holdingId: context.holdingId,
      totalQuantity: runningQty,
      averageCost: FinancialMath.roundMoney(avgCost, this.config.currencyPrecision),
      totalCostBasis: FinancialMath.roundMoney(totalCostBasis, this.config.currencyPrecision),
      status: runningQty > 0 ? 'OPEN' : 'CLOSED',
      transactionCount: normalizedTransactions.length
    };

    auditTrail.push(`[Summary] Final Quantity: ${finalSummary.totalQuantity}, Total Cost Basis: ${finalSummary.totalCostBasis}, Status: ${finalSummary.status}`);

    const isSuccess = errors.length === 0;

    return {
      success: isSuccess,
      data: {
        summary: finalSummary,
        normalizedTransactions
      },
      warnings,
      errors,
      auditTrail,
      metrics: {
        processedCount: normalizedTransactions.length,
        warningCount: warnings.length,
        errorCount: errors.length
      },
      executionTimeMs: Date.now() - startTime,
      engineVersion: this.metadata.version
    };
  }
}

// Auto-register TransactionEngine instance in global registry
export const transactionEngine = new TransactionEngine();
engineRegistry.register(transactionEngine);
