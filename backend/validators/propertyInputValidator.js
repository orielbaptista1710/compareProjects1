// backend/validators/propertyInputValidator.js
//
// Allowlist for developer-submitted property data (POST /add, PUT /update/:id).
// Only the fields below can be set by a developer; anything else in the body —
// metadata.moderation/analytics, userId, status, featured, owner/agent contact
// details, dataSource, review fields — is silently dropped (zod strips unknown
// keys), because the edit form sends the whole saved property back.
//
// Types are deliberately lenient ("" → not set, numeric strings → numbers) to
// match what the dashboard form sends. Limits and number rules match the form
// (shared limits in constants/listingRules.js); which fields each poster must
// fill in is checked on the whole listing by listingRuleErrors below, and
// Mongoose still enforces enums on save. See docs/review/01-security.md
// SEC-04 / SEC-09 and docs/review/09-listing-form-readiness.md FORM-04.
import { z } from "zod"; 
import { RESIDENTIAL_TYPES, COMMERCIAL_TYPES } from "../models/propertyType.js";
import { toPlainText } from "../utils/sanitizeInput.js";
import { PHOTO_CATEGORIES } from "../constants/media.js";
import {
  TEXT_LIMITS, TEXT_MINIMUMS, PINCODE_PATTERN, REQUIRED_FIELDS, INDIA_BOUNDS, FLOOR_RANGE,
  PRICE_RANGE, EMI_RANGE, SQFT_PER_UNIT, AREA_SQFT_RANGE, AREA_TYPES, ROOM_COUNT_MAX,
  FIELDS_NOT_FOR_TYPE, FURNISHING_REQUIRED_TYPES,
} from "../constants/listingRules.js";
import { LISTED_BY } from "../constants/roles.js";
import { mediaPublicHost } from "../services/mediaStorage.js";

// Hosts that listing links/media may point at (https only). A subdomain of a
// listed host is allowed too, e.g. www.youtube.com, my.matterport.com.
export const ALLOWED_URL_HOSTS = {
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

const isInIndia = (lat, lng) =>
  lat >= INDIA_BOUNDS.south && lat <= INDIA_BOUNDS.north &&
  lng >= INDIA_BOUNDS.west && lng <= INDIA_BOUNDS.east;

// "" and null mean "not filled in" in the dashboard form.
const blankToUndefined = (v) => (v === "" || v === null ? undefined : v);
const optional = (schema) => z.preprocess(blankToUndefined, schema.optional());

// Free text is shown to other users, so it's stored as plain text (tags removed).
const text = (max) => z.string().trim().max(max, `Use ${max} characters or fewer`).transform(toPlainText);
// A form field whose limit is in the shared rules (constants/listingRules.js)
const limited = (field) => text(TEXT_LIMITS[field]);
const num = optional(z.coerce.number().finite().min(0));
// 0 = ground, -1 = B1 … (FORM-18, same range as the form)
const floorNumber = optional(
  z.coerce
    .number()
    .int("Use a whole number")
    .min(FLOOR_RANGE.lowest, `Lowest floor is B${-FLOOR_RANGE.lowest}`)
    .max(FLOOR_RANGE.highest, `Highest floor is ${FLOOR_RANGE.highest}`)
);
// Same number rules as the form (propertySchema.js)
const count = optional(
  z.coerce.number().int("Use a whole number").min(0).max(ROOM_COUNT_MAX, `Use ${ROOM_COUNT_MAX} or fewer`)
);
// Whole rupees within a range (FORM-06)
const rupees = ({ lowest, highest }, what) =>
  optional(
    z.coerce
      .number()
      .finite()
      .int(`${what} must be in whole rupees`)
      .min(lowest, `${what} must be at least ₹${lowest.toLocaleString("en-IN")}`)
      .max(highest, `${what} must be at most ₹${highest.toLocaleString("en-IN")}`)
  );
const AREA_UNITS = Object.keys(SQFT_PER_UNIT);
// Within AREA_SQFT_RANGE once converted to square feet (FORM-07). Reported on
// area.value so the form marks the number, not the unit.
const areaInRange = ({ value, unit }) => {
  if (value === undefined) return true;
  const sqft = value * SQFT_PER_UNIT[unit ?? "sqft"];
  return sqft >= AREA_SQFT_RANGE.lowest && sqft <= AREA_SQFT_RANGE.highest;
};
const atLeastOne = optional(z.coerce.number().int("Use a whole number").min(1, "Must be at least 1"));

// Media links may also point at our own upload storage, when it is switched on
// (services/mediaStorage.js). Read per request so the setting isn't frozen at import.
const hostsFor = (kind) => {
  const uploadHost = kind === "media" ? mediaPublicHost() : null;
  return uploadHost ? [...ALLOWED_URL_HOSTS[kind], uploadHost] : ALLOWED_URL_HOSTS[kind];
};

const url = (kind) =>
  z.string().trim().max(2048).refine((v) => isAllowedUrl(v, hostsFor(kind)), {
    message: `must be an https link to ${ALLOWED_URL_HOSTS[kind].join(", ")}`,
  });

// A YouTube link must name one video (11-character id): a watch, short, embed
// or youtu.be link. Channel, playlist, search and redirect links are refused.
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
export const youtubeVideoId = (value) => {
  try {
    const { hostname, pathname, searchParams } = new URL(value);
    const host = hostname.replace(/^(www|m)\./, "");
    let id = null;
    if (host === "youtu.be") id = pathname.slice(1);
    else if (host === "youtube.com" && pathname === "/watch") id = searchParams.get("v");
    else if (host === "youtube.com") id = pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1];
    return id && YOUTUBE_ID.test(id) ? id : null;
  } catch {
    return null;
  }
};
const isYoutubeHost = (value) => {
  try {
    return /(^|\.)(youtube\.com|youtu\.be)$/.test(new URL(value).hostname);
  } catch {
    return false;
  }
};

