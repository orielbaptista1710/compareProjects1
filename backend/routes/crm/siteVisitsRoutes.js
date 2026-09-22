// backend/routes/crm/siteVisitsRoutes.js
//
// SiteVisit records (backend/prisma/schema.prisma) — scheduling and
// tracking property visits between a Lead and the CrmUser handling it.
//
// Expected to grow into something like:
//   GET  /?leadId=...      — visits for a given lead
//   POST /                 — schedule a new site visit
//   PATCH /:id             — update status (scheduled/completed/cancelled)
//
// Handlers should live in backend/controllers/crm/siteVisitsController.js.

import express from "express";

const router = express.Router();

export default router;
