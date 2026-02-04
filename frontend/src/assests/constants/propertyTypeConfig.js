//constants/propertyTypeConfig.js -- used for the MainSeachBar for the propertyType pill menu dropdown

// constants/propertyTypeConfig.js
import {
  faHouse,
  faBuilding,
  faMap,
  faStore,
  faWarehouse,
  faIndustry,
} from "@fortawesome/free-solid-svg-icons";

export const PROPERTY_TYPE_CONFIG = [
  {
    group: "Residential",
    key: "residential",
    target: "propertyType",
    items: [
      { label: "Flats / Apartments", value: "Flats/Apartments", icon: faHouse },
      { label: "Villa", value: "Villa", icon: faBuilding },
      { label: "Plot", value: "Plot", icon: faMap },
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
      {
        label: "Shop / Showroom",
        value: "Shop/Showroom",
        icon: faStore,
      },
      {
        label: "Office Space",
        value: "Office Space",
        icon: faBuilding,
      },
      {
        label: "Industrial Warehouse / Godown",
        value: "Industrial Warehouse/Godown",
        icon: faWarehouse,
      },
      {
        label: "Industrial Building",
        value: "Industrial Building",
        icon: faIndustry,
      },
      {
        label: "Commercial Land",
        value: "Commercial Land",
        icon: faMap,
      },
    ],
  },
];

 
//this is for the active filters in the Properties results page
//src/assests/constants/propertyTypeConfig.js
export const FILTER_LABELS = {
  city: "City",
  locality: "Locality",

  propertyType: "Property Type",
  bhk: "BHK",

  furnishing: "Furnishing",
  facing: "Facing",
  parkings: "Parkings",

  // minBudget: "Min Budget",
  // maxBudget: "Max Budget",
};

