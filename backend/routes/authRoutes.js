//routes/authRoutes.js
import express from 'express'; 
const router = express.Router();

import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again in 15 minutes' }
});

import { login, logout, getMe } from '../controllers/authController.js';
import protect from '../middleware/protect.js';

router.get("/me", protect, getMe);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);

export default router;
