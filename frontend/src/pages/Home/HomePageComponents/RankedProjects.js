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

  const filteredProjects = projects.filter(
    (p) => p.city === activeCity
  );

  return (
    <section className="ranked-projects">
      <div className="hp-header">
        <h2 className="hp-header-h2" style={{ paddingBottom: "50px" }}>
        <span className="highlight">Most Searched</span> Projects This Month
        </h2>

        <p>
          A handpicked collection of the country’s most in-demand residential
          developments. These properties offer unmatched value in top cities
          with ideal locations, smart amenities, and trusted builders.
        </p>
      </div>

      {/* <div className="hp-tabs">
        {cities.map((city) => (
          <button
            key={city}
            className={`hp-tab ${activeCity === city ? "active" : ""}`}
            onClick={() => setActiveCity(city)}
          >
            {city}
          </button>
        ))}
      </div> */}

      <div className="hp-cards">
        {filteredProjects.map((project, index) => (
  <div className="hp-card" key={project.id}>
    <div className="hp-image">
      {/* Rank number */}
      <div className="hp-rank">{index + 1}</div>

      <img src={project.image} alt={project.title} />
    </div>

    <div className="hp-content">
      <h3>{project.title}</h3>
      <p className="hp-location">{project.location}</p>
      <p className="hp-price">{project.price}</p>
    </div>
  </div>
))}

      </div>
    </section>
  );
}
