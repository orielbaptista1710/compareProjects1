//controllers/leadController.js
// Thin adapters: validate + sanitize the website form, then hand off to the
// single ingest service (services/leadIngestService.js).
import { customerLeadValidator } from "../validators/customerFormLeadValidator.js";
import { developerLeadValidator } from "../validators/developerFormLeadValidator.js";
import { sanitizeObject } from "../utils/sanitizeInput.js";
import { ingestEnquiry } from "../services/leadIngestService.js";

const clientMeta = (req) => ({
  ip: req.ip, // trust proxy is set in server.js
  userAgent: (req.headers["user-agent"] || "").slice(0, 300),
});

//    CUSTOMER LEAD CONTROLLER
export const createCustomerLead = async (req, res, next) => {
  try {
    const parsed = customerLeadValidator.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const cleanData = sanitizeObject(parsed.data);
    const {
      customerName,
      customerEmail,
      customerPhone,
      source,
      propertyId,
      budget,
      propertyType,
      locality,
      city,
      message,
      loanInterest,
    } = cleanData;

    const result = await ingestEnquiry({
      channel: "web",
      source,
      category: "buyer",
      person: { name: customerName, phone: customerPhone, email: customerEmail },
      propertyId: propertyId || null,
      preferences: { budget, propertyType, locality, city, message, loanInterest },
      rawPayload: cleanData,
      client: clientMeta(req),
    });

    if (result.status === "duplicate") {
      return res.status(200).json({
        success: true,
        message: "Lead already submitted recently",
      });
    }

    // Only the id: never echo stored fields (ip, userAgent, CRM state).
    return res.status(201).json({ success: true, id: result.id });
  } catch (error) {
    next(error);
  }
};


//    DEVELOPER LEAD CONTROLLER
export const createDeveloperLead = async (req, res, next) => {
  try {
    const parsed = developerLeadValidator.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const cleanData = sanitizeObject(parsed.data);
    const {
      developerFullName,
      developerEmail,
      developerPhone,
      source,
      projectLocation,
      message,
    } = cleanData;

    const result = await ingestEnquiry({
      channel: "web",
      source,
      category: "developer_partner",
      person: { name: developerFullName, phone: developerPhone, email: developerEmail },
      // companyName has no column; it stays in rawPayload.
      preferences: { message, locality: projectLocation },
      rawPayload: cleanData,
      client: clientMeta(req),
    });

    if (result.status === "duplicate") {
      return res.status(200).json({
        success: true,
        message: "Enquiry already submitted recently",
      });
    }

    return res.status(201).json({ success: true, id: result.id });
  } catch (error) {
    next(error);
  }
};
