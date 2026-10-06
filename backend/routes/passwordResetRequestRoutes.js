import express from 'express';
import { createPasswordResetRequest } from '../controllers/passwordResetRequestController.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/', authLimiter, createPasswordResetRequest);

export default router;