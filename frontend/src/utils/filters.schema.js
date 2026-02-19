// src/utils/filters.schema.js
import {FILTER_LABELS} from "../assests/constants/propertyTypeConfig"

//this is for hte filters present on the FilterPanel- probally have to add locality n all here if i add that 
export const DEFAULT_FILTERS = {
  city: "",
  locality: [], 

  search: "",
  
  bhk: [], 
  propertyType: [],
  
  furnishing: [],
  facing: [],
  parkings: [],
};

export const formatFilterValue = (key, value) => {
  if (value === null || value === undefined || value === "") return "";

  const stringValue = String(value).trim();

  switch (key) {
    case "bhk":
      // e.g., 1 → "1 BHK", 3+ → "3+ BHK"
      return stringValue.includes("+") ? `${stringValue} BHK` : `${stringValue} BHK`;

    case "propertyType":
      // e.g., villa → "Villa"
      return FILTER_LABELS.propertyType?.[stringValue] || stringValue;


    case "facing":
      // e.g., north → "North Facing"
      return stringValue.charAt(0).toUpperCase() + stringValue.slice(1) + " Facing";
      


    default:
      return stringValue;
  }
};


