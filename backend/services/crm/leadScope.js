// services/crm/leadScope.js
//
// The ONLY place that decides which leads a CRM user may see. Every lead
// query must AND its where clause with leadScope(user), the way listing
// queries use ownerFilter. Unknown roles get null: deny by default.
//
//   crm_manager    all leads
//   admin          all leads, contact details masked (see contactMasked)
//   zonal_manager  leads in zones they manage (Unzoned stays with crm_manager)
//   sales_rep      leads assigned to them
import { CrmRole } from "@prisma/client";

export function leadScope(user) {
  switch (user?.role) {
    case CrmRole.crm_manager:
    case CrmRole.admin:
      return {};
    case CrmRole.zonal_manager:
      return { zone: { staff: { some: { userId: user.id, isManager: true } } } };
    case CrmRole.sales_rep:
      return { assignedTo: user.id };
    default:
      return null;
  }
}

// Admins oversee the system, not buyers: they see masked contacts and must
// use the audited reveal action to see a number.
export const contactMasked = (user) => user?.role === CrmRole.admin;
