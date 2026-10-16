// /api/auth: login (rate limited and validated), logout and "who am I".
import { Router } from 'express';
import { login, logout, me } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { loginLimiter } from '../middlewares/rateLimiter.js';
import { loginSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
