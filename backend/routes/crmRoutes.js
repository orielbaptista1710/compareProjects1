// backend/routes/crmRoutes.js
// Mount point for the CRM API (/api/crm/*). CRM staff auth (CrmUser, Postgres)
// is separate from the website's: never use protect, isDeveloper or
// protectCustomer under here.
import express from "express";

import crmAuthRoutes from "./crm/authRoutes.js";
import crmLeadsRoutes from "./crm/leadsRoutes.js";
import crmDirectoryRoutes from "./crm/directoryRoutes.js";
import { requireCrmAuth } from "../middleware/crm/crmAuth.js";
import { crmApiLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

// CRM responses carry buyers' contact details: never let a browser or proxy keep a copy.
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Login is public; logout and me guard themselves inside the auth router.
router.use("/auth", crmAuthRoutes);

// Every route mounted below needs a valid CRM session, so none can forget it.
router.use(crmApiLimiter, requireCrmAuth);

router.use("/leads", crmLeadsRoutes);
router.use("/", crmDirectoryRoutes);

export default router;