// A media link can be cleared back to "" from the edit form.
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
  category: optional(z.enum(PHOTO_CATEGORIES)),
});

export const propertyInputSchema = z.object({
  // ── Basic info ──────────────────────────────
  developerName: limited("developerName"),
  title: limited("title"),
  description: limited("description"),
  long_description: limited("long_description"),
  projectName: limited("projectName"),
  listingType: optional(z.enum(["sale", "resale"])),

  // ── Location ────────────────────────────────
  state: limited("state"),
  city: limited("city"),
  locality: limited("locality"),
  sub_locality: limited("sub_locality"),
  address: limited("address"),
  pincode: optional(
    z.preprocess(
      (v) => (typeof v === "number" ? String(v) : v),
      z.string().trim().regex(PINCODE_PATTERN, "Pincode must be exactly 6 digits")
    )
  ),
  // No mapLink: posters set the location with the map pin (coordinates).
  // Scraped listings keep their stored mapLink; a sent one is dropped.
  // Blank lat/lng are rejected rather than coerced: Number("") is 0, which
  // would silently pin the listing at 0,0 in the Atlantic. null removes a
  // saved pin (the form's "Remove pin"); a pin that is sent must be in India
  // (FORM-10, same box as the form).
  coordinates: z.union([
    z.null(),
    optional(
      z
        .object({
          lat: z.preprocess(blankToUndefined, z.coerce.number().min(-90).max(90)),
          lng: z.preprocess(blankToUndefined, z.coerce.number().min(-180).max(180)),
        })
        .refine(({ lat, lng }) => isInIndia(lat, lng), {
          message: "Place the pin inside India",
          path: ["lat"],
        })
    ),
  ]),

  // ── Pricing & size ──────────────────────────
  price: rupees(PRICE_RANGE, "Price"),
  emiStarts: rupees(EMI_RANGE, "EMI"),
  priceNegotiable: z.boolean(),
  area: optional(
    z
      .object({
        value: optional(z.coerce.number().finite().positive("Area must be greater than 0")),
        unit: optional(z.enum(AREA_UNITS)),
        // "" clears a saved type (kept as "" so an edit can see the change;
        // the controller removes it before saving)
        type: z
          .string()
          .refine((v) => v === "" || AREA_TYPES.includes(v), "Pick carpet, built-up, super built-up or plot area")
          .optional(),
      })
      .refine(areaInRange, {
        message: `Area must be between ${AREA_SQFT_RANGE.lowest} sq ft and 1 crore sq ft; check the unit`,
        path: ["value"],
      })
  ),

  // ── Classification & details ────────────────
  propertyType: z.enum([...RESIDENTIAL_TYPES, ...COMMERCIAL_TYPES]),
  furnishing: optional(text(50)),
  possessionStatus: optional(text(50)),
  facing: text(50),
  ageOfProperty: text(50),
  floorLabel: optional(text(20)),
  bhk: count,
  bathrooms: count,
  balconies: count,
  parkings: stringList(20, 50),
  totalFloors: atLeastOne,
  floor: floorNumber,
  wing: limited("wing"),
  phase: limited("phase"),
  // Short text ("A", "T2"); a number from an older client is kept as text (FORM-18)
  tower: z.preprocess((v) => (typeof v === "number" ? String(v) : v), limited("tower")),
  unitsAvailable: atLeastOne,
  amenities: stringList(100, 100),
  facilities: stringList(100, 100),
  security: stringList(100, 100),

  // ── RERA (reraApproved is derived server-side from reraNumber) ──
  reraNumber: limited("reraNumber"),
  reraDate: optional(z.coerce.date()),

  // ── Media (URLs restricted to trusted hosts) ─
  // url "" removes the cover / brochure (the controller unsets the field).
  coverImage: optional(
    z.object({
      url: clearableUrl("media"),
      thumbnail: optional(url("media")),
      category: optional(z.enum(PHOTO_CATEGORIES)),
    })
  ),
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
    .array(
      z
        .object({ type: z.enum(["3d", "video", "panorama"]), url: url("tour"), thumbnail: optional(url("media")) })
        .refine((tour) => !isYoutubeHost(tour.url) || youtubeVideoId(tour.url) !== null, {
          message: "must be a link to one YouTube video",
          path: ["url"],
        })
    )
    .max(10),
  brochure: optional(z.object({ url: clearableUrl("media"), public_id: optional(text(200)) })),
})
  // Every field is optional here, because updates only touch the fields that
  // were sent; listingRuleErrors decides what the saved listing must have.
  .partial();

