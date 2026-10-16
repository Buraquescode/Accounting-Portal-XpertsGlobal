// Login rules. Controllers call this; it never touches req/res.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import * as userRepository from '../repositories/user.repository.js';
import * as sessionService from './session.service.js';

// A real bcrypt hash of a random string. Comparing against it when the email is unknown makes
// "no such user" take as long as "wrong password", so response time does not reveal which emails exist.
const DUMMY_HASH = '$2b$12$SIG2g1RKGpL2GsjJ.aJjEudBNzfklty6yGqHoNu6.11gL2vu0VmGq';

// The only shape of a user that ever leaves the service: no passwordHash, no twoFactorSecret.
export const toSafeUser = ({ id, name, email, roles }) => ({ id, name, email, roles });

export async function login(email, password, meta = {}) {
  const user = await userRepository.findByEmail(email);
  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !passwordOk) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled');

  // 2FA hook: with two-factor on, the password alone does not create a session. The client gets a
  // short-lived challenge token and must finish with completeTwoFactor() (bonus step).
  if (user.twoFactorEnabled) {
    const challengeToken = jwt.sign({ sub: user.id, purpose: '2fa' }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: 5 * 60,
    });
    return { requiresTwoFactor: true, challengeToken };
  }

  const token = await sessionService.createSession(user, meta);
  return { user: toSafeUser(user), token };
}

// STUB for the bonus step: verify the 6-digit TOTP code against user.twoFactorSecret, then create the session.
export async function completeTwoFactor() {
  throw new ApiError(501, 'Two-factor authentication is not implemented yet');
}

export const logout = (sessionId) => sessionService.revokeSession(sessionId);

export async function getCurrentUser(id) {
  const user = await userRepository.findById(id);
  if (!user || !user.isActive) throw ApiError.unauthorized();
  return toSafeUser(user);
}
