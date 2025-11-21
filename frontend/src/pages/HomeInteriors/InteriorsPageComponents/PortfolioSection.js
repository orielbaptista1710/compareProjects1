import React from "react";
import OptimizedImage from "./OptimizedImage";
import { portfolioFilters, portfolioItems } from "../../../database/interiorsData";
import "./PortfolioSection.css"
export default function PortfolioSection({ activeFilter, setActiveFilter }) {
  return (
    <section className="interiors-portfolio-section">
      <div className="interiors-portfolio-header">
        <p className="interiors-section-label">Our Work</p>
        <h2 className="interiors-section-heading">Portfolio Showcase</h2>
      </div>

      <div className="interiors-portfolio-filters">
        {portfolioFilters.map((filter) => (
          <button
            key={filter}
            className={`interiors-filter-btn ${activeFilter === filter ? "active" : ""}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter === "all"
              ? "All"
              : filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      <div className="interiors-portfolio-grid">
        {portfolioItems
          .filter((item) =>
            activeFilter === "all" ? true : item.category === activeFilter
          )
          .map((item) => (
            <div key={item.id} className="interiors-portfolio-card">
              <OptimizedImage
                src={item.image}
                width={500}
                height={400}
                alt={item.title}
              />

              <div className="interiors-portfolio-overlay">
                <h3>{item.title}</h3>
                <span className="interiors-portfolio-category">{item.category}</span>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
