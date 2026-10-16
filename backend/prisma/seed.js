// Seed: 5 users (safe to re-run) + 6 sample requests with their audit trail (only when the table is empty).
// The audit log is append-only, so it is never upserted or rewritten here.
// For a completely fresh database use: npx prisma migrate reset --force
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const prisma = new PrismaClient();
const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');

const PASSWORD = 'Password@123';
const USERS = [
  { name: 'Muhammad', email: 'muhammad@xperts.test', roles: ['FINAL_APPROVER'] },
  { name: 'Asif', email: 'asif@xperts.test', roles: ['REQUESTER', 'APPROVER'] },
  { name: 'Accounting Team', email: 'accounting@xperts.test', roles: ['APPROVER', 'ACCOUNTING'] },
  { name: 'Sara', email: 'sara@xperts.test', roles: ['REQUESTER'] },
  { name: 'Ali', email: 'ali@xperts.test', roles: ['REQUESTER'] },
];

// Sample requests. `trail` lists who did what; minutes are counted from the request's creation time.
const SAMPLES = [
  {
    ref: 'REQ-2026-0001', type: 'EXPENSE', currency: 'PKR', amount: '4500.00', daysAgo: 1,
    notes: 'Client lunch with the Karachi delegation', requester: 'sara', approver: 'asif', file: 'lunch-receipt.pdf',
    trail: [['SUBMITTED', 'sara', null, 'PENDING', 'Receipt attached', 0]],
  },
  {
    ref: 'REQ-2026-0002', type: 'FUND_REQUEST', currency: 'USD', amount: '1200.00', daysAgo: 3,
    notes: 'Advance for conference registration and travel', requester: 'ali', approver: 'accounting', file: 'conference-quotation.pdf',
    trail: [
      ['SUBMITTED', 'ali', null, 'PENDING', 'Quotation attached', 0],
      ['REVIEW_STARTED', 'accounting', 'PENDING', 'UNDER_REVIEW', 'Checking the quotation', 95],
    ],
  },
  {
    ref: 'REQ-2026-0003', type: 'BUDGET_APPROVAL', currency: 'PKR', amount: '250000.00', daysAgo: 5,
    notes: 'Office furniture for the new Lahore desk area', requester: 'sara', approver: 'accounting', file: 'furniture-quotation.pdf',
    trail: [
      ['SUBMITTED', 'sara', null, 'PENDING', 'Three quotations compared, cheapest attached', 0],
      ['REVIEW_STARTED', 'accounting', 'PENDING', 'UNDER_REVIEW', null, 120],
      ['FORWARDED', 'accounting', 'UNDER_REVIEW', 'AWAITING_FINAL_APPROVAL', 'Price is in line with market, forwarding', 400],
    ],
  },
  {
    ref: 'REQ-2026-0004', type: 'EXPENSE', currency: 'PKR', amount: '18750.00', daysAgo: 8,
    notes: 'Monthly office internet bill', requester: 'asif', approver: 'accounting', file: 'internet-bill.pdf',
    trail: [
      ['SUBMITTED', 'asif', null, 'PENDING', null, 0],
      ['REVIEW_STARTED', 'accounting', 'PENDING', 'UNDER_REVIEW', null, 60],
      ['FORWARDED', 'accounting', 'UNDER_REVIEW', 'AWAITING_FINAL_APPROVAL', 'Matches last month', 180],
      ['APPROVED', 'muhammad', 'AWAITING_FINAL_APPROVAL', 'APPROVED', 'Approved', 1500],
    ],
  },
  {
    ref: 'REQ-2026-0005', type: 'EXPENSE', currency: 'USD', amount: '85.00', daysAgo: 6,
    notes: 'Design tool subscription', requester: 'ali', approver: 'asif', file: 'subscription-invoice.pdf',
    trail: [
      ['SUBMITTED', 'ali', null, 'PENDING', null, 0],
      ['REVIEW_STARTED', 'asif', 'PENDING', 'UNDER_REVIEW', null, 45],
      ['REJECTED', 'asif', 'UNDER_REVIEW', 'REJECTED', 'Already claimed in last month\'s expenses', 200],
    ],
  },
  {
    ref: 'REQ-2026-0006', type: 'FUND_REQUEST', currency: 'PKR', amount: '60000.00', daysAgo: 12,
    notes: 'Supplies for the team event', requester: 'sara', approver: 'accounting', file: 'event-quotation.pdf',
    trail: [
      ['SUBMITTED', 'sara', null, 'PENDING', null, 0],
      ['REVIEW_STARTED', 'accounting', 'PENDING', 'UNDER_REVIEW', null, 30],
      ['FORWARDED', 'accounting', 'UNDER_REVIEW', 'AWAITING_FINAL_APPROVAL', null, 150],
      ['APPROVED', 'muhammad', 'AWAITING_FINAL_APPROVAL', 'APPROVED', null, 900],
      ['PAID', 'accounting', 'APPROVED', 'PAID', 'Bank transfer made, ref TRX-88231', 2400],
    ],
  },
];

// Smallest possible valid PDF, so receipt downloads in the demo open in a viewer.
function placeholderPdf(title) {
  return `%PDF-1.1
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 100]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 60>>stream
BT /F1 14 Tf 20 50 Td (Sample receipt: ${title}) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R/Size 6>>
%%EOF
`;
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const byKey = {};
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, roles: u.roles },
      create: { ...u, passwordHash },
    });
    byKey[u.email.split('@')[0]] = user;
  }
  console.log(`Users ready: ${USERS.length}`);
  return byKey;
}

async function seedRequests(users) {
  if ((await prisma.request.count()) > 0) {
    console.log('Sample data already present, skipping');
    return;
  }
  fs.mkdirSync(uploadsDir, { recursive: true });

  for (const s of SAMPLES) {
    const createdAt = new Date(Date.now() - s.daysAgo * 24 * 60 * 60 * 1000);
    const at = (minutes) => new Date(createdAt.getTime() + minutes * 60 * 1000);
    const storedName = `seed-${s.ref.toLowerCase()}.pdf`;
    const content = placeholderPdf(s.ref);
    fs.writeFileSync(path.join(uploadsDir, storedName), content);

    const last = s.trail[s.trail.length - 1];
    await prisma.request.create({
      data: {
        referenceNo: s.ref,
        type: s.type,
        currency: s.currency,
        amount: s.amount,
        notes: s.notes,
        status: last[3],
        requesterId: users[s.requester].id,
        selectedApproverId: users[s.approver].id,
        fileOriginalName: s.file,
        fileStoredName: storedName,
        fileMimeType: 'application/pdf',
        fileSize: Buffer.byteLength(content),
        createdAt,
        updatedAt: at(last[5]),
        // Audit rows are created in order, so their ids give a strict history.
        auditLogs: {
          create: s.trail.map(([action, actor, from, to, comment, minutes]) => ({
            action,
            actorId: users[actor].id,
            fromStatus: from,
            toStatus: to,
            comment,
            createdAt: at(minutes),
          })),
        },
      },
    });
  }
  console.log(`Sample requests created: ${SAMPLES.length}`);
}

async function main() {
  const users = await seedUsers();
  await seedRequests(users);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
