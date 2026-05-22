import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./DiscoverFeaturedProjects.css";
import API from "../../../api";
import { useCity } from "../../../contexts/CityContext";

const DiscoverFeaturedProjects = () => {
  const { city, setCity } = useCity();
  const [hoveredId, setHoveredId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const location = useLocation();

  const fallback = (value, fallbackText = "—") =>
    value !== undefined && value !== null && value !== "" ? value : fallbackText;

  const truncate = (text, max = 100) =>
    text?.length > max ? text.slice(0, max) + "…" : text;

  useEffect(() => {
    let ignore = false;
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(
          city
            ? `/api/properties/featured?city=${encodeURIComponent(city)}`
            : `/api/properties/featured`
        );
        if (!ignore) setProjects(data || []);
      } catch (err) {
        console.error("Failed to fetch featured projects:", err);
        if (!ignore) setProjects([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchFeatured();
    return () => { ignore = true; };
  }, [city]);


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

  if (loading || projects.length === 0) return null;

  return (
    <section className="dfp-section" aria-labelledby="dfp-heading">
      {/* Left: Info Panel */}
      <div className="dfp-info">
        <div className="dfp-info-inner">
          <div className="dfp-eyebrow">
            <span className="dfp-eyebrow-line" aria-hidden="true" />
            <span>Featured Projects</span>
          </div>

          <h2 id="dfp-heading" className="dfp-heading">
            {city ? (
              <>Curated Listings<br />in <em>{city}</em></>
            ) : (
              <>Premium Properties,<br />Handpicked For You</>
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
                navigate(`/properties?city=${encodeURIComponent(city)}`);
              } else {
                navigate("/properties");
              }
            }}
            aria-label="View all featured projects"
          >
            <span>Explore All Projects</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Right: Property Cards */}
      <div
        className="dfp-cards"
        role="list"
        aria-label="Featured property cards"
      >
        {projects.slice(0, 2).map((property, index) => (
          <article
            key={property._id}
            className={`dfp-card${index === 0 ? " dfp-card--large" : ""}`}
            role="listitem"
            tabIndex={0}
            onMouseEnter={() => setHoveredId(property._id)}
            onMouseLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(property._id)}
            onBlur={() => setHoveredId(null)}
            onKeyDown={(e) => handleKeyDown(e, property._id)}
            onClick={() => handleCardClick(property._id)}
            aria-label={`${property.title} in ${property.locality}, ${property.city}`}
          >
            {/* Badge top-left */}
            <div className="dfp-card-badge" aria-hidden="true">
              {property.reraNumber ? "RERA Approved" : "RERA Applied"}
            </div>

            {/* Image */}
            <img
              className="dfp-card-img"
              src={
                property.coverImage?.url ||
                "https://images.unsplash.com/photo-1568605114967-8130f3a36994"
              }
              alt={`${property.title} property view`}
              loading="lazy"
            />

            {/* Gradient overlay with title info */}
            <div className="dfp-card-overlay" aria-hidden="true">
              <div className="dfp-card-location">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 1a3.5 3.5 0 0 1 3.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 0 1 6 1z" stroke="currentColor" strokeWidth="1.2"/>
                  <circle cx="6" cy="4.5" r="1" fill="currentColor"/>
                </svg>
                {property.locality}, {property.city}
              </div>
              <h3 className="dfp-card-title">{property.title}</h3>
              <p className="dfp-card-price">
                {property.bhk ? `${property.bhk} BHK · ` : ""}
                From ₹{(property.price / 10000000).toFixed(2)} Cr
              </p>
            </div>

            {/* Glance panel — slides in on hover */}
            <div
              className={`dfp-glance${hoveredId === property._id ? " dfp-glance--active" : ""}`}
              role="region"
              aria-label="Property details"
              aria-hidden={hoveredId !== property._id}
            >
              <div className="dfp-glance-header">
                <span className="dfp-glance-title">{property.title}</span>
                <span className="dfp-glance-sub">{property.locality}, {property.city}</span>
              </div>

              <div className="dfp-glance-grid">
                <div className="dfp-glance-item">
                  <span className="dfp-glance-label">Developer</span>
                  <span className="dfp-glance-value">
                    {fallback(property.developerName, "Reputed Developer")}
                  </span>
                </div>
                <div className="dfp-glance-item">
                  <span className="dfp-glance-label">Area</span>
                  <span className="dfp-glance-value">
                    {property.area?.value
                      ? `${property.area.value} ${property.area.unit}`
                      : "On request"}
                  </span>
                </div>
                <div className="dfp-glance-item">
                  <span className="dfp-glance-label">Price / Sqft</span>
                  <span className="dfp-glance-value">
                    {property.pricePerSqft
                      ? `₹${property.pricePerSqft.toLocaleString("en-IN")}`
                      : "Market price"}
                  </span>
                </div>
                <div className="dfp-glance-item">
                  <span className="dfp-glance-label">Possession</span>
                  <span className="dfp-glance-value">
                    {fallback(property.possessionStatus, "TBA")}
                  </span>
                </div>
                <div className="dfp-glance-item">
                  <span className="dfp-glance-label">Type</span>
                  <span className="dfp-glance-value">
                    {fallback(property.propertyType, "Residential")}
                  </span>
                </div>
                <div className="dfp-glance-item">
                  <span className="dfp-glance-label">RERA</span>
                  <span className="dfp-glance-value">
                    {property.reraNumber ? "Approved" : "Applied"}
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
                aria-label={`View details for ${property.title}`}
              >
                View Property
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default React.memo(DiscoverFeaturedProjects);