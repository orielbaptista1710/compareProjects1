// backend/services/leadIngestService.js
//
// The only code that creates leads (website now; mobile and Meta later).
// Lead = the person (unique phone). Enquiry = one append-only submission.
// Lister and location come from Mongo here, never from the client.
import crypto from "node:crypto";
import prisma from "../config/prisma.js";
import Property from "../models/Property.js";
import logger from "../utils/logger.js";
import { safeErrorMeta } from "../utils/safeError.js";
import { isValidObjectId } from "mongoose";
import { LISTED_BY, LISTING_STATUS } from "../constants/roles.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Bump when the consent wording changes. TODO: the website consent text must
// say details are shared with the lister and our team (DPDP).
const CONSENT_VERSION = "v1-2026-11";

// A Mongo failure must not lose the lead: store the enquiry without the snapshot.
async function snapshotProperty(propertyId) {
  if (!propertyId || !isValidObjectId(propertyId)) return {};
  try {
    // Only live listings: an enquiry naming a pending, rejected or suspended
    // listing's id is stored without a lister, so it never reaches that poster.
    const p = await Property.findOne({ _id: propertyId, status: LISTING_STATUS.APPROVED })
      .select("title city locality pincode listedBy userId")
      .lean();
    if (!p) return {};
    return {
      propertyTitle: p.title,
      // Listings saved before listedBy existed are developer listings.
      listerType: p.listedBy || LISTED_BY.DEVELOPER,
      listerId: p.userId ? String(p.userId) : null,
      city: p.city,
      locality: p.locality,
      pincode: p.pincode,
    };
  } catch (err) {
    logger.error("lead ingest: property snapshot failed", safeErrorMeta(err));
    return {};
  }
}

// person.phone is the validated 10-digit mobile. Returns { status: "created", id }
// or { status: "duplicate" }.
export async function ingestEnquiry({
  channel,
  source,
  category,
  person,
  propertyId = null,
  preferences = {},
  rawPayload,
  client = {},
}) {
  const phone = `+91${person.phone}`;
  const email = person.email || null;

  // 24h duplicate check: same phone OR email on the same property, so rotating
  // either doesn't get round it (docs/review SEC-08).
  const duplicate = await prisma.enquiry.findFirst({
    where: {
      source,
      propertyId,
      createdAt: { gte: new Date(Date.now() - ONE_DAY_MS) },
      lead: { OR: email ? [{ phone }, { email }] : [{ phone }] },
    },
    select: { id: true },
  });
  if (duplicate) return { status: "duplicate" };

  const snap = await snapshotProperty(propertyId);
  const pincode = snap.pincode ?? null;
  const now = new Date();

  const save = () =>
    prisma.$transaction(async (tx) => {
      // Zone from the property's pincode; no match = Unzoned queue (null).
      const zoneId = pincode
        ? (await tx.zoneArea.findUnique({ where: { pincode }, select: { zoneId: true } }))?.zoneId ?? null
        : null;

      const existing = await tx.lead.findUnique({ where: { phone } });
      const lead = existing
        ? await tx.lead.update({
            where: { id: existing.id },
            // A public form can't change who the person is: name, email, stage and
            // assignee stay as they are. The submitted email lives on the enquiry.
            // An Unzoned lead takes the zone of a later enquiry; a set zone never moves.
            data: { lastActivityAt: now, ...(!existing.zoneId && zoneId && { zoneId }) },
          })
        : await tx.lead.create({
            data: { category, name: person.name, phone, email, zoneId, lastActivityAt: now },
          });

      return tx.enquiry.create({
        data: {
          leadId: lead.id,
          channel,
          source,
          idempotencyKey: crypto.randomUUID(),
          propertyId,
          // Only from the approved listing; a client-sent title stays in rawPayload.
          propertyTitle: snap.propertyTitle ?? null,
          listerType: snap.listerType ?? null,
          listerId: snap.listerId ?? null,
          city: snap.city ?? preferences.city ?? null,
          locality: snap.locality ?? preferences.locality ?? null,
          pincode,
          budget: preferences.budget ?? null,
          propertyTypeInterest: preferences.propertyType ?? null,
          message: preferences.message ?? null,
          loanInterest: preferences.loanInterest ?? null,
          consentVersion: CONSENT_VERSION,
          consentAt: now,
          rawPayload,
          ip: client.ip ?? null,
          userAgent: client.userAgent ?? null,
        },
        select: { id: true },
      });
    });

  let enquiry;
  try {
    enquiry = await save();
  } catch (err) {
    // Two first-time submissions with the same phone raced and the other created
    // the lead. Run once more so this enquiry attaches to it instead of being lost.
    if (err?.code !== "P2002") throw err;
    enquiry = await save();
  }
  return { status: "created", id: enquiry.id };
}
