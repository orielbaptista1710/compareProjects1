import { z } from 'zod';

export const passwordResetRequestSchema = z.object({
  username: z.string().trim().min(1).max(50),
  phone: z.string().trim().min(7).max(20),
  note: z.string().trim().max(500).optional(),
});