import { lazy } from "react";

export const TABS = [
  { id: "overview",  label: "Overview"  },
  { id: "details",   label: "Details"   },
  { id: "amenities", label: "Amenities" },
  { id: "location",  label: "Location"  },
];

// Each tab is its own chunk — Details/Amenities/Location JS
// only downloads when the user actually clicks that tab.
export const TAB_MAP = {
  overview:  lazy(() => import("./OverviewTab")),
  details:   lazy(() => import("./DetailsTab")),
  amenities: lazy(() => import("./AmenitiesTab")),
  location:  lazy(() => import("./LocationTab")),
};