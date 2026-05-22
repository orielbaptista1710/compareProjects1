//frontend/src/pages/PropertyPage/PropertyPageComponents/LocationSection 
//  * What it does:
//  *  - Derives a working embed URL via getMapEmbedUrl() (coords → mapLink → address)
//  *  - Shows a "Map not available" placeholder if nothing resolves
//  *  - Landmarks from property.landmarks[] (your schema field)
//  *  - Each landmark links out using getLandmarkHref() (coords → name search)
 
import React, { useMemo, useState } from "react";
import { MapPin, Building2, AlertCircle } from "lucide-react";
import { getMapEmbedUrl, getLandmarkHref } from "../../../utils/mapUtils";
import "./LocationSection.css";

// ── Map iframe with error/loading states ──────────────────────
const MapEmbed = ({ src }) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className="ls-map-placeholder" role="img" aria-label="Map unavailable">
        <AlertCircle size={22} strokeWidth={1.5} />
        <span>Map preview unavailable</span>
        {src && (
          <a href={src.replace("&output=embed", "")} target="_blank" rel="noopener noreferrer" className="ls-map-ext-link">
            Open in Google Maps ↗
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="ls-map-frame">
      <iframe
        src={src}
        width="100%"
        height="320"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Property location map"
        allowFullScreen
        onError={() => setFailed(true)}
      />
    </div>
  );
};

// ── Main component ────────────────────────────────────────────
const LocationSection = ({ property }) => {
  const embedUrl = useMemo(() => getMapEmbedUrl(property), [property]);

  const landmarks = property.landmarks || [];
  const hasAddress = !!property.address;

  return (
    <div className="ls-root pp-card">
      <h2 className="pp-card__title">Location</h2>

      {/* Address line */}
      {hasAddress && (
        <p className="ls-address">
          <MapPin size={13} className="ls-address__pin" />
          {property.address}
        </p>
      )}

      {/* Map */}
      <MapEmbed src={embedUrl} />

      {/* "Open full map" link — always show if we have anything */}
      {(embedUrl || hasAddress) && (
        <a
          href={
            property.coordinates?.lat
              ? `https://www.google.com/maps?q=${property.coordinates.lat},${property.coordinates.lng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address || property.locality || "")}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="ls-open-maps"
        >
          Open in Google Maps ↗
        </a>
      )}

      {/* Landmarks — from property.landmarks schema field */}
      {landmarks.length > 0 && (
        <div className="ls-landmarks">
          <h3 className="ls-landmarks__heading">Nearby Landmarks</h3>
          <div className="ls-landmarks__grid">
            {landmarks.map((lm, i) => (
              <a
                key={i}
                href={getLandmarkHref(lm, property.city)}
                target="_blank"
                rel="noopener noreferrer"
                className="ls-landmark"
                aria-label={`View ${lm.name} on map`}
              >
                <Building2 size={14} className="ls-landmark__ico" />
                <span className="ls-landmark__name">{lm.name}</span>
                <span className="ls-landmark__arrow">↗</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSection;