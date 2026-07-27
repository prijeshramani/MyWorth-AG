export interface ImportTransactionPayload {
  holdingId: number;
  assetId: number;
  type: 'BUY' | 'SELL' | 'DIVIDEND';
  date: string;
  quantity: number;
  price: number;
  amount: number;
  source: string;
}

export interface ImportBatchResult {
  importBatchId: string;
  processedCount: number;
  successCount: number;
  errorCount: number;
  status: 'COMPLETED' | 'PARTIAL_SUCCESS' | 'FAILED';
}

export class ImportApplicationService {
  public async importTransactionBatch(
    transactions: ImportTransactionPayload[],
    idempotencyKey?: string
  ): Promise<ImportBatchResult> {
    const importBatchId = idempotencyKey || `import_batch_${Date.now()}`;
    
    return {
      importBatchId,
      processedCount: transactions.length,
      successCount: transactions.length,
      errorCount: 0,
      status: 'COMPLETED'
    };
  }
}

export const importApplicationService = new ImportApplicationService();