// { "field.path": "reason" }, first reason per field. Sent to the form so it
// can mark the fields (FORM-15). Reasons are rule descriptions, never values.
const errorsByField = (issues) => {
  const errors = {};
  for (const issue of issues) {
    const path = issue.path.join(".") || "body";
    errors[path] ??= issue.message;
  }
  return errors;
};

const isBlank = (value) =>
  value === undefined || value === null || (typeof value === "string" && !value.trim());

/**
 * What a listing still breaks of the shared rules (constants/listingRules.js)
 * that a per-field check can't see: the fields this poster must fill in, and
 * minimum lengths of those fields. `listing` is the whole listing as it would
 * be saved (a new body, or the saved listing with the edit applied), so an
 * edit can't empty a required field either.
 *
 * @returns {Record<string,string>} { field: reason }; empty when it passes
 */
export const listingRuleErrors = (listing, listedBy) => {
  const required = REQUIRED_FIELDS[listedBy] ?? REQUIRED_FIELDS[LISTED_BY.DEVELOPER];
  const errors = {};
  for (const field of required) {
    const value = listing[field];
    if (isBlank(value)) {
      errors[field] = "This field is required";
      continue;
    }
    const min = TEXT_MINIMUMS[field];
    if (min && typeof value === "string" && value.trim().length < min) {
      errors[field] = `Use at least ${min} characters`;
    }
  }
  // Homes must say how they're furnished (FORM-08)
  if (FURNISHING_REQUIRED_TYPES.includes(listing.propertyType) && isBlank(listing.furnishing)) {
    errors.furnishing = "This field is required";
  }
  // The unit can't be above the top floor (FORM-18). Ground (0) and basements always fit.
  const { floor, totalFloors } = listing;
  if (Number.isFinite(floor) && Number.isFinite(totalFloors) && floor > totalFloors) {
    errors.floor = `The building has ${totalFloors} floors`;
  }
  return errors;
};

/**
 * Fields that don't apply to a property type (FORM-08), e.g. bhk on a Plot.
 * The API ignores them in a request. Unknown or missing type: none.
 * @returns {readonly string[]}
 */
export const fieldsNotForType = (propertyType) => FIELDS_NOT_FOR_TYPE[propertyType] ?? [];

/**
 * Parse a poster's property body into only the fields they may set.
 * Returns { data } or { error, errors } where error is a readable message
 * listing the rejected fields and errors maps each one to its reason.
 */
export const parsePropertyInput = (body = {}) => {
  // Legacy flat area shape { areaValue, areaUnit } → nested { area: { value, unit } }.
  const input = { ...body };
  if (input.area == null && input.areaValue != null) {
    input.area = { value: input.areaValue, unit: input.areaUnit || "sqft" };
  }

  const parsed = propertyInputSchema.safeParse(input);
  if (!parsed.success) {
    const errors = errorsByField(parsed.error.issues);
    return { error: `Invalid fields: ${Object.keys(errors).join(", ")}`, errors, issues: parsed.error.issues };
  }

  const data = parsed.data;
  // A listing is "RERA approved" only if it carries a RERA number; the client
  // can't just tick the badge on. Only recomputed when reraNumber was sent.
  if ("reraNumber" in data) data.reraApproved = Boolean(data.reraNumber);
  return { data };
};
