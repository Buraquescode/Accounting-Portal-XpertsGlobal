import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/app.js';
import prisma from '../../src/config/db.js';

const PASSWORD = 'Password@123';
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

async function loginAs(name) {
  const agent = request.agent(app); // agent keeps the session cookie
  const res = await agent.post('/api/auth/login').send({ email: `${name}@xperts.test`, password: PASSWORD });
  expect(res.status).toBe(200);
  return agent;
}

const submit = (agent, approverId) =>
  agent.post('/api/requests')
    .field('type', 'EXPENSE').field('currency', 'PKR').field('amount', '2500.50')
    .field('notes', 'Taxi to client').field('selectedApproverId', approverId)
    .attach('file', PDF, { filename: 'receipt.pdf', contentType: 'application/pdf' });

const act = (agent, id, action, body) => {
  const r = agent.post(`/api/requests/${id}/${action}`);
  return body ? r.send(body) : r;
};

let sara, ali, asif, accounting, muhammad, asifId;

// Each test makes its own request, so tests never depend on seed data or row counts.
async function newRequest() {
  const res = await submit(sara, asifId);
  expect(res.status).toBe(201);
  return res.body.data.id;
}

beforeAll(async () => {
  [sara, ali, asif, accounting, muhammad] = await Promise.all(
    ['sara', 'ali', 'asif', 'accounting', 'muhammad'].map(loginAs),
  );
  const approvers = await sara.get('/api/users/approvers');
  asifId = approvers.body.data.find((u) => u.email === 'asif@xperts.test').id;
});

afterAll(async () => { await prisma.$disconnect(); });

describe('authentication', () => {
  it('rejects requests without a session', async () => {
    expect((await request(app).get('/api/requests')).status).toBe(401);
  });
});

describe('happy path', () => {
  it('submit -> start-review -> forward -> approve, with a full history', async () => {
    const id = await newRequest();
    const review = await act(asif, id, 'start-review');
    expect(review.status).toBe(200);
    expect(review.body.data.status).toBe('UNDER_REVIEW');
    const forward = await act(asif, id, 'forward', { comment: 'Looks fine' });
    expect(forward.body.data.status).toBe('AWAITING_FINAL_APPROVAL');
    const approve = await act(muhammad, id, 'approve');
    expect(approve.status).toBe(200);
    expect(approve.body.data.status).toBe('APPROVED');
    const history = await muhammad.get(`/api/requests/${id}/history`);
    expect(history.body.data.map((h) => h.action)).toEqual(['SUBMITTED', 'REVIEW_STARTED', 'FORWARDED', 'APPROVED']);
    expect(history.body.data.every((h) => h.actor?.name && h.createdAt)).toBe(true);
  });
  it('approver can forward straight from PENDING', async () => {
    const id = await newRequest();
    expect((await act(asif, id, 'forward')).body.data.status).toBe('AWAITING_FINAL_APPROVAL');
  });
});

describe('reject path', () => {
  it('approver reject needs a comment', async () => {
    const id = await newRequest();
    expect((await act(asif, id, 'reject')).status).toBe(400);
    expect((await act(asif, id, 'reject', { comment: '   ' })).status).toBe(400);
    const ok = await act(asif, id, 'reject', { comment: 'Missing invoice' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe('REJECTED');
  });
  it('final approver reject needs a comment', async () => {
    const id = await newRequest();
    await act(asif, id, 'forward');
    expect((await act(muhammad, id, 'reject')).status).toBe(400);
    const ok = await act(muhammad, id, 'reject', { comment: 'Over budget' });
    expect(ok.body.data.status).toBe('REJECTED');
  });
});

describe('role and status enforcement', () => {
  it('returns 403 for the wrong person', async () => {
    const id = await newRequest();
    expect((await act(sara, id, 'forward')).status).toBe(403);
    expect((await act(accounting, id, 'forward')).status).toBe(403);
    expect((await act(asif, id, 'approve')).status).toBe(403);
    expect((await act(muhammad, id, 'reject', { comment: 'no' })).status).toBe(403);
  });
  it('returns 409 for the wrong status', async () => {
    const id = await newRequest();
    await act(asif, id, 'forward');
    await act(muhammad, id, 'approve');
    expect((await act(muhammad, id, 'approve')).status).toBe(409);
    expect((await act(asif, id, 'forward')).status).toBe(409);
  });
  it('rejects malformed ids', async () => {
    expect((await act(asif, 'not-a-uuid', 'forward')).status).toBe(400);
  });
});

describe('scoping', () => {
  it("a requester cannot read someone else's request", async () => {
    const id = await newRequest();
    expect((await ali.get(`/api/requests/${id}`)).status).toBe(403);
    expect((await ali.get(`/api/requests/${id}/file`)).status).toBe(403);
    const list = await ali.get('/api/requests?limit=50');
    expect(list.body.data.some((r) => r.id === id)).toBe(false);
  });
  it('the owner and final approver can read it', async () => {
    const id = await newRequest();
    expect((await sara.get(`/api/requests/${id}`)).status).toBe(200);
    expect((await muhammad.get(`/api/requests/${id}`)).status).toBe(200);
  });
  it('responses never expose stored file names or paths', async () => {
    const id = await newRequest();
    const body = JSON.stringify((await sara.get(`/api/requests/${id}`)).body);
    expect(body).not.toContain('fileStoredName');
    expect(body).not.toContain('uploads');
  });
});

describe('file validation', () => {
  const base = (a) =>
    a.post('/api/requests').field('type', 'EXPENSE').field('currency', 'PKR').field('amount', '10')
      .field('notes', 'Test note').field('selectedApproverId', asifId);
  it('rejects a fake PDF (wrong magic bytes)', async () => {
    const res = await base(sara).attach('file', Buffer.from('MZ not really a pdf'), { filename: 'x.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
  });
  it('rejects a disallowed file type', async () => {
    const res = await base(sara).attach('file', Buffer.from('hello'), { filename: 'x.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });
  it('rejects a request with no file', async () => {
    expect((await base(sara)).status).toBe(400);
  });
  it('does not let a requester pick themselves as approver', async () => {
    expect((await submit(asif, asifId)).status).toBe(400);
  });
});

describe('audit log immutability', () => {
  it('the database rejects UPDATE and DELETE on request_audit_logs', async () => {
    await newRequest();
    await expect(prisma.$executeRawUnsafe("UPDATE request_audit_logs SET comment = 'tampered'")).rejects.toThrow();
    await expect(prisma.$executeRawUnsafe('DELETE FROM request_audit_logs')).rejects.toThrow();
  });
});
