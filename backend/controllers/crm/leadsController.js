// controllers/crm/leadsController.js
// Handlers for routes/crm/leadsRoutes.js. Shapes follow openapi/crm.yaml.
// Scoping lives in services/crm/leadScope.js, never here.
import { z } from "zod";
import { LeadCategory, LeadStage } from "@prisma/client";
import { listLeads, getLead, decodeCursor } from "../../services/crm/leadsService.js";
import { updateLead, assignLead, revealContact } from "../../services/crm/leadActionsService.js";
import { toPlainText } from "../../utils/sanitizeInput.js";

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

const patchBody = z
  .strictObject({
    stage: z.enum(Object.values(LeadStage)).optional(),
    lostReason: z
      .string()
      .max(300)
      .nullable()
      .transform((v) => (v === null ? null : toPlainText(v)))
      .optional(),
    category: z.enum(Object.values(LeadCategory)).optional(),
  })
  .refine((v) => v.stage || v.category, { message: "Send a stage or a category." })
  // null clears the reason (reopening a lead); it is never valid together with stage lost.
  .refine((v) => (v.stage === LeadStage.lost ? !!v.lostReason : v.lostReason === undefined || v.lostReason === null), {
    message: "lostReason is required when stage is lost, and only allowed then.",
  });

const assignBody = z.strictObject({ assigneeId: z.uuid() });

// Turns a service result into the HTTP answer: { error } → 403/404, else `ok`.
const respond = (res, result, ok) => {
  if (result.error === "FORBIDDEN") return forbidden(res);
  if (result.error === "NOT_FOUND") return notFound(res);
  return res.json(ok(result));
};

// A malformed id is answered like a missing one: nothing to probe.
const validLeadId = (req) => z.uuid().safeParse(req.params.leadId).success;

export const updateLeadHandler = async (req, res, next) => {
  try {
    const parsed = patchBody.safeParse(req.body);
    if (!parsed.success) return badRequest(res, "Invalid stage, lost reason or category.");
    if (!validLeadId(req)) return notFound(res);
    respond(res, await updateLead(req.crmUser, req.params.leadId, parsed.data), (r) => r.lead);
  } catch (err) {
    next(err);
  }
};

export const assignLeadHandler = async (req, res, next) => {
  try {
    const parsed = assignBody.safeParse(req.body);
    if (!parsed.success) return badRequest(res, "assigneeId must be a valid id.");
    if (!validLeadId(req)) return notFound(res);
    respond(res, await assignLead(req.crmUser, req.params.leadId, parsed.data.assigneeId), (r) => r.lead);
  } catch (err) {
    next(err);
  }
};

export const revealContactHandler = async (req, res, next) => {
  try {
    if (!validLeadId(req)) return notFound(res);
    respond(res, await revealContact(req.crmUser, req.params.leadId), (r) => r.contact);
  } catch (err) {
    next(err);
  }
};

export const getLeadHandler = async (req, res, next) => {
  try {
    if (!validLeadId(req)) return notFound(res);

    const lead = await getLead(req.crmUser, req.params.leadId);
    return lead ? res.json(lead) : notFound(res);
  } catch (err) {
    next(err);
  }
};
