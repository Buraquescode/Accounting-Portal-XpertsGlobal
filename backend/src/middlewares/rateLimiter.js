// Slows down abuse. Both limiters are skipped in tests so automated runs never get a 429.
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const base = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
};

// Stops password guessing. Only FAILED attempts count (skipSuccessfulRequests), so a person
// logging in and out as different users during a demo is never blocked.
export const loginLimiter = rateLimit({
  ...base,
  limit: 5,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many failed login attempts. Try again in 15 minutes.' },
});

// General safety net for every API route.
export const apiLimiter = rateLimit({
  ...base,
  limit: 300,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});
