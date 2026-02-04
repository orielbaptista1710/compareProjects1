import React, { useEffect, useState } from "react";
import "./DiscoverFeaturedProjects.css";
import API from "../../../api"; // adjust path if needed

const DiscoverFeaturedProjects = () => {
  const [hoveredId, setHoveredId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await API.get("api/properties/featured");
        setProjects(data);
      } catch (err) {
        console.error("Failed to fetch featured projects", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  if (loading) return null; // or skeleton later

  return (
    <section className="discover-projects">
      {/* Left Info Card */}
      <div className="discover-info">
        <h2>Discover Featured Projects</h2>
        <p>
          Explore premium residential and commercial projects from
          top developers across prime locations.
        </p>
        <button className="discover-btn">View all projects</button>
      </div>

      {/* Featured Cards */}
      <div className="discover-cards">
        {projects.slice(0, 2).map((property, index) => (
          <div
            key={property._id}
            className={`project-card-discover-feature ${
              index === 0 ? "large" : ""
            }`}
            onMouseEnter={() => setHoveredId(property._id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <img
              src={
                property.coverImage?.url ||
                "https://images.unsplash.com/photo-1568605114967-8130f3a36994"
              }
              alt={property.title}
            />

            {/* Overlay */}
            <div className="project-overlay">
              <span className="project-tag">{property.city}</span>
              <h3>{property.title}</h3>
              <p>
                {property.bhk ? `${property.bhk} BHK · ` : ""}
                From ₹{(property.price / 10000000).toFixed(2)} Cr
              </p>
            </div>

            {/* Hover Snapshot */}
            {hoveredId === property._id && (
              <div className="property-glance">
                {property.bhk && (
                  <div className="glance-item">
                    <span className="glance-label">Configuration</span>
                    <span className="glance-value">{property.bhk} BHK</span>
                  </div>
                )}

                {property.area?.value && (
                  <div className="glance-item">
                    <span className="glance-label">Area</span>
                    <span className="glance-value">
                      {property.area.value} {property.area.unit}
                    </span>
                  </div>
                )}

                {property.pricePerSqft && (
                  <div className="glance-item">
                    <span className="glance-label">Price / Sqft</span>
                    <span className="glance-value">
                      ₹{property.pricePerSqft}
                    </span>
                  </div>
                )}

                {property.reraDate && (
                  <div className="glance-item">
                    <span className="glance-label">Possession</span>
                    <span className="glance-value">
                      {new Date(property.reraDate).toLocaleDateString(
                        "en-IN",
                        { month: "short", year: "numeric" }
                      )}
                    </span>
                  </div>
                )}

                {property.furnishing && (
                  <div className="glance-item">
                    <span className="glance-label">Furnishing</span>
                    <span className="glance-value">
                      {property.furnishing}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default DiscoverFeaturedProjects;
