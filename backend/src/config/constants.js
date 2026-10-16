// Shared constants. The values mirror the enums in prisma/schema.prisma so the two never drift apart.
import { env } from './env.js';

const asEnum = (...values) => Object.freeze(Object.fromEntries(values.map((v) => [v, v])));

export const ROLES = asEnum('REQUESTER', 'APPROVER', 'FINAL_APPROVER', 'ACCOUNTING');
export const REQUEST_TYPES = asEnum('EXPENSE', 'FUND_REQUEST', 'BUDGET_APPROVAL');
export const CURRENCIES = asEnum('PKR', 'USD');
export const STATUSES = asEnum('PENDING', 'UNDER_REVIEW', 'AWAITING_FINAL_APPROVAL', 'APPROVED', 'REJECTED', 'PAID');
export const AUDIT_ACTIONS = asEnum('SUBMITTED', 'REVIEW_STARTED', 'FORWARDED', 'APPROVED', 'REJECTED', 'PAID');

// Receipts: images and PDF only (the upload step also checks the real file bytes, not just this list).
export const ALLOWED_MIME_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
export const MAX_FILE_SIZE = env.MAX_FILE_SIZE_MB * 1024 * 1024;
