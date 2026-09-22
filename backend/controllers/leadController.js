//controllers/leadController.js
import prisma from "../config/prisma.js";
import { customerLeadValidator } from "../validators/customerFormLeadValidator.js";
import { developerLeadValidator } from "../validators/developerFormLeadValidator.js";
import { sanitizeObject } from "../utils/sanitizeInput.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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
      propertyTitle,
      userType,
      budget,
      propertyType,
      locality,
      city,
      message,
      loanInterest,
      customerContactConsent,
    } = cleanData;

    //    DUPLICATE CHECK (24H)
    const existingLead = await prisma.lead.findFirst({
      where: {
        leadType: "customer",
        email: customerEmail,
        propertyId: propertyId || null,
        createdAt: { gte: new Date(Date.now() - ONE_DAY_MS) },
      },
    });

    if (existingLead) {
      return res.status(200).json({
        success: true,
        message: "Lead already submitted recently",
      });
    }

    const lead = await prisma.lead.create({
      data: {
        leadType: "customer",
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        source,
        propertyId: propertyId || null,
        propertyTitle: propertyTitle || null,
        contactConsent: customerContactConsent ?? true,
        metadata: { userType, budget, propertyType, locality, city, message, loanInterest },
        ipAddress: req.ip, //req.ip depends on trust proxy in server.js CHECK THIS
        userAgent: req.headers["user-agent"] || "",
        pageUrl: req.headers.referer || "",
      },
    });

    return res.status(201).json({
      success: true,
      data: lead,
    });

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
      developerContactConsent,
      source,
      companyName,
      projectLocation,
      message,
    } = cleanData;

    const existingLead = await prisma.lead.findFirst({
      where: {
        leadType: "developer",
        email: developerEmail,
        createdAt: { gte: new Date(Date.now() - ONE_DAY_MS) },
      },
    });

    if (existingLead) {
      return res.status(200).json({
        success: true,
        message: "Enquiry already submitted recently",
      });
    }

    const lead = await prisma.lead.create({
      data: {
        leadType: "developer",
        name: developerFullName,
        email: developerEmail,
        phone: developerPhone,
        source,
        contactConsent: developerContactConsent,
        metadata: { companyName, projectLocation, message },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || "",
        pageUrl: req.headers.referer || "",
      },
    });

    return res.status(201).json({
      success: true,
      data: lead,
    });

  } catch (error) {
    next(error);
  }
};
