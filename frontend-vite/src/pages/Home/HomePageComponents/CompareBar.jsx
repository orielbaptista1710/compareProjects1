import React from "react";
import { X, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./CompareBar.css";

import { formatCurrencyShort } from "../../../utils/formatters";
import { getPropertyImage } from "../../../utils/propertyHelpers";

const CompareBar = ({ compareList, removeFromCompare }) =>{
  const navigate = useNavigate();

  const goToComparePage = () => {
    navigate("/compare");
  };

  return (
    <div className="compare-bar-wrapper">
      <div className="compare-bar">
        <div className="compare-scroll">
          {compareList.map((property) => (
            <div key={property._id} className="compare-item">
              <img
                src={getPropertyImage(property)}
                alt={property?.title}
                className="compare-item-image"
              />

              <div className="compare-item-info">
                <p className="compare-item-title">{property.title}</p>
                <p className="compare-item-price">
                  {formatCurrencyShort(property.price)}
                </p>
              </div>

              <button
                className="compare-remove-btn"
                onClick={() => removeFromCompare(property._id)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="compare-actions">
          <span className="compare-count">
            {compareList.length} selected
          </span>

          <button
            className="compare-clear-btn"
            onClick={() => navigate("/compare")}
          >
            <Trash2 size={16} />
            Clear All
          </button>

          <button
            className="compare-now-btn"
            onClick={goToComparePage}
          >
            Compare Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(CompareBar);