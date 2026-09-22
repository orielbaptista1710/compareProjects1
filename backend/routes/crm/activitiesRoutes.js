// backend/routes/crm/activitiesRoutes.js
//
// LeadActivity records (backend/prisma/schema.prisma) — the audit trail
// of notes/status-change events attached to a Lead, each tied to the
// CrmUser who performed it.
//
// Expected to grow into something like:
//   GET  /?leadId=... — activity history for a given lead
//   POST /            — log a new activity (note, status change, etc.)
//
// Handlers should live in backend/controllers/crm/activitiesController.js.

import express from "express";

const router = express.Router();

export default router;
