// One PrismaClient for the whole app (many clients would exhaust database connections).
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({ log: ['warn', 'error'] });
export default prisma;
