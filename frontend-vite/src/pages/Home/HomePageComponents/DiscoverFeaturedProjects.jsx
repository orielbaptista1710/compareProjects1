import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import "./DiscoverFeaturedProjects.css";

import API from "../../../api";
import { useCity } from "../../../contexts/CityContext";

import {
  formatCurrency,
  formatCurrencyShort,
  formatAreaText,
  safeText,
} from "../../../utils/formatters";

const DiscoverFeaturedProjects = () => {
  const { city, setCity } = useCity();

  const [hoveredId, setHoveredId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // This is component-specific display logic, so it is reasonable
  // to keep it here rather than adding it to the global formatters file.
  const truncate = (text, max = 100) =>
    text?.length > max ? `${text.slice(0, max)}…` : text;

  /*
   * Fetch featured projects whenever the selected city changes.
   *
   * The ignore flag prevents state updates if the component unmounts
   * before the request finishes.
   */
  useEffect(() => {
    let ignore = false;

    const fetchFeatured = async () => {
      try {
        setLoading(true);

        const endpoint = city
          ? `/api/properties/featured?city=${encodeURIComponent(city)}`
          : "/api/properties/featured";

        const { data } = await API.get(endpoint);

        if (!ignore) {
          setProjects(
            Array.isArray(data)
              ? data
              : data?.properties || data?.data || []
          );
        }
      } catch (err) {
        console.error("Failed to fetch featured projects:", err);

        if (!ignore) {
          setProjects([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchFeatured();

    return () => {
      ignore = true;
    };
  }, [city]);

  /*
   * Synchronize the city in the URL with CityContext.
   *
   * This allows a URL such as:
   * /?city=Mumbai
   *
   * to update the selected city.
   */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCity = params.get("city");

    if (urlCity && urlCity !== city) {
      setCity(urlCity);
    }
  }, [location.search, city, setCity]);

  const handleKeyDown = (e, propertyId) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setHoveredId(propertyId);
    } else if (e.key === "Escape") {
      setHoveredId(null);
    }
  };

  const handleCardClick = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  /*
   * Nothing is rendered while loading or when there are no featured
   * projects available.
   */
  if (loading || projects.length === 0) {
    return null;
  }

  return (
    <section className="dfp-section" aria-labelledby="dfp-heading">
      {/* Left: Information panel */}
      <div className="dfp-info">
        <div className="dfp-info-inner">
          <div className="dfp-eyebrow">
            <span className="dfp-eyebrow-line" aria-hidden="true" />
            <span>Featured Projects</span>
          </div>

          <h2 id="dfp-heading" className="dfp-heading">
            {city ? (
              <>
                Curated Listings
                <br />
                in <em>{city}</em>
              </>
            ) : (
              <>
                Premium Properties,
                <br />
                Handpicked For You
              </>
            )}
          </h2>

          <p className="dfp-subtext">
            Explore exclusive residential and commercial projects from India's
            most trusted developers — across prime locations.
          </p>

          <div className="dfp-stats">
            <div className="dfp-stat">
              <span className="dfp-stat-num">500+</span>
              <span className="dfp-stat-label">Active Listings</span>
            </div>

            <div className="dfp-stat-divider" aria-hidden="true" />

            <div className="dfp-stat">
              <span className="dfp-stat-num">50+</span>
              <span className="dfp-stat-label">Cities</span>
            </div>

            <div className="dfp-stat-divider" aria-hidden="true" />

            <div className="dfp-stat">
              <span className="dfp-stat-num">RERA</span>
              <span className="dfp-stat-label">Verified</span>
            </div>
          </div>

          <button
            className="dfp-cta"
            onClick={() => {
              if (city) {
                navigate(
                  `/properties?city=${encodeURIComponent(city)}`
                );
              } else {
                navigate("/properties");
              }
            }}
            aria-label="View all featured projects"
          >
            <span>Explore All Projects</span>

            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Right: Featured property cards */}
      <div
        className="dfp-cards"
        role="list"
        aria-label="Featured property cards"
      >
        {projects.slice(0, 2).map((property, index) => {
          /*
           * Centralize display values before rendering.
           *
           * The component asks the formatter for presentation-ready values
           * instead of manually formatting prices and areas.
           */
          const price = formatCurrencyShort(property.price);

          const area =
            formatAreaText(property.area) || "On request";

          const pricePerSqft = property.pricePerSqft
            ? formatCurrency(property.pricePerSqft)
            : "Market price";

          const locality = safeText(
            property.locality,
            "Location on request"
          );

          const propertyCity = safeText(
            property.city,
            ""
          );

          return (
            <article
              key={property._id}
              className={`dfp-card${
                index === 0 ? " dfp-card--large" : ""
              }`}
              role="listitem"
              tabIndex={0}
              onMouseEnter={() => setHoveredId(property._id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(property._id)}
              onBlur={() => setHoveredId(null)}
              onKeyDown={(e) =>
                handleKeyDown(e, property._id)
              }
              onClick={() => handleCardClick(property._id)}
              aria-label={`${safeText(
                property.title,
                "Property"
              )} in ${locality}${
                propertyCity ? `, ${propertyCity}` : ""
              }`}
            >
              {/* RERA badge */}
              <div
                className="dfp-card-badge"
                aria-hidden="true"
              >
                {property.reraNumber
                  ? "RERA Approved"
                  : "RERA Applied"}
              </div>

              {/* Property image */}
              <img
                className="dfp-card-img"
                src={
                  property.coverImage?.url ||
                  "https://images.unsplash.com/photo-1568605114967-8130f3a36994"
                }
                alt={`${safeText(
                  property.title,
                  "Property"
                )} property view`}
                loading="lazy"
              />

              {/* Main card information */}
              <div
                className="dfp-card-overlay"
                aria-hidden="true"
              >
                <div className="dfp-card-location">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 1a3.5 3.5 0 0 1 3.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 0 1 6 1z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <circle
                      cx="6"
                      cy="4.5"
                      r="1"
                      fill="currentColor"
                    />
                  </svg>

                  {locality}
                  {propertyCity ? `, ${propertyCity}` : ""}
                </div>

                <h3 className="dfp-card-title">
                  {safeText(property.title, "Untitled Property")}
                </h3>

                <p className="dfp-card-price">
                  {property.bhk
                    ? `${property.bhk} BHK · `
                    : ""}
                  From {price}
                </p>
              </div>

              {/* Hover/focus details panel */}
              <div
                className={`dfp-glance${
                  hoveredId === property._id
                    ? " dfp-glance--active"
                    : ""
                }`}
                role="region"
                aria-label="Property details"
                aria-hidden={hoveredId !== property._id}
              >
                <div className="dfp-glance-header">
                  <span className="dfp-glance-title">
                    {safeText(
                      property.title,
                      "Untitled Property"
                    )}
                  </span>

                  <span className="dfp-glance-sub">
                    {locality}
                    {propertyCity ? `, ${propertyCity}` : ""}
                  </span>
                </div>

                <div className="dfp-glance-grid">
                  <div className="dfp-glance-item">
                    <span className="dfp-glance-label">
                      Developer
                    </span>

                    <span className="dfp-glance-value">
                      {safeText(
                        property.developerName,
                        "Reputed Developer"
                      )}
                    </span>
                  </div>

                  <div className="dfp-glance-item">
                    <span className="dfp-glance-label">
                      Area
                    </span>

                    <span className="dfp-glance-value">
                      {area}
                    </span>
                  </div>

                  <div className="dfp-glance-item">
                    <span className="dfp-glance-label">
                      Price / Sqft
                    </span>

                    <span className="dfp-glance-value">
                      {pricePerSqft}
                    </span>
                  </div>

                  <div className="dfp-glance-item">
                    <span className="dfp-glance-label">
                      Possession
                    </span>

                    <span className="dfp-glance-value">
                      {safeText(
                        property.possessionStatus,
                        "TBA"
                      )}
                    </span>
                  </div>

                  <div className="dfp-glance-item">
                    <span className="dfp-glance-label">
                      Type
                    </span>

                    <span className="dfp-glance-value">
                      {safeText(
                        property.propertyType,
                        "Residential"
                      )}
                    </span>
                  </div>

                  <div className="dfp-glance-item">
                    <span className="dfp-glance-label">
                      RERA
                    </span>

                    <span className="dfp-glance-value">
                      {property.reraNumber
                        ? "Approved"
                        : "Applied"}
                    </span>
                  </div>
                </div>

                {property.description && (
                  <p className="dfp-glance-desc">
                    {truncate(property.description, 100)}
                  </p>
                )}

                <button
                  className="dfp-glance-cta"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(property._id);
                  }}
                  aria-label={`View details for ${safeText(
                    property.title,
                    "property"
                  )}`}
                >
                  View Property

                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default React.memo(DiscoverFeaturedProjects);