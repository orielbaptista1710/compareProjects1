//backend/controllers/passwordResetRequestController.js
import asyncHandler from 'express-async-handler';
import PasswordResetRequest from '../models/PasswordResetRequest.js';
import User from '../models/User.js';
import { passwordResetRequestSchema } from '../validators/passwordResetRequestValidator.js';

export const createPasswordResetRequest = asyncHandler(async (req, res) => {
  const parsed = passwordResetRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400);
    throw new Error('Please check the fields and try again.');
  }

  const { username, phone, note } = parsed.data;
  const normalizedUsername = username.toLowerCase();

  await PasswordResetRequest.create({ username: normalizedUsername, phone, note });

  // Server-side only — never exposed in the response, so this endpoint can't be
  // used to check which usernames exist (same enumeration issue as login).
  const userExists = await User.exists({ username: normalizedUsername });
  if (!userExists) {
    console.warn(`Password reset request for unknown username: ${normalizedUsername}`);
  }

  // TODO: call your existing notificationService (Resend/MSG91) here so this
  // hits your inbox/phone immediately instead of requiring a manual DB check.

  res.status(200).json({
    message: "Thanks — we've received your request and will contact you shortly.",
  });
});