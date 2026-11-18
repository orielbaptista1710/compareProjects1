// features/developer-dashboard/property-form/roleConfig.js
// What the listing form asks each kind of poster. SellPropertyForm takes a
// `role` (a LISTED_BY value) and reads everything role-specific from here:
//
//   sections            which cards show, in order (ids from sectionConfig.js)
//   requiredFields      fields the dashboard checks before sending
//   showDeveloperFields developer/builder name and project name inputs. Only
//                       developer listings are grouped into project cards, so
//                       owners and agents aren't asked for them.
//
// The matching validation rules live in propertySchema.js (propertySchemas).
import { LISTED_BY } from "../../../constants/roles";
import { SECTIONS } from "./sectionConfig";
import { REQUIRED_FIELDS } from "../utils/developerDashPropertyHelpers";

const sectionsWithout = (...ids) => SECTIONS.filter((s) => !ids.includes(s.id));
const requiredWithout = (...fields) => REQUIRED_FIELDS.filter((f) => !fields.includes(f));

export const FORM_ROLES = Object.freeze({
  [LISTED_BY.DEVELOPER]: Object.freeze({
    sections: SECTIONS,
    requiredFields: REQUIRED_FIELDS,
    showDeveloperFields: true,
  }),
  // Agents keep RERA and possession (the RERA number itself is optional).
  [LISTED_BY.AGENT]: Object.freeze({
    sections: SECTIONS,
    requiredFields: requiredWithout("developerName", "unitsAvailable"),
    showDeveloperFields: false,
  }),
  // Owners sell one home: no RERA/possession or Building section.
  [LISTED_BY.OWNER]: Object.freeze({
    sections: sectionsWithout("building", "rera"),
    requiredFields: requiredWithout("developerName", "unitsAvailable", "possessionStatus"),
    showDeveloperFields: false,
  }),
});

// An unknown role falls back to the developer form, which is the strictest.
export const formRoleConfig = (role) => FORM_ROLES[role] ?? FORM_ROLES[LISTED_BY.DEVELOPER];
