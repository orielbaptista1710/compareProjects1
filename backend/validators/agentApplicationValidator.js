// validators/agentApplicationValidator.js
import { z } from 'zod';
import { toPlainText } from '../utils/sanitizeInput.js';

// Agent signup (firebase-signup agentApplication) and re-apply
// (POST /api/customers/agent-application). Stored as plain text: admins see it.
export const agentApplicationSchema = z.object({
  agencyName: z.string().trim().min(2).max(150).transform(toPlainText),
  // State RERA agent registration number; formats differ per state, so only
  // length is checked here — the admin verifies it on the state RERA site.
  reraAgentId: z.string().trim().min(3).max(100).transform(toPlainText),
});
