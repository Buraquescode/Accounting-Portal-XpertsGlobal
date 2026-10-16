import * as auditLogRepository from '../repositories/auditLog.repository.js';

// Only two operations are exposed on purpose: append and read.
export function append(tx, { requestId, actorId, action, fromStatus = null, toStatus, comment = null }) {
  return auditLogRepository.create(tx, { requestId, actorId, action, fromStatus, toStatus, comment });
}

export async function getHistory(requestId) {
  const rows = await auditLogRepository.findByRequest(requestId);
  return rows.map((r) => ({
    id: String(r.id), // id may be BigInt, which JSON cannot serialize
    action: r.action,
    fromStatus: r.fromStatus,
    toStatus: r.toStatus,
    comment: r.comment,
    createdAt: r.createdAt,
    actor: r.actor ? { id: r.actor.id, name: r.actor.name } : null,
  }));
}
