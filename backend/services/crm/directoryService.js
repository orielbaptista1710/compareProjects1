// services/crm/directoryService.js
//
// Small pick-lists for the CRM screens: who a lead can be assigned to, and the
// zones a user may filter by. Bounded and scoped by role.
import { CrmRole } from "@prisma/client";
import prisma from "../../config/prisma.js";

const LIMIT = 200;
const managing = (user) => ({ staff: { some: { userId: user.id, isManager: true } } });

// Null when the role can't assign leads (→ 403).
export async function listAssignableStaff(user) {
  let where;
  if (user?.role === CrmRole.crm_manager) {
    where = { role: CrmRole.sales_rep, isActive: true };
  } else if (user?.role === CrmRole.zonal_manager) {
    where = { role: CrmRole.sales_rep, isActive: true, zones: { some: { zone: managing(user) } } };
  } else {
    return null;
  }
  return prisma.crmUser.findMany({
    where,
    orderBy: { name: "asc" },
    take: LIMIT,
    select: { id: true, name: true, role: true },
  });
}

// admin / crm_manager: all zones. zonal_manager: zones they manage.
// sales_rep: zones they belong to. Null for an unknown role.
export async function listZones(user) {
  let where;
  switch (user?.role) {
    case CrmRole.admin:
    case CrmRole.crm_manager:
      where = {};
      break;
    case CrmRole.zonal_manager:
      where = managing(user);
      break;
    case CrmRole.sales_rep:
      where = { staff: { some: { userId: user.id } } };
      break;
    default:
      return null;
  }
  return prisma.zone.findMany({
    where,
    orderBy: [{ city: "asc" }, { name: "asc" }],
    take: LIMIT,
    select: { id: true, name: true, city: true },
  });
}
