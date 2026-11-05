// validators/customerSignupValidator.js
import { z } from 'zod';
import { toPlainText } from '../utils/sanitizeInput.js';

// POST /api/customers/firebase-signup (the token and agentApplication are
// checked separately). The name is shown to admins, so it's stored as plain
// text; the Customer model still enforces min length and phone format.
export const customerSignupSchema = z.object({
  customerName: z.string().trim().min(1).max(100).transform(toPlainText),
  customerPhone: z.string().trim().max(20).optional(),
});
