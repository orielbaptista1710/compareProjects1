


//validators/developerFormLeadValidator.js
import { z } from "zod";

export const developerLeadValidator = z.object({
  developerFullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Name is too long"),

  developerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Email is too long")
    .email("Invalid email format"),

  developerPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Invalid 10-digit Indian mobile number"),

  // zod 4 ignores `errorMap`; `error` is the option that sets the message.
  developerContactConsent: z.literal(true, { error: "Consent is required" }),

  source: z.enum([
    "developer_popup",
  ]),

  companyName: z.string().max(200).optional(),
  projectLocation: z.string().max(200).optional(),
  message: z.string().max(1500).optional(),
});








