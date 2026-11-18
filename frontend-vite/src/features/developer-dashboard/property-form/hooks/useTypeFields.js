// hooks/useTypeFields.js
// What the chosen property type asks for (FORM-08, constants/listingRules.js):
// a Plot has no bedrooms or floors, a Villa no unit floor, and only homes must
// give furnishing. Watches propertyType alone, so a section using this
// re-renders when the type changes, not on every keystroke.
import { useFormContext, useWatch } from "react-hook-form";
import { FIELDS_NOT_FOR_TYPE, FURNISHING_REQUIRED_TYPES } from "../../../../constants/listingRules";

const NONE = Object.freeze([]);

/** @returns {{ skips: (field: string) => boolean, furnishingRequired: boolean }} */
export const useTypeFields = () => {
  const { control } = useFormContext();
  const propertyType = useWatch({ control, name: "propertyType" });
  const skipped = FIELDS_NOT_FOR_TYPE[propertyType] ?? NONE;
  return {
    skips: (field) => skipped.includes(field),
    // No type chosen yet: show it as required, the common case
    furnishingRequired: !propertyType || FURNISHING_REQUIRED_TYPES.includes(propertyType),
  };
};
