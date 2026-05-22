import React from "react";
import "./ProjectViewSideBar.css";

const deals = [ 
  {
    id: 1,
    title: "Luxury 4BHK Villa in Mumbai",
    description:
      "Spacious villa with a private pool, garden area, and premium interiors. Prime location near Juhu Beach.",
    price: "3.5 Cr",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    title: "2BHK Apartment in Pune",
    description:
      "Modern 2BHK apartment with clubhouse access, gym, and 24/7 security. Located in Koregaon Park.",
    price: "85 Lakhs",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    title: "3BHK Penthouse in Bangalore",
    description:
      "Skyline penthouse with a terrace garden, smart home features, and panoramic city views.",
    price: "1.8 Cr",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
  },
];

const ProjectViewSideBar = () => {
  return (
    <div className="latest-deals-container">
      <div className="latest-deals-header">
        <h2>Latest Deals</h2>
        <a href="/properties" className="see-more">
          See More
        </a>
      </div>
      <div className="deals-list">
        {deals.map((deal) => (
          <div className="deal-card" key={deal.id}>
            <img src={deal.image} alt={deal.title} className="deal-image" />
            <div className="deal-info">
              <h3>{deal.title}</h3>
              <p>{deal.description}</p>
              <span className="deal-price">Starts from: ${deal.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectViewSideBar;
