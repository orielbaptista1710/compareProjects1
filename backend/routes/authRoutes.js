//routes/authRoutes.js
import express from 'express';
const router = express.Router();

import { authLimiter, publicLimiter } from '../middleware/rateLimiters.js';
import { login, logout, getMe } from '../controllers/authController.js';
import protect from '../middleware/protect.js';

router.get("/me", publicLimiter, protect, getMe);
router.post("/login", authLimiter, login);
router.post("/logout", publicLimiter, logout);

export default router;
