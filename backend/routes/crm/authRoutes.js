// backend/routes/crm/authRoutes.js
//
// CRM login/session endpoints, against the CrmUser model
// (backend/prisma/schema.prisma) — completely separate from the site's
// Mongo-based JWT auth (middleware/protect.js). Build independently;
// do not reuse or depend on the site's auth middleware or User model.
//
// Expected to grow into something like:
//   POST /login      — CrmUser login (email + password against CrmUser.password)
//   POST /logout
//   GET  /me          — current CrmUser session info
//
// Handlers should live in backend/controllers/crm/authController.js.

import express from "express";

const router = express.Router();

export default router;
