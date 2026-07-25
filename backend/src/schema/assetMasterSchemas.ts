import { z } from 'zod';

export const MasterAssetTypeEnum = z.enum([
  'STOCK',
  'MUTUAL_FUND',
  'ETF',
  'BOND',
  'FD',
  'PPF',
  'EPF',
  'NPS',
  'SSA',
  'BANK',
  'GOLD',
  'REAL_ESTATE',
  'CRYPTO',
  'OTHER'
]);

export const MasterAssetStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'DELISTED',
  'MATURED'
]);

export const HoldingStatusEnum = z.enum([
  'OPEN',
  'CLOSED'
]);

// Asset Master Schemas
export const CreateAssetMasterSchema = z.object({
  asset_type: MasterAssetTypeEnum,
  name: z.string().min(1, 'Asset master name is required').max(150),
  display_name: z.string().max(150).optional(),
  symbol: z.string().max(50).optional().nullable(),
  isin: z.string().max(50).optional().nullable(),
  currency: z.string().default('INR'),
  status: MasterAssetStatusEnum.optional(),
  metadata: z.union([z.string(), z.record(z.any())]).optional().nullable()
});

export const UpdateAssetMasterSchema = z.object({
  asset_type: MasterAssetTypeEnum.optional(),
  name: z.string().min(1).max(150).optional(),
  display_name: z.string().max(150).optional(),
  symbol: z.string().max(50).optional().nullable(),
  isin: z.string().max(50).optional().nullable(),
  currency: z.string().optional(),
  status: MasterAssetStatusEnum.optional(),
  metadata: z.union([z.string(), z.record(z.any())]).optional().nullable()
});

// Holding Schemas
export const CreateHoldingSchema = z.object({
  account_id: z.number().int().positive('Valid Account ID is required'),
  asset_id: z.number().int().positive('Valid Asset Master ID is required'),
  opened_at: z.string().optional(),
  closed_at: z.string().optional().nullable(),
  status: HoldingStatusEnum.optional()
});

export const UpdateHoldingSchema = z.object({
  opened_at: z.string().optional(),
  closed_at: z.string().optional().nullable(),
  status: HoldingStatusEnum.optional()
});
