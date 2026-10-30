// config/env.js
//
// Loads .env and validates the configuration. Must be the FIRST import in
// server.js: every static import is evaluated before the importing file's own
// code, so the old `dotenv.config()` call in server.js ran after logger.js,
// rateLimiters.js, authController.js and firebaseAdmin.js had already read
// process.env, and their .env values were ignored locally.
import 'dotenv/config';
import logger from '../utils/logger.js';
import { validateEnv } from '../utils/validateEnv.js';

const problems = validateEnv(process.env);

if (problems.length) {
  logger.error('Invalid environment configuration, refusing to start', { problems });
  process.exit(1);
}
