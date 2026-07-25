import { z } from 'zod';

// Relationship Enum
export const RelationshipEnum = z.enum([
  'SELF',
  'SPOUSE',
  'CHILD',
  'PARENT',
  'SIBLING',
  'GRANDPARENT',
  'GRANDCHILD',
  'IN_LAW',
  'OTHER'
]);

// Entity Type Enum
export const EntityTypeEnum = z.enum([
  'INDIVIDUAL',
  'HUF',
  'MINOR',
  'COMPANY',
  'TRUST',
  'PARTNERSHIP',
  'LLP',
  'OTHER'
]);

// Account Type Enum
export const AccountTypeEnum = z.enum([
  'DEMAT',
  'BANK',
  'EPF',
  'PPF',
  'NPS',
  'FD',
  'MUTUAL_FUND_FOLIO',
  'CREDIT_CARD',
  'OTHER'
]);

// PAN Regex: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// Family Schemas
export const CreateFamilySchema = z.object({
  name: z.string().min(1, 'Family name is required').max(100),
  currency: z.string().default('INR')
});

export const UpdateFamilySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currency: z.string().optional()
});

// Family Member Schemas
export const CreateFamilyMemberSchema = z.object({
  family_id: z.number().int().positive('Valid Family ID is required'),
  name: z.string().min(1, 'Member name is required').max(100),
  relationship: RelationshipEnum,
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD').optional().nullable()
});

export const UpdateFamilyMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  relationship: RelationshipEnum.optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()
});

// Entity Schemas
export const CreateEntitySchema = z.object({
  family_member_id: z.number().int().positive('Valid Family Member ID is required'),
  name: z.string().min(1, 'Entity name is required').max(100),
  entity_type: EntityTypeEnum,
  pan_number: z.string()
    .trim()
    .toUpperCase()
    .regex(PAN_REGEX, 'Invalid PAN format. Must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)')
    .optional()
    .nullable()
    .or(z.literal(''))
});

export const UpdateEntitySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  entity_type: EntityTypeEnum.optional(),
  pan_number: z.string()
    .trim()
    .toUpperCase()
    .regex(PAN_REGEX, 'Invalid PAN format. Must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)')
    .optional()
    .nullable()
    .or(z.literal(''))
});

// Account Schemas
export const CreateAccountSchema = z.object({
  entity_id: z.number().int().positive('Valid Entity ID is required'),
  account_name: z.string().min(1, 'Account name is required').max(100),
  account_type: AccountTypeEnum,
  provider: z.string().max(100).optional().nullable(),
  institution_name: z.string().max(100).optional().nullable(),
  account_number: z.string().max(100).optional().nullable(),
  masked_account_number: z.string().max(100).optional().nullable(),
  nickname: z.string().max(100).optional().nullable(),
  is_active: z.number().int().min(0).max(1).optional()
});

export const UpdateAccountSchema = z.object({
  account_name: z.string().min(1).max(100).optional(),
  account_type: AccountTypeEnum.optional(),
  provider: z.string().max(100).optional().nullable(),
  institution_name: z.string().max(100).optional().nullable(),
  account_number: z.string().max(100).optional().nullable(),
  masked_account_number: z.string().max(100).optional().nullable(),
  nickname: z.string().max(100).optional().nullable(),
  is_active: z.number().int().min(0).max(1).optional()
});
