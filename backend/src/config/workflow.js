import { STATUSES as S, AUDIT_ACTIONS as A } from './constants.js';

// Single source of truth for the status machine. Nothing else decides transitions.
export const TRANSITIONS = {
  START_REVIEW:    { from: [S.PENDING], to: S.UNDER_REVIEW, auditAction: A.REVIEW_STARTED, actor: 'SELECTED_APPROVER', commentRequired: false, defaultComment: 'Review started' },
  FORWARD:         { from: [S.PENDING, S.UNDER_REVIEW], to: S.AWAITING_FINAL_APPROVAL, auditAction: A.FORWARDED, actor: 'SELECTED_APPROVER', commentRequired: false, defaultComment: 'Forwarded to Final Approver' },
  APPROVER_REJECT: { from: [S.PENDING, S.UNDER_REVIEW], to: S.REJECTED, auditAction: A.REJECTED, actor: 'SELECTED_APPROVER', commentRequired: true },
  APPROVE:         { from: [S.AWAITING_FINAL_APPROVAL], to: S.APPROVED, auditAction: A.APPROVED, actor: 'FINAL_APPROVER', commentRequired: false, defaultComment: 'Approved' },
  FINAL_REJECT:    { from: [S.AWAITING_FINAL_APPROVAL], to: S.REJECTED, auditAction: A.REJECTED, actor: 'FINAL_APPROVER', commentRequired: true },
  MARK_PAID:       { from: [S.APPROVED], to: S.PAID, auditAction: A.PAID, actor: 'ACCOUNTING', commentRequired: false, defaultComment: 'Marked as paid' },
};

// Names the UI and API use. REJECT maps to a different transition depending on status.
export const PUBLIC_ACTIONS = ['START_REVIEW', 'FORWARD', 'REJECT', 'APPROVE', 'MARK_PAID'];

export function resolveTransition(publicAction, status) {
  if (publicAction === 'REJECT') {
    return status === S.AWAITING_FINAL_APPROVAL ? TRANSITIONS.FINAL_REJECT : TRANSITIONS.APPROVER_REJECT;
  }
  return TRANSITIONS[publicAction] ?? null;
}