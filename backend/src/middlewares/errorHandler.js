// Last middleware: every error ends up here and leaves as { success: false, message, errors? }.
// Known problems get a helpful status code; anything unexpected becomes a plain 500.
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { MAX_FILE_SIZE } from '../config/constants.js';

const send = (res, status, message, errors) =>
  res.status(status).json({ success: false, message, ...(errors && { errors }) });

// Checked by name, so this file needs no import from the generated Prisma client.
const isPrismaKnownError = (err) => err.name === 'PrismaClientKnownRequestError';

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: `File is too large (maximum ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB)`,
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field. Upload a single file named "file"',
  LIMIT_FILE_COUNT: 'Only one file can be uploaded',
};

// eslint-disable-next-line no-unused-vars -- Express only treats a 4-argument function as an error handler
export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) return send(res, err.statusCode, err.message, err.errors);

  // zod validation failure -> 400 with one entry per bad field
  if (err.name === 'ZodError') {
    const errors = err.issues.map((i) => ({ field: i.path.join('.') || 'body', message: i.message }));
    return send(res, 400, 'Validation failed', errors);
  }

  if (err.name === 'MulterError') {
    return send(res, 400, MULTER_MESSAGES[err.code] ?? err.message);
  }

  if (isPrismaKnownError(err)) {
    if (err.code === 'P2002') return send(res, 409, 'A record with this value already exists');
    if (err.code === 'P2025') return send(res, 404, 'Record not found');
  }

  // Errors raised by Express itself (e.g. malformed JSON body, body too large)
  if (err.type === 'entity.parse.failed') return send(res, 400, 'Request body is not valid JSON');
  if (err.type === 'entity.too.large') return send(res, 413, 'Request body is too large');

  logger.error(err);
  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error';
  return res.status(500).json({
    success: false,
    message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }), // never leak stack traces in production
  });
};
