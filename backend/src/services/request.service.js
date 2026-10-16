import path from 'node:path';
import fs from 'node:fs/promises';
import prisma from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { UPLOAD_ROOT } from '../middlewares/upload.js';
import * as requestRepository from '../repositories/request.repository.js';
import * as auditService from './audit.service.js';
import { getAvailableActions } from './workflow.service.js';

const ALL_STATUSES = ['PENDING', 'UNDER_REVIEW', 'AWAITING_FINAL_APPROVAL', 'APPROVED', 'REJECTED', 'PAID'];
const has = (user, role) => user.roles.includes(role);

// Which requests a user may see. Final approver / accounting: all. Approver: routed to
// them or their own. Requester: only their own.
function scopeFor(user) {
  if (has(user, 'FINAL_APPROVER') || has(user, 'ACCOUNTING')) return {};
  if (has(user, 'APPROVER')) return { OR: [{ selectedApproverId: user.id }, { requesterId: user.id }] };
  return { requesterId: user.id };
}

function canView(user, request) {
  if (has(user, 'FINAL_APPROVER') || has(user, 'ACCOUNTING')) return true;
  if (request.requesterId === user.id) return true;
  return has(user, 'APPROVER') && request.selectedApproverId === user.id;
}

// Explicit whitelist: stored file name and server paths never leave the backend.
function toDto(request, user, history) {
  const dto = {
    id: request.id,
    referenceNo: request.referenceNo,
    type: request.type,
    currency: request.currency,
    amount: Number(request.amount),
    notes: request.notes,
    status: request.status,
    requester: request.requester,
    selectedApprover: request.selectedApprover,
    hasFile: Boolean(request.fileStoredName),
    fileOriginalName: request.fileOriginalName,
    fileMimeType: request.fileMimeType,
    fileSize: request.fileSize,
    fileUrl: `/api/requests/${request.id}/file`,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    availableActions: getAvailableActions(user, request),
  };
  if (history) dto.history = history;
  return dto;
}

function isReferenceCollision(err) {
  return err?.code === 'P2002' && String(err.meta?.target).includes('referenceNo');
}

export async function createRequest(user, body, file) {
  if (!has(user, 'REQUESTER')) throw ApiError.forbidden('Only requesters can submit requests');
  if (!file) throw ApiError.badRequest('Receipt file is required');
  if (body.selectedApproverId === user.id) {
    throw ApiError.badRequest('You cannot select yourself as the approver');
  }
  const approver = await requestRepository.findActiveApprover(body.selectedApproverId);
  if (!approver) throw ApiError.badRequest('Selected approver is not valid');

  const safeName = path.basename(file.originalname || 'receipt').trim().slice(0, 200) || 'receipt';

  // Request + first audit row in ONE transaction. Retried when two submissions race for the
  // same reference number (unique constraint is the safety net).
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const referenceNo = await requestRepository.nextReferenceNumber(tx);
        const request = await requestRepository.create(tx, {
          referenceNo,
          type: body.type,
          currency: body.currency,
          amount: body.amount,
          notes: body.notes,
          status: 'PENDING',
          requesterId: user.id,
          selectedApproverId: approver.id,
          fileOriginalName: safeName,
          fileStoredName: file.filename,
          fileMimeType: file.mimetype,
          fileSize: file.size,
        });
        await auditService.append(tx, {
          requestId: request.id,
          actorId: user.id,
          action: 'SUBMITTED',
          fromStatus: null,
          toStatus: 'PENDING',
          comment: 'Request submitted',
        });
        return request;
      });
      const history = await auditService.getHistory(created.id);
      return toDto(created, user, history);
    } catch (err) {
      if (isReferenceCollision(err) && attempt < 3) continue;
      throw err;
    }
  }
  throw ApiError.conflict('Could not allocate a reference number, please retry');
}

export async function listRequests(user, query) {
  const scope = scopeFor(user);
  const filters = {};
  if (query.status) filters.status = query.status;
  if (query.type) filters.type = query.type;
  const where = { AND: [scope, filters] };

  const [items, total, counts] = await Promise.all([
    requestRepository.list({ where, skip: (query.page - 1) * query.limit, take: query.limit }),
    requestRepository.count(where),
    requestRepository.countByStatus(scope), // dashboard cards ignore the active filters
  ]);

  const statusCounts = Object.fromEntries(ALL_STATUSES.map((s) => [s, counts[s] ?? 0]));
  statusCounts.TOTAL = ALL_STATUSES.reduce((sum, s) => sum + statusCounts[s], 0);

  return {
    items: items.map((r) => toDto(r, user)),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
      statusCounts,
    },
  };
}

async function loadViewable(user, id) {
  const request = await requestRepository.findById(id);
  if (!request) throw ApiError.notFound('Request not found');
  if (!canView(user, request)) throw ApiError.forbidden('You do not have access to this request');
  return request;
}

export async function getRequest(user, id) {
  const request = await loadViewable(user, id);
  const history = await auditService.getHistory(id);
  return toDto(request, user, history);
}

export async function getRequestHistory(user, id) {
  await loadViewable(user, id);
  return auditService.getHistory(id);
}

// Returns what the controller needs to stream the file. Path is rebuilt from the
// generated name and checked to stay inside the upload root (defence in depth).
export async function getRequestFile(user, id) {
  const request = await loadViewable(user, id);
  if (!request.fileStoredName) throw ApiError.notFound('File not found');

  const absolutePath = path.resolve(UPLOAD_ROOT, path.basename(request.fileStoredName));
  if (!absolutePath.startsWith(UPLOAD_ROOT + path.sep)) throw ApiError.notFound('File not found');

  let stat;
  try {
    stat = await fs.stat(absolutePath);
  } catch {
    throw ApiError.notFound('File not found');
  }
  return {
    absolutePath,
    size: stat.size,
    mimeType: request.fileMimeType,
    originalName: request.fileOriginalName,
  };
}
