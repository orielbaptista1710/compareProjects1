// src/utils/mapUtils 
/**
 * Derives a working Google Maps **embed** URL from whatever the property has stored.
 *
 * Priority:
 *  1. property.coordinates (lat/lng)  → most reliable embed
 *  2. property.mapLink                → parse and convert the stored link
 *  3. property.address                → fallback text search embed
 *  4. null                            → no map to show
 *
 * IMPORTANT: You need a Google Maps Embed API key.
 * Add  REACT_APP_GOOGLE_MAPS_KEY  /VITE_GOOGLE_MAPS_API_KEY  =your_key  to your .env file.
 * The Embed API has a generous free tier (separate from Maps JavaScript API).
 *
 * If you don't want to use an API key yet, pass  noKey=true  and the function
 * will fall back to the keyless iframe src format that still works for basic
 * coordinate embeds (less reliable, may show a grey box in some regions).
 */

const EMBED_BASE = "https://www.google.com/maps/embed/v1";
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

/**
 * @param {Object} property - the property document from your API
 * @returns {string|null}   - a valid iframe src, or null if nothing usable
 */
export function getMapEmbedUrl(property) {
  if (!property) return null;

  const key = API_KEY ? `&key=${API_KEY}` : "";

  // ── 1. Prefer stored coordinates (most accurate) ──────────────
  const lat = property.coordinates?.lat;
  const lng = property.coordinates?.lng;

  if (lat != null && lng != null) {
    if (API_KEY) {
      // Full Embed API — shows marker, label, nearby places
      return `${EMBED_BASE}/place?q=${lat},${lng}&zoom=15${key}`;
    }
    // Keyless fallback — basic map centred on coords
    return `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  }
 
  // ── 2. Parse stored mapLink ───────────────────────────────────
  const link = property.mapLink;
  if (link) {
    // Already an embed URL — use as-is
    if (link.includes("/maps/embed")) return link;

    // Extract coords from common URL patterns:
    //   ?q=lat,lng
    //   @lat,lng,zoom
    //   ll=lat,lng
    const coordPatterns = [
      /[?&]q=([-\d.]+),([-\d.]+)/,
      /@([-\d.]+),([-\d.]+)/,
      /ll=([-\d.]+),([-\d.]+)/,
    ];

    for (const re of coordPatterns) {
      const m = link.match(re);
      if (m) {
        const [, parsedLat, parsedLng] = m;
        if (API_KEY) {
          return `${EMBED_BASE}/place?q=${parsedLat},${parsedLng}&zoom=15${key}`;
        }
        return `https://www.google.com/maps?q=${parsedLat},${parsedLng}&z=15&output=embed`;
      }
    }

    // Extract a place/search query from the URL
    const placePatterns = [
      /[?&]q=([^&]+)/,
      /place\/([^/@]+)/,
      /search\/([^/@?]+)/,
    ];

    for (const re of placePatterns) {
      const m = link.match(re);
      if (m) {
        const query = decodeURIComponent(m[1]).replace(/\+/g, " ");
        if (API_KEY) {
          return `${EMBED_BASE}/place?q=${encodeURIComponent(query)}${key}`;
        }
        return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
      }
    }
  }

  // ── 3. Address text search fallback ──────────────────────────
  const address = [property.address, property.locality, property.city, property.state]
    .filter(Boolean)
    .join(", ");

  if (address) {
    if (API_KEY) {
      return `${EMBED_BASE}/place?q=${encodeURIComponent(address)}${key}`;
    }
    return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  }

  return null;
}

/**
 * Builds a "View on Map" href for a landmark.
 * Uses landmark coordinates if available, falls back to name search.
 */
export function getLandmarkHref(landmark, propertyCity = "") {
  if (landmark.coordinates?.lat && landmark.coordinates?.lng) {
    return `https://www.google.com/maps/search/?api=1&query=${landmark.coordinates.lat},${landmark.coordinates.lng}`;
  }
  const q = [landmark.name, propertyCity].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}