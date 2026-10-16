import * as requestsApi from '../api/requests.api';

// Maps the server's public action names to API calls. No permission logic here:
// the server decides which actions exist (availableActions) and re-checks on every call.
const CALLS = {
  START_REVIEW: requestsApi.startReview,
  FORWARD: requestsApi.forward,
  REJECT: requestsApi.reject,
  APPROVE: requestsApi.approve,
  MARK_PAID: requestsApi.markPaid,
};
export const COMMENT_REQUIRED = ['REJECT'];
export const SUCCESS_TEXT = {
  START_REVIEW: 'Review started', FORWARD: 'Forwarded to the Final Approver',
  REJECT: 'Request rejected', APPROVE: 'Request approved', MARK_PAID: 'Marked as paid',
};
export const runAction = (id, action, comment) => CALLS[action](id, comment);
