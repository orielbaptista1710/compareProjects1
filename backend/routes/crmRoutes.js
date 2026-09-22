// backend/routes/crmRoutes.js
// Top-level mount point for the CRM app's entire API surface (/api/crm/*).
// Owned by the CRM team. Nothing under here should depend on the site's
// Mongo-based auth (middleware/protect.js, isDeveloper.js) or vice versa —
// CrmUser auth is its own thing, built independently against
// backend/prisma/schema.prisma.
import express from "express";

import crmAuthRoutes from "./crm/authRoutes.js";
import crmLeadsRoutes from "./crm/leadsRoutes.js";
import crmActivitiesRoutes from "./crm/activitiesRoutes.js";
import crmSiteVisitsRoutes from "./crm/siteVisitsRoutes.js";
import crmSalesTeamRoutes from "./crm/salesTeamRoutes.js";

const router = express.Router();

// CrmUser login/session — separate from the site's User/Customer auth
router.use("/auth", crmAuthRoutes);

// Viewing/updating Lead records ingested from the website's contact/enquiry forms
router.use("/leads", crmLeadsRoutes);

// LeadActivity — status changes, notes, audit trail per lead
router.use("/activities", crmActivitiesRoutes);

// SiteVisit — scheduling/tracking property visits with a lead
router.use("/site-visits", crmSiteVisitsRoutes);

// CrmUser management — sales team roster, roles, assignment
router.use("/sales-team", crmSalesTeamRoutes);

export default router;
