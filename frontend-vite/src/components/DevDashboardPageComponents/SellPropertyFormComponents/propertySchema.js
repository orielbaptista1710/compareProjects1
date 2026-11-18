//frontend/src/components/SellPropertyFormComponents/propertySchema.js
// Single source of truth for form validation.
  
import { z } from "zod";
import { LISTED_BY } from "../../../constants/roles";
import { youtubeVideoId } from "../../../constants/media";
import { MEDIA_UPLOAD_ENABLED } from "../../../config/features";
// Limits, minimums and required fields shared with the API (FORM-04)
import {
  TEXT_LIMITS as MAX, TEXT_MINIMUMS as MIN, PINCODE_PATTERN,
  PRICE_RANGE, EMI_RANGE, SQFT_PER_UNIT, AREA_SQFT_RANGE, AREA_TYPES, ROOM_COUNT_MAX,
  FIELDS_NOT_FOR_TYPE, FURNISHING_REQUIRED_TYPES,
} from "../../../constants/listingRules";
import { parseFloor, FLOOR_HINT } from "../../../features/listings/floor";

// Treats "" and null as undefined — prevents empty strings failing numeric validation
const optionalNum = (schema) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), schema);

const optionalPosInt   = optionalNum(z.coerce.number().int().min(1).optional());
const optionalPosFloat = optionalNum(z.coerce.number().positive().optional());
// BHK/bathroom/balcony pills: a number, or the top "N+" bucket ("5+", "4+")
const optionalCount = optionalNum(
  z.union([z.coerce.number().int().min(0).max(ROOM_COUNT_MAX), z.string().regex(/^\d+\+$/)]).optional()
);

// Whole rupees within the API's range (FORM-06). The price input converts
// Lakh / Crore to rupees, so a fraction here means a fraction of a rupee.
const rupees = ({ lowest, highest }, what, { lowText, highText }) =>
  z.coerce
    .number({ error: `${what} must be a number` })
    .int(`${what} must be in whole rupees`)
    .min(lowest, `${what} must be at least ${lowText}`)
    .max(highest, `${what} must be at most ${highText}`);

// Same check as the API: 10 sq ft to 1 crore sq ft in any unit (FORM-07)
const areaInRange = ({ value, unit }) => {
  if (value === undefined) return true;
  const sqft = value * (SQFT_PER_UNIT[unit] ?? 1);
  return sqft >= AREA_SQFT_RANGE.lowest && sqft <= AREA_SQFT_RANGE.highest;
};

// Fields the chosen type doesn't have (bhk on a Plot, FORM-08) are left out
// before checking, so a hidden field can't block publishing and isn't sent.
// They stay in the form, so switching back to Flat brings them back.
const withoutFieldsNotForType = (values) => {
  const skip = FIELDS_NOT_FOR_TYPE[values?.propertyType];
  if (!skip?.length) return values;
  const kept = { ...values };
  for (const field of skip) delete kept[field];
  return kept;
};

