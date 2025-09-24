import React, { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons/faCheckCircle";  
import "./About.css";

const About = () => {
  const [activeTab, setActiveTab] = useState("buyers");

  const benefits = {
    buyers: [
      "Exclusive Discounts on Projects",
      "Bulk Booking Benefits",
      "Zero Brokerage Fees",
      "Direct Contact with Developers",
      "Free Guidance for Home Loans",
      "Short Booking Offers",
      "Home Interiors & Commercial Fitouts",
    ],
  
    developers: [
      "Quick Sellouts of Projects",
      "Bulk Order Advantages",
      "Strong Branding & Visibility",
      "Direct Customer Reach",
      "Digital Marketing Support",
      "Sales Team Training"
    ],
  };

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  // Animation delay calculator for staggered animations
  const getAnimationDelay = (index) => {
    return `${index * 0.1}s`;
  };

  return (
    <section className="about-container" aria-labelledby="about-heading">
      <div className="about-wrapper">
        {/* Left Content */}
        <div className="about-content">
          <h2 id="about-heading">
            About <span>CompareProjects</span>
          </h2>
          <p className="about-subtitle">
            Discover the advantages that make CompareProjects the preferred choice for all your real estate needs.
          </p>

          {/* Tabs */}
          <div className="benefit-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "buyers"}
              className={activeTab === "buyers" ? "active" : ""}
              onClick={() => handleTabChange("buyers")}
              aria-controls="buyers-panel"
              id="buyers-tab"
            >
              Buyers
            </button>
        
            <button
              role="tab"
              aria-selected={activeTab === "developers"}
              className={activeTab === "developers" ? "active" : ""}
              onClick={() => handleTabChange("developers")}
              aria-controls="developers-panel"
              id="developers-tab"
            >
              Developers
            </button>
          </div>

          {/* Benefits List */}
          <div 
            role="tabpanel"
            id={`${activeTab}-panel`}
            aria-labelledby={`${activeTab}-tab`}
            className="benefits-panel"
          >
            <ul className="benefits-list">
              {benefits[activeTab].map((item, index) => (
                <li 
                  key={index}
                  style={{ animationDelay: getAnimationDelay(index) }}
                  className="benefit-item"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="check-icon" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Illustration */}
        <div className="about-illustration">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80"
            alt="Visual representation of CompareProjects benefits"
            loading="lazy"
            width={600}
            height={400}
          />
          {/* Decorative elements */}
          <div className="illustration-overlay">
            <div className="decoration-circle circle-1"></div>
            <div className="decoration-circle circle-2"></div>
            <div className="decoration-circle circle-3"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(About);