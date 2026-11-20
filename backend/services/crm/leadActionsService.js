// services/crm/leadActionsService.js
//
// Write side of the CRM: change stage/category, assign, reveal contact.
// Every lookup is ANDed with leadScope(user); a lead outside the caller's scope
// is "not found". Results are { lead } / { contact } or { error }, where error
// is "FORBIDDEN" (role may never do this) or "NOT_FOUND".
import { CrmRole, LeadStage, ActivityType } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { leadScope, canWorkLeads, canAssign, canReveal } from "./leadScope.js";
import { getLead } from "./leadsService.js";

const FORBIDDEN = { error: "FORBIDDEN" };
const NOT_FOUND = { error: "NOT_FOUND" };

const inScope = (user, leadId) => ({ AND: [leadScope(user), { id: leadId }] });

// Change stage (with lostReason when lost) and/or category. One activity per change.
export async function updateLead(user, leadId, { stage, lostReason, category }) {
  if (!canWorkLeads(user)) return FORBIDDEN;

  const found = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findFirst({
      where: inScope(user, leadId),
      select: { stage: true, category: true, lostReason: true, firstContactedAt: true },
    });
    if (!lead) return false;

    const now = new Date();
    const data = {};
    const activities = [];

    const stageChanged = stage && stage !== lead.stage;
    const reasonChanged = stage === LeadStage.lost && lostReason !== lead.lostReason;
    if (stageChanged || reasonChanged) {
      data.stage = stage;
      data.lostReason = stage === LeadStage.lost ? lostReason : null;
      if (stageChanged) {
        if (!lead.firstContactedAt && lead.stage === LeadStage.new) {
          data.firstContactedAt = now;
        }
        const reason = stage === LeadStage.lost ? `: ${lostReason}` : "";
        activities.push({ activityType: ActivityType.stage_change, notes: `${lead.stage} → ${stage}${reason}` });
      } else {
        activities.push({ activityType: ActivityType.note, notes: `Lost reason changed to: ${lostReason}` });
      }
    }
    if (category && category !== lead.category) {
      data.category = category;
      activities.push({ activityType: ActivityType.note, notes: `Category corrected: ${lead.category} → ${category}` });
    }

    if (activities.length) {
      // Scoped write: if the lead left the caller's scope since the read, nothing is written.
      const { count } = await tx.lead.updateMany({
        where: inScope(user, leadId),
        data: { ...data, lastActivityAt: now },
      });
      if (count === 0) return false;
      await tx.leadActivity.createMany({
        data: activities.map((a) => ({ leadId, crmUserId: user.id, ...a })),
      });
    }
    return true;
  });

  if (!found) return NOT_FOUND;
  return withLead(user, leadId);
}

// Re-reads the lead for the response. If it has just left the caller's scope, answer 404, never an empty 200.
async function withLead(user, leadId) {
  const lead = await getLead(user, leadId);
  return lead ? { lead } : NOT_FOUND;
}

// crm_manager: any active rep. zonal_manager: only reps in zones they manage.
export async function assignLead(user, leadId, assigneeId) {
  if (!canAssign(user)) return FORBIDDEN;

  const assigneeWhere = {
    id: assigneeId,
    isActive: true,
    role: CrmRole.sales_rep,
    ...(user.role === CrmRole.zonal_manager && {
      zones: { some: { zone: { staff: { some: { userId: user.id, isManager: true } } } } },
    }),
  };

  const found = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findFirst({ where: inScope(user, leadId), select: { assignedTo: true } });
    const assignee = lead && (await tx.crmUser.findFirst({ where: assigneeWhere, select: { name: true } }));
    if (!lead || !assignee) return false;

    if (lead.assignedTo !== assigneeId) {
      // Scoped write: if the lead left the caller's scope since the read, nothing is written.
      const { count } = await tx.lead.updateMany({
        where: inScope(user, leadId),
        data: { assignedTo: assigneeId, lastActivityAt: new Date() },
      });
      if (count === 0) return false;
      await tx.leadActivity.create({
        data: { leadId, crmUserId: user.id, activityType: ActivityType.assignment, notes: `Assigned to ${assignee.name}` },
      });
      await tx.auditLog.create({
        data: { actorId: user.id, action: "lead.assign", targetType: "lead", targetId: leadId },
      });
    }
    return true;
  });

  if (!found) return NOT_FOUND;
  return withLead(user, leadId);
}

// Admin only. The audit row is written BEFORE the contact is returned, so a
// failed audit write means no number leaves the server.
export async function revealContact(user, leadId) {
  if (!canReveal(user)) return FORBIDDEN;

  const lead = await prisma.lead.findFirst({ where: inScope(user, leadId), select: { phone: true, email: true } });
  if (!lead) return NOT_FOUND;

  await prisma.auditLog.create({
    data: { actorId: user.id, action: "lead.reveal", targetType: "lead", targetId: leadId },
  });
  return { contact: { phone: lead.phone, email: lead.email } };
}
