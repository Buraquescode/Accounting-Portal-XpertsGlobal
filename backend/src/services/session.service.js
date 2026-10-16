// Real server-side sessions: the cookie holds a JWT, but the JWT is only honoured while its
// Session row is alive. Logging out (revokedAt) therefore ends the session immediately.
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { durationToMs } from '../utils/duration.js';
import * as sessionRepository from '../repositories/session.repository.js';

export const SESSION_TTL_MS = durationToMs(env.JWT_EXPIRES_IN);
const ALGORITHM = 'HS256'; // pinned on sign and verify so a token cannot choose its own algorithm

export async function createSession(user, { ip, userAgent } = {}) {
  const session = await sessionRepository.create({
    userId: user.id,
    userAgent: userAgent?.slice(0, 255) ?? null,
    ipAddress: ip ?? null,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return jwt.sign({ sub: user.id, sid: session.id }, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: Math.floor(SESSION_TTL_MS / 1000),
  });
}

// Returns { user, sessionId } or throws 401. Every failure gives the same message on purpose.
export async function verifyToken(token) {
  const fail = () => ApiError.unauthorized('Session is invalid or has expired. Please log in again.');

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
  } catch {
    throw fail();
  }
  if (payload.purpose || !payload.sid) throw fail(); // a 2FA challenge token is not a session

  const session = await sessionRepository.findById(payload.sid);
  const stillValid =
    session &&
    session.userId === payload.sub &&
    !session.revokedAt &&
    session.expiresAt > new Date() &&
    session.user.isActive;
  if (!stillValid) throw fail();

  const { id, name, email, roles } = session.user;
  return { user: { id, name, email, roles }, sessionId: session.id };
}

export const revokeSession = (sessionId) => sessionRepository.revoke(sessionId);
