// Database queries for login sessions. Rows are never deleted, only marked revoked.
import { prisma } from '../config/db.js';

export const create = ({ userId, userAgent, ipAddress, expiresAt }) =>
  prisma.session.create({ data: { userId, userAgent, ipAddress, expiresAt } });

// Includes the user so one query answers "is this session valid and who is it?".
export const findById = (id) => prisma.session.findUnique({ where: { id }, include: { user: true } });

// updateMany (not update) so revoking an unknown or already revoked session is harmless.
export const revoke = (id) =>
  prisma.session.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: new Date() } });

export const revokeAllForUser = (userId) =>
  prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
