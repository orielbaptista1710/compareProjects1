// backend/scripts/lib/passwords.js
//
// Shared password rules for the account scripts (createUser, resetPassword).

import { randomBytes } from 'crypto';

export const MIN_PASSWORD_LENGTH = 12;

// 12 random bytes → 16 URL-safe characters (~96 bits), no spaces to trim.
export const generatePassword = () => randomBytes(12).toString('base64url');

// Returns an error message, or null when the password is acceptable.
export const checkPassword = (password, username) => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > 128) return 'Password must be at most 128 characters'; // login truncates at 128
  if (password.toLowerCase() === username.toLowerCase()) return 'Password cannot be the same as the username';
  return null;
};
