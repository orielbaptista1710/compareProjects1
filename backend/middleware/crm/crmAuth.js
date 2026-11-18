// middleware/crm/crmAuth.js
// Session gate for /api/crm/*. Sets req.crmUser ({ id, email, name, role })
// and req.crmSessionId. Never use protect/protectCustomer under /api/crm.
import { validateSession } from "../../services/crm/crmAuthService.js";

export const CRM_COOKIE = "crm_session";

export const requireCrmAuth = async (req, res, next) => {
  try {
    const session = await validateSession(req.cookies?.[CRM_COOKIE]);
    if (!session) {
      return res.status(401).json({ success: false, code: "UNAUTHENTICATED", message: "Please log in." });
    }
    req.crmUser = session.user;
    req.crmSessionId = session.sessionId;
    next();
  } catch (err) {
    next(err);
  }
};
