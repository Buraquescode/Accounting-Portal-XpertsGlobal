import { describe, it, expect } from 'vitest';
import { getAvailableActions } from '../../src/services/workflow.service.js';
import { TRANSITIONS, resolveTransition } from '../../src/config/workflow.js';

const user = (id, roles) => ({ id, roles });
const sara = user('u-sara', ['REQUESTER']);
const asif = user('u-asif', ['REQUESTER', 'APPROVER']);
const accounting = user('u-acc', ['APPROVER', 'ACCOUNTING']);
const muhammad = user('u-mu', ['FINAL_APPROVER']);

// Sara's request, routed to Asif unless a test says otherwise.
const req = (status, over = {}) => ({
  id: 'r1', status, requesterId: sara.id, selectedApproverId: asif.id, ...over,
});

describe('getAvailableActions', () => {
  it('selected approver at PENDING can start review, forward or reject', () => {
    expect(getAvailableActions(asif, req('PENDING'))).toEqual(['START_REVIEW', 'FORWARD', 'REJECT']);
  });
  it('selected approver at UNDER_REVIEW can forward or reject only', () => {
    expect(getAvailableActions(asif, req('UNDER_REVIEW'))).toEqual(['FORWARD', 'REJECT']);
  });
  it('an approver who was not selected gets nothing', () => {
    expect(getAvailableActions(accounting, req('PENDING'))).toEqual([]);
    expect(getAvailableActions(accounting, req('UNDER_REVIEW'))).toEqual([]);
  });
  it('the selected approver can never approve', () => {
    for (const status of ['PENDING', 'UNDER_REVIEW', 'AWAITING_FINAL_APPROVAL', 'APPROVED']) {
      expect(getAvailableActions(asif, req(status))).not.toContain('APPROVE');
    }
  });
  it('selected approver has no actions once the request is forwarded', () => {
    expect(getAvailableActions(asif, req('AWAITING_FINAL_APPROVAL'))).toEqual([]);
  });
  it('nobody can act on their own request, even as the selected approver', () => {
    expect(getAvailableActions(sara, req('PENDING'))).toEqual([]);
    const own = req('PENDING', { requesterId: asif.id, selectedApproverId: asif.id });
    expect(getAvailableActions(asif, own)).toEqual([]);
  });
  it('final approver acts only at AWAITING_FINAL_APPROVAL', () => {
    const actions = getAvailableActions(muhammad, req('AWAITING_FINAL_APPROVAL'));
    expect([...actions].sort()).toEqual(['APPROVE', 'REJECT']);
    for (const status of ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID']) {
      expect(getAvailableActions(muhammad, req(status))).toEqual([]);
    }
  });
  it('accounting can mark paid only when APPROVED', () => {
    expect(getAvailableActions(accounting, req('APPROVED'))).toEqual(['MARK_PAID']);
    expect(getAvailableActions(accounting, req('PAID'))).toEqual([]);
    expect(getAvailableActions(muhammad, req('APPROVED'))).toEqual([]);
  });
  it('a requester without approver roles never gets actions', () => {
    for (const status of ['PENDING', 'UNDER_REVIEW', 'AWAITING_FINAL_APPROVAL', 'APPROVED']) {
      expect(getAvailableActions(user('u-ali', ['REQUESTER']), req(status))).toEqual([]);
    }
  });
  it('terminal states offer no actions to anyone', () => {
    for (const u of [sara, asif, accounting, muhammad]) {
      expect(getAvailableActions(u, req('REJECTED'))).toEqual([]);
    }
  });
});

describe('transition table', () => {
  it('REJECT resolves by current status', () => {
    expect(resolveTransition('REJECT', 'PENDING')).toBe(TRANSITIONS.APPROVER_REJECT);
    expect(resolveTransition('REJECT', 'UNDER_REVIEW')).toBe(TRANSITIONS.APPROVER_REJECT);
    expect(resolveTransition('REJECT', 'AWAITING_FINAL_APPROVAL')).toBe(TRANSITIONS.FINAL_REJECT);
  });
  it('unknown actions resolve to nothing', () => {
    expect(resolveTransition('DELETE', 'PENDING') ?? null).toBeNull();
  });
  it('every rejection requires a comment', () => {
    expect(TRANSITIONS.APPROVER_REJECT.commentRequired).toBe(true);
    expect(TRANSITIONS.FINAL_REJECT.commentRequired).toBe(true);
  });
  it('no transition leaves REJECTED or PAID', () => {
    for (const t of Object.values(TRANSITIONS)) {
      expect(t.from).not.toContain('REJECTED');
      expect(t.from).not.toContain('PAID');
    }
  });
  it('only the final approver can move a request to APPROVED', () => {
    const toApproved = Object.values(TRANSITIONS).filter((t) => t.to === 'APPROVED');
    expect(toApproved.map((t) => t.actor)).toEqual(['FINAL_APPROVER']);
  });
});
