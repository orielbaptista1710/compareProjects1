// components/SkeletonPropertyCard.js
// Skeleton for Dev Dashboard Page  - leave the css as it is?
import React from "react";
import "./SkeletonPropertyCard.css";

const SkeletonPropertyCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-img"></div>
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-button"></div>
    </div>
  );
};

export default SkeletonPropertyCard;
