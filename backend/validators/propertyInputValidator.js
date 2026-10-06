// backend/validators/propertyInputValidator.js
//
// Allowlist for developer-submitted property data (POST /add, PUT /update/:id).
// Only the fields below can be set by a developer; anything else in the body —
// metadata.moderation/analytics, userId, status, featured, owner/broker contact
// details, dataSource, review fields — is silently dropped (zod strips unknown
// keys), because the edit form sends the whole saved property back.
//
// Types are deliberately lenient ("" → not set, numeric strings → numbers) to
// match what the dashboard form sends; Mongoose still enforces required fields
// and enums on save. See docs/review/01-security.md SEC-04 / SEC-09.
import { z } from "zod"; 
import { RESIDENTIAL_TYPES, COMMERCIAL_TYPES } from "../models/propertyType.js";

// Hosts that listing links/media may point at (https only). A subdomain of a
// listed host is allowed too, e.g. www.google.com, maps.app.goo.gl, my.matterport.com.
export const ALLOWED_URL_HOSTS = {
  map: ["google.com", "google.co.in", "goo.gl"],
  media: ["res.cloudinary.com"],
  tour: ["res.cloudinary.com", "youtube.com", "youtu.be", "matterport.com"],
};

const isAllowedUrl = (value, hosts) => {
  try {
    const { protocol, hostname } = new URL(value);
    return protocol === "https:" && hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
};

// "" and null mean "not filled in" in the dashboard form.
const blankToUndefined = (v) => (v === "" || v === null ? undefined : v);
const optional = (schema) => z.preprocess(blankToUndefined, schema.optional());

const text = (max) => z.string().trim().max(max);
const num = optional(z.coerce.number().finite().min(0));
const signedNum = optional(z.coerce.number().finite()); // floor: basement = -1

const url = (kind) =>
  z.string().trim().max(2048).refine((v) => isAllowedUrl(v, ALLOWED_URL_HOSTS[kind]), {
    message: `must be an https link to ${ALLOWED_URL_HOSTS[kind].join(", ")}`,
  });

// mapLink can be cleared back to "" from the edit form.
const clearableUrl = (kind) => z.union([z.literal(""), url(kind)]);

// The form sends parkings as "Open, Covered"; store it as ["Open", "Covered"].
const stringList = (maxItems, maxLen) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : v),
    z.array(text(maxLen)).max(maxItems)
  );

const mediaImage = z.object({
  url: url("media"),
  thumbnail: optional(url("media")),
  caption: optional(text(200)),
});

export const propertyInputSchema = z.object({
  // ── Basic info ──────────────────────────────
  developerName: text(100),
  title: text(200),
  description: text(2000),
  long_description: text(10000),
  projectName: text(150),
  listingType: optional(z.enum(["sale", "resale"])),
  subType: text(100),

  // ── Location ────────────────────────────────
  state: text(100),
  city: text(100),
  locality: text(100),
  sub_locality: text(100),
  address: text(500),
  pincode: z.preprocess((v) => (typeof v === "number" ? String(v) : v), text(10)),
  mapLink: clearableUrl("map"),
  // Blank lat/lng are rejected rather than coerced: Number("") is 0, which
  // would silently pin the listing at 0,0 in the Atlantic.
  coordinates: optional(
    z.object({
      lat: z.preprocess(blankToUndefined, z.coerce.number().min(-90).max(90)),
      lng: z.preprocess(blankToUndefined, z.coerce.number().min(-180).max(180)),
    })
  ),

  // ── Pricing & size ──────────────────────────
  price: num,
  emiStarts: num,
  priceNegotiable: z.boolean(),
  area: optional(
    z.object({
      value: num,
      unit: optional(z.enum(["sqft", "sqmts", "guntas", "hectares", "acres"])),
    })
  ),

  // ── Classification & details ────────────────
  propertyType: z.enum([...RESIDENTIAL_TYPES, ...COMMERCIAL_TYPES]),
  furnishing: optional(text(50)),
  possessionStatus: optional(text(50)),
  facing: text(50),
  ageOfProperty: text(50),
  floorLabel: optional(text(20)),
  bhk: num,
  bathrooms: num,
  balconies: num,
  parkings: stringList(20, 50),
  totalFloors: num,
  floor: signedNum,
  wing: text(20),
  phase: text(20),
  tower: num,
  unitsAvailable: num,
  amenities: stringList(100, 100),
  facilities: stringList(100, 100),
  security: stringList(100, 100),

  // ── RERA (reraApproved is derived server-side from reraNumber) ──
  reraNumber: text(100),
  reraDate: optional(z.coerce.date()),

  // ── Media (URLs restricted to trusted hosts) ─
  coverImage: optional(z.object({ url: url("media"), thumbnail: optional(url("media")) })),
  galleryImages: z.array(mediaImage).max(50),
  floorPlans: z
    .array(
      z.object({
        planType: optional(z.enum(["2D", "3D", "Structural"])),
        imageUrl: optional(url("media")),
        unitType: optional(text(50)),
        builtUpArea: num,
        carpetArea: num,
        terraceArea: num,
        rooms: z
          .array(z.object({ name: optional(text(50)), dimensions: optional(text(50)), windowCount: num }))
          .max(30)
          .optional(),
      })
    )
    .max(30),
  mediaFiles: z
    .array(z.object({ type: z.enum(["image", "video"]), src: url("media"), thumbnail: optional(url("media")) }))
    .max(30),
  virtualTours: z
    .array(z.object({ type: z.enum(["3d", "video", "panorama"]), url: url("tour"), thumbnail: optional(url("media")) }))
    .max(10),
  brochure: optional(z.object({ url: url("media"), public_id: optional(text(200)) })),
})
  // Every field is optional here; Mongoose's `required` rules decide what a
  // new listing must have, and updates only touch the fields that were sent.
  .partial();

/**
 * Parse a developer's property body into only the fields they may set.
 * Returns { data } or { error } where error is a readable message listing the
 * rejected fields (shown to the developer by the dashboard's toast).
 */
export const parsePropertyInput = (body = {}) => {
  // Legacy flat area shape { areaValue, areaUnit } → nested { area: { value, unit } }.
  const input = { ...body };
  if (input.area == null && input.areaValue != null) {
    input.area = { value: input.areaValue, unit: input.areaUnit || "sqft" };
  }

  const parsed = propertyInputSchema.safeParse(input);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => i.path.join(".") || "body"))];
    return { error: `Invalid fields: ${fields.join(", ")}`, issues: parsed.error.issues };
  }

  const data = parsed.data;
  // A listing is "RERA approved" only if it carries a RERA number; the client
  // can't just tick the badge on. Only recomputed when reraNumber was sent.
  if ("reraNumber" in data) data.reraApproved = Boolean(data.reraNumber);
  return { data };
};
