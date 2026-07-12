//frontend/src/components/SellPropertyFormComponents/propertySchema.js
// Single source of truth for form validation.
  
import { z } from "zod";
 
// Treats "" and null as undefined — prevents empty strings failing numeric validation
const optionalNum = (schema) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), schema);
 
const optionalInt      = optionalNum(z.coerce.number().int().optional());
const optionalPosInt   = optionalNum(z.coerce.number().int().min(1).optional());
const optionalPosFloat = optionalNum(z.coerce.number().positive().optional());
 
export const propertySchema = z
  .object({
    // ── Basic Info ────────────────────────────────────────────────
    developerName:    z.string().min(2, "Developer name must be at least 2 characters").max(100).trim(),
    title:            z.string().min(5, "Title must be at least 5 characters").max(150).trim(),
    description:      z.string().min(20, "Short description must be at least 20 characters").max(500).trim(),
    long_description: z.string().max(5000).optional().or(z.literal("")),
 
    // ── Location ──────────────────────────────────────────────────
    state:    z.string().min(1, "State is required"),
    city:     z.string().min(1, "City is required"),
    locality: z.string().min(1, "Locality is required"),
    address:  z.string().min(5, "Address is required").max(300).trim(),
    pincode:  z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
    mapLink:  z.string().url("Enter a valid URL").optional().or(z.literal("")),
 
    // Set by map handlers via setValue — user never types these directly
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
 
    // ── Pricing ───────────────────────────────────────────────────
    price:           optionalNum(z.coerce.number({ invalid_type_error: "Price must be a number" }).positive("Price must be greater than 0")),
    emiStarts:       optionalNum(z.coerce.number().min(0).optional()),
    priceNegotiable: z.boolean().optional().default(false),
 
    // ── Area — NESTED OBJECT matching initialFormData shape ───────
    // initialFormData sends { area: { value: 0, unit: "sqft" } }
    // The form registers "area.value" and "area.unit" directly.
    area: z.object({
      value: optionalPosFloat,
      unit:  z.enum(["sqft", "sqmts", "guntas", "hectares", "acres"]).default("sqft"),
    }).optional(),
 
    // ── Property Classification ───────────────────────────────────
    // Enum validation happens server-side in Mongoose pre('validate')
    propertyType: z.string().min(1, "Select a property type"),
 
    // ── Property Details ──────────────────────────────────────────
    bhk:             optionalInt,
    bathrooms:       optionalInt,
    balconies:       optionalInt,
    facing:          z.string().optional(),
    // Mongoose has parkings as String (single). Form sends array.
    // Submit transform joins array → string. See onFormSubmit note.
    parkings:        z.array(z.string()).optional().default([]),
    furnishing:      z.string().min(1, "Select a furnishing type"),
    possessionStatus:z.string().min(1, "Select possession status"),
    ageOfProperty:   z.string().optional().default("New"),
 
    // ── Building Details ──────────────────────────────────────────
    totalFloors:    optionalPosInt,
    floor:          z.string().optional(), // Mongoose is Number but form is text — handled in transform
    wing:           z.string().max(10).optional(),
    phase:          z.string().max(20).optional(),
    tower:          optionalPosInt,
    unitsAvailable: optionalNum(z.coerce.number().int().min(1, "Enter at least 1 unit")),
 
    // ── RERA ──────────────────────────────────────────────────────
    reraApproved: z.boolean().optional().default(false),
    reraNumber:   z.string().optional().or(z.literal("")),
    // reraDate: accepts "" (empty date input), null (initialFormData), or ISO string
    reraDate:     z.string().optional().nullable().or(z.literal("")),
 
    // ── Amenities ────────────────────────────────────────────────
    amenities:  z.array(z.string()).optional().default([]),
    facilities: z.array(z.string()).optional().default([]),
    security:   z.array(z.string()).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.reraApproved && !data.reraNumber?.trim()) {
      ctx.addIssue({
        path: ["reraNumber"],
        code: z.ZodIssueCode.custom,
        message: "RERA number is required when RERA Approved is checked",
      });
    }
  });
 
// Matches initialFormData from developerDashPropertyHelpers.js exactly
// so RHF defaultValues and Dashboard state stay in sync.
export const defaultPropertyValues = {
  developerName:    "",
  title:            "",
  description:      "",
  long_description: "",
  state:            "",
  city:             "",
  locality:         "",
  address:          "",
  pincode:          "",
  mapLink:          "",
  lat:              undefined,
  lng:              undefined,
  price:            "",
  emiStarts:        "",
  priceNegotiable:  false,
  // Nested area — matches initialFormData shape
  area:             { value: "", unit: "sqft" },
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
};
 