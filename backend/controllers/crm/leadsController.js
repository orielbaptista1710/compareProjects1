// controllers/crm/leadsController.js
// Handlers for routes/crm/leadsRoutes.js. Shapes follow openapi/crm.yaml.
// Scoping lives in services/crm/leadScope.js, never here.
import { z } from "zod";
import { LeadCategory, LeadStage } from "@prisma/client";
import { listLeads, getLead, decodeCursor } from "../../services/crm/leadsService.js";

const listQuery = z
  .object({
    stage: z.enum(Object.values(LeadStage)).optional(),
    category: z.enum(Object.values(LeadCategory)).optional(),
    zoneId: z.uuid().optional(),
    assignedTo: z.uuid().optional(),
    unassigned: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
    q: z.string().trim().max(50).transform((v) => v || undefined).optional(),
    cursor: z.string().max(200).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(25),
  })
  .refine((v) => !(v.unassigned && v.assignedTo), { message: "unassigned and assignedTo can't be combined" });

const badRequest = (res, message) => res.status(400).json({ success: false, code: "VALIDATION_ERROR", message });
const forbidden = (res) => res.status(403).json({ success: false, code: "FORBIDDEN", message: "Not allowed." });
const notFound = (res) => res.status(404).json({ success: false, code: "NOT_FOUND", message: "Lead not found." });

export const listLeadsHandler = async (req, res, next) => {
  try {
    const parsed = listQuery.safeParse(req.query);
    if (!parsed.success) return badRequest(res, "Invalid filters.");

    const { cursor, ...filters } = parsed.data;
    const decoded = cursor ? decodeCursor(cursor) : undefined;
    if (cursor && !decoded) return badRequest(res, "Invalid cursor.");

    const result = await listLeads(req.crmUser, { ...filters, cursor: decoded });
    return result ? res.json(result) : forbidden(res);
  } catch (err) {
    next(err);
  }
};

export const getLeadHandler = async (req, res, next) => {
  try {
    // A malformed id is answered like a missing one: nothing to probe.
    if (!z.uuid().safeParse(req.params.leadId).success) return notFound(res);

    const lead = await getLead(req.crmUser, req.params.leadId);
    return lead ? res.json(lead) : notFound(res);
  } catch (err) {
    next(err);
  }
};
