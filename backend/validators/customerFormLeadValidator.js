


// //validators/customerFormLeadValidator.js
// import { z } from "zod";

// export const customerLeadValidator = z.object({
//   /* -------------------------
//      CORE CUSTOMER INFO
//   ------------------------- */
//   customerName: z
//     .string()
//     .trim()
//     .min(2, "Name must be at least 2 characters"),

//   customerEmail: z
//     .string()
//     .trim()
//     .email("Invalid email format"),

//   customerPhone: z
//     .string()
//     .trim()
//     .regex(/^[6-9]\d{9}$/, "Invalid 10-digit Indian mobile number"),

//   /* -------------------------
//      SOURCE
//   ------------------------- */
//   source: z.enum([
//     "home_page_contact",
//     "property_page_contact",
//     "smart_properties_page_form",
//     "quick_links_property_page_form",
//   ]),

//   /* -------------------------
//      OPTIONAL PROPERTY CONTEXT
//   ------------------------- */
//   propertyId: z.string().optional().nullable(),
//   propertyTitle: z.string().optional().nullable(),

//   /* -------------------------
//      PREFERENCES
//   ------------------------- */
//   userType: z.enum(["buyer", "investor"]).optional(),

//   budget: z.string().optional(),
//   propertyType: z.string().optional(),
//   locality: z.string().optional(),
//   city: z.string().optional(),

//   message: z.string().max(1000).optional(),

//   loanInterest: z.boolean().optional(),

//   /* -------------------------
//      CONSENT
//   ------------------------- */
//   customerContactConsent: z.literal(true, {
//     errorMap: () => ({ message: "Consent is required" }),
//   }),
// });


