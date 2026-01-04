import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import API from "../../../api";
import { useCity } from "../../../contexts/CityContext";

import "./RecentlyAdded.css";

const RecentlyAdded = () => {
  const navigate = useNavigate();
  const { city } = useCity();

  const {
    data: properties = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["recent-properties", city],
    queryFn: async () => {
      const res = await API.get(
        `/api/properties/recent?city=${city}&limit=3`
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return <div className="loading">Loading properties...</div>;
  }

  if (isError || properties.length === 0) {
    return null; // fail silently on homepage
  }

  return (
    <div className="recently-added-container">
      <h2 className="section-title-added" style={{ paddingBottom: "50px" }}>
        <span className="highlight">Top</span> Projects in {city}
      </h2>

      <div className="card-container">
        {properties.map((property) => (
          <div className="project-card" key={property._id}>
            <img
              src={
                property.coverImage ||
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
              }
              alt={property.title}
              className="project-image"
              loading="lazy"
            />

            <div className="project-info">
              <h3 className="project-title">{property.title}</h3>

              <p className="project-developer">
                By <span>{property.developerName || "Developer"}</span>
              </p>

              <p className="project-bhk">
                <span className="bhk-highlight">
                  {property.bhkType || "2 BHK"}
                </span>{" "}
                {property.propertyType || "Apartment"}
              </p>

              <p className="project-location">
                📍 {property.locality}, {property.city}
              </p>

              <button
                className="view-button"
                onClick={() => navigate(`/property/${property._id}`)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="view-more-container">
        <button
  className="view-more-link"
  onClick={() => navigate(`/properties?city=${encodeURIComponent(city)}`)}
>
  View More
</button>

      </div>
    </div>
  );
};

export default RecentlyAdded;
