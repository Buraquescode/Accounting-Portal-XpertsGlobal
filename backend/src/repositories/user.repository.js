// Database queries for users. No business rules here.
import { prisma } from '../config/db.js';
import { ROLES } from '../config/constants.js';

export const findByEmail = (email) => prisma.user.findUnique({ where: { email } });

export const findById = (id) => prisma.user.findUnique({ where: { id } });

// Active people who may be chosen as the first approver on a request form.
export const findApprovers = () =>
  prisma.user.findMany({
    where: { isActive: true, roles: { has: ROLES.APPROVER } },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
