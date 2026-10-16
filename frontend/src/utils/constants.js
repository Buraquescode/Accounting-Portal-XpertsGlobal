export const ROLES = { REQUESTER: 'REQUESTER', APPROVER: 'APPROVER', FINAL_APPROVER: 'FINAL_APPROVER', ACCOUNTING: 'ACCOUNTING' };
export const ROLE_LABELS = { REQUESTER: 'Requester', APPROVER: 'Approver', FINAL_APPROVER: 'Final Approver', ACCOUNTING: 'Accounting' };

export const STATUS_LABELS = {
  PENDING: 'Pending', UNDER_REVIEW: 'Under Review', AWAITING_FINAL_APPROVAL: 'Awaiting Final Approval',
  APPROVED: 'Approved', REJECTED: 'Rejected', PAID: 'Paid',
};
// CSS modifier per status (see .badge--* in components.css)
export const STATUS_STYLES = {
  PENDING: 'pending', UNDER_REVIEW: 'under-review', AWAITING_FINAL_APPROVAL: 'awaiting',
  APPROVED: 'approved', REJECTED: 'rejected', PAID: 'paid',
};
export const TYPE_LABELS = { EXPENSE: 'Expense Submission', FUND_REQUEST: 'Fund Request', BUDGET_APPROVAL: 'Budget Approval' };
export const CURRENCIES = ['PKR', 'USD'];
export const ACTION_LABELS = {
  START_REVIEW: 'Start Review', FORWARD: 'Forward', REJECT: 'Reject', APPROVE: 'Approve', MARK_PAID: 'Mark Paid',
};
