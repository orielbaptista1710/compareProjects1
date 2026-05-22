//frontend/src/pages/PropertyPage/PropertyPageComponents/RelatedProperties 
// This is for the addtion relatedProperties on the PropertyPage
import React, { useEffect, useState } from "react";
import "./RelatedProperties.css";
import { formatCurrencyShort } from "../../../utils/formatters";
import { useNavigate } from "react-router-dom";
 
function RelatedProperties({ propertyId }) {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!propertyId) return;

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/properties/related/${propertyId}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [propertyId]);

  if (!data.length) return null;

  return (
    <div className="rp-wrapper">
      <h2 className="rp-title">More from this Project</h2>

      <div className="rp-scroll">
        {data.map((p) => (
          <div
            key={p._id}
            className="rp-card"
            onClick={() => navigate(`/property/${p._id}`)}
          >
            <div className="rp-image">
              <img src={p.coverImage?.url} alt={p.title} />
              <span className="rp-date">
                Posted: {new Date(p.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="rp-body">
              <div className="rp-price">
                {formatCurrencyShort(p.price)}
              </div>

              <div className="rp-meta">
                {p.bhk} BHK • {p.area?.value} sqft
              </div>

              <p className="rp-desc">{p.title}</p>

              <button className="rp-btn">
                Contact {p.developerName ? "Builder" : "Agent"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rp-footer">
        View more properties →
      </div>
    </div>
  );
}

export default RelatedProperties;