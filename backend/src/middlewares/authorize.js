// Role gate. Use after authenticate: authorize('APPROVER', 'ACCOUNTING') lets in anyone holding at least one.
import { ApiError } from '../utils/ApiError.js';

// Pure helper so services can ask the same question without Express.
export const hasRole = (user, role) => Boolean(user?.roles?.includes(role));

export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!allowedRoles.some((role) => hasRole(req.user, role))) return next(ApiError.forbidden());
  return next();
};
