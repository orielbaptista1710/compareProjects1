import React from "react";
import { ArrowRight } from "lucide-react";

export default function InteriorsHeroSection() {
  return (
    <section className="interiors-hero-section">
      <div className="interiors-hero-overlay"></div>

      <div className="interiors-hero-content">
        <h1 className="hero-title">Premium Interior Design for Modern Spaces</h1>
        <p className="hero-subtitle">
          Beautiful, functional, and world-class designs crafted by experts.
        </p>

        <button className="hero-cta">
          Get Free Consultation <ArrowRight size={18} />
        </button>
      </div>

      {/* <div className="hero-stats">
        <div className="stat-item">
          <h3>500+</h3>
          <p>Projects Completed</p>
        </div>
        <div className="stat-item">
          <h3>12+</h3>
          <p>Years Experience</p>
        </div>
        <div className="stat-item">
          <h3>4.9★</h3>
          <p>Client Rating</p>
        </div>
      </div> */}

    </section>
  );
}
