// backend/utils/readReason.js
//
// Free-text reason from an admin (listing and agent rejections), shown to the
// poster as plain text. Anything that isn't a string is ignored instead of
// crashing .trim(); capped at 500 chars.
import { toPlainText } from './sanitizeInput.js';

export const readReason = (value) =>
  (typeof value === 'string' && toPlainText(value.trim().slice(0, 500))) || 'No reason provided';
