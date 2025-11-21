import React from "react";
import "./HeroSection.css";
import { Search, Shield, Handshake, LineChart } from "lucide-react"; // Lucide icons

const HeroSection = () => {
  const cards = [
    {
      id: "comprehensive-listings",
      icon: <Search size={28} strokeWidth={1.6} color="#D90429" />,
      title: "Comprehensive Listings",
      description:
        "Discover properties that suit your preferences with our extensive database of verified listings.",
    },
    {
      id: "direct-developer",
      icon: <Handshake size={28} strokeWidth={1.6} color="#D90429" />,
      title: "Direct Developer Access",
      description:
        "Connect directly with trusted developers for transparent communication, exclusive offers, and faster deal closures — no middlemen involved.",
    },
    {
      id: "smart-comparisons",
      icon: <LineChart size={28} strokeWidth={1.6} color="#D90429" />,
      title: "Smart Project Comparisons",
      description:
        "Compare projects side-by-side with our intelligent comparison tools, powered by real data, insights, and developer credibility metrics.",
    },
    {
      id: "safe-deals",
      icon: <Shield size={28} strokeWidth={1.6} color="#D90429" />,
      title: "Safe & Transparent Deals",
      description:
        "Experience secure and transparent property transactions with verified listings, clear documentation, and trusted partners every step of the way.",
    },
  ];

  return (
    <section className="why-choose-us" aria-labelledby="why-choose-section-title">
      <div className="why-choose-section-header">
        <h2 id="why-choose-section-title" className="why-choose-section-title">
          Why Choose Us
        </h2>
        <div className="why-choose-title-underline" aria-hidden="true"></div>
      </div>

      <div className="why-choose-card-container">
        {cards.map((card) => (
          <article className="card" key={card.id}>
            <div className="icon-wrapper" aria-hidden="true">
              {card.icon}
            </div>
            <div className="card-content">
              <h3 className="card-title">{card.title}</h3>
              <p className="why-choose-card-description">{card.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
