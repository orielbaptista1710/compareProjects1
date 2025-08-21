import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft, faChevronRight, faSchool,
  faHospital, faStore
} from "@fortawesome/free-solid-svg-icons";
import "./PropertyPage.css";

import PropertyGallery from "../components/PropertyGallery";
import Carousel from "../components/CarouselforPagetab";
import TabContent from "../components/TabContent";
import ContactFormm from "../components/ContactFormm";
import FAQSection from "../components/FAQSection";

function PropertyPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("highlights");

  // Refs for tab navigation
  const highlightsRef = useRef(null);
  const overviewRef = useRef(null);
  const locationRef = useRef(null);
  const amenitiesRef = useRef(null);
  const galleryRef = useRef(null);
  const faqRef = useRef(null);
  const carouselRef = useRef(null);

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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const scrollToSection = (ref, tabName) => {
    setActiveTab(tabName);
    if (ref.current) {
      window.scrollTo({ top: ref.current.offsetTop - 90, behavior: "smooth" });
    }
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -150, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 150, behavior: "smooth" });
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!property) return <div className="not-found">Property not found</div>;

  return (
    <div className="property-page">
      <div className="property-page-container">
        <div className="property-main-content">

          {/* Gallery */}
          <div className="property-image-container">
            <PropertyGallery media={property.media || []} />
          </div>

          {/* Tabs Navigation */}
          <div className="tabs-wrapper">
  <button className="scroll-btn left" onClick={scrollLeft}>
    <FontAwesomeIcon icon={faChevronLeft} />
  </button>
  <div className="tabs-container" ref={carouselRef}>
    {["Highlights", "Around This Project", "More About Project", "About Project", "Floor Plan", "Tour This Project", "Amenities"].map((tab) => {
      const tabKey = tab.toLowerCase().replace(/\s+/g, '-');
      return (
        <button
          key={tabKey}
          className={`tab-button ${activeTab === tabKey ? "active" : ""}`}
          onClick={() => {
            const refMap = {
              'highlights': highlightsRef,
              'around-this-project': locationRef,
              'more-about-project': overviewRef,
              'about-project': overviewRef,
              'floor-plan': galleryRef,
              'tour-this-project': galleryRef,
              'amenities': amenitiesRef
            };
            scrollToSection(refMap[tabKey], tabKey);
          }}
        >
          {tab}
        </button>
      );
    })}
  </div>
  <button className="scroll-btn right" onClick={scrollRight}>
    <FontAwesomeIcon icon={faChevronRight} />
  </button>
</div>

          {/* Details Grid */}
          <div className="property-details-grid">

            {/* LEFT: Main Content */}
            <div className="details-left">
              {/* Overview */}
              <div ref={overviewRef} className="tab-section overview-section">
                <h3>{property.title} Overview</h3>
                <div className="overview-grid">
                  <div className="overview-item">
                    <span>Units</span>
                    <strong>{property.overview?.unitsAvailable || "10+"}</strong>
                  </div>
                  <div className="overview-item">
                    <span>Project Size</span>
                    <strong>{property.overview?.area || "2.5"}</strong> {property.overview?.unit || "Sqft"}
                  </div>
                  <div className="overview-item">
                    <span>Avg. Price</span>
                    <strong>₹{property.pricePerSqFt}/sq.ft</strong>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div ref={highlightsRef} className="tab-section highlights-section">
                <h3>Why {property.title}?</h3>
                <ul className="highlight-list">
                  {property.highlights?.map((highlight, index) => (
                    <li key={index}>{highlight}</li>
                  ))}
                </ul>
              </div>

              {/* Location */}
              <div ref={locationRef} className="tab-section location-section">
                <h3>Property Location</h3>
                <p className="location-address">
                  <strong>{property.locality}, {property.city}, {property.state}</strong>
                </p>

                <div className="nearby-places">
                  <h4>Around This Project</h4>
                  <div className="nearby-item">
                    <FontAwesomeIcon icon={faSchool} />
                    <span>{property.nearby?.school || "S.B. Patil Public School"}</span>
                  </div>
                  <div className="nearby-item">
                    <FontAwesomeIcon icon={faHospital} />
                    <span>{property.nearby?.hospital || "Ratharoop Ayurved Hospital"}</span>
                  </div>
                  <div className="nearby-item">
                    <FontAwesomeIcon icon={faStore} />
                    <span>{property.nearby?.market || "4 mins (2.5 km) to nearest market"}</span>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div ref={amenitiesRef} className="tab-section">
                <h3>Amenities and More</h3>
                <TabContent property={property} />
              </div>

              {/* Gallery Carousel */}
              <div ref={galleryRef} className="tab-section">
                <h3>Gallery</h3>
                <Carousel images={property.galleryImages || []} />
              </div>

              {/* FAQs */}
              <div ref={faqRef} className="tab-section">
                <FAQSection property={property} />
              </div>
            </div>

            {/* RIGHT: Contact Form */}
            <div className="details-right">
              <ContactFormm property={property} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default PropertyPage;
