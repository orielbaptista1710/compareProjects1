import React, { useEffect, useState } from 'react';
// import axios from 'axios';
import './RecentlyAdded.css';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const RecentlyAdded = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentlyAdded = async () => {
      try {
        const response = await API.get('/api/properties/recent');
        if (!response.data || response.data.length === 0) {
          setError("No properties found");
        } else {
          // Get first 3
          const recentProperties = response.data.slice(0, 3);
          setProperties(recentProperties);
        }
      } catch (err) {
        setError("Failed to load properties");
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyAdded();
  }, []);

  if (loading) return <div className="loading">Loading properties...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="recently-added-container">
      <h2 className="section-title-added" style={{paddingBottom: "50px"}}>
          <span className="highlight">Top</span> Projects
        </h2>
      <div className="card-container">
        {properties.map((property) => (
          <div className="project-card" key={property._id}>
            <img
              src={property.coverImage || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"}
              alt={property.title}
              className="project-image"
              loading="lazy"
            />
            <div className="project-info">
              <h3 className="project-title">{property.title}</h3>
              <p className="project-developer">
                By <span>{property.firstName || "Developer"}</span>
              </p>
              <p className="project-bhk">
                <span className="bhk-highlight">{property.bhkType || "2 BHK"}</span>{" "}
                {property.propertyType || "Apartment"}
              </p>
              <p className="project-location">📍 {property.locality}, {property.city}</p>
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
        <a href="/properties" className="view-more-link">View More</a>
      </div>
    </div>
  );
};

export default RecentlyAdded;
