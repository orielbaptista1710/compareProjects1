// backend/routes/crm/leadsRoutes.js
// CRM lead inbox and detail. Mounted in routes/crmRoutes.js behind
// crmApiLimiter + requireCrmAuth, so req.crmUser is always set here.
// Leads are created only by the website forms (POST /api/leads/*).
import express from "express";
import {
  listLeadsHandler,
  getLeadHandler,
  updateLeadHandler,
  assignLeadHandler,
  revealContactHandler,
} from "../../controllers/crm/leadsController.js";

const router = express.Router();

router.get("/", listLeadsHandler);
router.get("/:leadId", getLeadHandler);
router.patch("/:leadId", updateLeadHandler);
router.post("/:leadId/assign", assignLeadHandler);
router.post("/:leadId/reveal", revealContactHandler);

export default router;
