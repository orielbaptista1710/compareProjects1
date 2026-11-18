// backend/routes/crm/leadsRoutes.js
// CRM lead inbox and detail. Mounted in routes/crmRoutes.js behind
// crmApiLimiter + requireCrmAuth, so req.crmUser is always set here.
// Leads are created only by the website forms (POST /api/leads/*).
import express from "express";
import { listLeadsHandler, getLeadHandler } from "../../controllers/crm/leadsController.js";

const router = express.Router();

router.get("/", listLeadsHandler);
router.get("/:leadId", getLeadHandler);

export default router;
