// src/pages/HomeInteriors/Interiors
import { useState } from "react";
import "./Interiors.css";

import HeroSection from "./InteriorsPageComponents/InteriorsHeroSection";
import ServicesSection from "./InteriorsPageComponents/ServicesSection";
import PortfolioSection from "./InteriorsPageComponents/PortfolioSection";
import HowItWorksSection from "./InteriorsPageComponents/HowItWorksSection";
import TestimonialSection from "../Home/HomePageComponents/TestimonialSection";
import ContactSection from "./InteriorsPageComponents/ContactSection";

export default function Interiors() {
  const [activeTab, setActiveTab] = useState("home");
  const [activeFilter, setActiveFilter] = useState("all");

  return (
    <div className="intr-page">
      <HeroSection />

      <ServicesSection activeTab={activeTab} setActiveTab={setActiveTab} />

      <PortfolioSection activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

      <HowItWorksSection />

      <TestimonialSection />

      <ContactSection />
    </div>
  );
}
