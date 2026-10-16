import { z } from 'zod';

const TYPES = ['EXPENSE', 'FUND_REQUEST', 'BUDGET_APPROVAL'];
const STATUSES = ['PENDING', 'UNDER_REVIEW', 'AWAITING_FINAL_APPROVAL', 'APPROVED', 'REJECTED', 'PAID'];

// Multipart fields arrive as strings, so numbers are coerced.
export const createRequestSchema = z.object({
  type: z.enum(TYPES),
  currency: z.enum(['PKR', 'USD']),
  amount: z.coerce
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .max(999999999.99, 'Amount is too large')
    // Max 2 decimals; the tolerance absorbs binary floating point noise (0.07 * 100).
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-3, 'Amount can have at most 2 decimals'),
  notes: z.string().trim().min(3, 'Notes must be at least 3 characters').max(1000, 'Notes are too long'),
  selectedApproverId: z.string().uuid('Select a valid approver'),
});

// Frontend filters may send empty strings; treat them as "not set".
const emptyToUndefined = (v) => (v === '' ? undefined : v);

export const listQuerySchema = z.object({
  status: z.preprocess(emptyToUndefined, z.enum(STATUSES).optional()),
  type: z.preprocess(emptyToUndefined, z.enum(TYPES).optional()),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// Route param :id. Object schema so validate(idParamSchema, 'params') and the controller both work.
export const idParamSchema = z.object({ id: z.string().uuid('Invalid request id') });

// Body for workflow actions. Comment is optional here; the service enforces it for rejections.
// .default({}) lets a POST with no body through.
export const actionSchema = z
  .object({ comment: z.string().trim().max(500, 'Comment is too long').optional() })
  .default({});