import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { formatCurrencyShort } from "../../../utils/formatters";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L from "leaflet";
import "./PropertyMap.css";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

/* Fix Leaflet marker icons */
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png",
});

const MAX_MARKERS = 80;
const DEFAULT_CENTER = [20.5937, 78.9629];

/* Format Price */

const PropertyMap = ({ properties = [], city }) => {

  const navigate = useNavigate();

  const mappableProperties = useMemo(() => {
    if (!Array.isArray(properties)) return [];

    return properties
      .map((p) => {
        if (Array.isArray(p.geo?.coordinates)) {
          return { ...p, __lat: p.geo.coordinates[1], __lng: p.geo.coordinates[0] };
        }
        if (typeof p.coordinates?.lat === "number") {
          return { ...p, __lat: p.coordinates.lat, __lng: p.coordinates.lng };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, MAX_MARKERS);
  }, [properties]);

  if (!properties.length) return null;

  const hasGeoData = mappableProperties.length > 0;

  const mapCenter = hasGeoData
    ? [mappableProperties[0].__lat, mappableProperties[0].__lng]
    : DEFAULT_CENTER;

  return (
    <div className="property-map-wrapper">
      <MapContainer
        center={mapCenter}
        zoom={city ? 12 : 5}
        scrollWheelZoom={false}
        className="property-map-container"
      >

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {hasGeoData && (
          <MarkerClusterGroup chunkedLoading>
            {mappableProperties.map((property) => (
              <Marker
                key={property._id}
                position={[property.__lat, property.__lng]}
              >
                <Popup maxWidth={300} offset={[0, -6]}>
  <div className="property-popup-compact">
    
    {property.coverImage?.thumbnail && (
      <img
        src={property.coverImage.thumbnail}
        alt={property.title || "Property"}
        className="popup-thumb"
        loading="lazy"
      />
    )}

    <div className="popup-info">

      <div className="popup-title">
                        {property.title || "Property"}
                      </div>

                      <div className="popup-price">
                        {formatCurrencyShort(property.price)}
                      </div>

                      {/* Property meta */}
                      {(property.bhk || property.propertyType) && (
                        <div className="popup-meta">
                          {property.bhk && <span>{property.bhk} BHK</span>}
                          {property.bhk && property.propertyType && <span>•</span>}
                          {property.propertyType && <span>{property.propertyType}</span>}
                        </div>
                      )}

                      <div className="popup-location">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {[property.locality, property.city]
                          .filter(Boolean)
                          .join(", ") || "Location not specified"}
                      </div>


      <div
        className="popup-link"
        onClick={() => navigate(`/property/${property._id}`)}
      >
        View →
      </div>




    </div>

  </div>
</Popup>

              </Marker>
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>
    </div>
  );
};

export default React.memo(PropertyMap);
