// Gate for logged-in routes: finds the token, checks the session in the database, sets req.user.
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../services/session.service.js';

function readToken(req) {
  const fromCookie = req.cookies?.[env.COOKIE_NAME];
  if (fromCookie) return fromCookie;
  const header = req.get('authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice(7) : null; // handy for curl and API tools
}

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = readToken(req);
  if (!token) throw ApiError.unauthorized();
  const { user, sessionId } = await verifyToken(token);
  req.user = user;
  req.sessionId = sessionId;
  next();
});
