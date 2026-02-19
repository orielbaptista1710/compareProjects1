import React, { useState } from "react";
import "./RankedProjects.css";

const cities = [
  "Mumbai",
  "Bangalore",
  "Gurgaon",
  "Pune",
  "Noida",
  "Hyderabad",
  "Thane",
  "Navi Mumbai",
  "Chennai",
];

const projects = [
  {
    id: 1,
    city: "Mumbai",
    title: "West Center Meridian Courts",
    location: "Kandivali West, Mumbai",
    price: "₹ 1.00 Cr to 2.98 Cr",
    image:
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=1200",
  },
  {
    id: 2,
    city: "Mumbai",
    title: "Origin Rock Highland",
    location: "Kandivali West, Mumbai",
    price: "₹ 1.55 Cr to 2.20 Cr",
    image:
      "https://images.unsplash.com/photo-1599423300746-b62533397364?q=80&w=1200",
  },
  {
    id: 3,
    city: "Mumbai",
    title: "Godrej Reserve Kandivali",
    location: "Kandivali East, Mumbai",
    price: "₹ 2.50 Cr to 6.66 Cr",
    image:
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1200",
  },
  {
    id: 4,
    city: "Mumbai",
    title: "K Raheja Antares",
    location: "Kanjurmarg West, Mumbai",
    price: "₹ 3.33 Cr to 5.19 Cr",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200",
  },
];

export default function RankedProjects() {
  const [activeCity, setActiveCity] = useState("Mumbai");

  const filteredProjects = projects.filter((p) => p.city === activeCity);

  const handleCardClick = (projectId) => {
    // Navigate to project details
    window.location.href = `/property/${projectId}`;
  };

  const handleKeyDown = (e, callback) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  return (
    <section 
      className="ranked-projects"
      aria-labelledby="ranked-heading"
    >
      <div className="hp-header">
        <h2 id="ranked-heading" className="hp-header-h2" style={{ paddingBottom: "20px" }}>
          <span className="highlight">Most Searched</span> Projects This Month
        </h2>

        <p>
          A handpicked collection of the country's most in-demand residential
          developments. These properties offer unmatched value in top cities
          with ideal locations, smart amenities, and trusted builders.
        </p>
      </div>

      {/* City Tabs (commented out but keeping for future use) */}
      {/* <nav 
        className="hp-tabs"
        role="tablist"
        aria-label="Filter projects by city"
      >
        {cities.map((city) => (
          <button
            key={city}
            role="tab"
            aria-selected={activeCity === city}
            aria-controls="project-cards"
            className={`hp-tab ${activeCity === city ? "active" : ""}`}
            onClick={() => setActiveCity(city)}
            onKeyDown={(e) => handleKeyDown(e, () => setActiveCity(city))}
          >
            {city}
          </button>
        ))}
      </nav> */}

      <div 
        id="project-cards"
        className="hp-cards"
        role="list"
        aria-label="Featured property projects"
      >
        {filteredProjects.map((project, index) => (
          <article
            className="hp-card"
            key={project.id}
            role="listitem"
            tabIndex={0}
            onClick={() => handleCardClick(project.id)}
            onKeyDown={(e) => handleKeyDown(e, () => handleCardClick(project.id))}
            aria-label={`Rank ${index + 1}: ${project.title} in ${project.location}, ${project.price}`}
          >
            <div className="hp-image">
              {/* Rank Badge */}
              <div 
                className="hp-rank" 
                aria-hidden="true"
              >
                {index + 1}
              </div>

              <img
                src={project.image}
                alt={`${project.title} property view`}
                loading="lazy"
              />
            </div>

            <div className="hp-content">
              <h3>{project.title}</h3>
              <p className="hp-location">{project.location}</p>
              <p className="hp-price">{project.price}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}