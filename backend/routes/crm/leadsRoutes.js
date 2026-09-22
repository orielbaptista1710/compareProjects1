// backend/routes/crm/leadsRoutes.js
//
// Read/update access to Lead records (backend/prisma/schema.prisma).
// These leads are created by the public website's contact/enquiry forms
// (backend/controllers/leadController.js, POST /api/leads/*) — this
// namespace is for viewing and managing them from the CRM side only.
// Never duplicate or re-ingest lead data here; this is the same `leads`
// table, read/written through Prisma.
//
// Expected to grow into something like:
//   GET  /            — list/filter leads (by stage, source, assignedTo, etc.)
//   GET  /:id         — single lead detail
//   PATCH /:id        — update stage, assignedTo, etc.
//
// Handlers should live in backend/controllers/crm/leadsController.js.

import express from "express";

const router = express.Router();

export default router;
