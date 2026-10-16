import fs from 'node:fs';
import { env } from '../config/env.js';
import * as requestService from '../services/request.service.js';
import * as workflowService from '../services/workflow.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';
import { listQuerySchema, idParamSchema } from '../validators/request.validator.js';

// Thin HTTP layer: parse input, call the service, shape the response.

// Reads the :id param.  is an object schema ({ id: uuid }), see validator note below.
const getId = (req) => idParamSchema.parse(req.params).id;

export const create = asyncHandler(async (req, res) => {
  const data = await requestService.createRequest(req.user, req.body, req.file);
  return created(res, data);
});

export const list = asyncHandler(async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await requestService.listRequests(req.user, query);
  return ok(res, items, meta);
});

export const getOne = asyncHandler(async (req, res) => {
  return ok(res, await requestService.getRequest(req.user, getId(req)));
});

export const history = asyncHandler(async (req, res) => {
  return ok(res, await requestService.getRequestHistory(req.user, getId(req)));
});

export const file = asyncHandler(async (req, res, next) => {
  const info = await requestService.getRequestFile(req.user, getId(req));

  res.setHeader('Content-Type', info.mimeType);
  res.setHeader('Content-Length', info.size);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');
  // The SPA (another origin in dev) shows this file in <img>/<iframe>. Helmet's defaults block that,
  // so relax ONLY this authenticated route: allow embedding by our own frontend and nobody else.
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', `frame-ancestors ${env.CLIENT_ORIGIN}`);
  const asciiName = info.originalName.replace(/[^\w.\- ]/g, '_');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(info.originalName)}`,
  );

  const stream = fs.createReadStream(info.absolutePath);
  stream.on('error', next);
  stream.pipe(res);
});

// Workflow actions. performAction returns nothing; re-reading through requestService gives the
// same safe DTO, history and availableActions as GET /requests/:id.
// req.body?.comment: body can be undefined when the client sends no body.
const act = (action) =>
  asyncHandler(async (req, res) => {
    await workflowService.performAction(req.user, getId(req), action, req.body?.comment);
    return ok(res, await requestService.getRequest(req.user, getId(req)));
  });

export const startReview = act('START_REVIEW');
export const forward = act('FORWARD');
export const reject = act('REJECT');
export const approve = act('APPROVE');
export const markPaid = act('MARK_PAID');