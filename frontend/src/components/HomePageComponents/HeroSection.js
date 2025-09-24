import React from "react";
import "./HeroSection.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearchLocation } from "@fortawesome/free-solid-svg-icons/faSearchLocation";
import { faHandshake } from "@fortawesome/free-solid-svg-icons/faHandshake";
import { faChartLine } from "@fortawesome/free-solid-svg-icons/faChartLine";
import { faShieldAlt }  from "@fortawesome/free-solid-svg-icons/faShieldAlt";

const HeroSection = () => {
  const cards = [ 
    {
      icon: faSearchLocation,
      title: "Comprehensive Listings",
      description: "Discover properties that suit your preferences with our extensive database of verified listings.",
    },
    {
      icon: faHandshake,
      title: "Trusted Agents",
      description: "Work with our network of certified professionals for a seamless experience.",
    },
    {
      icon: faChartLine,
      title: "Market Insights",
      description: "Stay ahead with accurate market trends and data-driven recommendations.",
    },
    {
      icon: faShieldAlt,
      title: "Secure Transactions",
      description: "Enjoy safe and secure property dealings with our verified processes.",
    },
  ];

  return (
    <section className="why-choose-us">
      <div className="sectionn-header">
        <h2 className="sectionn-title">Why Choose Us</h2>
        <div className="title-underline"></div>
      </div>
      <div className="card-containerr">
        {cards.map((card, index) => (
          <div className="card" key={index}>
            <div className="icon-wrapper">
              <FontAwesomeIcon icon={card.icon} className="icon" />
            </div>
            <div className="card-content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeroSection;