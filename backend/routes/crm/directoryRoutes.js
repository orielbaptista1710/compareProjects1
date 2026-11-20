// backend/routes/crm/directoryRoutes.js
// GET /api/crm/staff and /api/crm/zones. Mounted in routes/crmRoutes.js behind
// crmApiLimiter + requireCrmAuth.
import express from "express";
import { listStaffHandler, listZonesHandler } from "../../controllers/crm/directoryController.js";

const router = express.Router();

router.get("/staff", listStaffHandler);
router.get("/zones", listZonesHandler);

export default router;
