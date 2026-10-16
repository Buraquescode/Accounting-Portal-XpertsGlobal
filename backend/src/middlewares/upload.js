import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Absolute upload root. Created on startup so multer never fails on a missing folder.
export const UPLOAD_ROOT = path.resolve(env.UPLOAD_DIR);
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

// The extension comes from the (checked) MIME type, never from the client's file name.
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

// Magic numbers: the MIME type is sent by the client and can lie, the first bytes cannot.
const SIGNATURES = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
  'image/webp': (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  'application/pdf': (b) => b.toString('ascii', 0, 4) === '%PDF',
};

export function matchesSignature(mime, buffer) {
  return Boolean(SIGNATURES[mime]?.(buffer));
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_ROOT),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${MIME_TO_EXT[file.mimetype]}`),
});

const upload = multer({
  storage,
  limits: { fileSize: Number(env.MAX_FILE_SIZE_MB) * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!MIME_TO_EXT[file.mimetype]) {
      return cb(ApiError.badRequest('Only JPG, PNG, WEBP or PDF files are allowed'));
    }
    cb(null, true);
  },
});

// Single field named "file". Multer errors are passed on to errorHandler.
export const uploadReceipt = (req, res, next) => upload.single('file')(req, res, (err) => next(err));

// Runs after multer: file must exist and its real bytes must match the declared type.
export const verifyUploadedFile = asyncHandler(async (req, _res, next) => {
  if (!req.file) throw ApiError.badRequest('Receipt file is required');

  const handle = await fs.promises.open(req.file.path, 'r');
  try {
    const head = Buffer.alloc(12);
    await handle.read(head, 0, 12, 0);
    if (!matchesSignature(req.file.mimetype, head)) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      throw ApiError.badRequest('File content does not match its type');
    }
  } finally {
    await handle.close();
  }
  next();
});

// Error middleware placed AFTER the handlers: any later failure (zod, business rule,
// database) must not leave an orphan file on disk.
export function cleanupUploadOnError(err, req, _res, next) {
  if (req.file?.path) fs.promises.unlink(req.file.path).catch(() => {});
  next(err);
}
