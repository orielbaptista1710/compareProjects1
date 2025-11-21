// src/pages/Interiors/components/ServicesSection.jsx
import React from "react";
import OptimizedImage from "./OptimizedImage";
import { ArrowRight } from "lucide-react";
import { homeServices, commercialServices, serviceTabs } from "../../../database/interiorsData";
import './ServicesSection.css';
export default function ServicesSection({ activeTab, setActiveTab }) {
  const services = activeTab === "home" ? homeServices : commercialServices;

  return (
    <section className="interiors-services-section">
      <div className="interiors-services-header">
        <p className="interiors-section-label">Our Services</p>
        <h2 className="interiors-section-heading">What We Offer</h2>
        <p className="interiors-section-description">
          Choose from our premium interior design services for homes and commercial spaces.
        </p>
      </div>

      <div className="interiors-services-tabs">
        {serviceTabs.map((tab) => (
          <button
            key={tab.id}
            className={`interiors-service-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="interiors-services-grid">
        {services.map((service) => (
          <div key={service.id} className="interiors-service-card">
            <div className="interiors-service-image">
              <OptimizedImage
                src={service.image}
                width={600}
                height={400}
                alt={service.title}
              />
              <div className="interiors-service-icon">{service.icon}</div>
            </div>

            <div className="interiors-service-content">
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <button className="interiors-service-link">
                Learn More <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