// Every field the form can collect, with the developer rules. Owners and agents
// reuse this and loosen only the fields their form doesn't show (see
// ROLE_OVERRIDES below).
const baseShape = {
    // ── Basic Info ────────────────────────────────────────────────
    // Trimmed before the length checks, as the server does
    developerName:    z.string().trim().min(MIN.developerName, `Developer name must be at least ${MIN.developerName} characters`).max(MAX.developerName),
    // No title here: it is generated on submit (features/listings/listingTitle.js)
    description:      z.string().trim().min(MIN.description, `Short description must be at least ${MIN.description} characters`).max(MAX.description),
    long_description: z.string().max(MAX.long_description).optional().or(z.literal("")),
    // Groups BHK variants of one project onto one card (server: projectKey).
    // Blank = never grouped.
    projectName:      z.string().trim().max(MAX.projectName, `Project name can be up to ${MAX.projectName} characters`).optional().or(z.literal("")),

    // ── Location ──────────────────────────────────────────────────
    state:    z.string().trim().min(1, "State is required").max(MAX.state),
    city:     z.string().trim().min(1, "City is required").max(MAX.city),
    locality: z.string().trim().min(1, "Locality is required").max(MAX.locality),
    address:  z.string().trim().min(MIN.address, "Address is required").max(MAX.address),
    pincode:  z.string().regex(PINCODE_PATTERN, "Pincode must be exactly 6 digits"),

    // Set by map handlers via setValue — user never types these directly
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
 
    // ── Pricing ───────────────────────────────────────────────────
    price:           optionalNum(rupees(PRICE_RANGE, "Price", { lowText: "₹1 Lakh", highText: "₹1,000 Crore" })),
    emiStarts:       optionalNum(rupees(EMI_RANGE, "EMI", { lowText: "₹1", highText: "₹1 Crore" }).optional()),
    priceNegotiable: z.boolean().optional().default(false),

    // ── Area — NESTED OBJECT matching initialFormData shape ───────
    // The form registers "area.value", "area.unit" and "area.type" directly.
    // Type is optional: carpet, built-up, super built-up or plot (FORM-07).
    area: z.object({
      value: optionalPosFloat,
      unit:  z.enum(Object.keys(SQFT_PER_UNIT)).default("sqft"),
      type:  z.enum(AREA_TYPES).optional().or(z.literal("")),
    })
      .refine(areaInRange, {
        message: `Area must be between ${AREA_SQFT_RANGE.lowest} sq ft and 1 crore sq ft; check the unit`,
        path: ["value"],
      })
      .optional(),
 
    // ── Property Classification ───────────────────────────────────
    // Enum validation happens server-side in Mongoose pre('validate')
    propertyType: z.string().min(1, "Select a property type"),
 
    // ── Property Details ──────────────────────────────────────────
    bhk:             optionalCount,
    bathrooms:       optionalCount,
    balconies:       optionalCount,
    facing:          z.string().optional(),
    // Mongoose has parkings as String (single). Form sends array.
    // Submit transform joins array → string. See onFormSubmit note.
    parkings:        z.array(z.string()).optional().default([]),
    // Required for flats and villas only (checked below, FORM-08)
    furnishing:      z.string().optional(),
    possessionStatus:z.string().min(1, "Select possession status"),
    ageOfProperty:   z.string().optional().default("New"),
 
    // ── Building Details ──────────────────────────────────────────
    totalFloors:    optionalPosInt,
    // Typed as text ("12", "Ground", "B1"), sent as a number (features/listings/floor.js)
    floor:          z.string().optional().refine((v) => !Number.isNaN(parseFloor(v)), FLOOR_HINT),
    wing:           z.string().max(MAX.wing).optional(),
    phase:          z.string().max(MAX.phase).optional(),
    // Short text: towers are often lettered ("A", "T2"). Older listings saved a number.
    tower:          z.preprocess(
      (v) => (typeof v === "number" ? String(v) : v),
      z.string().trim().max(MAX.tower, `Use ${MAX.tower} characters or fewer`).optional()
    ),
    unitsAvailable: optionalNum(z.coerce.number().int().min(1, "Enter at least 1 unit")),
 
    // ── RERA ──────────────────────────────────────────────────────
    reraApproved: z.boolean().optional().default(false),
    reraNumber:   z.string().max(MAX.reraNumber).optional().or(z.literal("")),
    // reraDate: accepts "" (empty date input), null (initialFormData), or ISO string
    reraDate:     z.string().optional().nullable().or(z.literal("")),
 
    // ── Amenities ────────────────────────────────────────────────
    amenities:  z.array(z.string()).optional().default([]),
    facilities: z.array(z.string()).optional().default([]),
    security:   z.array(z.string()).optional().default([]),

    // ── Photos, brochure, video link (ListingMediaSection) ───────
    // Only part of the form while uploads are switched on. Without these keys
    // zod drops the fields, so nothing about media is sent and a save can't
    // touch the photos a listing already has.
    ...(MEDIA_UPLOAD_ENABLED ? mediaShape() : {}),
};

// Links only: the files are checked when they're picked (resizePhoto.js) and
// again by the server on save. Lenient about what older listings carry.
function mediaShape() {
  const storedPhoto = z.object({
    url:       z.string().nullish(),
    thumbnail: z.string().nullish(),
    category:  z.string().nullish(),
    caption:   z.string().nullish(),
  });
  return {
    coverImage:    z.union([z.literal(""), storedPhoto]).nullish(),
    galleryImages: z.array(storedPhoto).optional().default([]),
    brochure:      z.union([z.literal(""), z.object({ url: z.string().nullish() })]).nullish(),
    videoUrl: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || youtubeVideoId(v) !== null,
        "Paste the link to one YouTube video, like https://www.youtube.com/watch?v=…"
      )
      .optional(),
  };
}

