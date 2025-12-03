import React from "react";
import "./CompareSummary.css";

const CompareSummary = ({ properties }) => {
  if (!properties || properties.length < 2) return null;

  const p1 = properties[0];
  const p2 = properties[1];

  const title = `${p1.title || "Property 1"} vs ${p2.title || "Property 2"}`;

  const summaryText = `Here’s a quick comparison between ${p1.title} located in ${p1.city}, 
priced at ₹${p1.price}, and ${p2.title} located in ${p2.city}, 
priced at ₹${p2.price}. Scroll below for a detailed comparison across 
location, amenities, specifications, and more.`;

  return (
    <div className="compare-summary">
      <h2 className="summary-title">{title}</h2>
      <p className="summary-text">{summaryText}</p>

      <button className="summary-readmore">
        Read More
      </button>
    </div>
  );
};

export default CompareSummary;
