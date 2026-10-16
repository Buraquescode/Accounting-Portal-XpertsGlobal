import prisma from '../config/db.js';

// Append-only by design: only create and read exist. There is no update or delete here,
// and the database trigger blocks them even if someone writes raw SQL.
export function create(tx, data) {
  return (tx ?? prisma).requestAuditLog.create({ data });
}

export function findByRequest(requestId) {
  return prisma.requestAuditLog.findMany({
    where: { requestId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    include: { actor: { select: { id: true, name: true } } },
  });
}
