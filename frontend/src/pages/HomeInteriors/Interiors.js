// src/pages/Interiors/Interiors.js
import React, { useState } from "react";
import "./Interiors.css";
import {
  residentialServices,
  commercialServices,
  portfolioItems,
  testimonials,
} from "../../database/interiorsData";
import BaseLayout from "../../layouts/BaseLayout";
import FullWidthSection from "../../layouts/FullWidthSection";

import HeroSection from "./InteriorsPageComponents/InteriorsHeroSection";
import ServicesSection from "./InteriorsPageComponents/ServicesSection";
import PortfolioSection from "./InteriorsPageComponents/PortfolioSection";
import TestimonialsSection from "./InteriorsPageComponents/TestimonialsSection";
import ContactSection from "./InteriorsPageComponents/ContactSection";

export default function Interiors() {
  const [activeTab, setActiveTab] = useState("home");
  const [activeFilter, setActiveFilter] = useState("all");

  return (
    <div className="interior-wrapper">
      <HeroSection />


      <BaseLayout>
      <ServicesSection
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <PortfolioSection
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
      />
      </BaseLayout>


      <FullWidthSection>
      <TestimonialsSection />

      <ContactSection />
      </FullWidthSection>

    </div>
  );
}
