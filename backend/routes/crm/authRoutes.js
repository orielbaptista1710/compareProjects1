// backend/routes/crm/authRoutes.js
// CRM staff login/session (CrmUser in Postgres). Separate from the website's
// auth: never use protect, isDeveloper or protectCustomer here.
import express from "express";
import { crmLogin, crmLogout, crmMe } from "../../controllers/crm/authController.js";
import { requireCrmAuth } from "../../middleware/crm/crmAuth.js";
import { crmLoginLimiter, crmApiLimiter } from "../../middleware/rateLimiters.js";

const router = express.Router();

router.post("/login", crmLoginLimiter, crmLogin);
router.post("/logout", crmApiLimiter, requireCrmAuth, crmLogout);
router.get("/me", crmApiLimiter, requireCrmAuth, crmMe);

export default router;
