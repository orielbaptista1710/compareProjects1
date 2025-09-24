import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./PropertyPage.css";
import ContactFormm from "../components/PropertyPageComponents/ContactFormm";
import QuickLinks from "../components/PropertyPageComponents/QuickLinks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding } from "@fortawesome/free-solid-svg-icons/faBuilding";
import { faHeart, faShareAlt } from "@fortawesome/free-solid-svg-icons";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import PropertyGallery from "../components/PropertyPageComponents/PropertyGallery";
import PropertyDetails from "../components/PropertyPageComponents/PropertyDetails ";
// import { amenitiesList, facilitiesList, securityList } from "../constants/propertyFormConstants";
import FloorPlanView from "../components/PropertyPageComponents/FloorPlanView";
import FAQSection from "../components/PropertyPageComponents/FAQSection";
import IconTabContent from "../components/PropertyPageComponents/IconTabContent";
import BrochurePreview from "../components/PropertyPageComponents/BrochurePreview"
import NewsReview from "../components/NewsReview";
import { toast } from "react-toastify";
function PropertyPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [mainImage, setMainImage] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("Invalid Property ID");
      setLoading(false);
      return;
    }

    if(property){
      setMainImage(property.coverImage || property.galleryImages[0] || "");
    }


    const fetchProperty = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/properties/${id}`
        );
        if (!response.ok) throw new Error("Failed to fetch property data");
        const data = await response.json();
        setProperty(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, property]);


  // Format numbers nicely (with commas)
const formatPrice = (value) => {
  if (!value || isNaN(value)) return "";
  return new Intl.NumberFormat("en-IN").format(value);
};

// Convert number into Indian readable words (Lakh, Crore, etc.)
const formatPriceToWords = (price) => {
  if (!price || isNaN(price)) return "";

  if (price >= 10000000) {
    return (price / 10000000).toFixed(2).replace(/\.00$/, "") + " Crore";
  } else if (price >= 100000) {
    return (price / 100000).toFixed(2).replace(/\.00$/, "") + " Lakh";
  } else if (price >= 1000) {
    return (price / 1000).toFixed(2).replace(/\.00$/, "") + " Thousand";
  } else {
    return price.toString();
  }
};




  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!property) return <div className="not-found">Property not found</div>;

  return (
    <div className="property-page-container">
      <div className="property-page-content">

        <PropertyGallery
          coverImage={property.coverImage}
          galleryImages={property.galleryImages}
          mediaFiles={property.mediaFiles} />


        {/* Header Section */}
        <div className="property-page-header">
  <div className="header-left">
    <h1>{property.title}</h1>
    <p className="property-page-location">
      {property.locality}, {property.city}, {property.state} - {property.pincode}
    </p>
    <p className="property-page-price">
      ₹{formatPriceToWords(property.price)} (₹{formatPrice(property.pricePerSqft)}/sqft)
    </p>

  </div>

  {/* Action Buttons */}
  <div className="header-actions">
    {/* Save / Heart */}
    <button
      className={`icon-btn heartproperty ${property.saved ? "saved" : ""}`}
      onClick={() => {
        // Toggle save logic here (API or local state)
        toast.success("Property saved!");
        console.log("Save clicked!");
      }}
    >
      <FontAwesomeIcon icon={faHeart} />

    </button>

    {/* Share */}
    <button
      className="icon-btn sendproperty"
      onClick={() => {
        if (navigator.share) {
          navigator.share({
            title: property.title,
            text: `Check out this property: ${property.title}`,
            url: window.location.href,
          });
        } else {
          navigator.clipboard.writeText(window.location.href);
          toast.success("Link copied to clipboard!");
        }
      }}
    >
            <FontAwesomeIcon icon={faShareAlt} />

    </button>
  </div>
</div>


        <PropertyDetails property={property} />

        {/* Key Details Section */}
        <div className="key-details-section">
          <h2>Key Details</h2>
          <div className="key-details-grid">
            <div className="detail-item">
              <span className="detail-label">Property Type</span>
              <span className="detail-value">{property.propertyType}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">BHK</span>
              <span className="detail-value">{property.bhk}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Bathrooms</span>
              <span className="detail-value">{property.bathrooms}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Property Area</span>
              <span className="detail-value">{property.area.value} {property.area.unit}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Price per sqft</span>
              <span className="detail-value">₹{property.pricePerSqft}/{property.area.unit}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Furnishing</span>
              <span className="detail-value">{property.furnishing}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Parking</span>
              <span className="detail-value">{property.parkings.join(", ")}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Age of Property</span>
              <span className="detail-value">{property.ageOfProperty}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Floors</span>
              <span className="detail-value">{property.totalFloors}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Floor</span>
              <span className="detail-value">{property.floor}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Facing</span>
              <span className="detail-value">{property.facing}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Balconies</span>
              <span className="detail-value">{property.balconies}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Wing</span>
              <span className="detail-value">{property.wing}</span>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="description-section">
          <h2>Description</h2>
          <p className="property-description">
            {showFullDescription ? property.long_description || property.description : property.description}
          </p>
          {property.long_description && property.long_description.length > 200 && (
            <button 
              className="show-more-btn"
              onClick={() => setShowFullDescription(!showFullDescription)}
            >
              {showFullDescription ? 'Show Less' : 'Show More'}
            </button>
          )}
        </div>


        {/* Additional Information Section */}
        <div className="additional-info-section">
          <h2>Additional Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Developer</span>
              <span className="info-value">{property.developerName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">RERA Approved</span>
              <span className="info-value">{property.reraApproved ? 'Yes' : 'No'}</span>
            </div>
            {property.reraApproved && (
              <div className="info-item">
                <span className="info-label">RERA Number</span>
                <span className="info-value">{property.reraNumber}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Price Negotiable</span>
              <span className="info-value">{property.priceNegotiable ? 'Yes' : 'No'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Available From</span>
              <span className="info-value">
                {property.availableFrom ? new Date(property.availableFrom).toLocaleDateString() : 'Immediate'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Units Available</span>
              <span className="info-value">{property.unitsAvailable}</span>
            </div>
          </div>
        </div>


             {/* Amenities, Facilities and Security */}
        <div className="additional-info-section">
          <h2>Amenities</h2>
          <IconTabContent property={property}/>
        </div>

        <div className="additional-info-section">
          <FloorPlanView floorPlans={property.floorPlans} property={property} />
        </div>

        <div className="additional-info-section">
          <h1>Want better offers CONTACT US NOW</h1>
        </div>

        <div className="additional-info-section">
          <h1>rERA DOCUMENT VIEW FOR LOGIN USERS?</h1>
        </div>


        <div className="additional-info-section">
          <h1>virtualTours IS DATA PRESENT</h1>
        </div>

        {/* Add localities here too  */}
        <div className="location-section">
          <h2>Location</h2>
          <p className="full-address">{property.address}</p>
          {property.mapLink && (
            <div className="map-container">
              <iframe
                src={property.mapLink}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Property Location"
              ></iframe>
            </div>
          )}

          {/* Neighborhood Insights Section */}
{property.landmarks && property.landmarks.length > 0 && (
  <div className="neighborhood-section">
    <h2>Neighborhood Insights</h2>
    <div className="landmarks-grid">
      {property.landmarks.map((landmark, idx) => (
        <div className="landmark-item" key={idx}>
          <FontAwesomeIcon icon={faBuilding} className="landmark-icon" />
          <div className="landmark-details">
            <span className="landmark-name">{landmark.name}</span>
            {landmark.coordinates?.lat && landmark.coordinates?.lng && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${landmark.coordinates.lat},${landmark.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="landmark-map-link"
              >
                View on Map
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}


        </div>

        {property.brochure && (
          <BrochurePreview 
            brochure={property.brochure} 
            title="Project Brochure"
          />
        )}


        <FAQSection property={property} />

        <NewsReview />

      </div>

      {/* Contact Form - Fixed to the right */}
      <div className="contact-form-container">
        <ContactFormm property={property} />

        <div className="download-brochure-propertypage">
          <button className="download-brochure-btn">
            <FontAwesomeIcon icon={faDownload}></FontAwesomeIcon>
            <span>Download Brochure</span>
          </button>
        </div>

      </div>


      <QuickLinks property={property} />


    </div>
  );
}

export default PropertyPage;