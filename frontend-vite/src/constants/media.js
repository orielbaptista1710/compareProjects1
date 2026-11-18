// src/constants/media.js
//
// Limits and names for the photos and brochure posted with a listing.
// Keep in sync with backend/constants/media.js: the server enforces the same
// limits again, so a change here alone only changes what the form allows.
import { LISTED_BY } from "./roles";

export const PHOTO_CATEGORIES = Object.freeze([
  { id: "exterior", label: "Exterior view" },
  { id: "living_room", label: "Living room" },
  { id: "bedroom", label: "Bedrooms" },
  { id: "bathroom", label: "Bathrooms" },
  { id: "kitchen", label: "Kitchen" },
  { id: "interior", label: "Interior" },
  { id: "floor_plan", label: "Floor plan" },
  { id: "master_plan", label: "Master plan" },
  { id: "location_map", label: "Location map" },
  { id: "other", label: "Others" },
]);

const HOME_TABS = ["exterior", "living_room", "bedroom", "bathroom", "kitchen", "floor_plan", "master_plan", "location_map", "other"];
const LAND_TABS = ["exterior", "master_plan", "location_map", "other"];
const COMMERCIAL_TABS = ["exterior", "interior", "floor_plan", "master_plan", "location_map", "other"];

// Property types as in backend/models/propertyType.js
const TABS_BY_TYPE = {
  "Flats/Apartments": HOME_TABS,
  Villa: HOME_TABS,
  Plot: LAND_TABS,
  "Commercial Land": LAND_TABS,
  "Shop/Showroom": COMMERCIAL_TABS,
  "Office Space": COMMERCIAL_TABS,
  "Industrial Warehouse/Godown": COMMERCIAL_TABS,
  "Industrial Building": COMMERCIAL_TABS,
};

/** The photo tabs for a property type (a plot has no bedrooms tab). */
export const categoriesFor = (propertyType) => {
  const ids = TABS_BY_TYPE[propertyType] ?? HOME_TABS;
  return PHOTO_CATEGORIES.filter((c) => ids.includes(c.id));
};

export const MAX_PHOTOS = 30;

// The photo the poster picks
export const PHOTO_INPUT_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PHOTO_INPUT_MAX_BYTES = 20 * 1024 * 1024;
export const PHOTO_MIN_WIDTH = 600;
export const PHOTO_MIN_HEIGHT = 400;

// The two files made from it in the browser and uploaded
export const PHOTO_LARGE_EDGE = 1600;
export const PHOTO_THUMB_EDGE = 400;
export const PHOTO_LARGE_MAX_BYTES = 1.5 * 1024 * 1024;
export const PHOTO_THUMB_MAX_BYTES = 200 * 1024;

export const BROCHURE_MAX_BYTES = 10 * 1024 * 1024;

// Owners sell one home; brochures are for developers' projects and agents.
export const canAddBrochure = (role) => role !== LISTED_BY.OWNER;

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
/** The video id in a YouTube watch, short, embed or youtu.be link; null for anything else. */
export const youtubeVideoId = (value) => {
  try {
    const { protocol, hostname, pathname, searchParams } = new URL(value);
    if (protocol !== "https:") return null;
    const host = hostname.replace(/^(www|m)\./, "");
    let id = null;
    if (host === "youtu.be") id = pathname.slice(1);
    else if (host === "youtube.com" && pathname === "/watch") id = searchParams.get("v");
    else if (host === "youtube.com") id = pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1];
    return id && YOUTUBE_ID.test(id) ? id : null;
  } catch {
    return null;
  }
};
