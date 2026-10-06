//routes/leadRoutes.js -- for customer n developer leads MAINtaince hoho
import express from "express";
import {
  createCustomerLead,
  createDeveloperLead
} from "../controllers/leadController.js";
import { leadLimiter, leadPhoneLimiter } from "../middleware/rateLimiters.js";

//why is the leadPhoneLimiter applied to both customer and developer leads? Because the phone number is the key to limiting spam, not the IP address. A spammer can rotate through many IPs, but they can't rotate through many phone numbers. So we limit by phone number as well as by IP address.

const router = express.Router();


router.post("/customer", leadLimiter, leadPhoneLimiter, createCustomerLead);
router.post("/developer", leadLimiter, leadPhoneLimiter, createDeveloperLead);

export default router;


