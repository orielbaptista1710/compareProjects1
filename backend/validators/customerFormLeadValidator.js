
//validators/customerFormLeadValidator.js
import { z } from "zod";

export const customerLeadValidator = z.object({
  /* -------------------------
     CORE CUSTOMER INFO
  ------------------------- */
  customerName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),

  customerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Email is too long")
    .email("Invalid email format"),

  customerPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Invalid 10-digit Indian mobile number"),

  /* -------------------------
     SOURCE
  ------------------------- */
  source: z.enum([
    "home_page_contact",
    "property_page_contact",
    "smart_properties_page_form",
    "quick_links_property_page_form",
  ]),

  /* -------------------------
     OPTIONAL PROPERTY CONTEXT
  ------------------------- */
  propertyId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid property id").optional().nullable(),
  propertyTitle: z.string().max(300).optional().nullable(),

  /* -------------------------
     PREFERENCES
  ------------------------- */
  userType: z.enum(["buyer", "investor"]).optional(),

  budget: z.string().max(100).optional(),
  propertyType: z.string().max(100).optional(),
  locality: z.string().max(100).optional(),
  city: z.string().max(100).optional(),

  message: z.string().max(1000).optional(),

  loanInterest: z.boolean().optional(),

  /* -------------------------
     CONSENT
  ------------------------- */
  // Must be an explicit tick from the user. It used to default to true, so a
  // form with no checkbox still recorded consent (docs/review SEC-07, DPDP).
  customerContactConsent: z.literal(true, { error: "Consent is required" }),
});


