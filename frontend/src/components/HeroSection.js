import React from "react";
import "./HeroSection.css"; // CSS file
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearchLocation, faHandshake, faChartLine, faShieldAlt } from "@fortawesome/free-solid-svg-icons";

const HeroSection = () => {
  const cards = [
    {
      icon: faSearchLocation,
      title: "Comprehensive Listings",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Discover properties that suit your preferences.",
    },
    {
      icon: faHandshake,
      title: "Trusted Agents",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Work with certified professionals.",
    },
    {
      icon: faChartLine,
      title: "Market Insights",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Stay ahead with accurate market trends.",
    },
    {
      icon: faShieldAlt,
      title: "Secure Transactions",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Enjoy safe and secure property dealings.",
    },
  ];

  return (
    <section className="why-choose-us">
      <h2 className="section-titlee">Why Choose Us</h2>
      <div className="card-container">
        {cards.map((card, index) => (
          <div className="card" key={index}>
            <div className="icon">
              <FontAwesomeIcon icon={card.icon} />
            </div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
