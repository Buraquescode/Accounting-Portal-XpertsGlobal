// HTTP only: list people who can be picked as approver.
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import * as userService from '../services/user.service.js';

export const approvers = asyncHandler(async (req, res) => {
  ok(res, await userService.listApprovers());
});
