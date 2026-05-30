import { z } from 'zod';

export const AssetTypeSchema = z.enum([
  'MUTUAL_FUND',
  'STOCK',
  'NPS',
  'GOLD',
  'BOND',
  'PROPERTY',
  'BANK_ACCOUNT',
  'EPF',
  'OTHER'
]);

export const AssetCategorySchema = z.enum([
  'Equity',
  'Debt',
  'Cash',
  'Hybrid',
  'Alternative',
  'Other'
]);

export const TransactionTypeSchema = z.enum([
  'BUY',
  'SELL',
  'REINVEST',
  'DIVIDEND',
  'INTEREST',
  'BONUS'
]);

export const CreateAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  type: AssetTypeSchema,
  category: AssetCategorySchema,
  identifier: z.string().optional()
});

export const CreateTransactionSchema = z.object({
  asset_id: z.number().int().positive('Asset ID is required'),
  type: TransactionTypeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  price: z.number().positive('Price must be greater than 0'),
  amount: z.number().positive('Amount must be greater than 0'),
  source: z.enum(['MANUAL', 'PDF_IMPORT']).default('MANUAL')
});

export const ManualAssetWithTransactionSchema = z.object({
  asset: CreateAssetSchema,
  transaction: z.object({
    type: TransactionTypeSchema,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    quantity: z.number().positive('Quantity must be greater than 0'),
    price: z.number().positive('Price must be greater than 0'),
    amount: z.number().positive('Amount must be greater than 0')
  }).optional()
});
