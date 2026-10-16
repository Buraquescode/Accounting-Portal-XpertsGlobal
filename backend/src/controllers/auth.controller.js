// HTTP only: read the request, call the service, set or clear the cookie, send the response.
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import * as authService from '../services/auth.service.js';
import { SESSION_TTL_MS } from '../services/session.service.js';

// The token lives in an httpOnly cookie, so JavaScript on the page (and any injected script) cannot read it.
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password, { ip: req.ip, userAgent: req.get('user-agent') });

  if (result.requiresTwoFactor) return ok(res, result); // no cookie until the second step succeeds

  res.cookie(env.COOKIE_NAME, result.token, { ...cookieOptions, maxAge: SESSION_TTL_MS });
  return ok(res, { user: result.user });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.sessionId);
  res.clearCookie(env.COOKIE_NAME, cookieOptions);
  ok(res, { loggedOut: true });
});

export const me = asyncHandler(async (req, res) => {
  ok(res, { user: await authService.getCurrentUser(req.user.id) });
});
