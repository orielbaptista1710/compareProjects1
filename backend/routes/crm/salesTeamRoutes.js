// backend/routes/crm/salesTeamRoutes.js
//
// CrmUser management (backend/prisma/schema.prisma) — the sales team
// roster: roles (admin/sales_manager/sales_rep), active status, and
// (eventually) who leads get assigned to.
//
// Expected to grow into something like:
//   GET  /            — list CrmUsers (sales team roster)
//   POST /            — create a new CrmUser
//   PATCH /:id        — update role / isActive
//
// Handlers should live in backend/controllers/crm/salesTeamController.js.

import express from "express";

const router = express.Router();

export default router;