const MEDIA_DEFAULTS = { coverImage: "", galleryImages: [], brochure: "", videoUrl: "" };

// What each poster is NOT asked for. Property.js only requires developerName
// for developer listings (listedBy 'developer' or missing), and never requires
// possessionStatus or unitsAvailable, so skipping them as an owner or agent
// can't make a save fail. Developers keep the full rules.
const optionalDeveloperName = z.string().trim().max(MAX.developerName).optional().or(z.literal(""));
const optionalUnits = optionalNum(z.coerce.number().int().min(1).optional());

const ROLE_OVERRIDES = {
  [LISTED_BY.DEVELOPER]: {},
  // Agents see the RERA/possession section, so possessionStatus stays required.
  [LISTED_BY.AGENT]: { developerName: optionalDeveloperName, unitsAvailable: optionalUnits },
  // Owners have no RERA/possession or Building section.
  [LISTED_BY.OWNER]: {
    developerName: optionalDeveloperName,
    unitsAvailable: optionalUnits,
    possessionStatus: z.string().optional(),
  }, 
};

const buildPropertySchema = (role) =>
  z.preprocess(
    withoutFieldsNotForType,
    z
    .object({ ...baseShape, ...ROLE_OVERRIDES[role] })
    .superRefine((data, ctx) => {
      // Before a type is chosen it counts as required, as the form shows it
      const needsFurnishing = !data.propertyType || FURNISHING_REQUIRED_TYPES.includes(data.propertyType);
      if (needsFurnishing && !data.furnishing) {
        ctx.addIssue({ path: ["furnishing"], code: "custom", message: "Select a furnishing type" });
      }
      if (data.reraApproved && !data.reraNumber?.trim()) {
        ctx.addIssue({
          path: ["reraNumber"],
          code: z.ZodIssueCode.custom,
          message: "RERA number is required when RERA Approved is checked",
        });
      }
      // Same check as the API (FORM-18)
      const floor = parseFloor(data.floor);
      if (Number.isInteger(floor) && data.totalFloors && floor > data.totalFloors) {
        ctx.addIssue({
          path: ["floor"],
          code: z.ZodIssueCode.custom,
          message: `The building has ${data.totalFloors} floors`,
        });
      }
      // Run even while other fields are invalid, so a missing furnishing is
      // shown together with the other problems, not after they're fixed.
    }, { when: () => true })
  );

// One schema per role, built once so the form resolver keeps a stable identity.
export const propertySchemas = Object.freeze({
  [LISTED_BY.DEVELOPER]: buildPropertySchema(LISTED_BY.DEVELOPER),
  [LISTED_BY.AGENT]: buildPropertySchema(LISTED_BY.AGENT),
  [LISTED_BY.OWNER]: buildPropertySchema(LISTED_BY.OWNER),
});

// Every field the form checks (the schemas are wrapped, so they have no .shape)
export const PROPERTY_FORM_FIELDS = Object.freeze(Object.keys(baseShape));

// The developer schema, as before.
export const propertySchema = propertySchemas[LISTED_BY.DEVELOPER];

// Matches initialFormData from developerDashPropertyHelpers.js exactly
// so RHF defaultValues and Dashboard state stay in sync.
export const defaultPropertyValues = {
  developerName:    "",
  title:            "",
  description:      "",
  long_description: "",
  projectName:      "",
  state:            "",
  city:             "",
  locality:         "",
  address:          "",
  pincode:          "",
  lat:              undefined,
  lng:              undefined,
  price:            "",
  emiStarts:        "",
  priceNegotiable:  false,
  // Nested area — matches initialFormData shape
  area:             { value: "", unit: "sqft", type: "" },
  propertyType:     "",
  bhk:              "",
  bathrooms:        "",
  balconies:        "",
  facing:           "",
  parkings:         [],
  furnishing:       "",
  possessionStatus: "",
  ageOfProperty:    "New",
  totalFloors:      "",
  floor:            "",
  wing:             "",
  phase:            "",
  tower:            "",
  unitsAvailable:   "",
  reraApproved:     false,
  reraNumber:       "",
  reraDate:         null,
  amenities:        [],
  facilities:       [],
  security:         [],
  ...(MEDIA_UPLOAD_ENABLED ? MEDIA_DEFAULTS : {}),
};
 