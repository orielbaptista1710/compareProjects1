import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash, faMapMarkerAlt, faRulerCombined, faCity, faBed, faBath, faCar,
  faBuilding, faCalendarAlt, faCouch, faEye, faStar, faParking, faTree,
  faSwimmer, faWifi, faUtensils, faShieldAlt, faVideo, faFireExtinguisher,
  faWater, faBolt, faUmbrellaBeach, faUser, faElevator, faCompass
} from "@fortawesome/free-solid-svg-icons";
import Seo from '../../database/Seo';
import "./Compare.css";


function Compare({ compareList, setCompareList, removeFromCompare }) {
  const [properties, setProperties] = useState(compareList);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  useEffect(() => {
    setProperties(compareList);
  }, [compareList]);

  const removeProperty = (propertyId) => {
    removeFromCompare(propertyId);
  };

  const clearAllProperties = () => {
    setCompareList([]);
  };

  // Function to get property image
  const getPropertyImage = (property) => {
    if (property.coverImage) return property.coverImage;
    if (property.galleryImages && property.galleryImages.length > 0) return property.galleryImages[0];
    return '/default-property.jpg';
  };

  // Format price with commas
  const formatPrice = (price) => {
    return price ? `₹${price.toLocaleString('en-IN')}` : "Price on request";
  };

  // Get icon for amenity
  const getAmenityIcon = (amenity) => {
    const amenityIcons = {
  'Parking': <FontAwesomeIcon icon={faParking} />,
  'Garden': <FontAwesomeIcon icon={faTree} />,
  'Swimming Pool': <FontAwesomeIcon icon={faSwimmer} />, 
  'WiFi': <FontAwesomeIcon icon={faWifi} />,
  'Restaurant': <FontAwesomeIcon icon={faUtensils} />, 
  'Security': <FontAwesomeIcon icon={faShieldAlt} />,  
  'CCTV': <FontAwesomeIcon icon={faVideo} />,
  'Fire Safety': <FontAwesomeIcon icon={faFireExtinguisher} />,
  'Lift': <FontAwesomeIcon icon={faElevator} />,
  'Water Supply': <FontAwesomeIcon icon={faWater} />,
  'Power Backup': <FontAwesomeIcon icon={faBolt} />,    
  'Beach Access': <FontAwesomeIcon icon={faUmbrellaBeach} />
};

    
    return amenityIcons[amenity] || <FontAwesomeIcon icon={faStar} />;
  };

  // Render property header with image and basic info
  const renderPropertyHeader = (property) => (
    <div className="compare-property-header">
      <div className="compare-property-image-container">
        <img 
          src={getPropertyImage(property)} 
          alt={property.title} 
          className="property-image"
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = '/default-property.jpg';
          }}
        />
        <div className="property-badge">
          {property.featured && <span className="featured-badge">Featured</span>}
          <span className="type-badge">{property.propertyType}</span>
        </div>
        <div className="view-count">
          <FontAwesomeIcon icon={faEye} /> {property.viewCount || 0} views
        </div>
      </div>
      <h3>{property.title}</h3>
      <p className="location"><FontAwesomeIcon icon={faMapMarkerAlt} /> {property.locality}, {property.city}</p>
      <div className="price-tag">
        {formatPrice(property.price)}
        {property.pricePerSqft && (
          <span className="price-per-unit">₹{property.pricePerSqft.toLocaleString()}/sqft</span>
        )}
      </div>
      <div className="status-badge">
        <span className={`status ${property.status}`}>{property.status}</span>
      </div>
      <button 
        className="remove-btn"
        onClick={() => removeProperty(property._id)}
      >
        <FontAwesomeIcon icon={faTrash} /> Remove
      </button>
    </div>
  );

  // Render basic information section
  const renderBasicInfo = (property) => (
    <div className="info-section">
      <div className="info-grid">
        <div className="contact-row">
          <span className="info-label"><FontAwesomeIcon icon={faUser}  />Developer:</span>
          <span className="info-value">{property.developerName}</span>
        </div>
        <div className="info-row">
          <span className="info-label"><FontAwesomeIcon icon={faBed} /> BHK:</span>
          <span className="info-value">{property.bhk || "N/A"}</span>
        </div>
        <div className="info-row">
          <span className="info-label"><FontAwesomeIcon icon={faBath} /> Bathrooms:</span>
          <span className="info-value">{property.bathrooms || "N/A"}</span>
        </div>
        <div className="info-row">
          <span className="info-label"><FontAwesomeIcon icon={faRulerCombined} /> Carpet Area:</span>
          <span className="info-value">
            {property.area?.value ? `${property.area.value} ${property.area.unit}` : "N/A"}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label"><FontAwesomeIcon icon={faBuilding} /> Floor:</span>
          <span className="info-value">
            {property.floor ? `Floor ${property.floor} of ${property.totalFloors || 'N/A'}` : "N/A"}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label"><FontAwesomeIcon icon={faCouch} /> Furnishing:</span>
          <span className="info-value">{property.furnishing?.join(", ") || "N/A"}</span>
        </div>
        <div className="info-row">
          <span className="info-label"><FontAwesomeIcon icon={faCalendarAlt} /> Age:</span>
          <span className="info-value">{property.ageOfProperty || "N/A"}</span>
        </div>
        <div className="info-row">
          <span className="info-label"><FontAwesomeIcon icon={faCar} /> Parking:</span>
          <span className="info-value">{property.parkings?.length > 0 ? property.parkings.join(", ") : "N/A"}</span>
        </div>
        <div className="info-row">
          <span className="info-label"><FontAwesomeIcon icon={faCompass} />Facing:</span>
          <span className="info-value">{property.facing || "N/A"}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Balconies:</span>
          <span className="info-value">{property.balconies || "N/A"}</span>
        </div>
      </div>
    </div>
  );

  // Render property details section
  const renderPropertyDetails = (property) => (
    <div className="details-section">
      <div className="details-grid">
        <div className="details-row">
          <span className="details-label">Property Type:</span>
          <span className="details-value">{property.propertyType}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Property Group:</span>
          <span className="details-value">{property.propertyGroup}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Total Floors:</span>
          <span className="details-value">{property.totalFloors || "N/A"}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Wing:</span>
          <span className="details-value">{property.wing || "N/A"}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Units Available:</span>
          <span className="details-value">{property.unitsAvailable || "N/A"}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Possession:</span>
          <span className="details-value">{property.possessionStatus?.join(", ") || "N/A"}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Available From:</span>
          <span className="details-value">
            {property.availableFrom ? new Date(property.availableFrom).toLocaleDateString() : "Immediate"}
          </span>
        </div>
        <div className="details-row">
          <span className="details-label">RERA Approved:</span>
          <span className="details-value">{property.reraApproved ? `Yes (${property.reraNumber})` : "No"}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Price Negotiable:</span>
          <span className="details-value">{property.priceNegotiable ? "Yes" : "No"}</span>
        </div>
      </div>
    </div>
  );

  // Render amenities section
  const renderAmenities = (property) => (
    <div className="amenities-section">
      {property.amenities && property.amenities.length > 0 ? (
        <div className="amenities-grid">
          {property.amenities.map((amenity, index) => (
            <div key={index} className="amenity-item">
              <span className="amenity-icon">{getAmenityIcon(amenity)}</span>
              <span className="amenity-name">{amenity}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-data">No amenities listed</p>
      )}
    </div>
  );

  // Render facilities section
  const renderFacilities = (property) => (
    <div className="facilities-section">
      {property.facilities && property.facilities.length > 0 ? (
        <div className="facilities-list">
          {property.facilities.map((facility, index) => (
            <span key={index} className="facility-tag">{facility}</span>
          ))}
        </div>
      ) : (
        <p className="no-data">No facilities listed</p>
      )}
    </div>
  );

  // Render security section
  const renderSecurity = (property) => (
    <div className="security-section">
      {property.security && property.security.length > 0 ? (
        <div className="security-list">
          {property.security.map((securityFeature, index) => (
            <span key={index} className="security-tag">
              <FontAwesomeIcon icon={faShieldAlt} /> {securityFeature}
            </span>
          ))}
        </div>
      ) : (
        <p className="no-data">No security features listed</p>
      )}
    </div>
  );

  // Render location section
  const renderLocation = (property) => (
    <div className="location-section">
      <div className="location-grid">
        <div className="location-row">
          <span className="location-label">Address:</span>
          <span className="location-value">{property.address}</span>
        </div>
        <div className="location-row">
          <span className="location-label">Locality:</span>
          <span className="location-value">{property.locality}</span>
        </div>
        <div className="location-row">
          <span className="location-label">City:</span>
          <span className="location-value"><FontAwesomeIcon icon={faCity} /> {property.city}</span>
        </div>
        <div className="location-row">
          <span className="location-label">State:</span>
          <span className="location-value">{property.state}</span>
        </div>
        <div className="location-row">
          <span className="location-label">Pincode:</span>
          <span className="location-value">{property.pincode}</span>
        </div>
        {property.landmarks && property.landmarks.length > 0 && (
          <div className="location-row">
            <span className="location-label">Landmarks:</span>
            <div className="location-value">
              {property.landmarks.map((landmark, index) => (
                <div key={index} className="landmark-item">
                  <strong>{landmark.name}</strong>
                  {landmark.coordinates && (
                    <span className="coordinates">
                      {landmark.coordinates.lat}, {landmark.coordinates.lng}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {property.mapLink && (
          <div className="location-row">
            <span className="location-label">Map:</span>
            <span className="location-value">
              <a href={property.mapLink} target="_blank" rel="noopener noreferrer" className="map-link">
                View on Map
              </a>
            </span>
          </div>
        )}
      </div>
    </div>
  );

  

  // Render comprehensive overview section with all property data
  const renderOverview = (property) => (
    <div className="overview-section">
      <div className="overview-grid">
        {/* Basic Information */}
        <div className="overview-category">
          <h4 className="category-title">Basic Information</h4>
          <div className="category-content">
            {renderBasicInfo(property).props.children.props.children}
          </div>
        </div>

        {/* Property Details */}
        <div className="overview-category">
          <h4 className="category-title">Property Details</h4>
          <div className="category-content">
            {renderPropertyDetails(property).props.children.props.children}
          </div>
        </div>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="overview-category">
            <h4 className="category-title">Amenities</h4>
            <div className="category-content">
              {renderAmenities(property).props.children}
            </div>
          </div>
        )}

        {/* Facilities */}
        {property.facilities && property.facilities.length > 0 && (
          <div className="overview-category">
            <h4 className="category-title">Facilities</h4>
            <div className="category-content">
              {renderFacilities(property).props.children}
            </div>
          </div>
        )}

        {/* Security */}
        {property.security && property.security.length > 0 && (
          <div className="overview-category">
            <h4 className="category-title">Security</h4>
            <div className="category-content">
              {renderSecurity(property).props.children}
            </div>
          </div>
        )}

        {/* Location Details */}
        <div className="overview-category">
          <h4 className="category-title">Location</h4>
          <div className="category-content">
            {renderLocation(property).props.children.props.children}
          </div>
        </div>

        
      </div>
    </div>
  );

  // Render comparison tabs
  const renderComparisonTabs = () => (
    <div className="comparison-tabs">
      <button 
        className={activeTab === "overview" ? "active" : ""}
        onClick={() => setActiveTab("overview")}
      >
        Overview
      </button>
      <button 
        className={activeTab === "basic" ? "active" : ""}
        onClick={() => setActiveTab("basic")}
      >
        Basic Info
      </button>
      <button 
        className={activeTab === "details" ? "active" : ""}
        onClick={() => setActiveTab("details")}
      >
        Property Details
      </button>
      <button 
        className={activeTab === "amenities" ? "active" : ""}
        onClick={() => setActiveTab("amenities")}
      >
        Amenities
      </button>
      <button 
        className={activeTab === "facilities" ? "active" : ""}
        onClick={() => setActiveTab("facilities")}
      >
        Facilities
      </button>
      <button 
        className={activeTab === "security" ? "active" : ""}
        onClick={() => setActiveTab("security")}
      >
        Security
      </button>
      <button 
        className={activeTab === "location" ? "active" : ""}
        onClick={() => setActiveTab("location")}
      >
        Location
      </button>
    </div>
  );

  // Render content based on active tab
  const renderCompareTabContent = () => {
    switch(activeTab) {
      case "overview":
        return properties.map((property) => (
          <div key={property._id} className="compare-cell">
            {renderOverview(property)}
          </div>
        ));
      case "basic":
        return properties.map((property) => (
          <div key={property._id} className="compare-cell">
            {renderBasicInfo(property)}
          </div>
        ));
      case "details":
        return properties.map((property) => (
          <div key={property._id} className="compare-cell">
            {renderPropertyDetails(property)}
          </div>
        ));
      case "amenities":
        return properties.map((property) => (
          <div key={property._id} className="compare-cell">
            {renderAmenities(property)}
          </div>
        ));
      case "facilities":
        return properties.map((property) => (
          <div key={property._id} className="compare-cell">
            {renderFacilities(property)}
          </div>
        ));
      case "security":
        return properties.map((property) => (
          <div key={property._id} className="compare-cell">
            {renderSecurity(property)}
          </div>
        ));
      case "location":
        return properties.map((property) => (
          <div key={property._id} className="compare-cell">
            {renderLocation(property)}
          </div>
        ));
      default:
        return properties.map((property) => (
          <div key={property._id} className="compare-cell">
            {renderOverview(property)}
          </div>
        ));
    }
  };

  return (
    <div className="compare-container">

      <Seo 
            title="Compare Properties | CompareProjects" 
            description=" Cpompare properties side-by-side to analyze key features, pricing, and location details to make an informed decision." 
            // url="https://www.compareprojects.com/support"
            // image="https://www.compareprojects.com/assets/support-og.jpg"
            />

      <div className="comparison-header">
        <h1>Compare Properties</h1>
        <p className="header-description">
          Side-by-side comparison of {properties.length} selected properties. 
          Analyze key features, pricing, and location details to make an informed decision.
        </p>
        
        {properties.length > 0 && (
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-value">{properties.length}</div>
              <div className="stat-label">Properties</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">₹{Math.min(...properties.map(p => p.price || 0)).toLocaleString('en-IN')}</div>
              <div className="stat-label">Min Price</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">₹{Math.max(...properties.map(p => p.price || 0)).toLocaleString('en-IN')}</div>
              <div className="stat-label">Max Price</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{new Set(properties.map(p => p.city)).size}</div>
              <div className="stat-label">Cities</div>
            </div>
          </div>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="empty-compare">
          <div className="empty-icon">🏠</div>
          <h3>No properties selected for comparison</h3>
          <p>Add properties to compare their features and specifications</p>
          <button onClick={() => navigate("/properties")}>Browse Properties</button>
        </div>
      ) : (
        <>
          
          
          <div className="compare-grid">
            {/* Headers row */}
            <div className="compare-row headers">
              {properties.map((property) => (
                <div key={property._id} className="compare-cell">
                  {renderPropertyHeader(property)}
                </div>
              ))}
            </div>

            {renderComparisonTabs()}
            
            {/* Content based on active tab */}
            <div className="compare-row">
              {renderCompareTabContent()}
            </div>
          </div>

          <div className="compare-actions">
            <button className="clear-all-btn" onClick={clearAllProperties}>
              <FontAwesomeIcon icon={faTrash} /> Clear All Comparisons
            </button>
            <button className="browse-more-btn" onClick={() => navigate("/properties")}>
              Browse More Properties
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Compare;