// src/pages/PropertyPage/PropertyPageComponents/Card.jsx
const Card = ({ title, children }) => (
  <div className="pp-card">
    {title && <h2 className="pp-card__title">{title}</h2>}
    {children}
  </div>
);

export default Card;