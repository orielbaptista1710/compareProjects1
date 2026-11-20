// controllers/crm/directoryController.js
// Pick-lists for the CRM screens (assign picker, zone filter). See services/crm/directoryService.js.
import { listAssignableStaff, listZones } from "../../services/crm/directoryService.js";

const forbidden = (res) => res.status(403).json({ success: false, code: "FORBIDDEN", message: "Not allowed." });

export const listStaffHandler = async (req, res, next) => {
  try {
    const data = await listAssignableStaff(req.crmUser);
    return data ? res.json({ data }) : forbidden(res);
  } catch (err) {
    next(err);
  }
};

export const listZonesHandler = async (req, res, next) => {
  try {
    const data = await listZones(req.crmUser);
    return data ? res.json({ data }) : forbidden(res);
  } catch (err) {
    next(err);
  }
};
