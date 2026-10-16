import prisma from '../config/db.js';
import { ROLES as R } from '../config/constants.js';
import { PUBLIC_ACTIONS, resolveTransition } from '../config/workflow.js';
import { hasRole } from '../middlewares/authorize.js';
import ApiError from '../utils/ApiError.js';
import * as requestRepo from '../repositories/request.repository.js';
import * as auditService from './audit.service.js';

// Does this user fill the actor slot of a transition for this request?
function isActor(user, request, actor) {
  switch (actor) {
    case 'SELECTED_APPROVER': return user.id === request.selectedApproverId && hasRole(user, R.APPROVER);
    case 'FINAL_APPROVER':    return hasRole(user, R.FINAL_APPROVER);
    case 'ACCOUNTING':        return hasRole(user, R.ACCOUNTING);
    default: return false;
  }
}

// Pure function. The UI only renders what this returns.
export function getAvailableActions(user, request) {
  if (request.requesterId === user.id) return []; // no self-approval
  return PUBLIC_ACTIONS.filter((action) => {
    const t = resolveTransition(action, request.status);
    return t && isActor(user, request, t.actor) && t.from.includes(request.status);
  });
}

export async function performAction(user, requestId, action, comment) {
  const request = await requestRepo.findById(requestId);
  if (!request) throw ApiError.notFound('Request not found');

  const t = resolveTransition(action, request.status);
  if (!t) throw ApiError.badRequest('Unknown action');

  if (request.requesterId === user.id) throw ApiError.forbidden('You cannot act on your own request');
  if (!isActor(user, request, t.actor)) throw ApiError.forbidden(`You are not allowed to ${action} this request`);
  if (!t.from.includes(request.status)) throw ApiError.conflict(`Request is ${request.status}, cannot ${action}`);

  const text = (comment ?? '').trim();
  if (t.commentRequired && !text) throw ApiError.badRequest('A comment is required for this action');

  await prisma.$transaction(async (tx) => {
    // Optimistic concurrency: only succeeds if status is still what we read.
    const { count } = await tx.request.updateMany({
      where: { id: requestId, status: request.status },
      data: { status: t.to },
    });
    if (count === 0) throw ApiError.conflict('Request was changed by someone else, please refresh');

    await auditService.append(tx, {
      requestId,
      actorId: user.id,
      action: t.auditAction,
      fromStatus: request.status,
      toStatus: t.to,
      comment: text || t.defaultComment || null,
    });
  });
}