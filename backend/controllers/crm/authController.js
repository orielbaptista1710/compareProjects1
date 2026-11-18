// controllers/crm/authController.js
// Handlers for routes/crm/authRoutes.js. Shapes follow openapi/crm.yaml.
import { z } from "zod";
import { login, logout } from "../../services/crm/crmAuthService.js";
import { CRM_COOKIE } from "../../middleware/crm/crmAuth.js";

const isProd = process.env.NODE_ENV === "production";

// SameSite=Strict: the CRM app and API are same-site (crm.<domain>, api.<domain>),
// and locally the CRM dev server proxies /api, so no cross-site cookie is needed.
// Path limits the cookie to CRM routes; the website API never receives it.
const cookieOptions = { httpOnly: true, secure: isProd, sameSite: "strict", path: "/api/crm" };

// Unknown fields (e.g. the reserved mfaCode) are stripped.
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

export const crmLogin = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "Email and password are required." });
    }

    const result = await login({
      ...parsed.data,
      ip: req.ip,
      userAgent: (req.headers["user-agent"] || "").slice(0, 300),
    });

    if (result.status === "locked") {
      return res.status(423).json({ success: false, code: "ACCOUNT_LOCKED", message: "Account locked. Try again in 15 minutes." });
    }
    if (result.status !== "ok") {
      return res.status(401).json({ success: false, code: "UNAUTHENTICATED", message: "Invalid email or password." });
    }

    res.cookie(CRM_COOKIE, result.token, { ...cookieOptions, expires: result.expiresAt });
    return res.json({ success: true, user: result.user });
  } catch (err) {
    next(err);
  }
};

export const crmLogout = async (req, res, next) => {
  try {
    await logout(req.crmSessionId);
    res.clearCookie(CRM_COOKIE, cookieOptions);
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const crmMe = (req, res) => res.json({ user: req.crmUser });
