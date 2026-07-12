//controllers/leadController.js

import { CustomerLead } from "../models/CustomerFormLeads.js";
import { customerLeadValidator } from "../validators/customerFormLeadValidator.js";

import { DeveloperLead } from "../models/DeveloperFormLeads.js";
import { developerLeadValidator } from "../validators/developerFormLeadValidator.js";

import { sanitizeObject } from "../utils/sanitizeInput.js";


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
    const { customerEmail, propertyId } = cleanData;

    //    DUPLICATE CHECK (24H)
    const existingLead = await CustomerLead().findOne({
      customerEmail,
      propertyId,
      createdAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    if (existingLead) {
      return res.status(200).json({
        success: true,
        message: "Lead already submitted recently",
      });
    }

    const lead = await CustomerLead().create({
      ...cleanData,
      ipAddress: req.ip, //req.ip depends on trust proxy in server.js CHECK THIS 
      userAgent: req.headers["user-agent"] || "",
      pageUrl: req.headers.referer || "",
      leadStatus: "new",
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
    const { developerEmail } = cleanData;

    const existingLead = await DeveloperLead().findOne({
      developerEmail,
      createdAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    if (existingLead) {
      return res.status(200).json({
        success: true,
        message: "Enquiry already submitted recently",
      });
    }

    const lead = await DeveloperLead().create({
      ...cleanData,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || "",
      pageUrl: req.headers.referer || "",
      leadStatus: "new",
    });

    return res.status(201).json({
      success: true,
      data: lead,
    });

  } catch (error) {
    next(error);
  }
};
