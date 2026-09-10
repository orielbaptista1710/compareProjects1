import express from 'express';
import { createPasswordResetRequest } from '../controllers/passwordResetRequestController.js';
import { leadRateLimit } from '../middleware/leadRateLimit.js'; // reuse — check the actual export name in that file

const router = express.Router();

router.post('/', leadRateLimit, createPasswordResetRequest);

export default router;