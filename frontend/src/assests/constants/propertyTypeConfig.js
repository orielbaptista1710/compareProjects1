//constants/propertyTypeConfig.js -- used for the MainSeachBar for the propertyType pill menu dropdown

// constants/propertyTypeConfig.js
import {
  Home,
  Building2,
  Map,
  Store,
  Warehouse,
  Factory,
} from "lucide-react";

export const PROPERTY_TYPE_CONFIG = [
  {
    group: "Residential",
    key: "residential",
    target: "propertyType",
    items: [
      { label: "Flats / Apartments", value: "Flats/Apartments", icon: Home },
      { label: "Villa", value: "Villa", icon: Building2 },
      { label: "Plot", value: "Plot", icon: Map },
    ],
  },

  {
    group: "BHK",
    key: "bhk",
    target: "bhk",
    items: [
      { label: "1 BHK", value: "1" },
      { label: "2 BHK", value: "2" },
      { label: "3 BHK", value: "3" },
      { label: "4 BHK", value: "4" },
      { label: "5+ BHK", value: "5+" },
    ],
  },

  {
    group: "Commercial",
    key: "commercial",
    target: "propertyType",
    items: [
      { label: "Shop / Showroom", value: "Shop/Showroom", icon: Store },
      { label: "Office Space", value: "Office Space", icon: Building2 },
      {
        label: "Industrial Warehouse / Godown",
        value: "Industrial Warehouse/Godown",
        icon: Warehouse,
      },
      {
        label: "Industrial Building",
        value: "Industrial Building",
        icon: Factory,
      },
      { label: "Commercial Land", value: "Commercial Land", icon: Map },
    ],
  },
];

 
//this is for the active filters in the Properties results page
//src/assests/constants/propertyTypeConfig.js
export const FILTER_LABELS = {
  city: "City",
  locality: "Location",

  propertyType: "Property Type",
  bhk: "BHK",

  furnishing: "Furnishing",
  facing: "Facing",
  parkings: "Parkings",
};

