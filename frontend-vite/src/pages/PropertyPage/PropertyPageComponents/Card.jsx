// src/pages/PropertyPage/PropertyPageComponents/Card.jsx
import React from 'react';

const Card = ({ title, children }) => (
  <div className="pp-card">
    {title && <h2 className="pp-card__title">{title}</h2>}
    {children}
  </div>
);

export default Card;