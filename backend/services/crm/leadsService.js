// services/crm/leadsService.js
//
// Read side of the CRM lead inbox and lead detail. Every query is ANDed with
// leadScope(user), so a lead outside the caller's scope simply isn't found.
// Shapes follow openapi/crm.yaml (LeadSummary / LeadDetail / Enquiry).
import prisma from "../../config/prisma.js";
import { leadScope, contactMasked } from "./leadScope.js";

// Detail shows the newest enquiries only, so one read stays bounded.
export const ENQUIRY_LIMIT = 100;

// "+919876543210" → "+91******3210", "priya@example.com" → "p***@example.com".
// Anything unexpected is masked completely rather than partly.
const maskPhone = (phone) => (/^\+91\d{10}$/.test(phone) ? `+91******${phone.slice(-4)}` : "******");
const maskEmail = (email) => {
  const [name, domain] = email.split("@");
  return name && domain ? `${name[0]}***@${domain}` : "***";
};

const summarySelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  category: true,
  stage: true,
  assignedTo: true,
  zoneId: true,
  lastActivityAt: true,
  createdAt: true,
  assignee: { select: { name: true } },
  zone: { select: { name: true } },
  _count: { select: { enquiries: true } },
};

// Never selected: ip, userAgent, consent fields, utm, idempotencyKey, listerId.
// rawPayload is read only to pick out companyName and is never returned.
const enquirySelect = {
  id: true,
  channel: true,
  source: true,
  propertyId: true,
  propertyTitle: true,
  listerType: true,
  city: true,
  locality: true,
  pincode: true,
  budget: true,
  message: true,
  loanInterest: true,
  createdAt: true,
  rawPayload: true,
};

const toSummary = (lead, masked) => ({
  id: lead.id,
  name: lead.name,
  phone: masked ? maskPhone(lead.phone) : lead.phone,
  email: masked && lead.email ? maskEmail(lead.email) : lead.email,
  contactMasked: masked,
  category: lead.category,
  stage: lead.stage,
  assignedTo: lead.assignedTo,
  assigneeName: lead.assignee?.name ?? null,
  zoneId: lead.zoneId,
  zoneName: lead.zone?.name ?? null,
  enquiryCount: lead._count.enquiries,
  lastActivityAt: lead.lastActivityAt,
  createdAt: lead.createdAt,
});

// The buyer's message is free text that often contains their number or email,
// so masked callers don't get it.
const toEnquiry = ({ rawPayload, message, ...enquiry }, masked) => ({
  ...enquiry,
  message: masked ? null : message,
  companyName: typeof rawPayload?.companyName === "string" ? rawPayload.companyName : null,
});

// Opaque to the client: base64url of [createdAt, id] of the last row sent.
const encodeCursor = (lead) =>
  Buffer.from(JSON.stringify([lead.createdAt.toISOString(), lead.id])).toString("base64url");

// Returns { createdAt, id } or null for anything that isn't a cursor we issued.
export function decodeCursor(cursor) {
  try {
    const parts = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (!Array.isArray(parts) || parts.length !== 2) return null;
    const [iso, id] = parts;
    const createdAt = new Date(iso);
    if (typeof iso !== "string" || typeof id !== "string" || Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

// Masked callers (admin) search by name only, so a hidden number can't be
// recovered digit by digit through search.
const searchFilter = (q, masked) => {
  const byName = { name: { contains: q, mode: "insensitive" } };
  const digits = q.replace(/\D/g, "");
  if (masked || digits.length < 4) return byName;
  return { OR: [byName, { phone: { contains: digits } }] };
};

// Newest first. `cursor` is a decoded cursor (see decodeCursor) or undefined.
// Returns null when the caller's role may not see leads at all (→ 403).
export async function listLeads(user, { stage, category, zoneId, assignedTo, unassigned, q, cursor, limit }) {
  const scope = leadScope(user);
  if (!scope) return null;
  const masked = contactMasked(user);
  const and = [scope];
  if (stage) and.push({ stage });
  if (category) and.push({ category });
  if (zoneId) and.push({ zoneId });
  if (assignedTo) and.push({ assignedTo });
  if (unassigned) and.push({ assignedTo: null });
  if (q) and.push(searchFilter(q, masked));
  if (cursor) {
    and.push({
      OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }],
    });
  }

  const rows = await prisma.lead.findMany({
    where: { AND: and },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1, // one extra row tells us whether there is a next page
    select: summarySelect,
  });
  const page = rows.slice(0, limit);

  return {
    data: page.map((lead) => toSummary(lead, masked)),
    nextCursor: rows.length > limit ? encodeCursor(page.at(-1)) : null,
  };
}

// Null when the lead doesn't exist, is outside the caller's scope, or the
// role may not see leads; the caller answers all of them with the same 404,
// so ids can't be probed.
export async function getLead(user, leadId) {
  const scope = leadScope(user);
  if (!scope) return null;
  const masked = contactMasked(user);
  const lead = await prisma.lead.findFirst({
    where: { AND: [scope, { id: leadId }] },
    select: {
      ...summarySelect,
      lostReason: true,
      enquiries: { orderBy: { createdAt: "desc" }, take: ENQUIRY_LIMIT, select: enquirySelect },
    },
  });
  if (!lead) return null;

  return {
    ...toSummary(lead, masked),
    lostReason: lead.lostReason,
    enquiries: lead.enquiries.map((enquiry) => toEnquiry(enquiry, masked)),
  };
}
