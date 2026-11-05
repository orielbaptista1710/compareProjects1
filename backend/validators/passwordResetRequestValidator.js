import { z } from 'zod';
import { toPlainText } from '../utils/sanitizeInput.js';

export const passwordResetRequestSchema = z.object({
  username: z.string().trim().min(1).max(50),
  phone: z.string().trim().min(7).max(20),
  // Shown to the team later, so stored as plain text.
  note: z.string().trim().max(500).transform(toPlainText).optional(),
});
