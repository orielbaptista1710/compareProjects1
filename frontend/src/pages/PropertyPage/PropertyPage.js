// src/pages/PropertyPage.js
import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import "./PropertyPage.css";
import ContactFormm from "./PropertyPageComponents/ContactFormm";
import QuickLinks from "./PropertyPageComponents/QuickLinks";
import { Heart, Share2, Download, Building2 } from "lucide-react"; 
import PropertyGallery from "./PropertyPageComponents/PropertyGallery";
import PropertyDetails from "./PropertyPageComponents/PropertyDetails ";
import FloorPlanView from "./PropertyPageComponents/FloorPlanView";
import FAQSection from "./PropertyPageComponents/FAQSection";
import IconTabContent from "./PropertyPageComponents/IconTabContent";
import BrochurePreview from "./PropertyPageComponents/BrochurePreview";
import NewsReview from "../../components/NewsReview";
import Seo from '../../database/Seo';

import { toast } from "react-toastify"; // keep this until we switch to react-hot-toast

import { formatCurrencyShort } from "../../utils/formatters";

import API from "../../api";

function PropertyPage() {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mainImage, setMainImage] = useState(null);

  const handleHeartClick = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to save a property!");
      return;
    }

    try {
      const token = localStorage.getItem("customerToken");
      const res = await API.post(
        `/api/customerActivity/toggle-save/${property._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const isHeart = res.data.heartProperties.includes(property._id);
      setSaved(isHeart);

      toast.success(isHeart ? "Property saved!" : "Property removed from favorites");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save property");
    }
  };

  useEffect(() => {
    if (!id) {
      setError("Invalid Property ID");
      setLoading(false);
      return;
    }

    const fetchProperty = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/properties/${id}`
        );

        if (!response.ok) throw new Error("Failed to fetch property data");

        const data = await response.json();
        setProperty(data);
        setMainImage(data.coverImage || data.galleryImages?.[0] || "");
        setSaved(data.saved || false);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);
  
  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!property) return <div className="not-found">Property not found</div>;

  return (
    <div className="property-page-container">
      <Seo 
        title={property.title}
        description={property.description}
      />

      <div className="property-page-content">
        <PropertyGallery
          coverImage={property.coverImage}
          galleryImages={property.galleryImages}
          mediaFiles={property.mediaFiles}
        />

        {/* ---------------- Header Section ---------------- */}
        <div className="property-page-header">
          <div className="header-left">
            <h1>{property.title}</h1>
            <p className="property-page-location">
              {property.locality}, {property.city}, {property.state} - {property.pincode}
            </p>
            <p className="property-page-price">
              {formatCurrencyShort(property.price)} 
            </p>
          </div>

          {/* ---------------- Action Buttons ---------------- */}
          <div className="header-actions">
            {/* Save / Heart */}
            <button
              className={`icon-btn heartproperty ${saved ? "saved" : ""}`}
              onClick={handleHeartClick}
              aria-label="Save Property"
            >
              <Heart
                size={22}
                color={saved ? "#D90429" : "#888"}
                fill={saved ? "#D90429" : "none"}
                strokeWidth={1.6}
              />
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
              aria-label="Share Property"
            >
              <Share2 size={20} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <PropertyDetails property={property} />

        {/* ---------------- Key Details Section ---------------- */}
        <div className="key-details-section">
  <h2>Key Details</h2>
  <div className="key-details-grid">
    {[
      { label: "Property Type", value: property.propertyType || "NA" },
      { label: "BHK", value: property.bhk || "NA" },
      { label: "Bathrooms", value: property.bathrooms || "NA" },



      ///////check this 
      {
        label: "Property Area",
        value:
          property.area?.value
            ? `${property.area.value} ${property.area.unit || "sqft"}`
            : "NA",
      },

      //GET PROPRTY FROM DERIVED pricePerSqft n fallback on property.area?.unit etc
      // {
      //   label: "Price per sqft",
      //   value:
      //     property.pricePerSqft && property.area?.unit
      //       ? `₹${property.pricePerSqft}/${property.area.unit}`
      //       : "NA",
      // },

      { label: "Furnishing", value: property.furnishing || "NA" },

      {
        label: "Parking",
        value: Array.isArray(property.parkings)
          ? property.parkings.join(", ")
          : "NA",
      },

      { label: "Age of Property", value: property.ageOfProperty || "NA" },
      { label: "Total Floors", value: property.totalFloors || "NA" },
      { label: "Floor", value: property.floor || "NA" },
      { label: "Facing", value: property.facing || "NA" },
      { label: "Balconies", value: property.balconies || "NA" },
      { label: "Wing", value: property.wing || "NA" },
    ].map((item, idx) => (
      <div className="property-page-detail-item" key={idx}>
        <span className="property-page-detail-label">{item.label}</span>
        <span className="property-page-detail-value">{item.value}</span>
      </div>
    ))}
  </div>
</div>


        {/* ---------------- Description Section ---------------- */}
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

        {/* ---------------- Additional Info ---------------- */}
        <div className="additional-info-section">
          <h2>Additional Information</h2>
          <div className="info-grid">
            {[
              { label: "Developer", value: property.developerName },
              { label: "RERA Approved", value: property.reraApproved ? 'Yes' : 'No' },
              ...(property.reraApproved ? [{ label: "RERA Number", value: property.reraNumber }] : []),
              { label: "Price Negotiable", value: property.priceNegotiable ? 'Yes' : 'No' },
              { label: "Available From", value: property.reraDate ? new Date(property.reraDate).toLocaleDateString() : 'Immediate' },
              { label: "Units Available", value: property.unitsAvailable }
            ].map((item, idx) => (
              <div className="info-item" key={idx}>
                <span className="info-label">{item.label}</span>
                <span className="info-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- Amenities & Floor Plans ---------------- */}
        <div className="additional-info-section">
          <h2>Amenities</h2>
          <IconTabContent property={property}/>
        </div>

        <div className="additional-info-section">
          <FloorPlanView floorPlans={property.floorPlans} property={property} />
        </div>

        {/* ---------------- Location Section ---------------- */}
        <div className="location-section">
          <h2>Location</h2>
          <p className="full-address">{property?.address || "Address not available"}</p>

          {property.mapLink && (
  <div className="map-container">
    <iframe
      src={`${property.mapLink.replace(
        "https://maps.google.com/?q=",
        "https://www.google.com/maps?q="
      )}&output=embed`}
      width="100%"
      height="300"
      style={{ border: 0 }}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title="Property Location"
    />
  </div>
)}


          {/* Neighborhood / Landmarks */}
          {property.landmarks && property.landmarks.length > 0 && (
            <div className="neighborhood-section">
              <h2>Neighborhood Insights</h2>
              <div className="landmarks-grid">
                {property.landmarks.map((landmark, idx) => (
                  <div className="landmark-item" key={idx}>
                    <Building2 className="landmark-icon" size={20} />
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

        {/* ---------------- Brochure ---------------- */}
        {property.brochure && (
          <BrochurePreview 
            brochure={property.brochure} 
            title="Project Brochure"
          />
        )}

        {/* ---------------- FAQ & News ---------------- */}
        <FAQSection property={property} />
        <NewsReview />
      </div>

      {/* ---------------- Contact Form & Download Brochure ---------------- */}
      <div className="contact-form-container">
        <ContactFormm property={property} />
        <div className="download-brochure-propertypage">

          <button className="download-brochure-btn">
            <Download size={20} strokeWidth={1.6} />
            <span>Download Brochure</span>
          </button>

        </div>
      </div>

      {/* ---------------- Quick Links ---------------- */}
      <QuickLinks property={property} />
    </div>
  );
}

export default PropertyPage;
