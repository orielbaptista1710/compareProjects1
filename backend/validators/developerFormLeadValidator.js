


// //validators/developerFormLeadValidator.js
// import { z } from "zod";

// export const developerLeadValidator = z.object({
//   developerFullName: z
//     .string()
//     .trim()
//     .min(2, "Full name must be at least 2 characters"),

//   developerEmail: z
//     .string()
//     .trim()
//     .email("Invalid email format"),

//   developerPhone: z
//     .string()
//     .trim()
//     .regex(/^[6-9]\d{9}$/, "Invalid 10-digit Indian mobile number"),

//   developerContactConsent: z.literal(true, {
//     errorMap: () => ({ message: "Consent is required" }),
//   }),

//   source: z.enum([
//     "developer_popup",
//   ]),

//   companyName: z.string().optional(),
//   projectLocation: z.string().optional(),
//   message: z.string().max(1500).optional(),
// });








