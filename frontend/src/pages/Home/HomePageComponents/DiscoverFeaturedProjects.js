import React, { useEffect, useState } from "react";
import "./DiscoverFeaturedProjects.css";
import API from "../../../api";
import { useCity } from "../../../contexts/CityContext";

const DiscoverFeaturedProjects = () => {
  const { city } = useCity();
  const [hoveredId, setHoveredId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Utility functions
  const fallback = (value, fallbackText = "—") =>
    value !== undefined && value !== null && value !== ""
      ? value
      : fallbackText;

  const truncate = (text, max = 80) =>
    text?.length > max ? text.slice(0, max) + "…" : text;

  // Fetch featured projects
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

        if (!ignore) {
          setProjects(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch featured projects:", err);
        if (!ignore) {
          setProjects([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchFeatured();

    return () => {
      ignore = true;
    };
  }, [city]);

  // Keyboard handlers
  const handleKeyDown = (e, propertyId) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setHoveredId(propertyId);
    } else if (e.key === "Escape") {
      setHoveredId(null);
    }
  };

  const handleCardClick = (propertyId) => {
    // Navigate to property details
    window.location.href = `/property/${propertyId}`;
  };

  if (loading || projects.length === 0) return null;

  return (
    <section 
      className="discover-projects"
      aria-labelledby="discover-heading"
    >
      {/* Info Card */}
      <div className="discover-info">
        <h2 id="discover-heading">
          Discover Featured Projects
          {city && <span className="city-pill"> in {city}</span>}
        </h2>
        <p>
          Explore premium residential and commercial projects from top
          developers across prime locations.
        </p>
        <button 
          className="discover-btn"
          onClick={() => (window.location.href = "/properties")}
          aria-label="View all featured projects"
        >
          View all projects
        </button>
      </div>

      {/* Featured Cards */}
      <div 
        className="discover-cards"
        role="list"
        aria-label="Featured property cards"
      >
        {projects.slice(0, 2).map((property, index) => (
          <article
            key={property._id}
            className={`project-card-discover-feature ${
              index === 0 ? "large" : ""
            }`}
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
            <img
              src={
                property.coverImage?.url ||
                "https://images.unsplash.com/photo-1568605114967-8130f3a36994"
              }
              alt={`${property.title} property view`}
              loading="lazy"
            />

            {/* Overlay */}
            <div className="project-overlay" aria-hidden="true">
              <span className="project-tag">
                {property.locality}, {property.city}
              </span>
              <h3>{property.title}</h3>
              <p>
                {property.bhk ? `${property.bhk} BHK · ` : ""}
                From ₹{(property.price / 10000000).toFixed(2)} Cr
              </p>
            </div>

            {/* Hover Details */}
            {hoveredId === property._id && (
              <div 
                className="property-glance"
                role="region"
                aria-label="Property details"
              >
                {/* Developer */}
                <div className="glance-item">
                  <span className="glance-label">Developer</span>
                  <span className="glance-value">
                    {fallback(property.developerName, "Reputed Developer")}
                  </span>
                </div>

                {/* Area */}
                <div className="glance-item">
                  <span className="glance-label">Area</span>
                  <span className="glance-value">
                    {property.area?.value
                      ? `${property.area.value} ${property.area.unit}`
                      : "Area on request"}
                  </span>
                </div>

                {/* Price / Sqft */}
                <div className="glance-item">
                  <span className="glance-label">Price / Sqft</span>
                  <span className="glance-value">
                    {property.pricePerSqft
                      ? `₹${property.pricePerSqft.toLocaleString("en-IN")}`
                      : "Market price"}
                  </span>
                </div>

                {/* Possession */}
                <div className="glance-item">
                  <span className="glance-label">Possession</span>
                  <span className="glance-value">
                    {fallback(property.possessionStatus, "TBA")}
                  </span>
                </div>

                {/* Property Type */}
                <div className="glance-item">
                  <span className="glance-label">Type</span>
                  <span className="glance-value">
                    {fallback(property.propertyType, "Residential")}
                  </span>
                </div>

                {/* RERA */}
                <div className="glance-item">
                  <span className="glance-label">RERA</span>
                  <span className="glance-value">
                    {property.reraNumber ? "Approved" : "Applied"}
                  </span>
                </div>

                {/* Description */}
                <div className="glance-item glance-description">
                  <span className="glance-label">About</span>
                  <span className="glance-value">
                    {property.description
                      ? truncate(property.description, 90)
                      : "Premium project in a prime location."}
                  </span>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default React.memo(DiscoverFeaturedProjects);