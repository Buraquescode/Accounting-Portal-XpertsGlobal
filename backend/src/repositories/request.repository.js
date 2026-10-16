import prisma from '../config/db.js';

const person = { select: { id: true, name: true, email: true } };
const withPeople = { requester: person, selectedApprover: person };

// Next number for the current year, e.g. REQ-2026-0007. Must run inside the create
// transaction; the unique constraint on referenceNo is the safety net (service retries).
export async function nextReferenceNumber(tx) {
  const prefix = `REQ-${new Date().getFullYear()}-`;
  const last = await tx.request.findFirst({
    where: { referenceNo: { startsWith: prefix } },
    orderBy: { referenceNo: 'desc' },
    select: { referenceNo: true },
  });
  const seq = last ? parseInt(last.referenceNo.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export function create(tx, data) {
  return tx.request.create({ data, include: withPeople });
}

export function findById(id) {
  return prisma.request.findUnique({ where: { id }, include: withPeople });
}

export function list({ where, skip, take }) {
  return prisma.request.findMany({
    where,
    skip,
    take,
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    include: withPeople,
  });
}

export function count(where) {
  return prisma.request.count({ where });
}

export async function countByStatus(where) {
  const rows = await prisma.request.groupBy({ by: ['status'], where, _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.status, r._count._all]));
}

// An approver the requester may pick: active and holding the APPROVER role.
export function findActiveApprover(id) {
  return prisma.user.findFirst({
    where: { id, isActive: true, roles: { has: 'APPROVER' } },
    select: { id: true, name: true },
  });
}
