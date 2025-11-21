import React, { useState, useCallback } from "react";
import "./About.css";

const About = () => {
  const [activeTab, setActiveTab] = useState("buyers");

  const benefits = {
    buyers: [
      "Exclusive Discounts on Premium Projects",
      "Flexible Payment Plans with Bulk Booking Benefits",
      "Zero Brokerage Fees — Save More on Every Deal",
      "Direct Communication with Developers for Transparency and Faster Decisions",
      "Free Expert Guidance for Home Loans and Financing",
      "End-to-End Support for Home Interiors and Commercial Fit-outs",
    ],
    investors: [
      "Accelerated Project Sellouts through Targeted Buyer Reach",
      "Bulk Booking Advantages and Partner Incentives",
      "Enhanced Brand Visibility across Multiple Channels",
      "Comprehensive Digital Marketing and Lead Generation Support",
      "Sales Team Training for Higher Conversion Rates",
      "Strategic Collaboration Opportunities for Long-Term Growth",
    ],
  };

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  return (
    <section
      className="about-container"
      aria-labelledby="about-heading"
      id="about"
    >
      <div className="about-wrapper">
        {/* 🖼️ Illustration */}
        <div className="about-illustration">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80"
            alt="Real estate visualization showcasing CompareProjects benefits"
            loading="lazy"
            width={600}
            height={400}
          />
          <div className="illustration-overlay">
            <div className="decoration-circle circle-1"></div>
            <div className="decoration-circle circle-2"></div>
            <div className="decoration-circle circle-3"></div>
          </div>
        </div>

        {/* 📄 Content */}
        <div className="about-content">
          <h2 id="about-heading">
            About <span className="highlight">CompareProjects</span>
          </h2>

          <p className="about-intro">
            CompareProjects is a next-generation real estate comparison
            platform designed to make property discovery transparent,
            data-driven, and reliable. We connect buyers, investors, and
            developers directly — simplifying every step of the real estate
            journey.
          </p>

          {/* Tabs */}
          <div className="benefit-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "buyers"}
              className={`tab-button ${activeTab === "buyers" ? "active" : ""}`}
              onClick={() => handleTabChange("buyers")}
              aria-controls="buyers-panel"
              id="buyers-tab"
            >
              Benefits for Buyers
            </button>

            <button
              role="tab"
              aria-selected={activeTab === "investors"}
              className={`tab-button ${activeTab === "investors" ? "active" : ""}`}
              onClick={() => handleTabChange("investors")}
              aria-controls="investors-panel"
              id="investors-tab"
            >
              Benefits for Investors
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
                  className="benefit-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="benefit-text">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(About);
