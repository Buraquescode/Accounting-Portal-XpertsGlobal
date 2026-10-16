// /api/users: lookups for the request form.
import { Router } from 'express';
import { approvers } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.get('/approvers', authenticate, approvers);

export default router;
