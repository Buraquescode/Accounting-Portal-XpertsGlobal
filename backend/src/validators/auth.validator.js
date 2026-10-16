// Shape of the login request. Email is cleaned first so "  Asif@Xperts.test " still matches.
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.string().email('Enter a valid email address')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
