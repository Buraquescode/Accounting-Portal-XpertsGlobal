// Proves the database (not just the API) refuses to change the audit log.
// Each attempt runs inside a transaction that is always rolled back, so nothing can be damaged
// even if the trigger were missing.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ROLLBACK = 'ROLLBACK_SENTINEL';

async function attempt(label, run) {
  try {
    await prisma.$transaction(async (tx) => {
      await run(tx);
      throw new Error(ROLLBACK); // reached only if the database allowed the change
    });
    return false;
  } catch (err) {
    const blocked = String(err.message).includes('append-only');
    const allowed = String(err.message).includes(ROLLBACK);
    console.log(
      blocked ? `BLOCKED  ${label}` : allowed ? `ALLOWED  ${label}  <-- PROBLEM` : `ERROR    ${label}: ${err.message}`
    );
    return blocked;
  }
}

async function main() {
  const row = await prisma.requestAuditLog.findFirst({ orderBy: { id: 'asc' } });
  if (!row) throw new Error('No audit rows found. Run the seed first.');

  const results = [
    await attempt('UPDATE request_audit_logs', (tx) =>
      tx.$executeRaw`UPDATE "request_audit_logs" SET "comment" = 'tampered' WHERE "id" = ${row.id}`),
    await attempt('DELETE FROM request_audit_logs', (tx) =>
      tx.$executeRaw`DELETE FROM "request_audit_logs" WHERE "id" = ${row.id}`),
    await attempt('TRUNCATE request_audit_logs', (tx) =>
      tx.$executeRawUnsafe('TRUNCATE TABLE "request_audit_logs"')),
  ];

  console.log(results.every(Boolean) ? '\nOK: the database rejected every change to the audit log.' : '\nFAILED: audit log is not protected.');
  process.exitCode = results.every(Boolean) ? 0 : 1;
}

main().finally(() => prisma.$disconnect());
