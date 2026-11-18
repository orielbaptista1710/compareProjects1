// src/config/features.js
//
// Feature flags, read once from the build env. Check these instead of reading
// import.meta.env in components.

// Owner/agent "My listings" + posting in the customer profile. Keep in step
// with the backend's ENABLE_CUSTOMER_LISTINGS (the API is 404 without it).
export const CUSTOMER_LISTINGS_ENABLED = import.meta.env.VITE_ENABLE_CUSTOMER_LISTINGS === "true";

// Photo, brochure and video-link section of the listing form. Keep in step with
// the backend's ENABLE_MEDIA_UPLOAD (upload links answer 503 without it).
export const MEDIA_UPLOAD_ENABLED = import.meta.env.VITE_ENABLE_MEDIA_UPLOAD === "true";
