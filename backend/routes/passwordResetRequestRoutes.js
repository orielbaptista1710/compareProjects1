import express from 'express';
import { createPasswordResetRequest } from '../controllers/passwordResetRequestController.js';
import { passwordResetRequestLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/', passwordResetRequestLimiter, createPasswordResetRequest);

export default router;
